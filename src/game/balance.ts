import type { Area, Condition, EquipmentDef, Rarity, SkillDef, SkillEffect, Stats, Trigger } from '../combat/types';

// Approved balancing pass 1, extended for the class-archetype effects. Budgets are "per second of cooldown",
// per target. speed = |1 - factor| x seconds; summon = share of summoner stats; control = seconds of
// transform/taunt/delay; gold = gold; meter = chi/rage points.
export const SKILL_BUDGET: Record<
  Rarity,
  { damage: number; heal: number; barrier: number; buff: number; speed: number; summon: number; control: number; gold: number; meter: number }
> = {
  common: { damage: 0.75, heal: 0.5, barrier: 0.6, buff: 6, speed: 0.25, summon: 0.05, control: 0.3, gold: 1.5, meter: 3 },
  rare: { damage: 0.9, heal: 0.6, barrier: 0.72, buff: 8, speed: 0.3, summon: 0.06, control: 0.36, gold: 1.8, meter: 3.6 },
  epic: { damage: 1.05, heal: 0.7, barrier: 0.84, buff: 10, speed: 0.35, summon: 0.07, control: 0.42, gold: 2.1, meter: 4.2 },
  legendary: { damage: 1.25, heal: 0.85, barrier: 1.0, buff: 13, speed: 0.42, summon: 0.085, control: 0.5, gold: 2.5, meter: 5 },
};

export const GEAR_BUDGET: Record<Rarity, number> = { common: 8, rare: 14, epic: 20, legendary: 28 };

export const AREA_FACTOR: Record<Area, number> = { single: 1, row: 0.5, column: 0.5, all: 0.35 };
export const PERIODIC_ALLOWANCE = 1.1;
export const DRAIN_COST = 0.75;
export const PREREQUISITE_BONUS = 1.15;
export const GLORY_START = 0.8;
const STEAL_BUFF_POINTS = 10;
const SELF_DAMAGE_CREDIT = 10;
const CONSUME_SUMMON_CREDIT = 0.3;

// Harder-to-fire skills get more power per second of cooldown.
// Triggers fire at most once per cooldown, and only when their event happens: the rarer the event, the more
// each firing may do. Frequent events (hits, spells) get about the timed budget.
const TRIGGER_ALLOWANCE: Record<Exclude<Trigger['kind'], 'belowHp'>, number> = {
  whenHit: 1,
  allyHurt: 1,
  castSpell: 1,
  whenHealed: 1.1,
  enemyDies: 1.2,
  onKill: 1.3,
  barrierBreaks: 1.4,
  partyLow: 1.4,
  selfLow: 1.4,
  battleStart: 2,
  allyFalls: 2,
  onDefeat: 3,
};

export function triggerAllowance(trigger: Trigger | undefined): number {
  if (!trigger || trigger.kind === 'belowHp') return 1;
  return TRIGGER_ALLOWANCE[trigger.kind];
}

export function conditionAllowance(condition: Condition | undefined): number {
  switch (condition?.kind) {
    case 'frenzy':
      return 1.5;
    case 'souls':
      return 1 + 0.3 * condition.cost;
    case 'onlyJewelry':
      return 1.3;
    case 'chiBurst':
      return 1.4;
    case 'hasSummon':
      return 1.1;
    default:
      return 1;
  }
}

// Everything a skill's power is allowed to scale by, besides rarity and cooldown.
export function skillAllowance(skill: Pick<SkillDef, 'target' | 'prerequisite' | 'trigger' | 'condition' | 'glory'>): number {
  return (
    AREA_FACTOR[targetArea(skill)] *
    (skill.prerequisite ? PREREQUISITE_BONUS : 1) *
    triggerAllowance(skill.trigger) *
    conditionAllowance(skill.condition) *
    (skill.glory ? GLORY_START : 1)
  );
}

// Fraction of the rarity budget one effect spends. A well-budgeted skill's effects sum to about 1.
export function effectCost(e: SkillEffect, cooldown: number, rarity: Rarity): number {
  const b = SKILL_BUDGET[rarity];
  // A debuff the caster puts on itself is a drawback that pays for power elsewhere in the skill.
  if (e.self && e.kind === 'debuff') return -(e.amount * e.duration) / cooldown / b.buff;
  if (e.self && e.kind === 'speed' && e.factor < 1) return -((1 - e.factor) * e.duration) / cooldown / b.speed;
  switch (e.kind) {
    case 'damage':
      return (e.scaling * (e.hits ?? 1)) / cooldown / (e.drain ? DRAIN_COST : 1) / b.damage;
    case 'dot':
      return (e.scaling * e.duration) / PERIODIC_ALLOWANCE / cooldown / b.damage;
    case 'heal':
      return e.scaling / cooldown / b.heal;
    case 'regen':
      return (e.scaling * e.duration) / PERIODIC_ALLOWANCE / cooldown / b.heal;
    case 'barrier':
      return e.scaling / cooldown / b.barrier;
    case 'buff':
    case 'debuff':
      return (e.amount * e.duration) / cooldown / b.buff;
    case 'siphon':
      return (2 * e.amount * e.duration) / cooldown / b.buff;
    case 'steal':
      return STEAL_BUFF_POINTS / cooldown / b.buff;
    case 'speed':
      return (Math.abs(1 - e.factor) * e.duration) / cooldown / b.speed;
    case 'summon':
      return e.share / cooldown / b.summon;
    // Enemy-only; enemy abilities are never budgeted.
    case 'spawn':
      return 0;
    case 'transform':
    case 'taunt':
      return e.duration / cooldown / b.control;
    case 'delay':
      return e.seconds / cooldown / b.control;
    case 'shapeshift':
      return (e.duration * e.bonus) / cooldown / b.control;
    case 'gold':
      return e.amount / cooldown / b.gold;
    case 'meter':
      return e.amount / cooldown / b.meter;
    case 'selfDamage':
      return -(e.fraction * SELF_DAMAGE_CREDIT) / cooldown;
    case 'consumeSummon':
      return -CONSUME_SUMMON_CREDIT;
    case 'flight':
    case 'venom':
    case 'tickPoison':
      return 0;
    case 'chaos':
      return e.options.reduce((sum, o) => sum + effectCost(o, cooldown, rarity), 0) / e.options.length;
  }
}

// 1.0 means exactly on budget; synergy bonuses are excluded because they sit on top of the budget.
// Self effects land once on the caster, so they are measured without the area factor.
export function skillBudgetRatio(skill: SkillDef): number {
  const allowance = skillAllowance(skill);
  const selfAllowance = allowance / AREA_FACTOR[targetArea(skill)];
  return skill.effects.reduce(
    (sum, e) => sum + effectCost(e, skill.cooldown, skill.rarity) / (e.self || e.onSummons ? selfAllowance : allowance),
    0,
  );
}

export function targetArea(skill: Pick<SkillDef, 'target'>): Area {
  const t = skill.target;
  if (t.side === 'enemy' || t.side === 'ally') return t.area;
  return t.side === 'summons' ? t.area : 'single';
}

export function gearPoints(stats: Partial<Stats>): number {
  return (stats.hp ?? 0) / 4 + (stats.attack ?? 0) + (stats.magic ?? 0) + (stats.defense ?? 0) + (stats.resistance ?? 0);
}

export function gearBudgetRatio(item: EquipmentDef): number {
  return gearPoints(item.stats) / GEAR_BUDGET[item.rarity];
}

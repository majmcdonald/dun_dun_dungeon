import type { Area, EquipmentDef, Rarity, SkillDef, SkillEffect, Stats } from '../combat/types';

// Approved balancing pass 1. Budgets are "per second of cooldown", per target.
export const SKILL_BUDGET: Record<Rarity, { damage: number; heal: number; barrier: number; buff: number }> = {
  common: { damage: 0.75, heal: 0.5, barrier: 0.6, buff: 6 },
  rare: { damage: 0.9, heal: 0.6, barrier: 0.72, buff: 8 },
  epic: { damage: 1.05, heal: 0.7, barrier: 0.84, buff: 10 },
  legendary: { damage: 1.25, heal: 0.85, barrier: 1.0, buff: 13 },
};

export const GEAR_BUDGET: Record<Rarity, number> = { common: 8, rare: 14, epic: 20, legendary: 28 };

const AREA_FACTOR: Record<Area, number> = { single: 1, row: 0.5, column: 0.5, all: 0.35 };
const PERIODIC_ALLOWANCE = 1.1;
const DRAIN_COST = 0.75;
const PREREQUISITE_BONUS = 1.15;

// Fraction of the rarity budget one effect spends. A well-budgeted skill's effects sum to about 1.
function effectCost(e: SkillEffect, cooldown: number, rarity: Rarity): number {
  const b = SKILL_BUDGET[rarity];
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
  }
}

// 1.0 means exactly on budget; synergy bonuses are excluded because they sit on top of the budget.
export function skillBudgetRatio(skill: SkillDef): number {
  const area = skill.target.side === 'self' ? 'single' : skill.target.area;
  const spent = skill.effects.reduce((sum, e) => sum + effectCost(e, skill.cooldown, skill.rarity), 0);
  const allowance = AREA_FACTOR[area] * (skill.prerequisite ? PREREQUISITE_BONUS : 1);
  return spent / allowance;
}

export function gearPoints(stats: Partial<Stats>): number {
  return (stats.hp ?? 0) / 4 + (stats.attack ?? 0) + (stats.magic ?? 0) + (stats.defense ?? 0) + (stats.resistance ?? 0);
}

export function gearBudgetRatio(item: EquipmentDef): number {
  return gearPoints(item.stats) / GEAR_BUDGET[item.rarity];
}

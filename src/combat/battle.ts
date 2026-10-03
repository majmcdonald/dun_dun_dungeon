import type { Rng } from '../engine/random';
import type {
  Area,
  BattleEvent,
  BattleResult,
  Combatant,
  CombatantDef,
  Condition,
  Element,
  Enchantment,
  EquipSlot,
  PartyMember,
  Selector,
  Side,
  SkillDef,
  SkillEffect,
  StatKey,
  Stats,
  TriggerEvent,
  Ticking,
  Timed,
} from './types';
import { EQUIP_SLOTS } from './types';

// Guards against float drift from summing 1/60 steps (120 * 1/60 can land just under 2.0).
const TIMER_EPSILON = 1e-9;
export const MAX_START_DELAY = 0.2;
export const ENEMY_ROWS = 3;
const MAX_RESIST = 0.9;
export const FIRST_SUMMON_POSITION = 3;
export const SUMMONS_PER_MEMBER = 2;
// Hero skill slots 1–3 run their timers at these speeds; slot 4 holds a trigger.
export const SLOT_RATES = [1.25, 1, 0.75];
export const TRIGGER_SLOT = 3;
// Party HP share for partyLow triggers, own HP share for selfLow.
const PARTY_LOW = 0.35;
const SELF_LOW = 0.5;

export const MECHANIC = {
  rageMax: 100,
  frenzySeconds: 5,
  frenzySpeed: 2,
  soulsMax: 5,
  chiMax: 100,
  chiPerHit: 10,
  chiFilling: 0.8,
  chiBurst: 1.8,
  burstSeconds: 5,
  channelSeconds: 5,
  familiarShare: 0.6,
  transformedDamageTaken: 1.25,
  gloryStepSeconds: 5,
} as const;

export function mitigate(power: number, mitigation: number, resist = 0): number {
  return Math.max(1, Math.round(((power * 100) / (100 + mitigation)) * (1 - resist)));
}

export function isSummon(c: Pick<Combatant, 'summoner'>): boolean {
  return c.summoner !== null;
}

// Enemies fill a 3x3 grid, column 0 in front. The party has its members in the back column (one per row)
// and each member's summons in the columns in front of them, in the same row.
export function gridCell(c: Pick<Combatant, 'side' | 'position'>): { row: number; column: number } {
  if (c.side === 'party') {
    if (c.position < FIRST_SUMMON_POSITION) return { row: c.position, column: SUMMONS_PER_MEMBER };
    const index = c.position - FIRST_SUMMON_POSITION;
    return { row: index % FIRST_SUMMON_POSITION, column: Math.floor(index / FIRST_SUMMON_POSITION) };
  }
  return { row: c.position % ENEMY_ROWS, column: Math.floor(c.position / ENEMY_ROWS) };
}

// Slot 0 is the front-most summon column.
function summonPosition(owner: Combatant, slot: number): number {
  return FIRST_SUMMON_POSITION + slot * FIRST_SUMMON_POSITION + owner.position;
}

// Lower is closer to the front line; ties never happen because each unit has its own cell.
function frontKey(c: Combatant): number {
  const cell = gridCell(c);
  return cell.column * ENEMY_ROWS + cell.row;
}

export function statOf(c: Combatant, key: StatKey): number {
  let value = c.def.stats[key];
  for (const item of Object.values(c.equipment)) value += item?.stats[key] ?? 0;
  for (const buff of c.buffs) if (buff.stat === key) value += buff.amount;
  return Math.max(0, value);
}

function enchantments(c: Combatant): { source: string; ench: Enchantment }[] {
  return Object.values(c.equipment).flatMap((item) =>
    item?.enchantment ? [{ source: item.id, ench: item.enchantment }] : [],
  );
}

// Positive = takes less damage of that element; negative = weakness.
export function resistOf(c: Combatant, element: Element | undefined): number {
  if (!element) return 0;
  let value = c.def.resist?.[element] ?? 0;
  for (const { ench } of enchantments(c)) if (ench.kind === 'resist' && ench.element === element) value += ench.amount;
  return Math.min(MAX_RESIST, value);
}

export function hasTaunt(c: Combatant): boolean {
  return c.taunting > 0 || enchantments(c).some(({ ench }) => ench.kind === 'taunt');
}

export function speedOf(c: Combatant): number {
  let factor = c.speed.reduce((f, s) => f * s.value, 1);
  if (c.def.mechanic === 'rage' && c.burst > 0) factor *= MECHANIC.frenzySpeed;
  return factor;
}

const DEFENSIVE_KINDS = new Set<SkillEffect['kind']>(['heal', 'barrier', 'buff', 'regen']);
// Effects that hurt whoever they land on; reactive enchantments aim these at the attacker instead of the wearer.
const HOSTILE_KINDS = new Set<SkillEffect['kind']>(['damage', 'dot', 'debuff']);

function isDefensive(skill: SkillDef): boolean {
  return skill.category === 'spell' && skill.effects.some((e) => DEFENSIVE_KINDS.has(e.kind));
}

// How the party starts a fight, from events: wounded (a share of max HP) and/or blessed (bonus stats).
export interface PartyStart {
  hpFraction?: number;
  bonus?: Partial<Stats>;
}

export interface BattleOptions {
  party?: PartyStart;
  creatures?: Record<string, CombatantDef>;
  // Enemy types that enemy abilities can call in (spawn effects).
  bestiary?: Record<string, CombatantDef>;
}

export class Battle {
  readonly combatants: Combatant[];
  elapsed = 0;
  result: BattleResult | null = null;
  gold = 0;
  private summonCount = 0;
  private spawnCount = 0;
  private started = false;
  private bestiary: Record<string, CombatantDef>;
  private creatures: Record<string, CombatantDef>;

  constructor(
    party: PartyMember[],
    // Index = grid position; null leaves that cell empty.
    enemies: (CombatantDef | null)[],
    private rng: Rng = Math.random,
    options: BattleOptions = {},
  ) {
    this.creatures = options.creatures ?? {};
    this.bestiary = options.bestiary ?? {};
    const bonus = options.party?.bonus;
    const boosted = bonus ? party.map((m) => ({ ...m, def: { ...m.def, stats: addStats(m.def.stats, bonus) } })) : party;
    this.combatants = [
      ...boosted.map((m, i) => heroCombatant(m, i, rng)),
      ...enemies.flatMap((def, i) => (def ? [createCombatant(def, def.skills, 'enemy', i, {}, rng)] : [])),
    ];
    for (const c of this.combatants) if (c.def.familiar) c.channel = MECHANIC.channelSeconds;
    const fraction = options.party?.hpFraction;
    if (fraction !== undefined) {
      for (const c of this.combatants) if (c.side === 'party') c.hp = Math.max(1, Math.round(c.maxHp * fraction));
    }
  }

  tick(dt: number): BattleEvent[] {
    if (this.result) return [];
    this.elapsed += dt;
    const events: BattleEvent[] = [];

    if (!this.started) {
      this.started = true;
      for (const c of this.alive()) this.fireTrigger(c, 'battleStart', events);
    }
    for (const c of this.alive()) this.tickStatuses(c, dt, events);
    this.tickPeriodic(dt, events);

    for (const actor of [...this.combatants]) {
      if (actor.hp <= 0 || this.result || actor.channel > 0 || actor.transformed > 0) continue;
      const rate = speedOf(actor);
      for (const slot of actor.slots) {
        if (actor.hp <= 0 || this.result) break;
        const skill = slot.def;
        if (actor.shapeshift && !skill.form) continue;
        // Triggers recharge in real time and fire only on their event (see fireTrigger).
        if (skill.trigger) {
          slot.timer = Math.min(skill.cooldown, slot.timer + dt);
          continue;
        }
        slot.timer += dt * rate * slot.rate;
        if (slot.timer + TIMER_EPSILON < skill.cooldown) continue;
        if (!this.conditionMet(actor, skill.condition)) {
          slot.timer = skill.cooldown;
          continue;
        }
        slot.timer -= skill.cooldown;
        if (skill.condition?.kind === 'souls') actor.meter -= skill.condition.cost;
        this.useSkill(actor, skill, events);
      }
    }

    // Low-HP triggers fire whenever they are ready while the condition holds.
    for (const c of this.alive()) {
      if (this.result) break;
      if (this.sideHpRatio(c.side) < PARTY_LOW) this.fireTrigger(c, 'partyLow', events);
      if (c.hp / c.maxHp < SELF_LOW) this.fireTrigger(c, 'selfLow', events);
    }

    return events;
  }

  alive(side?: Side): Combatant[] {
    return this.combatants.filter((c) => c.hp > 0 && (!side || c.side === side));
  }

  members(side: Side): Combatant[] {
    return this.alive(side).filter((c) => !isSummon(c));
  }

  get(uid: string): Combatant {
    const c = this.combatants.find((x) => x.uid === uid);
    if (!c) throw new Error(`Unknown combatant: ${uid}`);
    return c;
  }

  summonsOf(owner: Combatant): Combatant[] {
    return this.alive(owner.side).filter((c) => c.summoner === owner.uid);
  }

  partyHpRatio(): number {
    return this.sideHpRatio('party');
  }

  sideHpRatio(side: Side): number {
    const party = this.combatants.filter((c) => c.side === side && !isSummon(c));
    const max = party.reduce((s, c) => s + c.maxHp, 0);
    return max === 0 ? 0 : party.reduce((s, c) => s + Math.max(0, c.hp), 0) / max;
  }

  private conditionMet(actor: Combatant, condition: Condition | undefined): boolean {
    if (!condition) return true;
    switch (condition.kind) {
      case 'frenzy':
        return actor.def.mechanic === 'rage' && actor.burst > 0;
      case 'souls':
        return actor.meter >= condition.cost;
      case 'onlyJewelry':
        return EQUIP_SLOTS.every((s) => s === 'jewelry' || !actor.equipment[s]);
      case 'chiBurst':
        return actor.burst > 0;
      case 'chiFilling':
        return actor.burst <= 0;
      case 'hasSummon':
        return this.summonsOf(actor).length > 0;
      case 'shapeshifted':
        return actor.shapeshift !== null;
    }
  }

  // A ready trigger skill fires at once when its event happens, then recharges over its cooldown.
  private fireTrigger(c: Combatant, event: TriggerEvent, events: BattleEvent[]): void {
    for (const slot of c.slots) {
      if (this.result) return;
      if (slot.def.trigger?.kind !== event || slot.timer + TIMER_EPSILON < slot.def.cooldown) continue;
      if (c.hp <= 0 && event !== 'onDefeat') return;
      slot.timer = 0;
      this.useSkill(c, slot.def, events);
    }
  }

  private tickStatuses(c: Combatant, dt: number, events: BattleEvent[]): void {
    this.tickRegeneration(c, dt, events);
    if (c.barrier) {
      c.barrier.remaining -= dt;
      if (c.barrier.remaining <= TIMER_EPSILON) c.barrier = null;
    }
    for (const b of c.buffs) b.remaining -= dt;
    c.buffs = c.buffs.filter((b) => b.remaining > TIMER_EPSILON);
    for (const s of c.speed) s.remaining -= dt;
    c.speed = c.speed.filter((s) => s.remaining > TIMER_EPSILON);
    c.transformed = Math.max(0, c.transformed - dt);
    c.taunting = Math.max(0, c.taunting - dt);
    if (c.shapeshift) {
      c.shapeshift.remaining -= dt;
      if (c.shapeshift.remaining <= TIMER_EPSILON) c.shapeshift = null;
    }
    if (c.burst > 0) c.burst = Math.max(0, c.burst - dt);
    if (c.channel > 0) {
      c.channel -= dt;
      if (c.channel <= TIMER_EPSILON) {
        c.channel = 0;
        if (c.def.familiar) this.summon(c, c.def.familiar, MECHANIC.familiarShare, events, true);
      }
    }
  }

  resolveTargets(actor: Combatant, skill: SkillDef): Combatant[] {
    const t = skill.target;
    if (t.side === 'self') return [actor];
    if (t.side === 'summons') {
      const own = this.summonsOf(actor);
      return t.area === 'all' ? own : own.slice(0, 1);
    }

    const side: Side = t.side === 'ally' ? actor.side : opposite(actor.side);
    const pool = this.alive(side);
    if (pool.length === 0) return [];

    if (t.side === 'enemy' && t.area === 'single') {
      const taunter = frontMost(pool.filter(hasTaunt));
      if (taunter) return [taunter];
    }

    const primary = this.select(actor, t.select, pool) ?? frontMost(pool)!;
    return expandArea(primary, t.area, pool);
  }

  private select(actor: Combatant, selector: Selector, pool: Combatant[]): Combatant | null {
    const hpPct = (c: Combatant) => c.hp / c.maxHp;
    switch (selector) {
      case 'front':
        return frontMost(pool);
      case 'back':
        return pool.reduce((a, b) => (frontKey(b) > frontKey(a) ? b : a));
      case 'random':
        return pool[Math.floor(this.rng() * pool.length)];
      case 'lowestHpPct':
        return extreme(pool, (c) => -hpPct(c));
      case 'highestHpPct':
        return extreme(pool, hpPct);
      case 'lowestHp':
        return extreme(pool, (c) => -c.hp);
      case 'highestHp':
        return extreme(pool, (c) => c.hp);
      case 'attackedMe':
        return pool.find((c) => c.uid === actor.lastAttacker) ?? null;
      case 'mostDamage':
        return extreme(
          pool.filter((c) => c.damageDealt > 0),
          (c) => c.damageDealt,
        );
      case 'castSpell':
        return frontMost(pool.filter((c) => c.castSpell));
      case 'castDefensive':
        return frontMost(pool.filter((c) => c.castDefensive));
    }
  }

  private useSkill(actor: Combatant, skill: SkillDef, events: BattleEvent[]): void {
    const targets = this.resolveTargets(actor, skill);
    const selfOnly = skill.effects.every((e) => e.self || e.onSummons);
    if (targets.length === 0 && !selfOnly) return;
    events.push({ type: 'skill', actor: actor.uid, skill: skill.id, targets: targets.map((t) => t.uid) });
    if (skill.category === 'spell') actor.castSpell = true;
    if (isDefensive(skill)) actor.castDefensive = true;

    let mult = skill.synergy && actor.slots.some((s) => s.def.id === skill.synergy!.with) ? 1 + skill.synergy.bonus : 1;
    if (skill.glory) mult *= 1 + skill.glory * Math.floor(this.elapsed / MECHANIC.gloryStepSeconds);
    if (skill.form && actor.shapeshift) mult *= 1 + actor.shapeshift.bonus;

    for (const effect of skill.effects.filter((e) => e.self)) {
      if (this.result) return;
      this.applyEffect(actor, skill.id, effect, actor, mult, events, true);
    }
    for (const effect of skill.effects.filter((e) => e.onSummons)) {
      for (const summoned of this.summonsOf(actor)) {
        if (this.result) return;
        this.applyEffect(actor, skill.id, effect, summoned, mult, events, true);
      }
    }
    for (const target of targets) {
      for (const effect of skill.effects.filter((e) => !e.self && !e.onSummons)) {
        if (this.result) return;
        // Spawning works from a fallen caster too (a boss bursting into minions as it dies).
        if (target.hp <= 0 && effect.kind !== 'spawn') break;
        this.applyEffect(actor, skill.id, effect, target, mult, events, true);
      }
    }
    if (skill.category === 'spell' && !skill.trigger) this.fireTrigger(actor, 'castSpell', events);
  }

  // `direct` is false for effects triggered by enchantments, which must not trigger further on-hit enchantments.
  private applyEffect(
    actor: Combatant,
    source: string,
    effect: SkillEffect,
    target: Combatant,
    mult: number,
    events: BattleEvent[],
    direct: boolean,
  ): void {
    switch (effect.kind) {
      case 'damage': {
        for (let hit = 0; hit < (effect.hits ?? 1); hit++) {
          if (target.hp <= 0 || this.result) return;
          let power = statOf(actor, effect.stat) * effect.scaling * mult;
          if (actor.def.mechanic === 'chi') power *= actor.burst > 0 ? MECHANIC.chiBurst : MECHANIC.chiFilling;
          if (effect.vsCasters) power *= target.castSpell ? 1 + effect.vsCasters.bonus : 1 - effect.vsCasters.penalty;
          if (target.transformed > 0) power *= MECHANIC.transformedDamageTaken;
          const mitigation = statOf(target, effect.damageType === 'physical' ? 'defense' : 'resistance');
          const amount = mitigate(power, mitigation, resistOf(target, effect.element));
          const total = this.applyDamage(actor, target, amount, events, { element: effect.element, direct: true });
          if (effect.drain) this.heal(actor, actor, Math.round(total * effect.drain), events);
          if (actor.def.mechanic === 'chi') this.gainChi(actor, MECHANIC.chiPerHit, events);
          if (direct) this.triggerOnHit(actor, target, events);
          this.triggerReactive(actor, target, total, events);
        }
        return;
      }
      case 'barrier': {
        const amount = Math.round(statOf(actor, effect.stat) * effect.scaling * mult);
        target.barrier = { amount, remaining: effect.duration };
        events.push({ type: 'barrier', target: target.uid, amount });
        return;
      }
      case 'heal':
        this.heal(actor, target, Math.round(statOf(actor, 'magic') * effect.scaling * mult), events);
        return;
      case 'regen': {
        const amount = Math.round(statOf(actor, 'magic') * effect.scaling * mult);
        target.regens = refresh(target.regens, { source, owner: actor.uid, amount, remaining: effect.duration, tick: 0 });
        return;
      }
      case 'dot': {
        const amount = Math.round(statOf(actor, effect.stat) * effect.scaling * mult);
        const dot: Ticking = { source, owner: actor.uid, amount, element: effect.element, remaining: effect.duration, tick: 0 };
        target.dots = refresh(target.dots, dot);
        return;
      }
      case 'buff':
      case 'debuff': {
        const sign = effect.kind === 'buff' ? 1 : -1;
        this.setBuff(target, source, effect.stat, sign * Math.round(effect.amount * mult), effect.duration, events);
        return;
      }
      case 'siphon': {
        const amount = Math.round(effect.amount * mult);
        this.setBuff(target, source, effect.stat, -amount, effect.duration, events);
        this.setBuff(actor, source, effect.stat, amount, effect.duration, events);
        return;
      }
      case 'speed':
        target.speed = refreshTimed(target.speed, { source, value: effect.factor, remaining: effect.duration });
        events.push({ type: 'status', target: target.uid, status: effect.factor < 1 ? 'slow' : 'haste' });
        return;
      case 'transform':
        target.transformed = Math.max(target.transformed, effect.duration);
        events.push({ type: 'status', target: target.uid, status: 'transform' });
        return;
      case 'taunt':
        target.taunting = Math.max(target.taunting, effect.duration);
        events.push({ type: 'status', target: target.uid, status: 'taunt' });
        return;
      case 'shapeshift':
        target.shapeshift = { remaining: effect.duration, bonus: effect.bonus };
        events.push({ type: 'status', target: target.uid, status: 'shapeshift' });
        return;
      case 'steal': {
        const stolen = target.buffs.find((b) => b.amount > 0);
        if (!stolen) return;
        target.buffs = target.buffs.filter((b) => b !== stolen);
        this.setBuff(actor, `stolen:${stolen.source}`, stolen.stat, stolen.amount, stolen.remaining, events);
        events.push({ type: 'status', target: target.uid, status: 'steal' });
        return;
      }
      case 'delay':
        for (const slot of target.slots) slot.timer = Math.max(-slot.def.cooldown, slot.timer - effect.seconds);
        events.push({ type: 'status', target: target.uid, status: 'delay' });
        return;
      case 'gold':
        this.gold += Math.round(effect.amount * mult);
        events.push({ type: 'gold', amount: Math.round(effect.amount * mult) });
        return;
      case 'selfDamage':
        this.loseHp(target, Math.max(1, Math.round(target.maxHp * effect.fraction)), events, target);
        return;
      case 'chaos': {
        const pick = effect.options[Math.floor(this.rng() * effect.options.length)];
        this.applyEffect(actor, source, pick, target, mult, events, direct);
        return;
      }
      case 'meter':
        if (target.def.mechanic === 'chi') this.gainChi(target, effect.amount, events);
        else if (target.def.mechanic === 'rage') this.gainRage(target, effect.amount, events);
        else if (target.def.mechanic === 'souls') target.meter = Math.min(MECHANIC.soulsMax, target.meter + effect.amount);
        return;
      case 'summon':
        this.summon(actor, effect.creature, effect.share * mult, events, false);
        return;
      case 'spawn':
        this.spawn(actor, effect.enemy, effect.count, effect.cap, events);
        return;
      case 'consumeSummon': {
        const victim = this.summonsOf(actor)[0];
        if (!victim) return;
        victim.hp = 0;
        this.onDeath(victim, events);
        return;
      }
    }
  }

  private setBuff(target: Combatant, source: string, stat: StatKey, amount: number, duration: number, events: BattleEvent[]): void {
    target.buffs = target.buffs.filter((b) => b.source !== source || b.stat !== stat);
    target.buffs.push({ source, stat, amount, remaining: duration });
    events.push({ type: 'buff', target: target.uid, stat, amount });
  }

  // Enemy reinforcements fill empty grid cells front to back, up to `cap` of that type alive at once.
  private spawn(actor: Combatant, enemyId: string, count: number, cap: number, events: BattleEvent[]): void {
    const def = this.bestiary[enemyId];
    if (!def || actor.side !== 'enemy') return;
    for (let i = 0; i < count; i++) {
      const alive = this.alive('enemy');
      if (alive.filter((c) => c.def.id === enemyId).length >= cap) return;
      const taken = new Set(alive.map((c) => c.position));
      const position = [...Array(ENEMY_ROWS * ENEMY_ROWS).keys()].find((p) => !taken.has(p));
      if (position === undefined) return;
      const unit = createCombatant(def, def.skills, 'enemy', position, {}, this.rng);
      unit.uid = `enemy-spawn-${++this.spawnCount}`;
      this.combatants.push(unit);
      events.push({ type: 'summon', summoner: actor.uid, unit: unit.uid });
    }
  }

  private summon(owner: Combatant, creatureId: string, share: number, events: BattleEvent[], familiar: boolean): void {
    const template = this.creatures[creatureId];
    if (!template || owner.side !== 'party') return;
    const scale = (n: number) => Math.max(1, Math.round(n * share));
    const power = Math.max(statOf(owner, 'attack'), statOf(owner, 'magic'));
    const def: CombatantDef = {
      ...template,
      stats: {
        hp: scale(owner.maxHp),
        attack: scale(power),
        magic: scale(power),
        defense: scale(statOf(owner, 'defense')),
        resistance: scale(statOf(owner, 'resistance')),
      },
    };
    // Up to 2 summons per summoner, in front of them in the same row; when full, the newest replaces the oldest.
    const own = this.summonsOf(owner);
    let position: number;
    if (own.length >= SUMMONS_PER_MEMBER) {
      own[0].hp = 0;
      position = own[0].position;
    } else {
      const used = new Set(own.map((c) => c.position));
      const slot = [...Array(SUMMONS_PER_MEMBER).keys()].find((s) => !used.has(summonPosition(owner, s)))!;
      position = summonPosition(owner, slot);
    }
    const unit = createCombatant(def, def.skills, 'party', position, {}, this.rng);
    unit.uid = `summon-${++this.summonCount}`;
    unit.summoner = owner.uid;
    unit.familiar = familiar;
    this.combatants.push(unit);
    events.push({ type: 'summon', summoner: owner.uid, unit: unit.uid });
  }

  private gainChi(monk: Combatant, amount: number, events: BattleEvent[]): void {
    if (monk.burst > 0) return;
    monk.meter += amount;
    if (monk.meter < MECHANIC.chiMax) return;
    monk.meter = 0;
    monk.burst = MECHANIC.burstSeconds;
    events.push({ type: 'status', target: monk.uid, status: 'burst' });
  }

  private gainRage(barbarian: Combatant, amount: number, events: BattleEvent[]): void {
    if (barbarian.burst > 0) return;
    barbarian.meter += amount;
    if (barbarian.meter < MECHANIC.rageMax) return;
    barbarian.meter = 0;
    barbarian.burst = MECHANIC.frenzySeconds;
    events.push({ type: 'status', target: barbarian.uid, status: 'frenzy' });
  }

  private heal(source: Combatant, target: Combatant, raw: number, events: BattleEvent[], periodic = false): void {
    if (target.hp <= 0) return;
    const amount = Math.min(target.maxHp - target.hp, raw);
    target.hp += amount;
    events.push({ type: 'heal', source: source.uid, target: target.uid, amount, ...(periodic && { periodic }) });
    if (amount > 0) this.fireTrigger(target, 'whenHealed', events);
  }

  private triggerOnHit(actor: Combatant, target: Combatant, events: BattleEvent[]): void {
    for (const { source, ench } of enchantments(actor)) {
      if (ench.kind !== 'onHit' || target.hp <= 0 || this.rng() >= ench.chance) continue;
      this.applyEffect(actor, source, ench.effect, target, 1, events, false);
    }
  }

  private triggerReactive(attacker: Combatant, target: Combatant, total: number, events: BattleEvent[]): void {
    for (const { source, ench } of enchantments(target)) {
      if (this.result) return;
      if (ench.kind === 'thorns' && attacker.hp > 0) {
        const amount = Math.max(1, Math.round(total * ench.fraction));
        this.applyDamage(target, attacker, amount, events, { direct: false });
      }
      if (ench.kind === 'onHitTaken' && target.hp > 0 && this.rng() < ench.chance) {
        const aimAt = HOSTILE_KINDS.has(ench.effect.kind) ? attacker : target;
        if (aimAt.hp > 0) this.applyEffect(target, source, ench.effect, aimAt, 1, events, false);
      }
    }
  }

  private tickPeriodic(dt: number, events: BattleEvent[]): void {
    for (const c of this.alive()) {
      for (const r of c.regens) {
        const ticks = advance(r, dt);
        for (let i = 0; i < ticks; i++) this.heal(this.get(r.owner), c, r.amount, events, true);
      }
      c.regens = c.regens.filter((r) => r.remaining > TIMER_EPSILON);

      for (const d of c.dots) {
        const ticks = advance(d, dt);
        for (let i = 0; i < ticks; i++) {
          if (c.hp <= 0 || this.result) break;
          const amount = Math.max(1, Math.round(d.amount * (1 - resistOf(c, d.element))));
          this.applyDamage(this.get(d.owner), c, amount, events, { element: d.element, direct: false, periodic: true });
        }
      }
      c.dots = c.dots.filter((d) => d.remaining > TIMER_EPSILON);
      if (this.result) return;
    }
  }

  // Returns the total damage landed (barrier absorption included) so drain and thorns can scale from it.
  // Passive regeneration heals in whole points as they build up, unless a blocking element hit it recently.
  private tickRegeneration(c: Combatant, dt: number, events: BattleEvent[]): void {
    const regen = c.def.regeneration;
    c.regenBlocked = Math.max(0, c.regenBlocked - dt);
    if (!regen || c.regenBlocked > 0 || c.hp >= c.maxHp) return;
    c.regenCarry += c.maxHp * regen.perSecond * dt;
    const amount = Math.min(Math.floor(c.regenCarry), c.maxHp - c.hp);
    if (amount < 1) return;
    c.regenCarry -= amount;
    c.hp += amount;
    events.push({ type: 'heal', source: c.uid, target: c.uid, amount, periodic: true });
  }

  private applyDamage(
    source: Combatant,
    target: Combatant,
    amount: number,
    events: BattleEvent[],
    opts: { element?: Element; direct: boolean; periodic?: boolean },
  ): number {
    const regen = target.def.regeneration;
    if (regen && opts.element && regen.blockedBy.includes(opts.element)) target.regenBlocked = regen.blockSeconds;
    let absorbed = 0;
    if (target.barrier) {
      absorbed = Math.min(target.barrier.amount, amount);
      target.barrier.amount -= absorbed;
      if (target.barrier.amount <= 0) {
        target.barrier = null;
        this.fireTrigger(target, 'barrierBreaks', events);
      }
    }
    const dealt = Math.min(target.hp, amount - absorbed);
    source.damageDealt += dealt;
    if (opts.direct) target.lastAttacker = source.uid;
    events.push({
      type: 'damage',
      source: source.uid,
      target: target.uid,
      amount: amount - absorbed,
      absorbed,
      ...(opts.element && { element: opts.element }),
      ...(opts.periodic && { periodic: true }),
    });
    this.loseHp(target, dealt, events, source);
    return dealt + absorbed;
  }

  // All HP loss funnels through here so rage, event timers, and deaths stay consistent.
  private loseHp(target: Combatant, amount: number, events: BattleEvent[], source: Combatant): void {
    if (amount <= 0 || target.hp <= 0) return;
    const selfInflicted = source === target;
    const dealt = selfInflicted ? Math.min(amount, target.hp - 1) : Math.min(amount, target.hp);
    if (dealt <= 0) return;
    target.hp -= dealt;
    if (target.hp > 0) {
      for (const slot of target.slots) {
        const trigger = slot.def.trigger;
        if (trigger?.kind !== 'belowHp' || slot.spent || target.hp / target.maxHp >= trigger.threshold) continue;
        slot.spent = true;
        this.useSkill(target, slot.def, events);
      }
    }

    if (target.def.mechanic === 'rage') this.gainRage(target, (dealt / target.maxHp) * 100, events);
    if (target.hp <= 0) return this.onDeath(target, events, source);
    if (!selfInflicted) {
      this.fireTrigger(target, 'whenHit', events);
      for (const ally of this.alive(target.side)) if (ally !== target) this.fireTrigger(ally, 'allyHurt', events);
    }
  }

  private onDeath(target: Combatant, events: BattleEvent[], killer?: Combatant): void {
    events.push({ type: 'death', target: target.uid });
    this.breakEquipment(target, events);
    for (const c of this.alive()) {
      if (c.def.mechanic === 'souls') c.meter = Math.min(MECHANIC.soulsMax, c.meter + 1);
    }

    this.fireTrigger(target, 'onDefeat', events);
    if (killer && killer.hp > 0 && killer.side !== target.side) this.fireTrigger(killer, 'onKill', events);
    for (const c of this.alive()) {
      if (c.side === target.side && !isSummon(target)) this.fireTrigger(c, 'allyFalls', events);
      if (c.side !== target.side) this.fireTrigger(c, 'enemyDies', events);
    }

    if (target.familiar && target.summoner) {
      const owner = this.get(target.summoner);
      if (owner.hp > 0) owner.channel = MECHANIC.channelSeconds;
    }

    if (this.alive('enemy').length === 0) this.result = 'victory';
    else if (this.members('party').length === 0) this.result = 'defeat';
    if (this.result) {
      events.push({ type: 'end', result: this.result });
      return;
    }

    if (isSummon(target)) return;
    for (const ally of this.alive(target.side)) {
      for (const { source, ench } of enchantments(ally)) {
        if (ench.kind === 'onAllyDeath') this.applyEffect(ally, source, ench.effect, ally, 1, events, false);
      }
    }
  }

  private breakEquipment(target: Combatant, events: BattleEvent[]): void {
    const worn = EQUIP_SLOTS.filter((s) => target.equipment[s]);
    if (worn.length === 0) return;
    const slot: EquipSlot = worn[Math.floor(this.rng() * worn.length)];
    const item = target.equipment[slot]!;
    delete target.equipment[slot];
    events.push({ type: 'equipmentBroken', target: target.uid, slot, item: item.id });
  }
}

// Reapplying resets the duration but keeps tick progress, so an effect refreshed every second still ticks.
function refresh(list: Ticking[], next: Ticking): Ticking[] {
  const existing = list.find((t) => t.source === next.source);
  return [...list.filter((t) => t !== existing), { ...next, tick: existing?.tick ?? 0 }];
}

function refreshTimed(list: Timed[], next: Timed): Timed[] {
  return [...list.filter((t) => t.source !== next.source), next];
}

// Advances a periodic effect by dt and returns how many whole-second ticks it crossed.
function advance(t: Ticking, dt: number): number {
  t.tick += dt;
  t.remaining -= dt;
  let ticks = 0;
  while (t.tick + TIMER_EPSILON >= 1) {
    t.tick -= 1;
    ticks++;
  }
  return ticks;
}

function opposite(side: Side): Side {
  return side === 'party' ? 'enemy' : 'party';
}

function frontMost(pool: Combatant[]): Combatant | null {
  if (pool.length === 0) return null;
  return pool.reduce((a, b) => (frontKey(b) < frontKey(a) ? b : a));
}

// Highest score wins; ties go to the front-most unit.
function extreme(pool: Combatant[], score: (c: Combatant) => number): Combatant | null {
  let best: Combatant | null = null;
  for (const c of pool) {
    if (!best || score(c) > score(best) || (score(c) === score(best) && frontKey(c) < frontKey(best))) best = c;
  }
  return best;
}

function expandArea(primary: Combatant, area: Area, pool: Combatant[]): Combatant[] {
  const cell = gridCell(primary);
  switch (area) {
    case 'single':
      return [primary];
    case 'row':
      return pool.filter((c) => gridCell(c).row === cell.row);
    case 'column':
      return pool.filter((c) => gridCell(c).column === cell.column);
    case 'all':
      return pool;
  }
}

// A negative starting timer delays the first activation so identical units don't fire in lockstep.
// A hero's 3 timed slots run at their slot speeds; the trigger (if any) sits in slot 4.
function heroCombatant(m: PartyMember, index: number, rng: Rng): Combatant {
  const c = createCombatant(m.def, m.trigger ? [...m.skills, m.trigger] : m.skills, 'party', index, { ...m.equipment }, rng);
  c.slots.forEach((slot, i) => {
    if (slot.def.trigger) slot.position = TRIGGER_SLOT;
    else slot.rate = SLOT_RATES[i] ?? 1;
  });
  return c;
}

function createCombatant(
  def: CombatantDef,
  skills: SkillDef[],
  side: Side,
  position: number,
  equipment: PartyMember['equipment'],
  rng: Rng,
): Combatant {
  const maxHp = def.stats.hp + Object.values(equipment).reduce((sum, e) => sum + (e?.stats.hp ?? 0), 0);
  return {
    uid: `${side}-${position}`,
    def,
    side,
    position,
    equipment,
    maxHp,
    hp: maxHp,
    barrier: null,
    buffs: [],
    dots: [],
    regens: [],
    speed: [],
    // Triggers start the fight ready; timed skills start with a small random offset.
    slots: skills.map((s, i) => ({ def: s, timer: s.trigger ? s.cooldown : -rng() * MAX_START_DELAY, position: i, rate: 1 })),
    damageDealt: 0,
    lastAttacker: null,
    castSpell: false,
    castDefensive: false,
    summoner: null,
    familiar: false,
    transformed: 0,
    taunting: 0,
    shapeshift: null,
    channel: 0,
    meter: 0,
    burst: 0,
    regenBlocked: 0,
    regenCarry: 0,
  };
}

function addStats(stats: Stats, bonus: Partial<Stats>): Stats {
  const sum = { ...stats };
  for (const [k, v] of Object.entries(bonus) as [keyof Stats, number][]) sum[k] += v;
  return sum;
}

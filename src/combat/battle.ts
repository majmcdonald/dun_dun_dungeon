import type { Rng } from '../engine/random';
import type {
  Area,
  BattleEvent,
  BattleResult,
  Combatant,
  CombatantDef,
  Element,
  EquipSlot,
  Enchantment,
  PartyMember,
  Selector,
  Side,
  SkillDef,
  SkillEffect,
  StatKey,
  Ticking,
} from './types';
import { EQUIP_SLOTS } from './types';

// Guards against float drift from summing 1/60 steps (120 * 1/60 can land just under 2.0).
const TIMER_EPSILON = 1e-9;
export const MAX_START_DELAY = 0.2;
export const ENEMY_ROWS = 3;
const MAX_RESIST = 0.9;

export function mitigate(power: number, mitigation: number, resist = 0): number {
  return Math.max(1, Math.round(((power * 100) / (100 + mitigation)) * (1 - resist)));
}

// Party stands in one column (each member its own row); enemies fill a 3x3 grid, column 0 in front.
export function gridCell(c: Pick<Combatant, 'side' | 'position'>): { row: number; column: number } {
  if (c.side === 'party') return { row: c.position, column: 0 };
  return { row: c.position % ENEMY_ROWS, column: Math.floor(c.position / ENEMY_ROWS) };
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
  return enchantments(c).some(({ ench }) => ench.kind === 'taunt');
}

const DEFENSIVE_KINDS = new Set<SkillEffect['kind']>(['heal', 'barrier', 'buff', 'regen']);
// Effects that hurt whoever they land on; reactive enchantments aim these at the attacker instead of the wearer.
const HOSTILE_KINDS = new Set<SkillEffect['kind']>(['damage', 'dot', 'debuff']);

function isDefensive(skill: SkillDef): boolean {
  return skill.category === 'spell' && skill.effects.some((e) => DEFENSIVE_KINDS.has(e.kind));
}

export class Battle {
  readonly combatants: Combatant[];
  elapsed = 0;
  result: BattleResult | null = null;

  constructor(
    party: PartyMember[],
    enemies: CombatantDef[],
    private rng: Rng = Math.random,
  ) {
    this.combatants = [
      ...party.map((m, i) => createCombatant(m.def, m.skills, 'party', i, { ...m.equipment }, rng)),
      ...enemies.map((def, i) => createCombatant(def, def.skills, 'enemy', i, {}, rng)),
    ];
  }

  tick(dt: number): BattleEvent[] {
    if (this.result) return [];
    this.elapsed += dt;
    const events: BattleEvent[] = [];

    for (const c of this.alive()) {
      if (c.barrier) {
        c.barrier.remaining -= dt;
        if (c.barrier.remaining <= TIMER_EPSILON) c.barrier = null;
      }
      for (const b of c.buffs) b.remaining -= dt;
      c.buffs = c.buffs.filter((b) => b.remaining > TIMER_EPSILON);
    }

    this.tickPeriodic(dt, events);

    for (const actor of this.combatants) {
      for (const slot of actor.slots) {
        if (actor.hp <= 0 || this.result) break;
        slot.timer += dt;
        if (slot.timer + TIMER_EPSILON < slot.def.cooldown) continue;
        slot.timer -= slot.def.cooldown;
        this.useSkill(actor, slot.def, events);
      }
    }

    return events;
  }

  alive(side?: Side): Combatant[] {
    return this.combatants.filter((c) => c.hp > 0 && (!side || c.side === side));
  }

  get(uid: string): Combatant {
    const c = this.combatants.find((x) => x.uid === uid);
    if (!c) throw new Error(`Unknown combatant: ${uid}`);
    return c;
  }

  resolveTargets(actor: Combatant, skill: SkillDef): Combatant[] {
    const t = skill.target;
    if (t.side === 'self') return [actor];

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
        return pool.reduce((a, b) => (b.position > a.position ? b : a));
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
    if (targets.length === 0) return;
    events.push({ type: 'skill', actor: actor.uid, skill: skill.id, targets: targets.map((t) => t.uid) });
    if (skill.category === 'spell') actor.castSpell = true;
    if (isDefensive(skill)) actor.castDefensive = true;

    const synergy = skill.synergy && actor.slots.some((s) => s.def.id === skill.synergy!.with) ? 1 + skill.synergy.bonus : 1;
    for (const target of targets) {
      for (const effect of skill.effects) {
        if (this.result || target.hp <= 0) break;
        this.applyEffect(actor, skill.id, effect, target, synergy, events, true);
      }
    }
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
          const power = statOf(actor, effect.stat) * effect.scaling * mult;
          const mitigation = statOf(target, effect.damageType === 'physical' ? 'defense' : 'resistance');
          const amount = mitigate(power, mitigation, resistOf(target, effect.element));
          const total = this.applyDamage(actor, target, amount, events, { element: effect.element, direct: true });
          if (effect.drain) this.heal(actor, actor, Math.round(total * effect.drain), events);
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
        const amount = sign * Math.round(effect.amount * mult);
        target.buffs = target.buffs.filter((b) => b.source !== source || b.stat !== effect.stat);
        target.buffs.push({ source, stat: effect.stat, amount, remaining: effect.duration });
        events.push({ type: 'buff', target: target.uid, stat: effect.stat, amount });
        return;
      }
    }
  }

  private heal(source: Combatant, target: Combatant, raw: number, events: BattleEvent[], periodic = false): void {
    if (target.hp <= 0) return;
    const amount = Math.min(target.maxHp - target.hp, raw);
    target.hp += amount;
    events.push({ type: 'heal', source: source.uid, target: target.uid, amount, ...(periodic && { periodic }) });
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
  private applyDamage(
    source: Combatant,
    target: Combatant,
    amount: number,
    events: BattleEvent[],
    opts: { element?: Element; direct: boolean; periodic?: boolean },
  ): number {
    let absorbed = 0;
    if (target.barrier) {
      absorbed = Math.min(target.barrier.amount, amount);
      target.barrier.amount -= absorbed;
      if (target.barrier.amount <= 0) target.barrier = null;
    }
    const dealt = Math.min(target.hp, amount - absorbed);
    target.hp -= dealt;
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

    if (target.hp <= 0) this.onDeath(target, events);
    return dealt + absorbed;
  }

  private onDeath(target: Combatant, events: BattleEvent[]): void {
    events.push({ type: 'death', target: target.uid });
    this.breakEquipment(target, events);

    if (this.alive('enemy').length === 0) this.result = 'victory';
    else if (this.alive('party').length === 0) this.result = 'defeat';
    if (this.result) {
      events.push({ type: 'end', result: this.result });
      return;
    }

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
  return pool.reduce((a, b) => (b.position < a.position ? b : a));
}

// Highest score wins; ties go to the front-most unit.
function extreme(pool: Combatant[], score: (c: Combatant) => number): Combatant | null {
  let best: Combatant | null = null;
  for (const c of pool) {
    if (!best || score(c) > score(best) || (score(c) === score(best) && c.position < best.position)) best = c;
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
    slots: skills.map((s) => ({ def: s, timer: -rng() * MAX_START_DELAY })),
    damageDealt: 0,
    lastAttacker: null,
    castSpell: false,
    castDefensive: false,
  };
}

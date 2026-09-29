import type { Rng } from '../engine/random';
import type {
  Area,
  BattleEvent,
  BattleResult,
  Combatant,
  CombatantDef,
  EquipSlot,
  PartyMember,
  Selector,
  Side,
  SkillDef,
  StatKey,
} from './types';
import { EQUIP_SLOTS } from './types';

// Guards against float drift from summing 1/60 steps (120 * 1/60 can land just under 2.0).
const TIMER_EPSILON = 1e-9;
export const MAX_START_DELAY = 0.2;
export const ENEMY_ROWS = 3;

export function mitigate(power: number, mitigation: number): number {
  return Math.max(1, Math.round((power * 100) / (100 + mitigation)));
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
  return value;
}

function isDefensive(skill: SkillDef): boolean {
  return skill.category === 'spell' && skill.effect.kind !== 'damage';
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
      ...party.map((m, i) => createCombatant(m.def, 'party', i, { ...m.equipment }, rng)),
      ...enemies.map((def, i) => createCombatant(def, 'enemy', i, {}, rng)),
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
      const taunter = frontMost(pool.filter((c) => Object.values(c.equipment).some((e) => e?.taunt)));
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

    for (const target of targets) {
      if (this.result) return;
      this.applyEffect(actor, skill, target, events);
    }
  }

  private applyEffect(actor: Combatant, skill: SkillDef, target: Combatant, events: BattleEvent[]): void {
    const effect = skill.effect;
    switch (effect.kind) {
      case 'barrier': {
        const amount = Math.round(statOf(target, effect.stat) * effect.scaling);
        target.barrier = { amount, remaining: effect.duration };
        events.push({ type: 'barrier', target: target.uid, amount });
        return;
      }
      case 'heal': {
        const amount = Math.min(target.maxHp - target.hp, Math.round(statOf(actor, 'magic') * effect.scaling));
        target.hp += amount;
        events.push({ type: 'heal', source: actor.uid, target: target.uid, amount });
        return;
      }
      case 'buff': {
        target.buffs = target.buffs.filter((b) => b.skill !== skill.id);
        target.buffs.push({ skill: skill.id, stat: effect.stat, amount: effect.amount, remaining: effect.duration });
        events.push({ type: 'buff', target: target.uid, stat: effect.stat, amount: effect.amount });
        return;
      }
      case 'damage': {
        const power = statOf(actor, effect.stat) * effect.scaling;
        const mitigation = statOf(target, effect.damageType === 'physical' ? 'defense' : 'resistance');
        this.applyDamage(actor, target, mitigate(power, mitigation), events);
        return;
      }
    }
  }

  private applyDamage(source: Combatant, target: Combatant, amount: number, events: BattleEvent[]): void {
    let absorbed = 0;
    if (target.barrier) {
      absorbed = Math.min(target.barrier.amount, amount);
      target.barrier.amount -= absorbed;
      if (target.barrier.amount <= 0) target.barrier = null;
    }
    const dealt = Math.min(target.hp, amount - absorbed);
    target.hp -= dealt;
    source.damageDealt += dealt;
    target.lastAttacker = source.uid;
    events.push({ type: 'damage', source: source.uid, target: target.uid, amount: amount - absorbed, absorbed });

    if (target.hp > 0) return;
    events.push({ type: 'death', target: target.uid });
    this.breakEquipment(target, events);

    if (this.alive('enemy').length === 0) this.result = 'victory';
    else if (this.alive('party').length === 0) this.result = 'defeat';
    if (this.result) events.push({ type: 'end', result: this.result });
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
    slots: def.skills.map((s) => ({ def: s, timer: -rng() * MAX_START_DELAY })),
    damageDealt: 0,
    lastAttacker: null,
    castSpell: false,
    castDefensive: false,
  };
}

import type {
  BattleEvent,
  BattleResult,
  Combatant,
  CombatantDef,
  Side,
  SkillDef,
} from './types';
import type { Rng } from '../engine/random';

// Guards against float drift from summing 1/60 steps (120 * 1/60 can land just under 2.0).
const TIMER_EPSILON = 1e-9;
export const MAX_START_DELAY = 0.2;

export function mitigate(power: number, mitigation: number): number {
  return Math.max(1, Math.round((power * 100) / (100 + mitigation)));
}

export class Battle {
  readonly combatants: Combatant[];
  elapsed = 0;
  result: BattleResult | null = null;

  constructor(party: CombatantDef[], enemies: CombatantDef[], rng: Rng = Math.random) {
    this.combatants = [
      ...party.map((def, i) => createCombatant(def, 'party', i, rng)),
      ...enemies.map((def, i) => createCombatant(def, 'enemy', i, rng)),
    ];
  }

  tick(dt: number): BattleEvent[] {
    if (this.result) return [];
    this.elapsed += dt;
    const events: BattleEvent[] = [];

    for (const c of this.alive()) {
      if (!c.barrier) continue;
      c.barrier.remaining -= dt;
      if (c.barrier.remaining <= TIMER_EPSILON) c.barrier = null;
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

  private useSkill(actor: Combatant, skill: SkillDef, events: BattleEvent[]): void {
    const target = this.resolveTarget(actor, skill);
    if (!target) return;
    events.push({ type: 'skill', actor: actor.uid, skill: skill.id });

    const effect = skill.effect;
    if (effect.kind === 'barrier') {
      const amount = Math.round(target.def.stats[effect.stat] * effect.scaling);
      target.barrier = { amount, remaining: effect.duration };
      events.push({ type: 'barrier', target: target.uid, amount });
      return;
    }

    const power = actor.def.stats[effect.stat] * effect.scaling;
    const mitigation =
      effect.damageType === 'physical' ? target.def.stats.defense : target.def.stats.resistance;
    this.applyDamage(actor, target, mitigate(power, mitigation), events);
  }

  private applyDamage(source: Combatant, target: Combatant, amount: number, events: BattleEvent[]): void {
    let absorbed = 0;
    if (target.barrier) {
      absorbed = Math.min(target.barrier.amount, amount);
      target.barrier.amount -= absorbed;
      if (target.barrier.amount <= 0) target.barrier = null;
    }
    target.hp = Math.max(0, target.hp - (amount - absorbed));
    events.push({ type: 'damage', source: source.uid, target: target.uid, amount: amount - absorbed, absorbed });

    if (target.hp > 0) return;
    events.push({ type: 'death', target: target.uid });

    if (this.alive('enemy').length === 0) this.result = 'victory';
    else if (this.alive('party').length === 0) this.result = 'defeat';
    if (this.result) events.push({ type: 'end', result: this.result });
  }

  private resolveTarget(actor: Combatant, skill: SkillDef): Combatant | null {
    if (skill.target === 'self') return actor;
    const opponents = this.alive(actor.side === 'party' ? 'enemy' : 'party');
    if (opponents.length === 0) return null;
    return opponents.reduce((front, c) => (c.position < front.position ? c : front));
  }
}

// A negative starting timer delays the first activation so identical units don't fire in lockstep.
function createCombatant(def: CombatantDef, side: Side, position: number, rng: Rng): Combatant {
  return {
    uid: `${side}-${position}`,
    def,
    side,
    position,
    hp: def.stats.hp,
    barrier: null,
    slots: def.skills.map((s) => ({ def: s, timer: -rng() * MAX_START_DELAY })),
  };
}

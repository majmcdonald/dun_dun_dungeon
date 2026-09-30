import type {
  Area,
  Category,
  Condition,
  DamageType,
  Element,
  Rarity,
  Selector,
  SkillAccess,
  SkillDef,
  SkillEffect,
  StatKey,
  Tag,
  Targeting,
  Trigger,
} from '../combat/types';
import { AREA_FACTOR, SKILL_BUDGET, skillAllowance, targetArea } from '../game/balance';

// Skills are authored as shares of their rarity budget; these builders turn shares into concrete numbers
// using the approved balancing-pass-1 formulas, so content stays on budget by construction.

interface Ctx {
  rarity: Rarity;
  cooldown: number;
  allowance: number;
  selfAllowance: number;
}

type Fx = (ctx: Ctx) => SkillEffect;

const step = (n: number, s: number) => Math.max(s, Math.round(n / s) * s);
const r2 = (n: number) => Math.round(n * 100) / 100;

export function dmg(
  share: number,
  opts: { type?: DamageType; element?: Element; hits?: number; drain?: number; vsCasters?: { bonus: number; penalty: number } } = {},
): Fx {
  return ({ rarity, cooldown, allowance }) => {
    const type = opts.type ?? 'physical';
    const hits = opts.hits ?? 1;
    const raw = (SKILL_BUDGET[rarity].damage * cooldown * allowance * share * (opts.drain ? 0.75 : 1)) / hits;
    return {
      kind: 'damage',
      damageType: type,
      stat: type === 'physical' ? 'attack' : 'magic',
      scaling: r2(step(raw, 0.05)),
      ...(opts.element && { element: opts.element }),
      ...(hits > 1 && { hits }),
      ...(opts.drain && { drain: opts.drain }),
      ...(opts.vsCasters && { vsCasters: opts.vsCasters }),
    };
  };
}

export function dot(share: number, duration: number, opts: { stat?: 'attack' | 'magic'; element?: Element } = {}): Fx {
  return ({ rarity, cooldown, allowance }) => ({
    kind: 'dot',
    stat: opts.stat ?? 'attack',
    scaling: r2(step((SKILL_BUDGET[rarity].damage * cooldown * allowance * share * 1.1) / duration, 0.01)),
    duration,
    ...(opts.element && { element: opts.element }),
  });
}

export function heal(share: number): Fx {
  return ({ rarity, cooldown, allowance }) => ({
    kind: 'heal',
    scaling: r2(step(SKILL_BUDGET[rarity].heal * cooldown * allowance * share, 0.05)),
  });
}

export function regen(share: number, duration: number): Fx {
  return ({ rarity, cooldown, allowance }) => ({
    kind: 'regen',
    scaling: r2(step((SKILL_BUDGET[rarity].heal * cooldown * allowance * share * 1.1) / duration, 0.01)),
    duration,
  });
}

export function barrier(share: number, duration: number, stat: 'defense' | 'resistance' = 'defense'): Fx {
  return ({ rarity, cooldown, allowance }) => ({
    kind: 'barrier',
    stat,
    scaling: r2(step(SKILL_BUDGET[rarity].barrier * cooldown * allowance * share, 0.05)),
    duration,
  });
}

function statChange(kind: 'buff' | 'debuff', stat: StatKey, share: number, duration: number): Fx {
  return ({ rarity, cooldown, allowance }) => ({
    kind,
    stat,
    amount: Math.max(1, Math.round((SKILL_BUDGET[rarity].buff * cooldown * allowance * share) / duration)),
    duration,
  });
}

export const buff = (stat: StatKey, share: number, duration: number) => statChange('buff', stat, share, duration);
export const debuff = (stat: StatKey, share: number, duration: number) => statChange('debuff', stat, share, duration);

const round = (n: number, s: number) => Math.round(n / s) * s;

export function slow(share: number, duration: number): Fx {
  return ({ rarity, cooldown, allowance }) => ({
    kind: 'speed',
    factor: r2(Math.max(0.3, 1 - round((SKILL_BUDGET[rarity].speed * cooldown * allowance * share) / duration, 0.05))),
    duration,
  });
}

export function haste(share: number, duration: number): Fx {
  return ({ rarity, cooldown, allowance }) => ({
    kind: 'speed',
    factor: r2(1 + round((SKILL_BUDGET[rarity].speed * cooldown * allowance * share) / duration, 0.05)),
    duration,
  });
}

export function summon(creature: string, share = 1): Fx {
  return ({ rarity, cooldown, allowance }) => ({
    kind: 'summon',
    creature,
    share: r2(step(SKILL_BUDGET[rarity].summon * cooldown * allowance * share, 0.05)),
  });
}

function control(kind: 'transform' | 'taunt', share: number): Fx {
  return ({ rarity, cooldown, allowance }) => ({
    kind,
    duration: step(SKILL_BUDGET[rarity].control * cooldown * allowance * share, 0.25),
  });
}

export const transform = (share: number) => control('transform', share);
export const taunt = (share: number) => control('taunt', share);

export function delay(share: number): Fx {
  return ({ rarity, cooldown, allowance }) => ({
    kind: 'delay',
    seconds: step(SKILL_BUDGET[rarity].control * cooldown * allowance * share, 0.25),
  });
}

export function shapeshift(share: number, duration: number): Fx {
  return ({ rarity, cooldown, allowance }) => ({
    kind: 'shapeshift',
    duration,
    bonus: r2(step((SKILL_BUDGET[rarity].control * cooldown * allowance * share) / duration, 0.05)),
  });
}

export function gold(share: number): Fx {
  return ({ rarity, cooldown }) => ({ kind: 'gold', amount: Math.max(1, Math.round(SKILL_BUDGET[rarity].gold * cooldown * share)) });
}

export function meter(share: number): Fx {
  return ({ rarity, cooldown, allowance }) => ({
    kind: 'meter',
    amount: Math.max(1, Math.round(SKILL_BUDGET[rarity].meter * cooldown * allowance * share)),
  });
}

export function siphon(stat: StatKey, share: number, duration: number): Fx {
  return ({ rarity, cooldown, allowance }) => ({
    kind: 'siphon',
    stat,
    amount: Math.max(1, Math.round((SKILL_BUDGET[rarity].buff * cooldown * allowance * share) / (2 * duration))),
    duration,
  });
}

export const steal = (): Fx => () => ({ kind: 'steal' });
export const selfDamage = (fraction: number): Fx => () => ({ kind: 'selfDamage', fraction, self: true });
export const consumeSummon = (): Fx => () => ({ kind: 'consumeSummon', self: true });

// Each option is budgeted as if it were the whole skill; the average cost is what the checker sees.
export function chaos(...options: Fx[]): Fx {
  return (ctx) => ({ kind: 'chaos', options: options.map((o) => o(ctx)) });
}

// Apply once to the caster instead of to each target.
export function self(fx: Fx): Fx {
  return (ctx) => ({ ...fx({ ...ctx, allowance: ctx.selfAllowance }), self: true });
}

// Apply to each of the caster's summons (budgeted like a self effect).
export function toSummons(fx: Fx): Fx {
  return (ctx) => ({ ...fx({ ...ctx, allowance: ctx.selfAllowance }), onSummons: true });
}

export function foe(select: Selector, area: Area = 'single'): Targeting {
  return { side: 'enemy', select, area };
}

export function ally(select: Selector, area: Area = 'single'): Targeting {
  return { side: 'ally', select, area };
}

export const SELF: Targeting = { side: 'self' };

export const SHARED: SkillAccess = { kind: 'shared' };
export const tag = (t: Tag): SkillAccess => ({ kind: 'tag', tag: t });
export const cls = (classId: string): SkillAccess => ({ kind: 'class', classId });

export interface SkillSpec {
  id: string;
  name: string;
  category: Category;
  rarity: Rarity;
  access: SkillAccess;
  cooldown: number;
  target: Targeting;
  fx: Fx[];
  prerequisite?: string;
  synergy?: { with: string; bonus: number };
  vfx?: string;
  theme?: string;
  trigger?: Trigger;
  condition?: Condition;
  glory?: number;
  form?: boolean;
}

export function skill(spec: SkillSpec): SkillDef {
  const allowance = skillAllowance(spec);
  const ctx = { rarity: spec.rarity, cooldown: spec.cooldown, allowance, selfAllowance: allowance / AREA_FACTOR[targetArea(spec)] };
  const { fx, ...rest } = spec;
  return { ...rest, effects: fx.map((f) => f(ctx)) };
}

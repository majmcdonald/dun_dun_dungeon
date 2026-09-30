import type {
  Area,
  Category,
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
} from '../combat/types';
import { SKILL_BUDGET } from '../game/balance';

// Skills are authored as shares of their rarity budget; these builders turn shares into concrete numbers
// using the approved balancing-pass-1 formulas, so content stays on budget by construction.

interface Ctx {
  rarity: Rarity;
  cooldown: number;
  allowance: number;
}

type Fx = (ctx: Ctx) => SkillEffect;

const AREA_FACTOR: Record<Area, number> = { single: 1, row: 0.5, column: 0.5, all: 0.35 };

const step = (n: number, s: number) => Math.max(s, Math.round(n / s) * s);
const r2 = (n: number) => Math.round(n * 100) / 100;

export function dmg(
  share: number,
  opts: { type?: DamageType; element?: Element; hits?: number; drain?: number } = {},
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
}

export function skill(spec: SkillSpec): SkillDef {
  const area = spec.target.side === 'self' ? 'single' : spec.target.area;
  const allowance = AREA_FACTOR[area] * (spec.prerequisite ? 1.15 : 1);
  const ctx = { rarity: spec.rarity, cooldown: spec.cooldown, allowance };
  const { fx, ...rest } = spec;
  return { ...rest, effects: fx.map((f) => f(ctx)) };
}

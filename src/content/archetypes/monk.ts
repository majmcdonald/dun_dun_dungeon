import type { SkillDef } from '../../combat/types';
import { barrier, buff, cls, delay, dmg, foe, haste, meter, self, SELF, skill, type SkillSpec } from '../build';

type Spec = Omit<SkillSpec, 'access' | 'category'> & { category?: SkillSpec['category'] };
const m = (spec: Spec): SkillDef => skill({ category: 'skill', ...spec, access: cls('monk') });

const BARE = { kind: 'onlyJewelry' } as const;
const BURST = { kind: 'chiBurst' } as const;
const FILLING = { kind: 'chiFilling' } as const;
const holy = (extra: object = {}) => ({ element: 'holy', ...extra }) as const;

// Open hand: only works while the monk wears nothing but jewelry.
const openHand: SkillDef[] = [
  m({ id: 'openPalm', name: 'Open Palm', theme: 'open hand', rarity: 'common', cooldown: 2, condition: BARE, target: foe('front'), fx: [dmg(1)] }),
  m({ id: 'craneKick', name: 'Crane Kick', theme: 'open hand', rarity: 'common', cooldown: 3.5, condition: BARE, target: foe('front', 'column'), fx: [dmg(1)] }),
  m({ id: 'ironBody', name: 'Iron Body', theme: 'open hand', rarity: 'common', cooldown: 7, condition: BARE, target: SELF, fx: [buff('defense', 0.5, 5), buff('resistance', 0.5, 5)] }),
  m({ id: 'tigerClaw', name: 'Tiger Claw', theme: 'open hand', rarity: 'rare', cooldown: 3, condition: BARE, target: foe('front'), fx: [dmg(1, { hits: 3 })], synergy: { with: 'openPalm', bonus: 0.3 } }),
  m({ id: 'pressurePoint', name: 'Pressure Point', theme: 'open hand', rarity: 'rare', cooldown: 4, condition: BARE, target: foe('highestHp'), fx: [dmg(0.5), delay(0.5)] }),
  m({ id: 'dragonKick', name: 'Dragon Kick', theme: 'open hand', rarity: 'epic', cooldown: 5, condition: BARE, target: foe('front', 'row'), fx: [dmg(1)] }),
  m({ id: 'thousandPalms', name: 'Thousand Palms', theme: 'open hand', rarity: 'epic', cooldown: 5, condition: BARE, target: foe('front'), fx: [dmg(1, { hits: 5 })] }),
  m({ id: 'emptyHand', name: 'Empty Hand', theme: 'open hand', rarity: 'legendary', cooldown: 5, condition: BARE, target: foe('lowestHpPct'), fx: [dmg(1, { hits: 4 })], prerequisite: 'flurry' }),
];

// True self: during Chi Burst, the monk's strikes heal him.
const trueSelf: SkillDef[] = [
  m({ id: 'healingStrike', name: 'Healing Strike', theme: 'true self', rarity: 'common', cooldown: 1.5, condition: BURST, target: foe('front'), fx: [dmg(1, { drain: 0.5 })] }),
  m({ id: 'chiLeech', name: 'Chi Leech', theme: 'true self', rarity: 'common', cooldown: 2, condition: BURST, target: foe('lowestHp'), fx: [dmg(1, { drain: 0.6 })] }),
  m({ id: 'harmony', name: 'Harmony', theme: 'true self', rarity: 'common', cooldown: 3, condition: BURST, target: SELF, fx: [barrier(1, 3)] }),
  m({ id: 'radiantFist', name: 'Radiant Fist', theme: 'true self', rarity: 'rare', cooldown: 2, condition: BURST, target: foe('front'), fx: [dmg(1, holy({ hits: 2, drain: 0.4 }))], synergy: { with: 'healingStrike', bonus: 0.3 } }),
  m({ id: 'serenity', name: 'Serenity', theme: 'true self', rarity: 'rare', cooldown: 3, condition: BURST, target: SELF, fx: [buff('defense', 1, 3)] }),
  m({ id: 'enlightenment', name: 'Enlightenment', theme: 'true self', rarity: 'epic', cooldown: 4, condition: BURST, target: foe('front', 'all'), fx: [dmg(1, { drain: 0.4 })] }),
];

// Soul: builds chi faster, but rests (holds) during Chi Burst.
const soul: SkillDef[] = [
  m({ id: 'meditate', name: 'Meditate', theme: 'soul', rarity: 'common', cooldown: 5, condition: FILLING, target: SELF, fx: [meter(1)] }),
  m({ id: 'focusChi', name: 'Focus Chi', theme: 'soul', rarity: 'common', cooldown: 5, condition: FILLING, target: SELF, fx: [meter(0.6), buff('defense', 0.4, 4)] }),
  m({ id: 'breathingTechnique', name: 'Breathing Technique', theme: 'soul', rarity: 'common', cooldown: 6, condition: FILLING, target: SELF, fx: [meter(0.5), barrier(0.5, 4)] }),
  m({ id: 'spiritSurge', name: 'Spirit Surge', theme: 'soul', rarity: 'rare', cooldown: 4, condition: FILLING, target: SELF, fx: [meter(1)], synergy: { with: 'meditate', bonus: 0.3 } }),
  m({ id: 'soulStrike', name: 'Soul Strike', theme: 'soul', rarity: 'rare', cooldown: 3, condition: FILLING, target: foe('front'), fx: [dmg(0.6), self(meter(0.4))] }),
  m({ id: 'awakening', name: 'Awakening', theme: 'soul', rarity: 'epic', cooldown: 8, condition: FILLING, target: SELF, fx: [meter(0.6), haste(0.4, 4)] }),
  m({ id: 'transcendence', name: 'Transcendence', theme: 'soul', rarity: 'legendary', cooldown: 6, condition: FILLING, target: SELF, fx: [meter(0.7), barrier(0.3, 4)], prerequisite: 'innerPeace' }),
];

const general: SkillDef[] = [
  m({ id: 'sweepingKick', name: 'Sweeping Kick', theme: 'monk', rarity: 'common', cooldown: 4, target: foe('front', 'column'), fx: [dmg(1)] }),
  m({ id: 'stoneFist', name: 'Stone Fist', theme: 'monk', rarity: 'common', cooldown: 3, target: foe('highestHp'), fx: [dmg(1)] }),
  m({ id: 'deflect', name: 'Deflect', theme: 'monk', rarity: 'rare', cooldown: 6, target: SELF, fx: [barrier(1, 4)] }),
  m({ id: 'flyingKnee', name: 'Flying Knee', theme: 'monk', rarity: 'rare', cooldown: 3, target: foe('back'), fx: [dmg(1)] }),
];

export const MONK_ARCHETYPES: SkillDef[] = [...openHand, ...trueSelf, ...soul, ...general];

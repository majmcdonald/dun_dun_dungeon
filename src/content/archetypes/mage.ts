import type { SkillDef } from '../../combat/types';
import { ally, barrier, buff, chaos, cls, debuff, delay, dmg, dot, foe, haste, SELF, skill, slow, transform, type SkillSpec } from '../build';

type Spec = Omit<SkillSpec, 'access' | 'category'> & { category?: SkillSpec['category'] };
const m = (spec: Spec): SkillDef => skill({ category: 'spell', ...spec, access: cls('mage') });

const magic = (element?: 'fire' | 'ice' | 'lightning' | 'holy' | 'shadow' | 'poison', extra: object = {}) =>
  ({ type: 'magic', ...(element && { element }), ...extra }) as const;

// Chaos: every cast rolls one of several outcomes.
const chaosSpells: SkillDef[] = [
  m({ id: 'wildMagic', name: 'Wild Magic', theme: 'chaos', rarity: 'common', cooldown: 2.5, target: foe('random'), fx: [chaos(dmg(1, magic('fire')), dmg(1, magic('ice')), dmg(1, magic('lightning')))] }),
  m({ id: 'prismaticBolt', name: 'Prismatic Bolt', theme: 'chaos', rarity: 'common', cooldown: 3, target: foe('front'), fx: [chaos(dmg(1, magic('fire')), dmg(1, magic('shadow')), slow(1, 3))] }),
  m({ id: 'unstableRift', name: 'Unstable Rift', theme: 'chaos', rarity: 'common', cooldown: 3, target: foe('random', 'row'), fx: [dmg(1, magic('lightning', { hits: 2 }))] }),
  m({ id: 'chaosOrb', name: 'Chaos Orb', theme: 'chaos', rarity: 'rare', cooldown: 5, target: foe('random', 'row'), fx: [chaos(dmg(1, magic('fire')), slow(1, 3), debuff('resistance', 1, 4))] }),
  m({ id: 'wildSurge', name: 'Wild Surge', theme: 'chaos', rarity: 'rare', cooldown: 7, target: SELF, fx: [chaos(buff('magic', 1, 5), haste(1, 5), barrier(1, 5, 'resistance'))] }),
  m({ id: 'entropy', name: 'Entropy', theme: 'chaos', rarity: 'epic', cooldown: 8, target: foe('front', 'all'), fx: [chaos(dmg(1, magic('shadow')), dot(1, 4, { stat: 'magic', element: 'fire' }), slow(1, 4))] }),
  m({ id: 'cataclysm', name: 'Cataclysm', theme: 'chaos', rarity: 'legendary', cooldown: 10, target: foe('front', 'all'), fx: [chaos(dmg(1, magic('fire')), dmg(1, magic('lightning', { hits: 2 })), transform(1))], prerequisite: 'wildMagic', vfx: 'fireball' }),
];

// Ice: spells that slow enemies down.
const ice: SkillDef[] = [
  m({ id: 'frostNova', name: 'Frost Nova', theme: 'ice', rarity: 'common', cooldown: 5, target: foe('front', 'column'), fx: [dmg(0.5, magic('ice')), slow(0.5, 3)], synergy: { with: 'chill', bonus: 0.3 } }),
  m({ id: 'chill', name: 'Chill', theme: 'ice', rarity: 'common', cooldown: 4, target: foe('highestHp'), fx: [slow(1, 4)] }),
  m({ id: 'iceLance', name: 'Ice Lance', theme: 'ice', rarity: 'common', cooldown: 2, target: foe('front'), fx: [dmg(1, magic('ice'))] }),
  m({ id: 'glacialSpike', name: 'Glacial Spike', theme: 'ice', rarity: 'rare', cooldown: 4, target: foe('highestHp'), fx: [dmg(0.7, magic('ice')), slow(0.3, 3)] }),
  m({ id: 'coneOfCold', name: 'Cone of Cold', theme: 'ice', rarity: 'rare', cooldown: 5, target: foe('front', 'row'), fx: [dmg(0.6, magic('ice')), slow(0.4, 3)] }),
  m({ id: 'deepFreeze', name: 'Deep Freeze', theme: 'ice', rarity: 'epic', cooldown: 6, target: foe('mostDamage'), fx: [slow(0.6, 4), dmg(0.4, magic('ice'))], synergy: { with: 'iceLance', bonus: 0.3 } }),
  m({ id: 'absoluteZero', name: 'Absolute Zero', theme: 'ice', rarity: 'legendary', cooldown: 10, target: foe('front', 'all'), fx: [slow(0.6, 5), dmg(0.4, magic('ice'))], prerequisite: 'frostBolt' }),
];

// Transformation: turn enemies into harmless critters, turn allies into something mightier.
const transformation: SkillDef[] = [
  m({ id: 'polymorph', name: 'Polymorph', theme: 'transformation', rarity: 'common', cooldown: 8, target: foe('highestHp'), fx: [transform(1)] }),
  m({ id: 'toadify', name: 'Toadify', theme: 'transformation', rarity: 'common', cooldown: 6, target: foe('random'), fx: [transform(0.7), dmg(0.3, magic())] }),
  m({ id: 'stoneskin', name: 'Stoneskin', theme: 'transformation', rarity: 'common', cooldown: 6, target: ally('lowestHpPct'), fx: [buff('defense', 0.6, 5), buff('resistance', 0.4, 5)] }),
  m({ id: 'beastForm', name: 'Beast Form', theme: 'transformation', rarity: 'rare', cooldown: 7, target: ally('front'), fx: [buff('attack', 1, 6)] }),
  m({ id: 'metamorphosis', name: 'Metamorphosis', theme: 'transformation', rarity: 'rare', cooldown: 7, target: foe('random'), fx: [transform(0.5), debuff('defense', 0.5, 5)], synergy: { with: 'polymorph', bonus: 0.3 } }),
  m({ id: 'massPolymorph', name: 'Mass Polymorph', theme: 'transformation', rarity: 'epic', cooldown: 10, target: foe('front', 'column'), fx: [transform(1)] }),
  m({ id: 'dragonForm', name: 'Dragon Form', theme: 'transformation', rarity: 'epic', cooldown: 9, target: ally('mostDamage'), fx: [buff('attack', 0.5, 6), buff('magic', 0.5, 6)] }),
];

const general: SkillDef[] = [
  m({ id: 'blinkBolt', name: 'Blink Bolt', theme: 'mage', rarity: 'common', cooldown: 2.5, target: foe('back'), fx: [dmg(1, magic())] }),
  m({ id: 'manaShield', name: 'Mana Shield', theme: 'mage', rarity: 'common', cooldown: 5, target: SELF, fx: [barrier(0.7, 4, 'resistance'), buff('magic', 0.3, 4)] }),
  m({ id: 'quicken', name: 'Quicken', theme: 'mage', rarity: 'rare', cooldown: 8, target: SELF, fx: [haste(1, 5)] }),
  m({ id: 'counterspell', name: 'Counterspell', theme: 'mage', rarity: 'rare', cooldown: 5, target: foe('castSpell'), fx: [delay(0.6), dmg(0.4, magic())] }),
];

export const MAGE_ARCHETYPES: SkillDef[] = [...chaosSpells, ...ice, ...transformation, ...general];

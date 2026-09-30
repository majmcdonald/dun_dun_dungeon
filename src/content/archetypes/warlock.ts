import type { SkillDef, Targeting } from '../../combat/types';
import {
  ally,
  barrier,
  buff,
  chaos,
  cls,
  consumeSummon,
  debuff,
  dmg,
  foe,
  haste,
  heal,
  SELF,
  selfDamage,
  siphon,
  skill,
  toSummons,
  type SkillSpec,
} from '../build';

type Spec = Omit<SkillSpec, 'access' | 'category'> & { category?: SkillSpec['category'] };
const w = (spec: Spec): SkillDef => skill({ category: 'spell', ...spec, access: cls('warlock') });

const FAMILIAR: Targeting = { side: 'summons', area: 'single' };
const shadow = (extra: object = {}) => ({ type: 'magic', element: 'shadow', ...extra }) as const;
const fire = { type: 'magic', element: 'fire' } as const;

// Link life: the warlock bleeds to empower his familiar.
const linkLife: SkillDef[] = [
  w({ id: 'bloodBond', name: 'Blood Bond', theme: 'link life', rarity: 'common', cooldown: 5, target: FAMILIAR, fx: [buff('attack', 1.1, 5), selfDamage(0.05)] }),
  w({ id: 'lifeTransfer', name: 'Life Transfer', theme: 'link life', rarity: 'common', cooldown: 5, target: FAMILIAR, fx: [heal(1.1), selfDamage(0.05)], vfx: 'heal' }),
  w({ id: 'darkLink', name: 'Dark Link', theme: 'link life', rarity: 'common', cooldown: 5, target: FAMILIAR, fx: [barrier(1.1, 4, 'resistance'), selfDamage(0.05)] }),
  w({ id: 'painShare', name: 'Pain Share', theme: 'link life', rarity: 'rare', cooldown: 6, target: FAMILIAR, fx: [haste(1.1, 4), selfDamage(0.05)] }),
  w({ id: 'sanguinePact', name: 'Sanguine Pact', theme: 'link life', rarity: 'rare', cooldown: 6, target: FAMILIAR, fx: [buff('attack', 0.55, 5), buff('defense', 0.55, 5), selfDamage(0.05)], synergy: { with: 'bloodBond', bonus: 0.3 } }),
  w({ id: 'soulLink', name: 'Soul Link', theme: 'link life', rarity: 'epic', cooldown: 7, target: FAMILIAR, fx: [heal(0.6), barrier(0.6, 4, 'resistance'), selfDamage(0.05)] }),
  w({ id: 'eternalBond', name: 'Eternal Bond', theme: 'link life', rarity: 'legendary', cooldown: 7, target: FAMILIAR, fx: [buff('attack', 0.6, 5), haste(0.5, 5), selfDamage(0.05)], prerequisite: 'bloodBond' }),
];

// Siphon: the warlock's damage feeds power to his familiar.
const siphonSkills: SkillDef[] = [
  w({ id: 'siphonStrike', name: 'Siphon Strike', theme: 'siphon', rarity: 'common', cooldown: 3, target: foe('front'), fx: [dmg(0.6, shadow()), toSummons(buff('attack', 0.4, 5))] }),
  w({ id: 'drainEssence', name: 'Drain Essence', theme: 'siphon', rarity: 'common', cooldown: 5, target: foe('highestHp'), fx: [siphon('attack', 0.6, 5), toSummons(buff('attack', 0.4, 5))] }),
  w({ id: 'feed', name: 'Feed', theme: 'siphon', rarity: 'common', cooldown: 4, target: foe('lowestHp'), fx: [dmg(0.6, shadow()), toSummons(heal(0.4))] }),
  w({ id: 'hunger', name: 'Hunger', theme: 'siphon', rarity: 'rare', cooldown: 4, target: foe('front'), fx: [dmg(0.5, shadow()), toSummons(haste(0.5, 4))], synergy: { with: 'siphonStrike', bonus: 0.3 } }),
  w({ id: 'soulSiphon', name: 'Soul Siphon', theme: 'siphon', rarity: 'rare', cooldown: 4, target: foe('random'), fx: [dmg(0.6, shadow()), toSummons(barrier(0.4, 4, 'resistance'))] }),
  w({ id: 'devour', name: 'Devour', theme: 'siphon', rarity: 'epic', cooldown: 5, target: foe('lowestHpPct'), fx: [dmg(0.6, shadow({ drain: 0.5 })), toSummons(buff('attack', 0.4, 5))] }),
];

// Sacrifice: give up the familiar (and 5s to resummon it) for a burst of power.
const sacrifice: SkillDef[] = [
  w({ id: 'darkOffering', name: 'Dark Offering', theme: 'sacrifice', rarity: 'common', cooldown: 12, condition: { kind: 'hasSummon' }, target: SELF, fx: [consumeSummon(), buff('magic', 1.4, 6)] }),
  w({ id: 'immolateFamiliar', name: 'Immolate Familiar', theme: 'sacrifice', rarity: 'common', cooldown: 10, condition: { kind: 'hasSummon' }, target: foe('front', 'column'), fx: [consumeSummon(), dmg(1.3, fire)] }),
  w({ id: 'demonicPact', name: 'Demonic Pact', theme: 'sacrifice', rarity: 'rare', cooldown: 12, condition: { kind: 'hasSummon' }, target: SELF, fx: [consumeSummon(), haste(1.35, 6)] }),
  w({ id: 'infernalBlast', name: 'Infernal Blast', theme: 'sacrifice', rarity: 'rare', cooldown: 10, condition: { kind: 'hasSummon' }, target: foe('front', 'all'), fx: [consumeSummon(), dmg(1.3, fire)], synergy: { with: 'immolateFamiliar', bonus: 0.3 } }),
  w({ id: 'ritual', name: 'Ritual', theme: 'sacrifice', rarity: 'epic', cooldown: 12, condition: { kind: 'hasSummon' }, target: ally('front', 'all'), fx: [consumeSummon(), barrier(1.35, 5, 'resistance')] }),
  w({ id: 'finalOffering', name: 'Final Offering', theme: 'sacrifice', rarity: 'legendary', cooldown: 12, condition: { kind: 'hasSummon' }, target: foe('front', 'all'), fx: [consumeSummon(), dmg(1, shadow()), debuff('resistance', 0.25, 5)], prerequisite: 'darkOffering' }),
];

const general: SkillDef[] = [
  w({ id: 'hellfire', name: 'Hellfire', theme: 'warlock', rarity: 'common', cooldown: 4, target: foe('front', 'row'), fx: [dmg(1, fire)] }),
  w({ id: 'hexBolt', name: 'Hex Bolt', theme: 'warlock', rarity: 'common', cooldown: 2.5, target: foe('random'), fx: [dmg(1, shadow())] }),
  w({ id: 'felFlame', name: 'Fel Flame', theme: 'warlock', rarity: 'common', cooldown: 3, target: foe('lowestHp'), fx: [dmg(1, fire)] }),
  w({ id: 'demonSkin', name: 'Demon Skin', theme: 'warlock', rarity: 'rare', cooldown: 6, target: SELF, fx: [barrier(1, 4, 'resistance')] }),
  w({ id: 'leechLife', name: 'Leech Life', theme: 'warlock', rarity: 'rare', cooldown: 3, target: foe('front'), fx: [dmg(1, shadow({ drain: 0.4 }))] }),
  w({ id: 'chaosBolt', name: 'Chaos Bolt', theme: 'warlock', rarity: 'epic', cooldown: 5, target: foe('highestHp'), fx: [chaos(dmg(1, fire), dmg(1, shadow()))] }),
];

export const WARLOCK_ARCHETYPES: SkillDef[] = [...linkLife, ...siphonSkills, ...sacrifice, ...general];

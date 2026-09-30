import type { SkillDef } from '../../combat/types';
import { ally, barrier, buff, cls, debuff, delay, dmg, foe, haste, meter, SELF, selfDamage, skill, type SkillSpec } from '../build';

type Spec = Omit<SkillSpec, 'access' | 'category'> & { category?: SkillSpec['category'] };
const b = (spec: Spec): SkillDef => skill({ category: 'skill', ...spec, access: cls('barbarian') });

const ZEAL = { bonus: 0.5, penalty: 0.3 };
const FRENZY = { kind: 'frenzy' } as const;
const lightning = (extra: object = {}) => ({ element: 'lightning', ...extra }) as const;

// Berserker: bleed to build rage. Self-damage credits the budget, so the rest of each skill hits harder.
const berserker: SkillDef[] = [
  b({ id: 'bloodletting', name: 'Bloodletting', theme: 'berserker', rarity: 'common', cooldown: 5, target: SELF, fx: [selfDamage(0.08), buff('attack', 1.16, 5)] }),
  b({ id: 'recklessSwing', name: 'Reckless Swing', theme: 'berserker', rarity: 'common', cooldown: 3, target: foe('front'), fx: [dmg(1.1), selfDamage(0.03)] }),
  b({ id: 'painFuel', name: 'Pain Fuel', theme: 'berserker', rarity: 'common', cooldown: 6, target: SELF, fx: [selfDamage(0.1), meter(1.17)] }),
  b({ id: 'bloodFrenzy', name: 'Blood Frenzy', theme: 'berserker', rarity: 'rare', cooldown: 4, target: foe('front'), fx: [dmg(1.12, { hits: 2 }), selfDamage(0.05)], synergy: { with: 'bloodletting', bonus: 0.3 } }),
  b({ id: 'gore', name: 'Gore', theme: 'berserker', rarity: 'rare', cooldown: 4, target: foe('lowestHpPct'), fx: [dmg(1.1, { drain: 0.3 }), selfDamage(0.04)] }),
  b({ id: 'unchained', name: 'Unchained', theme: 'berserker', rarity: 'epic', cooldown: 10, target: SELF, fx: [selfDamage(0.15), haste(1.15, 5)] }),
  b({ id: 'rampage', name: 'Rampage', theme: 'berserker', rarity: 'legendary', cooldown: 6, target: foe('front', 'column'), fx: [dmg(1.07, { hits: 2 }), selfDamage(0.05)], prerequisite: 'recklessSwing' }),
];

// Zealot: hunts spellcasters. Bonus damage against any enemy that has cast a spell, less against others.
const zealot: SkillDef[] = [
  b({ id: 'zealousStrike', name: 'Zealous Strike', theme: 'zealot', rarity: 'common', cooldown: 2.5, target: foe('front'), fx: [dmg(1, { vsCasters: ZEAL })] }),
  b({ id: 'mageHunter', name: 'Mage Hunter', theme: 'zealot', rarity: 'common', cooldown: 3, target: foe('castSpell'), fx: [dmg(1, { vsCasters: ZEAL })] }),
  b({ id: 'spellbreaker', name: 'Spellbreaker', theme: 'zealot', rarity: 'common', cooldown: 4, target: foe('castSpell'), fx: [delay(0.5), dmg(0.5, { vsCasters: ZEAL })] }),
  b({ id: 'purge', name: 'Purge', theme: 'zealot', rarity: 'rare', cooldown: 4, target: foe('castDefensive'), fx: [dmg(1, { vsCasters: ZEAL })], synergy: { with: 'mageHunter', bonus: 0.3 } }),
  b({ id: 'righteousFury', name: 'Righteous Fury', theme: 'zealot', rarity: 'rare', cooldown: 5, target: foe('front', 'row'), fx: [dmg(1, { vsCasters: ZEAL })] }),
  b({ id: 'witchHunt', name: 'Witch Hunt', theme: 'zealot', rarity: 'epic', cooldown: 6, target: foe('castSpell', 'column'), fx: [dmg(1, { vsCasters: ZEAL })] }),
  b({ id: 'inquisition', name: 'Inquisition', theme: 'zealot', rarity: 'epic', cooldown: 7, target: foe('front', 'all'), fx: [dmg(1, { vsCasters: ZEAL })] }),
];

// Storm: only works during Frenzy, and hits like it.
const storm: SkillDef[] = [
  b({ id: 'thunderClap', name: 'Thunder Clap', theme: 'storm', rarity: 'common', cooldown: 3, condition: FRENZY, target: foe('front', 'column'), fx: [dmg(1, lightning())] }),
  b({ id: 'stormStrike', name: 'Storm Strike', theme: 'storm', rarity: 'common', cooldown: 2, condition: FRENZY, target: foe('front'), fx: [dmg(1, lightning({ hits: 2 }))] }),
  b({ id: 'galeForce', name: 'Gale Force', theme: 'storm', rarity: 'rare', cooldown: 4, condition: FRENZY, target: foe('front', 'all'), fx: [dmg(1)] }),
  b({ id: 'lightningRage', name: 'Lightning Rage', theme: 'storm', rarity: 'rare', cooldown: 2, condition: FRENZY, target: foe('random'), fx: [dmg(1, lightning())], synergy: { with: 'stormStrike', bonus: 0.3 } }),
  b({ id: 'maelstrom', name: 'Maelstrom', theme: 'storm', rarity: 'epic', cooldown: 5, condition: FRENZY, target: foe('front', 'all'), fx: [dmg(1, lightning())] }),
  b({ id: 'tempestFury', name: 'Tempest Fury', theme: 'storm', rarity: 'legendary', cooldown: 5, condition: FRENZY, target: foe('front', 'all'), fx: [dmg(1, lightning({ hits: 2 }))], prerequisite: 'thunderClap' }),
];

const general: SkillDef[] = [
  b({ id: 'warCry', name: 'War Cry', theme: 'barbarian', rarity: 'common', cooldown: 8, target: ally('front', 'all'), fx: [buff('attack', 1, 6)], vfx: 'blessing' }),
  b({ id: 'headbutt', name: 'Headbutt', theme: 'barbarian', rarity: 'common', cooldown: 3, target: foe('front'), fx: [dmg(0.7), delay(0.3)] }),
  b({ id: 'skullCrack', name: 'Skull Crack', theme: 'barbarian', rarity: 'common', cooldown: 3, target: foe('highestHp'), fx: [dmg(1)] }),
  b({ id: 'thickHide', name: 'Thick Hide', theme: 'barbarian', rarity: 'rare', cooldown: 6, target: SELF, fx: [barrier(1, 4)] }),
  b({ id: 'intimidate', name: 'Intimidate', theme: 'barbarian', rarity: 'rare', cooldown: 6, target: foe('front', 'column'), fx: [debuff('attack', 1, 5)] }),
];

export const BARBARIAN_ARCHETYPES: SkillDef[] = [...berserker, ...zealot, ...storm, ...general];

import type { SkillDef } from '../../combat/types';
import { ally, barrier, buff, cleanse, cls, delay, dmg, foe, heal, regen, SELF, skill, type SkillSpec } from '../build';

type Spec = Omit<SkillSpec, 'access' | 'category'> & { category?: SkillSpec['category'] };
const p = (spec: Spec): SkillDef => skill({ category: 'skill', ...spec, access: cls('paladin') });

const holy = (extra: object = {}) => ({ element: 'holy', ...extra }) as const;
const ALLY_HURT = { kind: 'allyHurt' } as const;
const GLORY = 0.05;

// Devotion: protect and strengthen the party.
const devotion: SkillDef[] = [
  p({ id: 'devotionAura', name: 'Devotion Aura', theme: 'devotion', rarity: 'common', cooldown: 8, target: ally('front', 'all'), fx: [buff('defense', 1, 6)], vfx: 'blessing' }),
  p({ id: 'guardianBlessing', name: 'Guardian Blessing', theme: 'devotion', rarity: 'common', category: 'spell', cooldown: 5, target: ally('lowestHpPct'), fx: [barrier(1, 4)] }),
  p({ id: 'holyLight', name: 'Holy Light', theme: 'devotion', rarity: 'common', category: 'spell', cooldown: 4, target: ally('lowestHpPct'), fx: [heal(0.6), cleanse(), buff('defense', 0.25, 4)], vfx: 'heal' }),
  p({ id: 'sacredVow', name: 'Sacred Vow', theme: 'devotion', rarity: 'rare', cooldown: 9, target: ally('front', 'all'), fx: [buff('attack', 0.5, 6), buff('defense', 0.5, 6)], vfx: 'blessing' }),
  p({ id: 'shieldOfFaith', name: 'Shield of Faith', theme: 'devotion', rarity: 'rare', category: 'spell', cooldown: 5, target: ally('lowestHpPct'), fx: [barrier(1, 4, 'resistance')], synergy: { with: 'guardianBlessing', bonus: 0.3 } }),
  p({ id: 'beaconOfHope', name: 'Beacon of Hope', theme: 'devotion', rarity: 'epic', category: 'spell', cooldown: 9, target: ally('front', 'all'), fx: [barrier(0.4, 4), heal(0.4), cleanse()], vfx: 'heal' }),
  p({ id: 'divineProtection', name: 'Divine Protection', theme: 'devotion', rarity: 'legendary', category: 'spell', cooldown: 10, target: ally('front', 'all'), fx: [barrier(0.6, 5), buff('defense', 0.4, 5)], prerequisite: 'layOnHands', vfx: 'blessing' }),
];

// Vengeance: fills whenever an ally is hurt, and strikes back at the biggest threat.
const vengeance: SkillDef[] = [
  p({ id: 'avenge', name: 'Avenge', theme: 'vengeance', rarity: 'common', cooldown: 3, trigger: ALLY_HURT, target: foe('mostDamage'), fx: [dmg(1, holy())] }),
  p({ id: 'retribution', name: 'Retribution', theme: 'vengeance', rarity: 'common', cooldown: 4, target: foe('mostDamage'), fx: [dmg(1)] }),
  p({ id: 'righteousAnger', name: 'Righteous Anger', theme: 'vengeance', rarity: 'common', cooldown: 5, trigger: ALLY_HURT, target: SELF, fx: [buff('attack', 1, 5)] }),
  p({ id: 'hammerOfJustice', name: 'Hammer of Justice', theme: 'vengeance', rarity: 'rare', cooldown: 5, target: foe('mostDamage'), fx: [dmg(0.6), delay(0.4)], synergy: { with: 'avenge', bonus: 0.3 } }),
  p({ id: 'vengefulLight', name: 'Vengeful Light', theme: 'vengeance', rarity: 'rare', category: 'spell', cooldown: 5, target: foe('mostDamage', 'row'), fx: [dmg(1, { type: 'magic', element: 'holy' })] }),
  p({ id: 'wrath', name: 'Wrath', theme: 'vengeance', rarity: 'epic', cooldown: 7, trigger: ALLY_HURT, target: foe('front', 'all'), fx: [dmg(1, holy())] }),
  p({ id: 'oathOfVengeance', name: 'Oath of Vengeance', theme: 'vengeance', rarity: 'legendary', cooldown: 5, target: foe('mostDamage'), fx: [dmg(1, holy({ hits: 2 }))], prerequisite: 'avenge' }),
];

// Glory: every Glory skill grows stronger the longer the fight lasts.
const glory: SkillDef[] = [
  p({ id: 'gloriousStrike', name: 'Glorious Strike', theme: 'glory', rarity: 'common', cooldown: 3, glory: GLORY, target: foe('front'), fx: [dmg(1)] }),
  p({ id: 'crusade', name: 'Crusade', theme: 'glory', rarity: 'common', cooldown: 5, glory: GLORY, target: foe('front', 'column'), fx: [dmg(1)] }),
  p({ id: 'inspiringPresence', name: 'Inspiring Presence', theme: 'glory', rarity: 'common', cooldown: 8, glory: GLORY, target: ally('front', 'all'), fx: [buff('attack', 0.6, 6), buff('defense', 0.4, 6)], vfx: 'blessing' }),
  p({ id: 'radiantCharge', name: 'Radiant Charge', theme: 'glory', rarity: 'rare', cooldown: 4, glory: GLORY, target: foe('highestHp'), fx: [dmg(1, holy())], synergy: { with: 'gloriousStrike', bonus: 0.3 } }),
  p({ id: 'valor', name: 'Valor', theme: 'glory', rarity: 'rare', cooldown: 6, glory: GLORY, target: SELF, fx: [buff('defense', 1, 5)] }),
  p({ id: 'triumph', name: 'Triumph', theme: 'glory', rarity: 'epic', cooldown: 8, glory: GLORY, target: foe('front', 'all'), fx: [dmg(1, holy())] }),
  p({ id: 'holyAvenger', name: 'Holy Avenger', theme: 'glory', rarity: 'epic', cooldown: 5, glory: GLORY, target: foe('front'), fx: [dmg(1, holy({ hits: 2 }))] }),
];

const general: SkillDef[] = [
  p({ id: 'hammerThrow', name: 'Hammer Throw', theme: 'paladin', rarity: 'common', cooldown: 3, target: foe('back'), fx: [dmg(1)] }),
  p({ id: 'shieldSlam', name: 'Shield Slam', theme: 'paladin', rarity: 'common', cooldown: 3, target: foe('front'), fx: [dmg(0.7), delay(0.3)] }),
  p({ id: 'judgment', name: 'Judgment', theme: 'paladin', rarity: 'rare', cooldown: 4, target: foe('castDefensive'), fx: [dmg(1, holy())] }),
  p({ id: 'steadfastFaith', name: 'Steadfast Faith', theme: 'paladin', rarity: 'rare', category: 'spell', cooldown: 6, target: SELF, fx: [barrier(0.7, 4, 'resistance'), regen(0.3, 4)] }),
];

export const PALADIN_ARCHETYPES: SkillDef[] = [...devotion, ...vengeance, ...glory, ...general];

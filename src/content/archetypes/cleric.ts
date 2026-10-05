import type { SkillDef } from '../../combat/types';
import { ally, barrier, buff, cleanse, cls, debuff, delay, dmg, dot, foe, haste, heal, regen, skill, slow, type SkillSpec } from '../build';

type Spec = Omit<SkillSpec, 'access' | 'category'> & { category?: SkillSpec['category'] };
const c = (spec: Spec): SkillDef => skill({ category: 'spell', ...spec, access: cls('cleric') });

const holy = { type: 'magic', element: 'holy' } as const;
const PARTY_LOW = { kind: 'partyLow' } as const;

// Light: holy magic that crosses into offense, or lends the party striking power.
const light: SkillDef[] = [
  c({ id: 'holyBolt', name: 'Holy Bolt', theme: 'light', rarity: 'common', cooldown: 2.5, target: foe('front'), fx: [dmg(1, holy)] }),
  c({ id: 'radiance', name: 'Radiance', theme: 'light', rarity: 'common', cooldown: 4, target: foe('front', 'row'), fx: [dmg(1, holy)] }),
  c({ id: 'blessedWeapon', name: 'Blessed Weapon', theme: 'light', rarity: 'common', cooldown: 6, target: ally('mostDamage'), fx: [buff('attack', 1, 5)] }),
  c({ id: 'searingLight', name: 'Searing Light', theme: 'light', rarity: 'rare', cooldown: 4, target: foe('highestHp'), fx: [dmg(0.6, holy), dot(0.4, 3, { stat: 'magic', element: 'holy' })], synergy: { with: 'holyBolt', bonus: 0.3 } }),
  c({ id: 'lightsFavor', name: "Light's Favor", theme: 'light', rarity: 'rare', cooldown: 8, target: ally('front', 'all'), fx: [buff('attack', 0.5, 6), buff('magic', 0.5, 6)], vfx: 'blessing' }),
  c({ id: 'sunburst', name: 'Sunburst', theme: 'light', rarity: 'epic', cooldown: 7, target: foe('front', 'all'), fx: [dmg(1, holy)] }),
  c({ id: 'wrathOfHeaven', name: 'Wrath of Heaven', theme: 'light', rarity: 'legendary', cooldown: 9, target: foe('front', 'all'), fx: [dmg(0.8, holy), debuff('resistance', 0.2, 5)], prerequisite: 'holyBolt' }),
];

// Order: control enemies and direct friends.
const order: SkillDef[] = [
  c({ id: 'silence', name: 'Silence', theme: 'order', rarity: 'common', cooldown: 5, target: foe('castSpell'), fx: [delay(1)] }),
  c({ id: 'command', name: 'Command', theme: 'order', rarity: 'common', cooldown: 5, target: foe('highestHp'), fx: [debuff('attack', 1, 5)] }),
  c({ id: 'compel', name: 'Compel', theme: 'order', rarity: 'common', cooldown: 7, target: ally('mostDamage'), fx: [haste(1, 4)] }),
  c({ id: 'hold', name: 'Hold', theme: 'order', rarity: 'rare', cooldown: 6, target: foe('front'), fx: [delay(1)], synergy: { with: 'silence', bonus: 0.3 } }),
  c({ id: 'decree', name: 'Decree', theme: 'order', rarity: 'rare', cooldown: 9, target: foe('front', 'all'), fx: [slow(1, 4)] }),
  c({ id: 'ordain', name: 'Ordain', theme: 'order', rarity: 'rare', cooldown: 9, target: ally('front', 'all'), fx: [haste(1, 4)], vfx: 'blessing' }),
  c({ id: 'divineOrder', name: 'Divine Order', theme: 'order', rarity: 'epic', cooldown: 8, target: foe('front', 'column'), fx: [delay(0.5), debuff('attack', 0.5, 5)] }),
];

// Life: help that only comes when the party is close to falling.
const life: SkillDef[] = [
  c({ id: 'secondChance', name: 'Second Chance', theme: 'life', rarity: 'common', cooldown: 4, trigger: PARTY_LOW, target: ally('lowestHpPct'), fx: [heal(1)], vfx: 'heal' }),
  c({ id: 'guardianLight', name: 'Guardian Light', theme: 'life', rarity: 'common', cooldown: 4, target: ally('lowestHpPct'), fx: [barrier(1, 4, 'resistance')] }),
  c({ id: 'lifeline', name: 'Lifeline', theme: 'life', rarity: 'rare', cooldown: 6, trigger: PARTY_LOW, target: ally('front', 'all'), fx: [heal(1)], vfx: 'heal' }),
  c({ id: 'prayerOfHope', name: 'Prayer of Hope', theme: 'life', rarity: 'rare', cooldown: 7, target: ally('front', 'all'), fx: [regen(1, 5)], vfx: 'heal' }),
  c({ id: 'divineIntervention', name: 'Divine Intervention', theme: 'life', rarity: 'epic', cooldown: 8, trigger: PARTY_LOW, target: ally('front', 'all'), fx: [heal(0.6), barrier(0.4, 4, 'resistance')], vfx: 'heal' }),
  c({ id: 'resurgence', name: 'Resurgence', theme: 'life', rarity: 'legendary', cooldown: 10, target: ally('front', 'all'), fx: [heal(0.5), haste(0.5, 4)], prerequisite: 'heal', vfx: 'heal' }),
];

const general: SkillDef[] = [
  c({ id: 'renew', name: 'Renew', theme: 'cleric', rarity: 'common', cooldown: 5, target: ally('front', 'all'), fx: [regen(1, 4)], vfx: 'heal' }),
  c({ id: 'purify', name: 'Purify', theme: 'cleric', rarity: 'common', cooldown: 5, target: ally('lowestHpPct'), fx: [heal(0.5), buff('resistance', 0.38, 5), cleanse()], vfx: 'heal' }),
  c({ id: 'rebuke', name: 'Rebuke', theme: 'cleric', rarity: 'common', cooldown: 3, target: foe('attackedMe'), fx: [dmg(1, holy)] }),
  c({ id: 'halo', name: 'Halo', theme: 'cleric', rarity: 'rare', cooldown: 6, target: ally('lowestHpPct'), fx: [barrier(0.5, 4, 'resistance'), regen(0.5, 4)] }),
  c({ id: 'benediction', name: 'Benediction', theme: 'cleric', rarity: 'epic', cooldown: 8, target: ally('front', 'all'), fx: [heal(0.5), buff('defense', 0.5, 5)], vfx: 'heal' }),
];

export const CLERIC_ARCHETYPES: SkillDef[] = [...light, ...order, ...life, ...general];

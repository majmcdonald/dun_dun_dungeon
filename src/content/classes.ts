import type { CombatantDef, Stats, Tag } from '../combat/types';
import { SKILLS_BY_ID } from './skills';

// Balancing pass 1 role baselines (before gear).
const ROLE: Record<string, Stats> = {
  tank: { hp: 150, attack: 14, magic: 0, defense: 22, resistance: 12 },
  bruiser: { hp: 125, attack: 18, magic: 0, defense: 14, resistance: 8 },
  striker: { hp: 95, attack: 18, magic: 0, defense: 8, resistance: 8 },
  caster: { hp: 85, attack: 4, magic: 18, defense: 6, resistance: 15 },
  support: { hp: 95, attack: 6, magic: 14, defense: 8, resistance: 15 },
};

export interface ClassDef extends CombatantDef {
  role: keyof typeof ROLE;
  starting: boolean;
}

function classDef(
  id: string,
  name: string,
  role: keyof typeof ROLE,
  tags: Tag[],
  startingSkills: string[],
  starting: boolean,
  statOverride: Partial<Stats> = {},
  extra: Pick<ClassDef, 'mechanic' | 'familiar'> = {},
): ClassDef {
  return {
    id,
    name,
    role,
    tags,
    starting,
    ...extra,
    stats: { ...ROLE[role], ...statOverride },
    skills: startingSkills.map((s) => SKILLS_BY_ID[s]),
  };
}

export const CLASSES: ClassDef[] = [
  // Class pass (Act 2): the Knight's tanking carried trios furthest, so it trades a little HP and ATK.
  classDef('knight', 'Knight', 'tank', ['martial', 'heavy'], ['slash', 'ironGuard'], true, { hp: 140, attack: 12 }),
  classDef('mage', 'Mage', 'caster', ['caster', 'arcane'], ['fireball', 'frostBolt'], true, { magic: 20 }),
  // Support baseline with 1 less MAG: its healing carried long fights too far ahead of other parties (Act 2 balance).
  classDef('cleric', 'Cleric', 'support', ['caster', 'holy'], ['heal', 'blessing'], true, { magic: 13 }),
  // Striker baseline with extra HP and DEF so tankless trios can survive Act 1 (balance pass 2).
  classDef('rogue', 'Rogue', 'striker', ['martial', 'shadow'], ['backstab', 'poisonedBlade'], true, { hp: 115, defense: 12 }),
  classDef('ranger', 'Ranger', 'striker', ['martial', 'ranged', 'nature'], ['aimedShot', 'volley'], true, { hp: 110, defense: 11, attack: 20 }),
  classDef('barbarian', 'Barbarian', 'bruiser', ['martial', 'heavy'], ['cleave', 'rage'], true, {}, { mechanic: 'rage' }),
  // Tank baseline with 6 ATK moved into MAG so Lay on Hands (a Magic Power heal) does something.
  classDef('paladin', 'Paladin', 'tank', ['martial', 'heavy', 'holy'], ['holyStrike', 'layOnHands'], false, { attack: 8, magic: 6 }),
  classDef('necromancer', 'Necromancer', 'caster', ['caster', 'shadow'], ['siphonLife', 'curseOfFrailty'], false, { magic: 22 }, { mechanic: 'souls' }),
  classDef('druid', 'Druid', 'support', ['caster', 'nature'], ['rejuvenate', 'barkskin'], false),
  classDef('monk', 'Monk', 'bruiser', ['martial', 'holy'], ['flurry', 'innerPeace'], false, {}, { mechanic: 'chi' }),
  // Class pass (Act 2): the weakest class; sturdier and stronger so it can carry a party as its only support.
  classDef('bard', 'Bard', 'support', ['caster', 'arcane'], ['inspire', 'discord'], false, { hp: 120, attack: 10, magic: 22, defense: 10 }),
  classDef('warlock', 'Warlock', 'caster', ['caster', 'shadow', 'arcane'], ['corruption', 'eldritchBlast'], false, { hp: 95, magic: 28 }, {
    mechanic: 'familiar',
    familiar: 'imp',
  }),
];

export const CLASSES_BY_ID: Record<string, ClassDef> = Object.fromEntries(CLASSES.map((c) => [c.id, c]));

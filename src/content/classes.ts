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
): ClassDef {
  return {
    id,
    name,
    role,
    tags,
    starting,
    stats: { ...ROLE[role], ...statOverride },
    skills: startingSkills.map((s) => SKILLS_BY_ID[s]),
  };
}

export const CLASSES: ClassDef[] = [
  classDef('knight', 'Knight', 'tank', ['martial', 'heavy'], ['slash', 'ironGuard'], true),
  classDef('mage', 'Mage', 'caster', ['caster', 'arcane'], ['fireball', 'frostBolt'], true),
  classDef('cleric', 'Cleric', 'support', ['caster', 'holy'], ['heal', 'blessing'], true),
  classDef('rogue', 'Rogue', 'striker', ['martial', 'shadow'], ['backstab', 'poisonedBlade'], true),
  classDef('ranger', 'Ranger', 'striker', ['martial', 'ranged', 'nature'], ['aimedShot', 'volley'], true),
  classDef('barbarian', 'Barbarian', 'bruiser', ['martial', 'heavy'], ['cleave', 'rage'], true),
  // Tank baseline with 6 ATK moved into MAG so Lay on Hands (a Magic Power heal) does something.
  classDef('paladin', 'Paladin', 'tank', ['martial', 'heavy', 'holy'], ['holyStrike', 'layOnHands'], false, { attack: 8, magic: 6 }),
  classDef('necromancer', 'Necromancer', 'caster', ['caster', 'shadow'], ['siphonLife', 'curseOfFrailty'], false),
  classDef('druid', 'Druid', 'support', ['caster', 'nature'], ['rejuvenate', 'barkskin'], false),
  classDef('monk', 'Monk', 'bruiser', ['martial', 'holy'], ['flurry', 'innerPeace'], false),
  classDef('bard', 'Bard', 'support', ['caster', 'arcane'], ['inspire', 'discord'], false),
  classDef('warlock', 'Warlock', 'caster', ['caster', 'shadow', 'arcane'], ['corruption', 'eldritchBlast'], false),
];

export const CLASSES_BY_ID: Record<string, ClassDef> = Object.fromEntries(CLASSES.map((c) => [c.id, c]));

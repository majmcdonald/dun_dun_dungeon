import type { CombatantDef, SkillDef, SkillEffect, Targeting } from '../combat/types';

// Enemy abilities are not part of the player skill library and never appear in inventory or rewards.
function enemySkill(id: string, name: string, cooldown: number, target: Targeting, effect: SkillEffect, spell = false): SkillDef {
  return {
    id,
    name,
    category: spell ? 'spell' : 'skill',
    rarity: 'common',
    access: { kind: 'shared' },
    cooldown,
    target,
    effects: [effect],
  };
}

const physical = (scaling: number): SkillEffect => ({ kind: 'damage', damageType: 'physical', stat: 'attack', scaling });

const bounce = enemySkill('bounce', 'Bounce', 1.5, { side: 'enemy', select: 'front', area: 'single' }, physical(1));
const bite = enemySkill('bite', 'Bite', 1.2, { side: 'enemy', select: 'random', area: 'single' }, physical(1));
const arrow = enemySkill('arrow', 'Arrow', 2.5, { side: 'enemy', select: 'back', area: 'single' }, physical(1));
const orcCleave = enemySkill('orcCleave', 'Cleave', 5, { side: 'enemy', select: 'highestHp', area: 'column' }, physical(0.8));
const charge = enemySkill('charge', 'Charge', 3, { side: 'enemy', select: 'highestHpPct', area: 'single' }, physical(1.2));
const mend = enemySkill('mend', 'Mend', 4, { side: 'ally', select: 'lowestHpPct', area: 'single' }, { kind: 'heal', scaling: 1.5 }, true);
const hex = enemySkill(
  'hex',
  'Hex',
  3,
  { side: 'enemy', select: 'castSpell', area: 'single' },
  { kind: 'damage', damageType: 'magic', stat: 'magic', scaling: 1, element: 'shadow' },
  true,
);

export const SLIME: CombatantDef = {
  id: 'slime',
  name: 'Slime',
  stats: { hp: 50, attack: 12, magic: 0, defense: 5, resistance: 5 },
  skills: [bounce],
  resist: { fire: -0.5, poison: 0.5 },
};

export const BAT: CombatantDef = {
  id: 'bat',
  name: 'Bat',
  stats: { hp: 30, attack: 9, magic: 0, defense: 3, resistance: 3 },
  skills: [bite],
  resist: { lightning: -0.5 },
};

export const ARCHER: CombatantDef = {
  id: 'archer',
  name: 'Archer',
  stats: { hp: 40, attack: 7, magic: 0, defense: 4, resistance: 6 },
  skills: [arrow],
  resist: { holy: -0.5, poison: 0.9 },
};

export const ORC: CombatantDef = {
  id: 'orc',
  name: 'Orc',
  stats: { hp: 100, attack: 10, magic: 0, defense: 10, resistance: 4 },
  skills: [orcCleave, charge],
};

export const SHAMAN: CombatantDef = {
  id: 'shaman',
  name: 'Shaman',
  stats: { hp: 50, attack: 4, magic: 8, defense: 4, resistance: 10 },
  skills: [mend, hex],
  resist: { shadow: 0.5, poison: 0.3 },
};

// Positions fill column by column: 0-2 front, 3-5 middle, 6-8 back.
export const TEST_ENCOUNTER: CombatantDef[] = [SLIME, SLIME, SLIME, BAT, ORC, BAT, ARCHER, SHAMAN, ARCHER];

// Every map fight until Phase 6 content: one of each enemy, melee in front, casters behind.
export const MAP_ENCOUNTER: CombatantDef[] = [SLIME, ORC, BAT, ARCHER, SHAMAN];

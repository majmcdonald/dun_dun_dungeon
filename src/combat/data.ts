import type { CombatantDef, EquipmentDef, PartyMember, SkillDef } from './types';

export const SKILLS = {
  slash: {
    id: 'slash',
    name: 'Slash',
    category: 'skill',
    cooldown: 2.0,
    target: { side: 'enemy', select: 'front', area: 'single' },
    effect: { kind: 'damage', damageType: 'physical', stat: 'attack', scaling: 1.5 },
  },
  shieldBash: {
    id: 'shieldBash',
    name: 'Shield Bash',
    category: 'skill',
    cooldown: 4.0,
    target: { side: 'enemy', select: 'attackedMe', area: 'single' },
    effect: { kind: 'damage', damageType: 'physical', stat: 'attack', scaling: 1.0 },
  },
  ironGuard: {
    id: 'ironGuard',
    name: 'Iron Guard',
    category: 'skill',
    cooldown: 6.0,
    target: { side: 'self' },
    effect: { kind: 'barrier', stat: 'defense', scaling: 1.0, duration: 4.0 },
  },
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    category: 'spell',
    cooldown: 5.0,
    target: { side: 'enemy', select: 'lowestHp', area: 'row' },
    effect: { kind: 'damage', damageType: 'magic', stat: 'magic', scaling: 1.2 },
    vfx: 'fireball',
  },
  arcaneBolt: {
    id: 'arcaneBolt',
    name: 'Arcane Bolt',
    category: 'spell',
    cooldown: 2.5,
    target: { side: 'enemy', select: 'mostDamage', area: 'single' },
    effect: { kind: 'damage', damageType: 'magic', stat: 'magic', scaling: 1.0 },
  },
  heal: {
    id: 'heal',
    name: 'Heal',
    category: 'spell',
    cooldown: 3.0,
    target: { side: 'ally', select: 'lowestHpPct', area: 'single' },
    effect: { kind: 'heal', scaling: 1.5 },
    vfx: 'heal',
  },
  blessing: {
    id: 'blessing',
    name: 'Blessing',
    category: 'spell',
    cooldown: 8.0,
    target: { side: 'ally', select: 'front', area: 'all' },
    effect: { kind: 'buff', stat: 'defense', amount: 10, duration: 6.0 },
    vfx: 'blessing',
  },
  smite: {
    id: 'smite',
    name: 'Smite',
    category: 'spell',
    cooldown: 3.5,
    target: { side: 'enemy', select: 'castDefensive', area: 'single' },
    effect: { kind: 'damage', damageType: 'magic', stat: 'magic', scaling: 1.0 },
  },
  bounce: {
    id: 'bounce',
    name: 'Bounce',
    category: 'skill',
    cooldown: 1.5,
    target: { side: 'enemy', select: 'front', area: 'single' },
    effect: { kind: 'damage', damageType: 'physical', stat: 'attack', scaling: 1.0 },
  },
  bite: {
    id: 'bite',
    name: 'Bite',
    category: 'skill',
    cooldown: 1.2,
    target: { side: 'enemy', select: 'random', area: 'single' },
    effect: { kind: 'damage', damageType: 'physical', stat: 'attack', scaling: 1.0 },
  },
  arrow: {
    id: 'arrow',
    name: 'Arrow',
    category: 'skill',
    cooldown: 2.5,
    target: { side: 'enemy', select: 'back', area: 'single' },
    effect: { kind: 'damage', damageType: 'physical', stat: 'attack', scaling: 1.0 },
  },
  cleave: {
    id: 'cleave',
    name: 'Cleave',
    category: 'skill',
    cooldown: 5.0,
    target: { side: 'enemy', select: 'highestHp', area: 'column' },
    effect: { kind: 'damage', damageType: 'physical', stat: 'attack', scaling: 0.8 },
  },
  charge: {
    id: 'charge',
    name: 'Charge',
    category: 'skill',
    cooldown: 3.0,
    target: { side: 'enemy', select: 'highestHpPct', area: 'single' },
    effect: { kind: 'damage', damageType: 'physical', stat: 'attack', scaling: 1.2 },
  },
  mend: {
    id: 'mend',
    name: 'Mend',
    category: 'spell',
    cooldown: 4.0,
    target: { side: 'ally', select: 'lowestHpPct', area: 'single' },
    effect: { kind: 'heal', scaling: 1.5 },
  },
  hex: {
    id: 'hex',
    name: 'Hex',
    category: 'spell',
    cooldown: 3.0,
    target: { side: 'enemy', select: 'castSpell', area: 'single' },
    effect: { kind: 'damage', damageType: 'magic', stat: 'magic', scaling: 1.0 },
  },
} satisfies Record<string, SkillDef>;

export const KNIGHT: CombatantDef = {
  id: 'knight',
  name: 'Knight',
  stats: { hp: 120, attack: 15, magic: 0, defense: 20, resistance: 10 },
  skills: [SKILLS.slash, SKILLS.shieldBash, SKILLS.ironGuard],
};

export const MAGE: CombatantDef = {
  id: 'mage',
  name: 'Mage',
  stats: { hp: 80, attack: 5, magic: 18, defense: 5, resistance: 15 },
  skills: [SKILLS.fireball, SKILLS.arcaneBolt],
};

export const CLERIC: CombatantDef = {
  id: 'cleric',
  name: 'Cleric',
  stats: { hp: 90, attack: 6, magic: 14, defense: 8, resistance: 15 },
  skills: [SKILLS.heal, SKILLS.blessing, SKILLS.smite],
};

export const SLIME: CombatantDef = {
  id: 'slime',
  name: 'Slime',
  stats: { hp: 50, attack: 12, magic: 0, defense: 5, resistance: 5 },
  skills: [SKILLS.bounce],
};

export const BAT: CombatantDef = {
  id: 'bat',
  name: 'Bat',
  stats: { hp: 30, attack: 9, magic: 0, defense: 3, resistance: 3 },
  skills: [SKILLS.bite],
};

export const ARCHER: CombatantDef = {
  id: 'archer',
  name: 'Archer',
  stats: { hp: 40, attack: 7, magic: 0, defense: 4, resistance: 6 },
  skills: [SKILLS.arrow],
};

export const ORC: CombatantDef = {
  id: 'orc',
  name: 'Orc',
  stats: { hp: 100, attack: 10, magic: 0, defense: 10, resistance: 4 },
  skills: [SKILLS.cleave, SKILLS.charge],
};

export const SHAMAN: CombatantDef = {
  id: 'shaman',
  name: 'Shaman',
  stats: { hp: 50, attack: 4, magic: 8, defense: 4, resistance: 10 },
  skills: [SKILLS.mend, SKILLS.hex],
};

export const EQUIPMENT = {
  tauntHelm: { id: 'tauntHelm', name: 'Taunt Helm', slot: 'helmet', stats: { hp: 20, defense: 5 }, taunt: true },
  ironArmor: { id: 'ironArmor', name: 'Iron Armor', slot: 'armor', stats: { hp: 30, defense: 10 } },
  ironBoots: { id: 'ironBoots', name: 'Iron Boots', slot: 'boots', stats: { defense: 3 } },
  longsword: { id: 'longsword', name: 'Longsword', slot: 'weapon', stats: { attack: 5 } },
  apprenticeRobe: { id: 'apprenticeRobe', name: 'Apprentice Robe', slot: 'armor', stats: { hp: 10, resistance: 5 } },
  oakStaff: { id: 'oakStaff', name: 'Oak Staff', slot: 'weapon', stats: { magic: 6 } },
  holySymbol: { id: 'holySymbol', name: 'Holy Symbol', slot: 'jewelry', stats: { magic: 4 } },
  leatherBoots: { id: 'leatherBoots', name: 'Leather Boots', slot: 'boots', stats: { hp: 5 } },
} satisfies Record<string, EquipmentDef>;

export function testParty(): PartyMember[] {
  return [
    {
      def: KNIGHT,
      equipment: {
        helmet: EQUIPMENT.tauntHelm,
        armor: EQUIPMENT.ironArmor,
        boots: EQUIPMENT.ironBoots,
        weapon: EQUIPMENT.longsword,
      },
    },
    { def: MAGE, equipment: { armor: EQUIPMENT.apprenticeRobe, weapon: EQUIPMENT.oakStaff } },
    { def: CLERIC, equipment: { jewelry: EQUIPMENT.holySymbol, boots: EQUIPMENT.leatherBoots } },
  ];
}

// Positions fill column by column: 0-2 front, 3-5 middle, 6-8 back.
export const TEST_ENCOUNTER: CombatantDef[] = [SLIME, SLIME, SLIME, BAT, ORC, BAT, ARCHER, SHAMAN, ARCHER];

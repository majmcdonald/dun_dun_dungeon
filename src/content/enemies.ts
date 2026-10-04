import type { CombatantDef, SkillDef, SkillEffect, Targeting } from '../combat/types';

// Enemy abilities are not part of the player skill library and never appear in inventory or rewards.
function enemySkill(
  id: string,
  name: string,
  cooldown: number,
  target: Targeting,
  effect: SkillEffect | SkillEffect[],
  spell = false,
  extra: Partial<SkillDef> = {},
): SkillDef {
  return {
    id,
    name,
    category: spell ? 'spell' : 'skill',
    rarity: 'common',
    access: { kind: 'shared' },
    cooldown,
    target,
    effects: Array.isArray(effect) ? effect : [effect],
    ...extra,
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

const nibble = enemySkill('nibble', 'Nibble', 1, { side: 'enemy', select: 'front', area: 'single' }, physical(0.8));
const sporePuff = enemySkill(
  'sporePuff',
  'Spore Puff',
  4,
  { side: 'enemy', select: 'random', area: 'single' },
  { kind: 'dot', stat: 'magic', scaling: 0.4, duration: 4, element: 'poison' },
  true,
);

const front = { side: 'enemy', select: 'front', area: 'single' } as const;
const stab = enemySkill('stab', 'Stab', 1.4, front, physical(1));
const dirtyTrick = enemySkill('dirtyTrick', 'Dirty Trick', 6, front, { kind: 'debuff', stat: 'defense', amount: 3, duration: 4 });
const wail = enemySkill(
  'wail',
  'Wail',
  4,
  { side: 'enemy', select: 'random', area: 'row' },
  { kind: 'damage', damageType: 'magic', stat: 'magic', scaling: 0.7, element: 'shadow' },
  true,
);
const spiderBite = enemySkill('spiderBite', 'Bite', 1.3, front, physical(0.9));
const web = enemySkill('web', 'Web', 5, { side: 'enemy', select: 'random', area: 'single' }, { kind: 'speed', factor: 0.7, duration: 3 });

const slash = enemySkill('knightSlash', 'Slash', 1.8, front, physical(1));
const shieldWall = enemySkill('shieldWall', 'Shield Wall', 8, { side: 'self' }, { kind: 'taunt', duration: 3 });
const rend = enemySkill('rend', 'Rend', 1.6, front, { kind: 'damage', damageType: 'physical', stat: 'attack', scaling: 0.9, drain: 0.5 });
const darkBolt = enemySkill(
  'darkBolt',
  'Dark Bolt',
  2.5,
  { side: 'enemy', select: 'highestHpPct', area: 'single' },
  { kind: 'damage', damageType: 'magic', stat: 'magic', scaling: 1.1, element: 'shadow' },
  true,
);
const bloodRite = enemySkill(
  'bloodRite',
  'Blood Rite',
  8,
  { side: 'ally', select: 'front', area: 'all' },
  { kind: 'buff', stat: 'magic', amount: 4, duration: 6 },
  true,
);

const allHeroes = { side: 'enemy', select: 'front', area: 'all' } as const;
const smash = enemySkill('smash', 'Smash', 4, { side: 'enemy', select: 'front', area: 'column' }, physical(1.2));
const stomp = enemySkill('stomp', 'Stomp', 10, allHeroes, { kind: 'delay', seconds: 1.5 });
const venomSpray = enemySkill('venomSpray', 'Venom Spray', 7, allHeroes, {
  kind: 'dot',
  stat: 'attack',
  scaling: 0.35,
  duration: 4,
  element: 'poison',
});
const webVolley = enemySkill('webVolley', 'Web Volley', 9, allHeroes, { kind: 'speed', factor: 0.75, duration: 3 });
const fangs = enemySkill('fangs', 'Fangs', 1.5, front, physical(1));
const soulDrain = enemySkill(
  'soulDrain',
  'Soul Drain',
  3,
  { side: 'enemy', select: 'highestHpPct', area: 'single' },
  { kind: 'damage', damageType: 'magic', stat: 'magic', scaling: 1.2, element: 'shadow', drain: 0.5 },
  true,
);
const boneShield = enemySkill(
  'boneShield',
  'Bone Shield',
  8,
  { side: 'ally', select: 'front', area: 'all' },
  { kind: 'barrier', stat: 'resistance', scaling: 1, duration: 6 },
  true,
);

export const SLIME: CombatantDef = {
  id: 'slime',
  name: 'Slime',
  stats: { hp: 235, attack: 11, magic: 0, defense: 5, resistance: 5 },
  skills: [bounce],
  resist: { fire: -0.5, poison: 0.5 },
};

export const BAT: CombatantDef = {
  id: 'bat',
  name: 'Bat',
  stats: { hp: 141, attack: 8, magic: 0, defense: 3, resistance: 3 },
  skills: [bite],
  resist: { lightning: -0.5 },
};

export const ARCHER: CombatantDef = {
  id: 'archer',
  name: 'Archer',
  stats: { hp: 188, attack: 6, magic: 0, defense: 4, resistance: 6 },
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
  stats: { hp: 250, attack: 4, magic: 8, defense: 4, resistance: 10 },
  skills: [mend, hex],
  resist: { shadow: 0.5, poison: 0.3 },
};

export const RAT: CombatantDef = {
  id: 'rat',
  name: 'Rat',
  stats: { hp: 143, attack: 6, magic: 0, defense: 2, resistance: 2 },
  skills: [nibble],
  resist: { fire: -0.5 },
};

export const MUSHROOM: CombatantDef = {
  id: 'mushroom',
  name: 'Mushroom',
  stats: { hp: 212, attack: 4, magic: 5, defense: 3, resistance: 8 },
  skills: [sporePuff],
  resist: { fire: -0.5, poison: 0.5 },
};

export const GOBLIN: CombatantDef = {
  id: 'goblin',
  name: 'Goblin',
  stats: { hp: 240, attack: 10, magic: 0, defense: 6, resistance: 4 },
  skills: [stab, dirtyTrick],
  resist: { lightning: -0.5 },
};

// High DEF and low RES: physical attacks struggle, magic gets through.
export const GHOST: CombatantDef = {
  id: 'ghost',
  name: 'Ghost',
  stats: { hp: 338, attack: 0, magic: 18, defense: 20, resistance: 4 },
  skills: [wail],
  resist: { holy: -0.5, shadow: 0.5, poison: 0.5 },
};

export const SPIDER: CombatantDef = {
  id: 'spider',
  name: 'Spider',
  stats: { hp: 263, attack: 16, magic: 0, defense: 5, resistance: 5 },
  skills: [spiderBite, web],
  resist: { fire: -0.5, poison: 0.5 },
};

// Taunts with Shield Wall, so the party's single-target attacks must go through it.
export const SKELETON_KNIGHT: CombatantDef = {
  id: 'skeletonKnight',
  name: 'Skeleton Knight',
  stats: { hp: 480, attack: 22, magic: 0, defense: 18, resistance: 6 },
  skills: [slash, shieldWall],
  resist: { holy: -0.5, poison: 0.5 },
};

export const GHOUL: CombatantDef = {
  id: 'ghoul',
  name: 'Ghoul',
  stats: { hp: 330, attack: 18, magic: 0, defense: 8, resistance: 6 },
  skills: [rend],
  resist: { holy: -0.5, fire: -0.5, shadow: 0.5, poison: 0.5 },
};

export const CULTIST: CombatantDef = {
  id: 'cultist',
  name: 'Cultist',
  stats: { hp: 200, attack: 2, magic: 11, defense: 5, resistance: 12 },
  skills: [darkBolt, bloodRite],
  resist: { holy: -0.5, shadow: 0.5 },
};

// --- Act 1 Epic Monsters

export const OGRE: CombatantDef = {
  id: 'ogre',
  name: 'Ogre',
  stats: { hp: 1300, attack: 26, magic: 0, defense: 14, resistance: 6 },
  skills: [smash, stomp],
  resist: { lightning: -0.5 },
};

export const SPIDER_QUEEN: CombatantDef = {
  id: 'spiderQueen',
  name: 'Spider Queen',
  stats: { hp: 1200, attack: 19, magic: 13, defense: 10, resistance: 10 },
  skills: [fangs, venomSpray, webVolley],
  resist: { fire: -0.5, poison: 0.5 },
};

export const BONE_MAGE: CombatantDef = {
  id: 'boneMage',
  name: 'Bone Mage',
  stats: { hp: 1105, attack: 12, magic: 54, defense: 8, resistance: 18 },
  skills: [soulDrain, boneShield],
  resist: { holy: -0.5, shadow: 0.5, poison: 0.5 },
};

// --- Act 1 bosses (one per run). Their 48x48 sprites are drawn separately.

// Bosses hit lightly at first, then grow fiercer from 25s: +30% ATK/MAG every 3s. Fast parties win before
// the wall; slow ones (heal-and-outlast) can't, so no class is required.
const BOSS_FURY = { after: 25, step: 3, rate: 0.3 };

const self = { side: 'self' } as const;
const scepterBash = enemySkill('scepterBash', 'Scepter Bash', 2, front, physical(1.1));
const callTheHorde = enemySkill('callTheHorde', 'Call the Horde', 10, self, { kind: 'spawn', enemy: 'goblin', count: 2, cap: 6 });
const warCry = enemySkill('warCry', 'War Cry', 12, { side: 'ally', select: 'front', area: 'all' }, { kind: 'speed', factor: 1.4, duration: 4 });
const bodySlam = enemySkill('bodySlam', 'Body Slam', 3.5, { side: 'enemy', select: 'front', area: 'column' }, physical(1.2));
const acidSpit = enemySkill('acidSpit', 'Acid Spit', 5, { side: 'enemy', select: 'random', area: 'single' }, {
  kind: 'dot',
  stat: 'attack',
  scaling: 0.3,
  duration: 4,
  element: 'poison',
});
const split = (id: string, threshold: number) =>
  enemySkill(id, 'Split', 1, self, { kind: 'spawn', enemy: 'slime', count: 2, cap: 8 }, false, {
    trigger: { kind: 'belowHp', threshold },
  });
const burst = enemySkill('burst', 'Burst', 1, self, { kind: 'spawn', enemy: 'slime', count: 3, cap: 9 }, false, {
  trigger: { kind: 'onDefeat' },
});
const club = enemySkill('trollClub', 'Club', 2.5, front, physical(1.2));
const enrage = enemySkill(
  'enrage',
  'Enrage',
  1,
  self,
  [
    { kind: 'buff', stat: 'attack', amount: 6, duration: 999 },
    { kind: 'speed', factor: 1.5, duration: 999 },
  ],
  false,
  { trigger: { kind: 'belowHp', threshold: 0.5 } },
);

export const GOBLIN_KING: CombatantDef = {
  id: 'goblinKing',
  name: 'Goblin King',
  stats: { hp: 1911, attack: 14, magic: 0, defense: 14, resistance: 10 },
  skills: [scepterBash, callTheHorde, warCry],
  fury: BOSS_FURY,
  resist: { lightning: -0.5 },
};

export const SLIME_KING: CombatantDef = {
  id: 'slimeKing',
  name: 'Slime King',
  stats: { hp: 2880, attack: 13, magic: 0, defense: 8, resistance: 8 },
  skills: [bodySlam, acidSpit, split('split66', 0.66), split('split33', 0.33), burst],
  fury: BOSS_FURY,
  resist: { fire: -0.5, poison: 0.5 },
};

// Regenerates about 2% of max HP a second until fire or poison damage stops it for 4s.
export const TROLL: CombatantDef = {
  id: 'troll',
  name: 'Troll',
  stats: { hp: 3780, attack: 19, magic: 0, defense: 16, resistance: 8 },
  skills: [club, enrage],
  fury: BOSS_FURY,
  resist: { fire: -0.5 },
  regeneration: { perSecond: 0.02, blockedBy: ['fire', 'poison'], blockSeconds: 4 },
};

// Every enemy type, for pickers.
export const ENEMIES: CombatantDef[] = [
  SLIME,
  BAT,
  ORC,
  ARCHER,
  SHAMAN,
  RAT,
  MUSHROOM,
  GOBLIN,
  GHOST,
  SPIDER,
  SKELETON_KNIGHT,
  GHOUL,
  CULTIST,
  OGRE,
  SPIDER_QUEEN,
  BONE_MAGE,
  GOBLIN_KING,
  SLIME_KING,
  TROLL,
];
export const ENEMIES_BY_ID: Record<string, CombatantDef> = Object.fromEntries(ENEMIES.map((e) => [e.id, e]));

// Positions fill column by column: 0-2 front, 3-5 middle, 6-8 back.
export const TEST_ENCOUNTER: CombatantDef[] = [SLIME, SLIME, SLIME, BAT, ORC, BAT, ARCHER, SHAMAN, ARCHER];

// Every map fight until Phase 6 content: one of each enemy, melee in front, casters behind.
export const MAP_ENCOUNTER: CombatantDef[] = [SLIME, ORC, BAT, ARCHER, SHAMAN];

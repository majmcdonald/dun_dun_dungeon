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
  stats: { hp: 235, attack: 7, magic: 0, defense: 5, resistance: 5 },
  skills: [bounce],
  resist: { fire: -0.5, poison: 0.5 },
};

export const BAT: CombatantDef = {
  id: 'bat',
  name: 'Bat',
  stats: { hp: 141, attack: 5, magic: 0, defense: 3, resistance: 3 },
  skills: [bite],
  resist: { lightning: -0.5 },
};

export const ARCHER: CombatantDef = {
  id: 'archer',
  name: 'Archer',
  stats: { hp: 188, attack: 4, magic: 0, defense: 4, resistance: 6 },
  skills: [arrow],
  resist: { holy: -0.5, poison: 0.9 },
};

export const ORC: CombatantDef = {
  id: 'orc',
  name: 'Orc',
  stats: { hp: 332, attack: 15, magic: 0, defense: 10, resistance: 4 },
  skills: [orcCleave, charge],
};

export const SHAMAN: CombatantDef = {
  id: 'shaman',
  name: 'Shaman',
  stats: { hp: 250, attack: 3, magic: 5, defense: 4, resistance: 10 },
  skills: [mend, hex],
  resist: { shadow: 0.5, poison: 0.3 },
};

export const RAT: CombatantDef = {
  id: 'rat',
  name: 'Rat',
  stats: { hp: 143, attack: 4, magic: 0, defense: 2, resistance: 2 },
  skills: [nibble],
  resist: { fire: -0.5 },
};

export const MUSHROOM: CombatantDef = {
  id: 'mushroom',
  name: 'Mushroom',
  stats: { hp: 212, attack: 3, magic: 3, defense: 3, resistance: 8 },
  skills: [sporePuff],
  resist: { fire: -0.5, poison: 0.5 },
};

export const GOBLIN: CombatantDef = {
  id: 'goblin',
  name: 'Goblin',
  stats: { hp: 240, attack: 7, magic: 0, defense: 6, resistance: 4 },
  skills: [stab, dirtyTrick],
  resist: { lightning: -0.5 },
};

// High DEF and low RES: physical attacks struggle, magic gets through.
export const GHOST: CombatantDef = {
  id: 'ghost',
  name: 'Ghost',
  stats: { hp: 338, attack: 0, magic: 12, defense: 20, resistance: 4 },
  skills: [wail],
  resist: { holy: -0.5, shadow: 0.5, poison: 0.5 },
};

export const SPIDER: CombatantDef = {
  id: 'spider',
  name: 'Spider',
  stats: { hp: 263, attack: 11, magic: 0, defense: 5, resistance: 5 },
  skills: [spiderBite, web],
  resist: { fire: -0.5, poison: 0.5 },
};

// Taunts with Shield Wall, so the party's single-target attacks must go through it.
export const SKELETON_KNIGHT: CombatantDef = {
  id: 'skeletonKnight',
  name: 'Skeleton Knight',
  stats: { hp: 480, attack: 15, magic: 0, defense: 18, resistance: 6 },
  skills: [slash, shieldWall],
  resist: { holy: -0.5, poison: 0.5 },
};

export const GHOUL: CombatantDef = {
  id: 'ghoul',
  name: 'Ghoul',
  stats: { hp: 330, attack: 12, magic: 0, defense: 8, resistance: 6 },
  skills: [rend],
  resist: { holy: -0.5, fire: -0.5, shadow: 0.5, poison: 0.5 },
};

export const CULTIST: CombatantDef = {
  id: 'cultist',
  name: 'Cultist',
  stats: { hp: 200, attack: 1, magic: 7, defense: 5, resistance: 12 },
  skills: [darkBolt, bloodRite],
  resist: { holy: -0.5, shadow: 0.5 },
};

// --- Act 1 Epic Monsters

export const OGRE: CombatantDef = {
  id: 'ogre',
  name: 'Ogre',
  stats: { hp: 1019, attack: 15, magic: 0, defense: 14, resistance: 6 },
  skills: [smash, stomp],
  resist: { lightning: -0.5 },
};

export const SPIDER_QUEEN: CombatantDef = {
  id: 'spiderQueen',
  name: 'Spider Queen',
  stats: { hp: 941, attack: 10, magic: 7, defense: 10, resistance: 10 },
  skills: [fangs, venomSpray, webVolley],
  resist: { fire: -0.5, poison: 0.5 },
};

export const BONE_MAGE: CombatantDef = {
  id: 'boneMage',
  name: 'Bone Mage',
  stats: { hp: 866, attack: 7, magic: 30, defense: 8, resistance: 18 },
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
  stats: { hp: 818, attack: 9, magic: 0, defense: 14, resistance: 10 },
  skills: [scepterBash, callTheHorde, warCry],
  fury: BOSS_FURY,
  resist: { lightning: -0.5 },
};

export const SLIME_KING: CombatantDef = {
  id: 'slimeKing',
  name: 'Slime King',
  stats: { hp: 1233, attack: 8, magic: 0, defense: 8, resistance: 8 },
  skills: [bodySlam, acidSpit, split('split66', 0.66), split('split33', 0.33), burst],
  fury: BOSS_FURY,
  resist: { fire: -0.5, poison: 0.5 },
};

// Regenerates about 2% of max HP a second until fire or poison damage stops it for 4s.
export const TROLL: CombatantDef = {
  id: 'troll',
  name: 'Troll',
  stats: { hp: 1618, attack: 12, magic: 0, defense: 16, resistance: 8 },
  skills: [club, enrage],
  fury: BOSS_FURY,
  resist: { fire: -0.5 },
  regeneration: { perSecond: 0.02, blockedBy: ['fire', 'poison'], blockSeconds: 4 },
};

// --- Act 2, Group 1 (rooms 1–5). Base stats are pre-tuning; the Act 2 balance pass scales them.

const frostBite = enemySkill('frostBite', 'Frost Bite', 1, front, [
  physical(0.8),
  { kind: 'damage', damageType: 'magic', stat: 'attack', scaling: 0.3, element: 'ice' },
]);
const howl = enemySkill('howl', 'Howl', 8, { side: 'ally', select: 'front', area: 'all' }, { kind: 'buff', stat: 'attack', amount: 4, duration: 4 });
const frostbiteHide = enemySkill('frostbiteHide', 'Frostbite Hide', 3, { side: 'enemy', select: 'attackedMe', area: 'single' }, { kind: 'speed', factor: 0.7, duration: 3 }, false, {
  trigger: { kind: 'whenHit' },
});
const dive = enemySkill('dive', 'Dive', 2, { side: 'enemy', select: 'back', area: 'single' }, physical(1.1));
const screech = enemySkill('screech', 'Screech', 9, allHeroes, { kind: 'delay', seconds: 1 });
const takeFlight = enemySkill('takeFlight', 'Take Flight', 8, self, { kind: 'flight', duration: 3, damageTaken: 0.3, damageDealt: 1.7 }, false, {
  trigger: { kind: 'whenHit' },
});
const shiv = enemySkill('shiv', 'Shiv', 2.5, { side: 'enemy', select: 'lowestHp', area: 'single' }, [
  physical(0.8),
  { kind: 'dot', stat: 'attack', scaling: 0.25, duration: 4, element: 'poison', perStack: 0.5 },
]);
const envenom = enemySkill('envenom', 'Envenom', 5, self, { kind: 'venom' });
const caltrops = enemySkill('caltrops', 'Caltrops', 6, front, { kind: 'speed', factor: 0.7, duration: 3 });

// Slows whoever hits it.
export const FROST_WOLF: CombatantDef = {
  id: 'frostWolf',
  name: 'Frost Wolf',
  stats: { hp: 139, attack: 6, magic: 0, defense: 8, resistance: 8 },
  skills: [frostBite, howl, frostbiteHide],
  resist: { fire: -0.5, ice: 0.5 },
};

// Takes flight when hit: 70% less damage taken and 70% more dealt for 3s.
export const HARPY: CombatantDef = {
  id: 'harpy',
  name: 'Harpy',
  stats: { hp: 133, attack: 9, magic: 0, defense: 6, resistance: 6 },
  skills: [dive, screech, takeFlight],
  resist: { lightning: -0.5, poison: 0.5 },
};

// Gains a Venom stack every 5s; each stack adds 50% to Shiv's poison.
export const BANDIT: CombatantDef = {
  id: 'bandit',
  name: 'Bandit',
  stats: { hp: 150, attack: 8, magic: 0, defense: 8, resistance: 6 },
  skills: [shiv, envenom, caltrops],
};

// --- Act 2, Group 2 (rooms 6–10). Base stats are pre-tuning; the Act 2 balance pass scales them.

const slam = enemySkill('slam', 'Slam', 4, { side: 'enemy', select: 'front', area: 'column' }, physical(1.1));
const stoneSkin = enemySkill('stoneSkin', 'Stone Skin', 10, self, [
  { kind: 'taunt', duration: 3 },
  { kind: 'barrier', stat: 'defense', scaling: 2, duration: 5 },
]);
const shatter = enemySkill('shatter', 'Shatter', 1, allHeroes, physical(2.5), false, { trigger: { kind: 'onDefeat' } });
const gnollRend = enemySkill('gnollRend', 'Rend', 1.8, front, [physical(0.8), { kind: 'dot', stat: 'attack', scaling: 0.3, duration: 3 }]);
const bloodlust = enemySkill(
  'bloodlust',
  'Bloodlust',
  0,
  self,
  [
    { kind: 'buff', stat: 'attack', amount: 4, duration: 10, stack: true },
    { kind: 'speed', factor: 1.3, duration: 10, stack: true },
  ],
  false,
  { trigger: { kind: 'allyFalls' } },
);
const flicker = enemySkill('flicker', 'Flicker', 2, { side: 'enemy', select: 'random', area: 'single' }, {
  kind: 'damage',
  damageType: 'magic',
  stat: 'magic',
  scaling: 0.8,
  element: 'fire',
}, true);
const lure = enemySkill('lure', 'Lure', 7, { side: 'enemy', select: 'highestHp', area: 'single' }, { kind: 'delay', seconds: 1.5 }, true);
const emberWard = enemySkill('emberWard', 'Ember Ward', 4, self, [
  { kind: 'barrier', stat: 'resistance', scaling: 1, duration: 3 },
  { kind: 'heal', scaling: 0.6 },
], true, { trigger: { kind: 'whenHit' } });
const flameWall = enemySkill('flameWall', 'Flame Wall', 10, allHeroes, {
  kind: 'damage',
  damageType: 'magic',
  stat: 'magic',
  scaling: 1.5,
  element: 'fire',
}, true);

// Shatters on defeat, hitting every hero hard.
export const STONE_GOLEM: CombatantDef = {
  id: 'stoneGolem',
  name: 'Stone Golem',
  stats: { hp: 530, attack: 12, magic: 0, defense: 22, resistance: 6 },
  skills: [slam, stoneSkin, shatter],
  resist: { lightning: -0.5, poison: 0.5 },
};

// Each enemy that falls stacks +ATK and haste for 10s.
export const GNOLL: CombatantDef = {
  id: 'gnoll',
  name: 'Gnoll',
  stats: { hp: 232, attack: 6, magic: 0, defense: 8, resistance: 5 },
  skills: [gnollRend, bloodlust],
  resist: { fire: -0.5 },
};

// Wards and heals itself when hit; Flame Wall scorches the whole party every 10s.
export const WISP: CombatantDef = {
  id: 'wisp',
  name: 'Wisp',
  stats: { hp: 133, attack: 0, magic: 9, defense: 4, resistance: 14 },
  skills: [flicker, lure, emberWard, flameWall],
  resist: { ice: -0.5, fire: 0.5 },
};

// --- Act 2, Group 3 (rooms 11–15). Base stats are pre-tuning; the Act 2 balance pass scales them.

const gore = enemySkill('gore', 'Gore', 2.5, { side: 'enemy', select: 'highestHp', area: 'single' }, physical(1.3));
const trample = enemySkill('trample', 'Trample', 7, { side: 'enemy', select: 'front', area: 'column' }, physical(1));
const rampage = enemySkill(
  'rampage',
  'Rampage',
  1,
  self,
  [
    { kind: 'buff', stat: 'attack', amount: 6, duration: 999 },
    { kind: 'speed', factor: 1.4, duration: 999 },
  ],
  false,
  { trigger: { kind: 'belowHp', threshold: 0.5 } },
);
const petrifyingGaze = enemySkill('petrifyingGaze', 'Petrifying Gaze', 8, { side: 'enemy', select: 'random', area: 'single' }, { kind: 'delay', seconds: 3 }, true);
const serpentHair = enemySkill('serpentHair', 'Serpent Hair', 3, { side: 'enemy', select: 'random', area: 'single' }, {
  kind: 'dot',
  stat: 'magic',
  scaling: 0.4,
  duration: 4,
  element: 'poison',
}, true);
const stoneGlare = enemySkill('stoneGlare', 'Stone Glare', 4, { side: 'enemy', select: 'attackedMe', area: 'single' }, { kind: 'speed', factor: 0.5, duration: 2 }, true, {
  trigger: { kind: 'whenHit' },
});
const tailSting = enemySkill('tailSting', 'Tail Sting', 4, front, [physical(0.8), { kind: 'dot', stat: 'attack', scaling: 0.5, duration: 5, element: 'poison' }]);
const wyvernBite = enemySkill('wyvernBite', 'Bite', 3, front, [physical(0.9), { kind: 'tickPoison' }]);

// A wall of HP; enrages below half.
export const MINOTAUR: CombatantDef = {
  id: 'minotaur',
  name: 'Minotaur',
  stats: { hp: 1561, attack: 15, magic: 0, defense: 14, resistance: 8 },
  skills: [gore, trample, rampage],
  resist: { ice: -0.5 },
};

export const MEDUSA: CombatantDef = {
  id: 'medusa',
  name: 'Medusa',
  stats: { hp: 303, attack: 4, magic: 9, defense: 8, resistance: 14 },
  skills: [petrifyingGaze, serpentHair, stoneGlare],
  resist: { holy: -0.5, poison: 0.5 },
};

// Bite makes every poison on its target tick at once; takes flight when hit, like the Harpy.
export const WYVERN: CombatantDef = {
  id: 'wyvern',
  name: 'Wyvern',
  stats: { hp: 456, attack: 11, magic: 0, defense: 10, resistance: 8 },
  skills: [tailSting, wyvernBite, takeFlight],
  resist: { lightning: -0.5, poison: 0.5 },
};

// --- Act 2 Epic Monsters. Base stats are pre-tuning; the Act 2 balance pass scales them.

const glacialSmash = enemySkill('glacialSmash', 'Glacial Smash', 4, { side: 'enemy', select: 'front', area: 'column' }, {
  kind: 'damage',
  damageType: 'physical',
  stat: 'attack',
  scaling: 1.3,
  element: 'ice',
});
const blizzard = enemySkill('blizzard', 'Blizzard', 10, allHeroes, [
  { kind: 'damage', damageType: 'magic', stat: 'attack', scaling: 0.6, element: 'ice' },
  { kind: 'speed', factor: 0.7, duration: 3 },
], true);
const iceArmor = enemySkill('iceArmor', 'Ice Armor', 1, self, { kind: 'buff', stat: 'defense', amount: 3, duration: 8, stack: true }, false, {
  trigger: { kind: 'whenHit' },
});
const atCaster = { side: 'enemy', select: 'casterClass', area: 'single' } as const;
const lionBite = enemySkill('lionBite', 'Lion Bite', 1.5, atCaster, physical(1));
const goatCharge = enemySkill('goatCharge', 'Goat Charge', 5, atCaster, physical(1.6));
const serpentTail = enemySkill('serpentTail', 'Serpent Tail', 4, atCaster, { kind: 'dot', stat: 'attack', scaling: 0.4, duration: 5, element: 'poison' });
const fireBreath = enemySkill('fireBreath', 'Fire Breath', 8, { side: 'enemy', select: 'casterClass', area: 'row' }, {
  kind: 'damage',
  damageType: 'magic',
  stat: 'magic',
  scaling: 1.2,
  element: 'fire',
}, true);
const snappingHeads = enemySkill('snappingHeads', 'Snapping Heads', 2, front, { kind: 'damage', damageType: 'physical', stat: 'attack', scaling: 0.5, hits: 3 });
const growHead = (id: string, threshold: number) =>
  enemySkill(
    id,
    'Grow Head',
    1,
    self,
    [
      { kind: 'buff', stat: 'attack', amount: 4, duration: 999, stack: true },
      { kind: 'speed', factor: 1.2, duration: 999, stack: true },
    ],
    false,
    { trigger: { kind: 'belowHp', threshold } },
  );

// Hardens when hit: each hit stacks +DEF for 8s.
export const FROST_GIANT: CombatantDef = {
  id: 'frostGiant',
  name: 'Frost Giant',
  stats: { hp: 1741, attack: 46, magic: 0, defense: 14, resistance: 8 },
  skills: [glacialSmash, blizzard, iceArmor],
  resist: { fire: -0.5, ice: 0.5 },
};

// Every head goes for the party's casters.
export const CHIMERA: CombatantDef = {
  id: 'chimera',
  name: 'Chimera',
  stats: { hp: 1758, attack: 19, magic: 13, defense: 10, resistance: 10 },
  skills: [lionBite, goatCharge, serpentTail, fireBreath],
};

// Regrows unless burned; grows a head (stacking +ATK and haste) at 75%, 50%, and 25% HP.
export const HYDRA: CombatantDef = {
  id: 'hydra',
  name: 'Hydra',
  stats: { hp: 1674, attack: 29, magic: 0, defense: 10, resistance: 8 },
  skills: [snappingHeads, growHead('growHead75', 0.75), growHead('growHead50', 0.5), growHead('growHead25', 0.25)],
  resist: { fire: -0.5 },
  regeneration: { perSecond: 0.02, blockedBy: ['fire'], blockSeconds: 4 },
};

// --- Act 2 bosses (one per run; 48x48 sprites drawn separately). Base stats are pre-tuning.

const twinDaggers = enemySkill('twinDaggers', 'Twin Daggers', 1.5, { side: 'enemy', select: 'lowestHp', area: 'single' }, [
  { kind: 'damage', damageType: 'physical', stat: 'attack', scaling: 0.6, hits: 2 },
  { kind: 'dot', stat: 'attack', scaling: 0.25, duration: 4, element: 'poison', perStack: 0.5 },
]);
const smokeBomb = enemySkill('smokeBomb', 'Smoke Bomb', 12, allHeroes, { kind: 'delay', seconds: 1.5 });
const smokeScreen = enemySkill('smokeScreen', 'Smoke Screen', 12, { side: 'ally', select: 'front', area: 'all' }, {
  kind: 'barrier',
  stat: 'defense',
  scaling: 1.5,
  duration: 4,
});
const callThugs = enemySkill('callThugs', 'Call Thugs', 15, self, { kind: 'spawn', enemy: 'bandit', count: 2, cap: 4 });
const frostLance = enemySkill('frostLance', 'Frost Lance', 2, { side: 'enemy', select: 'highestHp', area: 'single' }, {
  kind: 'damage',
  damageType: 'magic',
  stat: 'magic',
  scaling: 1.1,
  element: 'ice',
}, true);
const glacialTomb = enemySkill('glacialTomb', 'Glacial Tomb', 10, { side: 'enemy', select: 'random', area: 'single' }, { kind: 'delay', seconds: 4 }, true);
const mirrorShards = enemySkill('mirrorShards', 'Mirror Shards', 3, { side: 'enemy', select: 'attackedMe', area: 'single' }, {
  kind: 'damage',
  damageType: 'magic',
  stat: 'magic',
  scaling: 0.8,
  element: 'ice',
}, true, { trigger: { kind: 'whenHit' } });
const wintersGrip = enemySkill('wintersGrip', "Winter's Grip", 1, allHeroes, { kind: 'speed', factor: 0.6, duration: 999 }, true, {
  trigger: { kind: 'belowHp', threshold: 0.5 },
});
const wintersCall = enemySkill('wintersCall', "Winter's Call", 1, self, { kind: 'spawn', enemy: 'frostWolf', count: 2, cap: 2 }, false, {
  trigger: { kind: 'belowHp', threshold: 0.5 },
});
const wyrmClaw = enemySkill('wyrmClaw', 'Claw', 2, front, physical(1.1));
const inferno = enemySkill('inferno', 'Inferno', 9, allHeroes, {
  kind: 'damage',
  damageType: 'magic',
  stat: 'magic',
  scaling: 1.3,
  element: 'fire',
}, true);
const moltenScales = enemySkill(
  'moltenScales',
  'Molten Scales',
  1,
  self,
  [
    { kind: 'buff', stat: 'defense', amount: 10, duration: 999 },
    { kind: 'buff', stat: 'resistance', amount: 10, duration: 999 },
  ],
  false,
  { trigger: { kind: 'belowHp', threshold: 0.5 } },
);

export const BANDIT_KING: CombatantDef = {
  id: 'banditKing',
  name: 'Bandit King',
  stats: { hp: 2214, attack: 9, magic: 0, defense: 12, resistance: 10 },
  skills: [twinDaggers, smokeBomb, smokeScreen, callThugs, envenom],
  fury: BOSS_FURY,
};

// Below half HP: the whole party slows to 60% for good, and two Frost Wolves join.
export const ICE_QUEEN: CombatantDef = {
  id: 'iceQueen',
  name: 'Ice Queen',
  stats: { hp: 2475, attack: 3, magic: 15, defense: 10, resistance: 18 },
  skills: [frostLance, glacialTomb, mirrorShards, wintersGrip, wintersCall],
  resist: { fire: -0.5, ice: 0.5 },
  fury: BOSS_FURY,
};

export const ELDER_WYRM: CombatantDef = {
  id: 'elderWyrm',
  name: 'Elder Wyrm',
  stats: { hp: 2939, attack: 15, magic: 13, defense: 14, resistance: 12 },
  skills: [wyrmClaw, inferno, takeFlight, moltenScales],
  resist: { ice: -0.5, fire: 0.5 },
  fury: BOSS_FURY,
};

// --- Act 3, Group 1 (rooms 1–5). Base stats are pre-tuning; the Act 3 balance pass scales them.

const bloodDrain = enemySkill('bloodDrain', 'Blood Drain', 2, { side: 'enemy', select: 'highestHp', area: 'single' }, {
  kind: 'damage',
  damageType: 'physical',
  stat: 'attack',
  scaling: 1,
  drain: 0.5,
});
const mistForm = enemySkill('mistForm', 'Mist Form', 8, self, { kind: 'flight', duration: 3, damageTaken: 0.5, damageDealt: 1 }, false, {
  trigger: { kind: 'whenHit' },
});
const batSwarm = enemySkill('batSwarm', 'Bat Swarm', 1, self, { kind: 'spawn', enemy: 'bat', count: 3, cap: 8 }, false, {
  trigger: { kind: 'belowHp', threshold: 0.5 },
});
const soulReap = enemySkill('soulReap', 'Soul Reap', 3, { side: 'enemy', select: 'front', area: 'column' }, {
  kind: 'damage',
  damageType: 'physical',
  stat: 'attack',
  scaling: 1.1,
  element: 'shadow',
});
const unholyAura = enemySkill('unholyAura', 'Unholy Aura', 10, { side: 'ally', select: 'front', area: 'all' }, {
  kind: 'buff',
  stat: 'attack',
  amount: 3,
  duration: 999,
  stack: true,
});
const deathGrip = enemySkill('deathGrip', 'Death Grip', 1, { side: 'enemy', select: 'highestHp', area: 'single' }, { kind: 'delay', seconds: 2 }, false, {
  trigger: { kind: 'allyFalls' },
});
const shadowBolt = enemySkill('shadowBolt', 'Shadow Bolt', 2, { side: 'enemy', select: 'random', area: 'single' }, {
  kind: 'damage',
  damageType: 'magic',
  stat: 'magic',
  scaling: 1,
  element: 'shadow',
}, true);
const drainLight = enemySkill('drainLight', 'Drain Light', 9, allHeroes, { kind: 'debuff', stat: 'magic', amount: 4, duration: 6 }, true);
const fade = enemySkill('fade', 'Fade', 6, self, { kind: 'flight', duration: 2, damageTaken: 0.2, damageDealt: 1 }, true, {
  trigger: { kind: 'whenHit' },
});

// Drains blood, turns to mist when hit, and calls bats at half HP.
export const VAMPIRE: CombatantDef = {
  id: 'vampire',
  name: 'Vampire',
  stats: { hp: 204, attack: 29, magic: 0, defense: 10, resistance: 12 },
  skills: [bloodDrain, mistForm, batSwarm],
  resist: { holy: -0.5, fire: -0.5, shadow: 0.5 },
};

// Its aura stacks +ATK on every enemy, and each fallen ally drags a hero's timers back.
export const DEATH_KNIGHT: CombatantDef = {
  id: 'deathKnight',
  name: 'Death Knight',
  stats: { hp: 306, attack: 34, magic: 0, defense: 20, resistance: 10 },
  skills: [soulReap, unholyAura, deathGrip],
  resist: { holy: -0.5, shadow: 0.5, poison: 0.5 },
};

// Fades when hit (80% less damage for 2s).
export const SHADE: CombatantDef = {
  id: 'shade',
  name: 'Shade',
  stats: { hp: 102, attack: 0, magic: 34, defense: 4, resistance: 16 },
  skills: [shadowBolt, drainLight, fade],
  resist: { holy: -0.5, shadow: 0.5 },
};

// --- Act 3, Group 2 (rooms 6–10). Base stats are pre-tuning; the Act 3 balance pass scales them.

const boneCrush = enemySkill('boneCrush', 'Bone Crush', 3, front, physical(1.2));
const boneSpikes = enemySkill('boneSpikes', 'Bone Spikes', 2, { side: 'enemy', select: 'attackedMe', area: 'single' }, physical(0.6), false, {
  trigger: { kind: 'whenHit' },
});
const bansheeWail = enemySkill('bansheeWail', 'Wail', 8, allHeroes, [
  { kind: 'damage', damageType: 'magic', stat: 'magic', scaling: 0.9, element: 'shadow' },
  { kind: 'delay', seconds: 1 },
], true);
const keening = enemySkill('keening', 'Keening', 0, allHeroes, { kind: 'debuff', stat: 'defense', amount: 3, duration: 999, stack: true }, true, {
  trigger: { kind: 'allyFalls' },
});
const diveClaw = enemySkill('diveClaw', 'Dive Claw', 2.5, { side: 'enemy', select: 'back', area: 'single' }, physical(1.1));
const stoneForm = enemySkill('stoneForm', 'Stone Form', 12, self, [
  { kind: 'flight', duration: 4, damageTaken: 0.1, damageDealt: 1 },
  { kind: 'delay', seconds: 4 },
]);

// Spikes whoever hits it; the first time it falls, it reassembles at 40% HP.
export const BONE_GOLEM: CombatantDef = {
  id: 'boneGolem',
  name: 'Bone Golem',
  stats: { hp: 546, attack: 25, magic: 0, defense: 16, resistance: 8 },
  skills: [boneCrush, boneSpikes],
  resist: { holy: -0.5, poison: 0.5, shadow: 0.5 },
  reassemble: 0.4,
};

// Each enemy that falls stacks −DEF on every hero for the rest of the fight.
export const BANSHEE: CombatantDef = {
  id: 'banshee',
  name: 'Banshee',
  stats: { hp: 195, attack: 0, magic: 25, defense: 4, resistance: 16 },
  skills: [bansheeWail, keening],
  resist: { holy: -0.5, shadow: 0.5 },
};

// Every 12s it turns to stone: 90% less damage for 4s, but its timers stop.
export const GARGOYLE: CombatantDef = {
  id: 'gargoyle',
  name: 'Gargoyle',
  stats: { hp: 351, attack: 23, magic: 0, defense: 18, resistance: 8 },
  skills: [diveClaw, stoneForm],
  resist: { lightning: -0.5, poison: 0.5 },
};

// --- Act 3, Group 3 (rooms 11–15). Base stats are pre-tuning; the Act 3 balance pass scales them.

const hook = enemySkill('hook', 'Hook', 4, { side: 'enemy', select: 'back', area: 'single' }, physical(1.4));
const rotCloud = enemySkill('rotCloud', 'Rot Cloud', 7, allHeroes, { kind: 'dot', stat: 'attack', scaling: 0.3, duration: 5, element: 'poison' });
const abominationBurst = enemySkill('abominationBurst', 'Burst', 1, allHeroes, { kind: 'dot', stat: 'attack', scaling: 0.6, duration: 6, element: 'poison' }, false, {
  trigger: { kind: 'onDefeat' },
});
const nightmareTrample = enemySkill('nightmareTrample', 'Trample', 3, { side: 'enemy', select: 'front', area: 'row' }, physical(1));
const terror = enemySkill('terror', 'Terror', 8, { side: 'enemy', select: 'random', area: 'single' }, [
  { kind: 'delay', seconds: 2 },
  { kind: 'debuff', stat: 'attack', amount: 4, duration: 5 },
], true);
const hellfire = enemySkill('hellfire', 'Hellfire', 6, allHeroes, { kind: 'dot', stat: 'magic', scaling: 0.3, duration: 4, element: 'fire' }, true);
const raiseDead = enemySkill('raiseDead', 'Raise Dead', 12, self, { kind: 'spawn', enemy: 'skeletonKnight', count: 1, cap: 2 }, true);
const unholyMending = enemySkill('unholyMending', 'Unholy Mending', 4, { side: 'ally', select: 'lowestHpPct', area: 'single' }, { kind: 'heal', scaling: 1 }, true);
const darkWard = enemySkill('darkWard', 'Dark Ward', 2, { side: 'ally', select: 'front', area: 'all' }, {
  kind: 'barrier',
  stat: 'resistance',
  scaling: 1,
  duration: 4,
}, true, { trigger: { kind: 'allyFalls' } });

// Poisons the party while alive, and bursts into heavier poison when it dies.
export const ABOMINATION: CombatantDef = {
  id: 'abomination',
  name: 'Abomination',
  stats: { hp: 990, attack: 29, magic: 0, defense: 12, resistance: 6 },
  skills: [hook, rotCloud, abominationBurst],
  resist: { fire: -0.5, poison: 0.5 },
};

export const NIGHTMARE: CombatantDef = {
  id: 'nightmare',
  name: 'Nightmare',
  stats: { hp: 545, attack: 25, magic: 22, defense: 12, resistance: 12 },
  skills: [nightmareTrample, terror, hellfire],
  resist: { holy: -0.5, ice: -0.5, fire: 0.5 },
};

// Raises Skeleton Knights, mends the most-hurt enemy, and wards every enemy when one falls.
export const DARK_PRIEST: CombatantDef = {
  id: 'darkPriest',
  name: 'Dark Priest',
  stats: { hp: 297, attack: 6, magic: 25, defense: 6, resistance: 16 },
  skills: [raiseDead, unholyMending, darkWard],
  resist: { holy: -0.5, shadow: 0.5 },
};

// --- Act 3 Epic Monsters. Base stats are pre-tuning; the Act 3 balance pass scales them.

const deathCoil = enemySkill('deathCoil', 'Death Coil', 2.5, { side: 'enemy', select: 'highestHp', area: 'single' }, {
  kind: 'damage',
  damageType: 'magic',
  stat: 'magic',
  scaling: 1.1,
  element: 'shadow',
  drain: 0.5,
}, true);
const bonePrison = enemySkill('bonePrison', 'Bone Prison', 8, { side: 'enemy', select: 'random', area: 'single' }, { kind: 'delay', seconds: 3 }, true);
const chillOfTheGrave = enemySkill('chillOfTheGrave', 'Chill of the Grave', 10, allHeroes, { kind: 'speed', factor: 0.8, duration: 4 }, true);
const boneBreath = enemySkill('boneBreath', 'Bone Breath', 8, allHeroes, {
  kind: 'damage',
  damageType: 'magic',
  stat: 'magic',
  scaling: 1,
  element: 'shadow',
}, true);
const tailSweep = enemySkill('tailSweep', 'Tail Sweep', 4, { side: 'enemy', select: 'front', area: 'column' }, physical(1.2));
const plagueBolt = enemySkill('plagueBolt', 'Plague Bolt', 2, { side: 'enemy', select: 'random', area: 'single' }, {
  kind: 'dot',
  stat: 'magic',
  scaling: 0.4,
  duration: 6,
  element: 'poison',
}, true);
const pestilence = enemySkill('pestilence', 'Pestilence', 8, allHeroes, { kind: 'tickPoison' }, true);
const blightedSkin = enemySkill('blightedSkin', 'Blighted Skin', 2, { side: 'enemy', select: 'attackedMe', area: 'single' }, {
  kind: 'dot',
  stat: 'magic',
  scaling: 0.3,
  duration: 5,
  element: 'poison',
}, true, { trigger: { kind: 'whenHit' } });

// Its phylactery brings it back once at 50% HP.
export const LICH: CombatantDef = {
  id: 'lich',
  name: 'Lich',
  stats: { hp: 662, attack: 36, magic: 182, defense: 10, resistance: 16 },
  skills: [deathCoil, bonePrison, chillOfTheGrave],
  resist: { holy: -0.5, fire: -0.5, shadow: 0.5, ice: 0.5 },
  reassemble: 0.5,
};

export const BONE_DRAGON: CombatantDef = {
  id: 'boneDragon',
  name: 'Bone Dragon',
  stats: { hp: 1232, attack: 39, magic: 35, defense: 14, resistance: 10 },
  skills: [boneBreath, tailSweep, takeFlight],
  resist: { holy: -0.5, shadow: 0.5, poison: 0.5 },
};

// Pestilence makes every poison on every hero tick at once.
export const PLAGUE_LORD: CombatantDef = {
  id: 'plagueLord',
  name: 'Plague Lord',
  stats: { hp: 1535, attack: 12, magic: 34, defense: 10, resistance: 12 },
  skills: [plagueBolt, pestilence, blightedSkin],
  resist: { fire: -0.5, poison: 0.5 },
};

// --- Act 3 bosses (the final fights; 48x48 sprites drawn separately). Base stats are pre-tuning.

const crimsonFeast = enemySkill('crimsonFeast', 'Crimson Feast', 6, allHeroes, {
  kind: 'damage',
  damageType: 'magic',
  stat: 'magic',
  scaling: 0.8,
  element: 'shadow',
  drain: 0.5,
}, true);
const bloodLance = enemySkill('bloodLance', 'Blood Lance', 2, { side: 'enemy', select: 'highestHp', area: 'single' }, physical(1.1));
const bloodMoon = enemySkill(
  'bloodMoon',
  'Blood Moon',
  1,
  { side: 'ally', select: 'front', area: 'all' },
  [
    { kind: 'buff', stat: 'attack', amount: 5, duration: 999 },
    { kind: 'speed', factor: 1.3, duration: 999 },
  ],
  true,
  { trigger: { kind: 'belowHp', threshold: 0.5 } },
);
const bloodMoonBats = enemySkill('bloodMoonBats', 'Blood Moon', 1, self, { kind: 'spawn', enemy: 'bat', count: 4, cap: 8 }, false, {
  trigger: { kind: 'belowHp', threshold: 0.5 },
});
const scythe = enemySkill('scythe', 'Scythe', 3, { side: 'enemy', select: 'front', area: 'row' }, physical(1.1));
const markOfDeath = enemySkill('markOfDeath', 'Mark of Death', 10, { side: 'enemy', select: 'highestHp', area: 'single' }, {
  kind: 'dot',
  stat: 'magic',
  scaling: 0.8,
  duration: 6,
  element: 'shadow',
}, true);
// A hero falling counts as "enemy dies" from the Reaper's side.
const soulHarvest = enemySkill(
  'soulHarvest',
  'Soul Harvest',
  0,
  self,
  [
    { kind: 'heal', scaling: 3 },
    { kind: 'buff', stat: 'attack', amount: 5, duration: 999, stack: true },
  ],
  true,
  { trigger: { kind: 'enemyDies' } },
);
const finalHour = enemySkill('finalHour', 'Final Hour', 1, self, { kind: 'speed', factor: 1.5, duration: 999 }, false, {
  trigger: { kind: 'belowHp', threshold: 0.25 },
});
const infernalCleave = enemySkill('infernalCleave', 'Infernal Cleave', 3, { side: 'enemy', select: 'front', area: 'column' }, {
  kind: 'damage',
  damageType: 'physical',
  stat: 'attack',
  scaling: 1.2,
  element: 'fire',
});
const rainOfFire = enemySkill('rainOfFire', 'Rain of Fire', 9, allHeroes, { kind: 'dot', stat: 'magic', scaling: 0.4, duration: 5, element: 'fire' }, true);
const hellgate = enemySkill('hellgate', 'Hellgate', 15, self, { kind: 'spawn', enemy: 'nightmare', count: 1, cap: 3 }, true);

// Below half HP, Blood Moon empowers every enemy and calls 4 Bats.
export const BLOOD_COUNTESS: CombatantDef = {
  id: 'bloodCountess',
  name: 'Blood Countess',
  stats: { hp: 2232, attack: 20, magic: 20, defense: 12, resistance: 16 },
  skills: [crimsonFeast, bloodLance, mistForm, bloodMoon, bloodMoonBats],
  resist: { holy: -0.5, fire: -0.5, shadow: 0.5 },
  fury: BOSS_FURY,
};

// Grows with every hero it reaps; hastes at 25% HP.
export const REAPER: CombatantDef = {
  id: 'reaper',
  name: 'The Reaper',
  stats: { hp: 3013, attack: 20, magic: 17, defense: 14, resistance: 14 },
  skills: [scythe, markOfDeath, soulHarvest, finalHour],
  resist: { holy: -0.5, shadow: 0.5, poison: 0.5, ice: 0.5 },
  fury: BOSS_FURY,
};

// Opens Hellgates for Nightmares; the first time it dies, its pact brings it back at 40% HP.
export const DEMON_LORD: CombatantDef = {
  id: 'demonLord',
  name: 'Demon Lord',
  stats: { hp: 1585, attack: 16, magic: 12, defense: 16, resistance: 12 },
  skills: [infernalCleave, rainOfFire, hellgate],
  resist: { holy: -0.5, ice: -0.5, fire: 0.5 },
  reassemble: 0.4,
  fury: BOSS_FURY,
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
  FROST_WOLF,
  HARPY,
  BANDIT,
  STONE_GOLEM,
  GNOLL,
  WISP,
  MINOTAUR,
  MEDUSA,
  WYVERN,
  FROST_GIANT,
  CHIMERA,
  HYDRA,
  BANDIT_KING,
  ICE_QUEEN,
  ELDER_WYRM,
  VAMPIRE,
  DEATH_KNIGHT,
  SHADE,
  BONE_GOLEM,
  BANSHEE,
  GARGOYLE,
  ABOMINATION,
  NIGHTMARE,
  DARK_PRIEST,
  LICH,
  BONE_DRAGON,
  PLAGUE_LORD,
  BLOOD_COUNTESS,
  REAPER,
  DEMON_LORD,
];
export const ENEMIES_BY_ID: Record<string, CombatantDef> = Object.fromEntries(ENEMIES.map((e) => [e.id, e]));

// Positions fill column by column: 0-2 front, 3-5 middle, 6-8 back.
export const TEST_ENCOUNTER: CombatantDef[] = [SLIME, SLIME, SLIME, BAT, ORC, BAT, ARCHER, SHAMAN, ARCHER];

// Every map fight until Phase 6 content: one of each enemy, melee in front, casters behind.
export const MAP_ENCOUNTER: CombatantDef[] = [SLIME, ORC, BAT, ARCHER, SHAMAN];

// Hand-written fights per act. `enemies` lists enemy ids by grid position: 0–2 the front column (top to
// bottom), 3–5 the middle, 6–8 the back; null leaves a cell empty.
export interface EncounterDef {
  id: string;
  name: string;
  enemies: (string | null)[];
}

export interface ActEncounters {
  // Battle rooms: one group of 4 for each third of the act (rooms 1–5, 6–10, 11–15).
  battles: EncounterDef[][];
  // Epic Monster rooms: 3 per act.
  epics: EncounterDef[];
  // Bosses: 3 per act, one picked per run.
  bosses: EncounterDef[];
}

export const ACTS: ActEncounters[] = [
  {
    battles: [
      [
        { id: 'slimePuddle', name: 'SLIME PUDDLE', enemies: ['slime', 'slime', 'slime'] },
        { id: 'ratPack', name: 'RAT PACK', enemies: ['rat', 'rat', null, null, 'rat', 'rat'] },
        { id: 'boneSentries', name: 'BONE SENTRIES', enemies: [null, 'slime', null, null, null, null, 'archer', null, 'archer'] },
        { id: 'sporePatch', name: 'SPORE PATCH', enemies: ['mushroom', null, 'mushroom', 'bat', null, 'bat'] },
      ],
      [
        { id: 'verminHorde', name: 'VERMIN HORDE', enemies: ['slime', 'slime', 'slime', 'rat', null, 'rat'] },
        { id: 'goblinGang', name: 'GOBLIN GANG', enemies: ['goblin', 'goblin', 'goblin', null, null, null, 'archer', null, 'archer'] },
        { id: 'hauntedWebs', name: 'HAUNTED WEBS', enemies: ['spider', null, 'spider', 'ghost', null, 'ghost'] },
        { id: 'goblinDen', name: 'GOBLIN DEN', enemies: ['goblin', null, 'goblin', null, 'spider', null, null, 'ghost'] },
      ],
      [
        { id: 'goblinWarband', name: 'GOBLIN WARBAND', enemies: ['goblin', 'goblin', 'goblin', null, 'shaman', null, 'ghost', 'archer', 'ghost'] },
        { id: 'graveWatch', name: 'GRAVE WATCH', enemies: ['skeletonKnight', null, 'skeletonKnight', null, null, null, 'archer', 'archer', 'archer'] },
        { id: 'darkRitual', name: 'DARK RITUAL', enemies: ['ghoul', null, 'ghoul', null, 'skeletonKnight', null, 'cultist', null, 'cultist'] },
        { id: 'feedingPit', name: 'FEEDING PIT', enemies: ['ghoul', 'ghoul', 'ghoul', null, 'cultist'] },
      ],
    ],
    epics: [
      { id: 'ogreBrute', name: 'OGRE BRUTE', enemies: ['goblin', null, 'goblin', null, 'ogre'] },
      { id: 'spiderQueen', name: 'SPIDER QUEEN', enemies: ['spider', null, 'spider', null, 'spiderQueen'] },
      { id: 'boneMage', name: 'BONE MAGE', enemies: [null, 'skeletonKnight', null, null, 'boneMage', null, 'archer', null, 'archer'] },
    ],
    bosses: [
      { id: 'goblinKing', name: 'GOBLIN KING', enemies: ['goblin', null, 'goblin', null, 'goblinKing'] },
      { id: 'slimeKing', name: 'SLIME KING', enemies: [null, null, null, null, 'slimeKing'] },
      { id: 'troll', name: 'TROLL', enemies: [null, null, null, null, 'troll'] },
    ],
  },
  {
    battles: [
      [
        { id: 'graveyardShift', name: 'GRAVEYARD SHIFT', enemies: ['skeletonKnight', null, 'skeletonKnight', null, 'ghoul', null, 'archer', null, 'archer'] },
        { id: 'orcHunters', name: 'ORC HUNTERS', enemies: ['orc', null, 'orc', 'frostWolf', null, 'frostWolf'] },
        { id: 'wolfPack', name: 'WOLF PACK', enemies: ['frostWolf', 'frostWolf', 'frostWolf', null, 'frostWolf', null, null, 'harpy', null] },
        { id: 'highwaymen', name: 'HIGHWAYMEN', enemies: ['bandit', null, 'bandit', null, 'bandit', null, 'harpy', null, 'harpy'] },
      ],
      [
        { id: 'banditCamp', name: 'BANDIT CAMP', enemies: ['bandit', 'bandit', 'bandit', 'orc', null, 'orc', 'archer', null, 'archer'] },
        { id: 'gnollRaiders', name: 'GNOLL RAIDERS', enemies: ['gnoll', 'gnoll', 'gnoll', 'frostWolf', null, 'frostWolf'] },
        { id: 'quarry', name: 'QUARRY', enemies: ['stoneGolem', null, 'stoneGolem', null, null, null, 'wisp', null, 'wisp'] },
        { id: 'hauntedBog', name: 'HAUNTED BOG', enemies: [null, 'stoneGolem', null, 'gnoll', null, 'gnoll', 'wisp', null, 'wisp'] },
      ],
      [
        { id: 'gnollWarband', name: 'GNOLL WARBAND', enemies: ['bandit', null, 'bandit', 'gnoll', 'gnoll', 'gnoll', 'wisp', null, 'wisp'] },
        { id: 'labyrinth', name: 'LABYRINTH', enemies: ['minotaur', null, 'minotaur', null, null, null, 'harpy', null, 'harpy'] },
        { id: 'gorgonsGarden', name: "GORGON'S GARDEN", enemies: [null, 'minotaur', null, null, 'medusa', null, 'wyvern', null, 'wyvern'] },
        { id: 'wyvernRoost', name: 'WYVERN ROOST', enemies: ['wyvern', null, 'wyvern', null, 'wyvern', null, null, 'medusa', null] },
      ],
    ],
    epics: [
      { id: 'frostGiant', name: 'FROST GIANT', enemies: ['frostWolf', null, 'frostWolf', null, 'frostGiant'] },
      { id: 'chimera', name: 'CHIMERA', enemies: [null, null, null, null, 'chimera', null, 'harpy', null, 'harpy'] },
      { id: 'hydra', name: 'HYDRA', enemies: [null, null, null, null, 'hydra', null, null, 'medusa', null] },
    ],
    bosses: [
      { id: 'banditKing', name: 'BANDIT KING', enemies: ['bandit', null, 'bandit', null, 'banditKing'] },
      { id: 'iceQueen', name: 'ICE QUEEN', enemies: [null, null, null, null, 'iceQueen'] },
      { id: 'elderWyrm', name: 'ELDER WYRM', enemies: [null, null, null, null, 'elderWyrm'] },
    ],
  },
  {
    battles: [
      [
        { id: 'oldGrudges', name: 'OLD GRUDGES', enemies: ['gnoll', 'minotaur', 'gnoll', null, null, null, 'wisp', 'medusa', 'wisp'] },
        { id: 'theNest', name: 'THE NEST', enemies: ['bat', 'bat', 'bat', 'vampire', null, 'vampire', 'bat', 'bat', 'bat'] },
        { id: 'hauntedKeep', name: 'HAUNTED KEEP', enemies: ['deathKnight', null, 'deathKnight', null, null, null, 'shade', null, 'shade'] },
        { id: 'bloodCourt', name: 'BLOOD COURT', enemies: [null, 'deathKnight', null, 'vampire', null, 'vampire', null, 'shade', null] },
      ],
      [
        { id: 'nightWatch', name: 'NIGHT WATCH', enemies: ['deathKnight', null, 'deathKnight', null, 'shade', null, 'shade', null, 'shade'] },
        { id: 'bonePit', name: 'BONE PIT', enemies: ['boneGolem', null, 'boneGolem', null, null, null, 'shade', null, 'shade'] },
        { id: 'cathedralRuins', name: 'CATHEDRAL RUINS', enemies: [null, null, null, 'gargoyle', 'gargoyle', 'gargoyle', null, 'banshee', null] },
        { id: 'wailingCrypt', name: 'WAILING CRYPT', enemies: [null, 'boneGolem', null, 'gargoyle', null, 'gargoyle', 'banshee', null, 'banshee'] },
      ],
      [
        { id: 'legionOfTheDead', name: 'LEGION OF THE DEAD', enemies: ['boneGolem', 'deathKnight', 'boneGolem', null, null, null, 'banshee', null, 'banshee'] },
        { id: 'theFeast', name: 'THE FEAST', enemies: ['abomination', null, 'abomination', null, null, null, null, 'vampire', null] },
        { id: 'darkMass', name: 'DARK MASS', enemies: [null, 'abomination', null, null, 'nightmare', null, 'darkPriest', null, 'darkPriest'] },
        { id: 'nightmareStampede', name: 'NIGHTMARE STAMPEDE', enemies: [null, null, null, 'nightmare', 'nightmare', 'nightmare', null, 'darkPriest', null] },
      ],
    ],
    epics: [
      { id: 'lich', name: 'LICH', enemies: ['skeletonKnight', null, 'skeletonKnight', null, 'lich'] },
      { id: 'boneDragon', name: 'BONE DRAGON', enemies: [null, null, null, 'gargoyle', 'boneDragon', 'gargoyle'] },
      { id: 'plagueLord', name: 'PLAGUE LORD', enemies: [null, 'abomination', null, null, 'plagueLord'] },
    ],
    bosses: [
      { id: 'bloodCountess', name: 'BLOOD COUNTESS', enemies: [null, null, null, 'vampire', 'bloodCountess', 'vampire'] },
      { id: 'reaper', name: 'THE REAPER', enemies: [null, null, null, null, 'reaper'] },
      { id: 'demonLord', name: 'DEMON LORD', enemies: ['nightmare', null, 'nightmare', null, 'demonLord'] },
    ],
  },
];

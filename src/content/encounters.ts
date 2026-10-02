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
        { id: 'verminHorde', name: 'VERMIN HORDE', enemies: ['slime', 'slime', 'slime', 'rat', 'rat', 'rat', 'mushroom', null, 'mushroom'] },
        { id: 'goblinGang', name: 'GOBLIN GANG', enemies: ['goblin', 'goblin', 'goblin', null, null, null, 'archer', null, 'archer'] },
        { id: 'hauntedWebs', name: 'HAUNTED WEBS', enemies: ['spider', null, 'spider', 'ghost', null, 'ghost'] },
        { id: 'goblinDen', name: 'GOBLIN DEN', enemies: ['goblin', null, 'goblin', null, 'spider', null, null, 'ghost'] },
      ],
      [],
    ],
    epics: [],
    bosses: [],
  },
  { battles: [[], [], []], epics: [], bosses: [] },
  { battles: [[], [], []], epics: [], bosses: [] },
];

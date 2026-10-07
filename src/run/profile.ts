import { CLASSES } from '../content/classes';
import { clearSlot, loadSlot, saveSlot } from '../engine/save';

export interface Tally {
  runs: number;
  wins: number;
}

// A save slot's player profile: class unlocks and lifetime stats. It outlives the slot's runs;
// only deleting the slot clears it. Runs count when they end.
export interface Profile {
  unlocked: string[];
  runs: number;
  wins: number;
  // Furthest point reached: act (0-based) and room (1-based).
  best: { level: number; room: number } | null;
  bosses: number;
  epics: number;
  events: number;
  // Acts (0-based) whose boss has been beaten.
  bossLevels: number[];
  byClass: Record<string, Tally>;
  // Keyed by the party's class ids, sorted and joined with '+'.
  byParty: Record<string, Tally>;
  // Unlocked since the run-end screen last showed them.
  newUnlocks: string[];
}

export interface Unlock {
  classId: string;
  condition: string;
  met: (p: Profile, gold: number) => boolean;
}

export const BARD_GOLD = 500;
export const MONK_EPICS = 10;
export const DRUID_EVENTS = 15;

export const UNLOCKS: Unlock[] = [
  { classId: 'paladin', condition: 'BEAT THE ACT 1 BOSS', met: (p) => p.bossLevels.includes(0) },
  { classId: 'necromancer', condition: 'BEAT THE ACT 2 BOSS', met: (p) => p.bossLevels.includes(1) },
  { classId: 'warlock', condition: 'WIN A RUN', met: (p) => p.wins > 0 },
  { classId: 'monk', condition: `SLAY ${MONK_EPICS} EPIC MONSTERS`, met: (p) => p.epics >= MONK_EPICS },
  { classId: 'bard', condition: `HOLD ${BARD_GOLD} GOLD AT ONCE`, met: (_p, gold) => gold >= BARD_GOLD },
  { classId: 'druid', condition: `COMPLETE ${DRUID_EVENTS} EVENTS`, met: (p) => p.events >= DRUID_EVENTS },
];

export function newProfile(): Profile {
  return {
    unlocked: CLASSES.filter((c) => c.starting).map((c) => c.id),
    runs: 0,
    wins: 0,
    best: null,
    bosses: 0,
    epics: 0,
    events: 0,
    bossLevels: [],
    byClass: {},
    byParty: {},
    newUnlocks: [],
  };
}

export function loadProfile(slot: number): Profile {
  const saved = loadSlot<Profile>(slot, 'profile');
  return saved ? { ...newProfile(), ...saved.data } : newProfile();
}

export function saveProfile(slot: number, profile: Profile): void {
  saveSlot(slot, profile, 'profile');
}

export function hasProfile(slot: number): boolean {
  return loadSlot<Profile>(slot, 'profile') !== null;
}

export function deleteProfile(slot: number): void {
  clearSlot(slot, 'profile');
  clearSlot(slot, 'save');
}

export const partyKey = (classIds: string[]) => [...classIds].sort().join('+');

// Unlocks every class whose condition now holds; returns the newly unlocked ids.
export function checkUnlocks(p: Profile, gold = 0): string[] {
  const fresh = UNLOCKS.filter((u) => !p.unlocked.includes(u.classId) && u.met(p, gold)).map((u) => u.classId);
  p.unlocked.push(...fresh);
  p.newUnlocks.push(...fresh);
  return fresh;
}

// A won fight or opened room. `level` is the act the room was in.
export function noteRoom(p: Profile, type: 'battle' | 'epic' | 'boss' | 'event' | 'store' | 'treasure', level: number): void {
  if (type === 'epic') p.epics += 1;
  if (type === 'event') p.events += 1;
  if (type === 'boss') {
    p.bosses += 1;
    if (!p.bossLevels.includes(level)) p.bossLevels.push(level);
  }
  checkUnlocks(p);
}

export function noteRunEnd(p: Profile, won: boolean, classIds: string[], level: number, room: number): void {
  const tally = (book: Record<string, Tally>, key: string) => {
    const t = (book[key] ??= { runs: 0, wins: 0 });
    t.runs += 1;
    if (won) t.wins += 1;
  };
  p.runs += 1;
  if (won) p.wins += 1;
  for (const id of classIds) tally(p.byClass, id);
  tally(p.byParty, partyKey(classIds));
  if (!p.best || level > p.best.level || (level === p.best.level && room > p.best.room)) p.best = { level, room };
  checkUnlocks(p);
}

export function isUnlocked(p: Profile, classId: string): boolean {
  return p.unlocked.includes(classId);
}

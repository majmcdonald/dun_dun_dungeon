import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CLASSES_BY_ID } from '../content/classes';
import { createState } from '../game/state';
import { checkUnlocks, deleteProfile, loadProfile, newProfile, noteRoom, noteRunEnd, partyKey, saveProfile } from './profile';
import { saveRun, startRun } from './run';

// A minimal in-memory localStorage for the node test environment.
beforeEach(() => {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
});
afterEach(() => {
  delete (globalThis as { localStorage?: unknown }).localStorage;
});

describe('profiles', () => {
  it('start with the six starting classes', () => {
    expect(newProfile().unlocked.sort()).toEqual(['barbarian', 'cleric', 'knight', 'mage', 'ranger', 'rogue']);
  });

  it('count epics, events, and bosses, and unlock the Paladin for the act 1 boss', () => {
    const p = newProfile();
    noteRoom(p, 'epic', 0);
    noteRoom(p, 'event', 0);
    noteRoom(p, 'battle', 0);
    expect([p.epics, p.events, p.bosses]).toEqual([1, 1, 0]);
    noteRoom(p, 'boss', 0);
    expect(p.bossLevels).toEqual([0]);
    expect(p.unlocked).toContain('paladin');
    expect(p.newUnlocks).toEqual(['paladin']);
  });

  it('unlock the Monk at 10 Epic Monsters and the Druid at 15 events, across runs', () => {
    const p = newProfile();
    for (let i = 0; i < 9; i++) noteRoom(p, 'epic', 0);
    expect(p.unlocked).not.toContain('monk');
    noteRoom(p, 'epic', 1);
    expect(p.unlocked).toContain('monk');
    for (let i = 0; i < 15; i++) noteRoom(p, 'event', 0);
    expect(p.unlocked).toContain('druid');
  });

  it('unlock the Bard when the party holds 500 gold', () => {
    const p = newProfile();
    expect(checkUnlocks(p, 499)).toEqual([]);
    expect(checkUnlocks(p, 500)).toEqual(['bard']);
    expect(checkUnlocks(p, 900)).toEqual([]);
  });

  it('tally finished runs overall, by class, and by party, keep the best, and unlock the Warlock on a win', () => {
    const p = newProfile();
    noteRunEnd(p, false, ['mage', 'knight', 'cleric'], 0, 7);
    noteRunEnd(p, true, ['knight', 'cleric', 'mage'], 0, 15);
    noteRunEnd(p, false, ['knight', 'rogue', 'ranger'], 0, 3);
    expect([p.runs, p.wins]).toEqual([3, 1]);
    expect(p.byClass.knight).toEqual({ runs: 3, wins: 1 });
    expect(p.byClass.mage).toEqual({ runs: 2, wins: 1 });
    expect(p.byParty[partyKey(['knight', 'mage', 'cleric'])]).toEqual({ runs: 2, wins: 1 });
    expect(p.best).toEqual({ level: 0, room: 15 });
    expect(p.unlocked).toContain('warlock');
  });

  it('save per slot, survive the run being freed, and delete with the slot', () => {
    const p = newProfile();
    p.runs = 4;
    saveProfile(1, p);
    expect(loadProfile(1).runs).toBe(4);
    expect(loadProfile(0).runs).toBe(0);
    deleteProfile(1);
    expect(loadProfile(1).runs).toBe(0);
  });

  it('save with the run, unlocking by the gold on hand', () => {
    const state = createState();
    startRun(state, 2, ['knight', 'mage', 'cleric'].map((id) => CLASSES_BY_ID[id]), 5);
    state.profile = newProfile();
    state.run!.gold = 520;
    saveRun(state);
    expect(loadProfile(2).unlocked).toContain('bard');
  });
});

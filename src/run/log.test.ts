import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CLASSES_BY_ID } from '../content/classes';
import { createState } from '../game/state';
import { finishedLogs, keepFinishedLog, KEPT_LOGS, logEvent } from './log';
import { beginNode, startRun } from './run';

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

function started() {
  const state = createState();
  startRun(state, 1, ['knight', 'mage', 'cleric'].map((id) => CLASSES_BY_ID[id]), 9);
  return state;
}

describe('run log', () => {
  it('starts with the party and tags entries with act and room', () => {
    const state = started();
    const run = state.run!;
    expect(run.log[0]).toMatchObject({ kind: 'start', act: 1, seed: 9, slot: 1 });
    expect((run.log[0].party as { class: string }[]).map((m) => m.class)).toEqual(['knight', 'mage', 'cleric']);
    beginNode(run, { id: '4-2', floor: 4, column: 2, type: 'battle', next: [] });
    logEvent(run, 'room', { type: 'battle' });
    expect(run.log[1]).toEqual({ kind: 'room', act: 1, room: 5, type: 'battle' });
  });

  it(`keeps the last ${KEPT_LOGS} finished runs, newest first`, () => {
    for (let i = 0; i < KEPT_LOGS + 2; i++) {
      const state = started();
      logEvent(state.run!, 'marker', { i });
      keepFinishedLog(state, i % 2 === 0);
    }
    const logs = finishedLogs();
    expect(logs).toHaveLength(KEPT_LOGS);
    expect(logs[0].entries.at(-1)).toMatchObject({ kind: 'marker', i: KEPT_LOGS + 1 });
    expect(logs[0].won).toBe(false);
  });
});

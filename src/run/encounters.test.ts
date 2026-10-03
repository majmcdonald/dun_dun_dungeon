import { describe, expect, it } from 'vitest';
import { CLASSES_BY_ID } from '../content/classes';
import { ACTS, type ActEncounters, type EncounterDef } from '../content/encounters';
import { ENEMIES_BY_ID, MAP_ENCOUNTER } from '../content/enemies';
import { createState } from '../game/state';
import { currentEncounter, groupOf, pickEncounter } from './encounters';
import type { MapNode, NodeType } from './map';
import { beginNode, startRun } from './run';

const fight = (id: string): EncounterDef => ({ id, name: id, enemies: ['slime'] });
const ACT: ActEncounters = {
  battles: [['a1', 'a2', 'a3', 'a4'].map(fight), ['b1', 'b2', 'b3', 'b4'].map(fight), ['c1', 'c2', 'c3', 'c4'].map(fight)],
  epics: ['e1', 'e2', 'e3'].map(fight),
  bosses: ['x1', 'x2', 'x3'].map(fight),
};
const room = (floor: number, column: number, type: NodeType = 'battle'): MapNode => ({ id: `${floor}-${column}`, floor, column, type, next: [] });

function started() {
  const state = createState();
  startRun(state, 0, ['knight', 'mage', 'cleric'].map((id) => CLASSES_BY_ID[id]), 11);
  return state;
}

function enter(state: ReturnType<typeof started>, node: MapNode, acts = [ACT]) {
  beginNode(state.run!, node);
  return pickEncounter(state, node, acts)!.id;
}

describe('encounters', () => {
  it('group rooms into thirds of the act', () => {
    expect([0, 4, 5, 9, 10, 14].map((f) => groupOf(room(f, 0)))).toEqual([0, 0, 1, 1, 2, 2]);
  });

  it("pick from the room's third, the same one on a reload", () => {
    const state = started();
    const id = enter(state, room(6, 2));
    expect(id).toMatch(/^b/);
    expect(enter(state, room(6, 2))).toBe(id);
  });

  it('never repeat a battle until the group runs out, then reuse the least recent', () => {
    const state = started();
    const ids = [0, 1, 2, 3].map((f) => enter(state, room(f, 3)));
    expect(new Set(ids).size).toBe(4);
    expect(enter(state, room(4, 3))).toBe(ids[0]);
  });

  it('cycle Epic Monsters: no repeats until all 3 are met, then all come back', () => {
    const state = started();
    const ids = [5, 7, 9].map((f) => enter(state, room(f, 1, 'epic')));
    expect(new Set(ids).size).toBe(3);
    const fourth = enter(state, room(11, 1, 'epic'));
    expect(ids).toContain(fourth);
    const fifth = enter(state, room(12, 1, 'epic'));
    expect(fifth).not.toBe(fourth);
  });

  it("pick one of the act's bosses", () => {
    const state = started();
    expect(['x1', 'x2', 'x3']).toContain(enter(state, room(15, 3, 'boss')));
  });

  it('fall back to the old fight where an act has no content yet', () => {
    const state = started();
    state.run!.level = 1;
    const node = room(15, 3, 'boss');
    beginNode(state.run!, node);
    expect(pickEncounter(state, node)).toBeNull();
    expect(currentEncounter(state)).toEqual(MAP_ENCOUNTER);
  });

  it('only use real enemies, in the 3x3 grid', () => {
    for (const act of ACTS) {
      for (const e of [...act.battles.flat(), ...act.epics, ...act.bosses]) {
        expect(e.enemies.length, e.id).toBeLessThanOrEqual(9);
        for (const id of e.enemies) if (id) expect(ENEMIES_BY_ID[id], `${e.id}: ${id}`).toBeDefined();
      }
    }
  });
});

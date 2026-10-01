import { describe, expect, it } from 'vitest';
import { CLASSES_BY_ID } from '../content/classes';
import { ITEM_LIBRARY, ITEMS_BY_ID } from '../content/items';
import { SKILL_LIBRARY, SKILLS_BY_ID } from '../content/skills';
import { seededRng } from '../engine/random';
import { equipItemBlock, skillAccessBlock } from '../game/loadout';
import { createState, recruit } from '../game/state';
import { COLUMNS, FIRST_EPIC_FLOOR, FLOORS, generateMap, reachable, TREASURE_FLOOR, type RunMap } from './map';
import { rollReward } from './rewards';
import { clearNode, fromSave, LEVELS, nextNodes, pickHolder, setRewardPicks, startRun, toSave, type LastReward } from './run';

const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1);

function edgesOf(map: RunMap): [number, number, number][] {
  return map.floors.flat().flatMap((n) =>
    n.floor === FLOORS - 1 ? [] : n.next.map((id): [number, number, number] => [n.floor, n.column, Number(id.split('-')[1])]),
  );
}

describe('map generator', () => {
  it('is deterministic per seed', () => {
    expect(generateMap(seededRng(7))).toEqual(generateMap(seededRng(7)));
  });

  it('builds 15 floors inside the grid, with a real choice on floor 1', () => {
    for (const seed of SEEDS) {
      const map = generateMap(seededRng(seed));
      expect(map.floors).toHaveLength(FLOORS);
      expect(map.floors[0].length).toBeGreaterThanOrEqual(2);
      for (const node of map.floors.flat()) {
        expect(node.column).toBeGreaterThanOrEqual(0);
        expect(node.column).toBeLessThan(COLUMNS);
      }
    }
  });

  it('connects every node up to the boss, one floor at a time, to adjacent columns only', () => {
    for (const seed of SEEDS) {
      const map = generateMap(seededRng(seed));
      for (const node of map.floors.flat()) {
        expect(node.next.length).toBeGreaterThan(0);
        if (node.floor === FLOORS - 1) expect(node.next).toEqual(['boss']);
      }
      for (const [, from, to] of edgesOf(map)) expect(Math.abs(from - to)).toBeLessThanOrEqual(1);
      // Every node above floor 1 has a way in.
      const entered = new Set(map.floors.flat().flatMap((n) => n.next));
      for (const node of map.floors.slice(1).flat()) expect(entered.has(node.id)).toBe(true);
    }
  });

  it('never crosses two edges', () => {
    for (const seed of SEEDS) {
      const edges = new Set(edgesOf(generateMap(seededRng(seed))).map(([f, a, b]) => `${f}:${a}>${b}`));
      for (const key of edges) {
        const [f, rest] = key.split(':');
        const [a, b] = rest.split('>').map(Number);
        if (a !== b) expect(edges.has(`${f}:${b}>${a}`)).toBe(false);
      }
    }
  });

  it('opens on battles, puts the only treasure on room 7, and keeps Epic Monsters out of the early rooms', () => {
    for (const seed of SEEDS) {
      const map = generateMap(seededRng(seed));
      expect(map.floors[0].every((n) => n.type === 'battle')).toBe(true);
      expect(map.floors[TREASURE_FLOOR].every((n) => n.type === 'treasure')).toBe(true);
      expect(map.floors.flat().filter((n) => n.type === 'treasure').every((n) => n.floor === TREASURE_FLOOR)).toBe(true);
      for (const floor of map.floors.slice(0, FIRST_EPIC_FLOOR)) expect(floor.some((n) => n.type === 'epic')).toBe(false);
      expect(map.boss.type).toBe('boss');
    }
  });

  it('rolls roughly the planned node mix', () => {
    const nodes = SEEDS.flatMap((seed) => generateMap(seededRng(seed)).floors.flat());
    const share = (type: string) => nodes.filter((n) => n.type === type).length / nodes.length;
    expect(share('battle')).toBeGreaterThan(0.4);
    expect(share('battle')).toBeLessThan(0.65);
    for (const type of ['epic', 'event', 'store', 'treasure']) expect(share(type)).toBeGreaterThan(0.04);
    expect(share('event')).toBeGreaterThan(share('store'));
  });
});

describe('run progress', () => {
  const classes = ['knight', 'mage', 'cleric'].map((id) => CLASSES_BY_ID[id]);

  it('starts with recruits, no inventory, no gold, and any floor-1 node open', () => {
    const state = createState();
    startRun(state, 0, classes, 42);
    expect(state.party.map((m) => m.def.id)).toEqual(['knight', 'mage', 'cleric']);
    expect(state.inventory).toEqual({ skills: [], items: [] });
    expect(state.run!.gold).toBe(0);
    expect(nextNodes(state.run!)).toEqual(state.run!.map.floors[0]);
  });

  it('only allows connected nodes and climbs through all three levels to a win', () => {
    const state = createState();
    startRun(state, 0, classes, 42);
    const run = state.run!;
    expect(() => clearNode(run, run.map.floors[1][0].id)).toThrow();
    for (let level = 0; level < LEVELS; level++) {
      expect(run.level).toBe(level);
      while (run.position !== run.map.boss.id && run.result === null) {
        const next = nextNodes(run)[0];
        clearNode(run, next.id);
        if (next.type === 'boss') break;
      }
    }
    expect(run.result).toBe('won');
  });

  it('gives each level its own map', () => {
    const state = createState();
    startRun(state, 0, classes, 42);
    const first = state.run!.map;
    let run = state.run!;
    while (run.level === 0) clearNode(run, nextNodes(run)[0].id);
    run = state.run!;
    expect(run.map).not.toEqual(first);
    expect(run.position).toBeNull();
  });

  it('loads saves made before path tracking', () => {
    const state = createState();
    startRun(state, 0, classes, 42);
    const saved = JSON.parse(JSON.stringify(toSave(state)));
    delete saved.run.path;
    delete saved.run.pending;
    const loaded = createState();
    fromSave(saved, loaded);
    expect(() => clearNode(loaded.run!, nextNodes(loaded.run!)[0].id)).not.toThrow();
    expect(loaded.run!.path).toHaveLength(1);
  });

  it('round-trips through a save', () => {
    const state = createState();
    startRun(state, 2, classes, 42);
    state.party[0].equipment.weapon = ITEMS_BY_ID.longsword;
    state.party[1].skills.push(SKILLS_BY_ID.polymorph);
    state.inventory.items.push(ITEMS_BY_ID.scaleMail);
    clearNode(state.run!, nextNodes(state.run!)[0].id);

    const loaded = createState();
    fromSave(JSON.parse(JSON.stringify(toSave(state))), loaded);
    expect(loaded.run).toEqual(state.run);
    expect(loaded.party).toEqual(state.party);
    expect(loaded.inventory).toEqual(state.inventory);
  });
});

describe('reward picks', () => {
  const classes = ['knight', 'mage', 'cleric'].map((id) => CLASSES_BY_ID[id]);
  const offer = (): LastReward => ({ node: '0-0', type: 'battle', gold: 20, skills: ['bodyguard', 'polymorph', 'heal'], items: ['longsword', 'leatherCap'], skill: null, item: null });

  function setup() {
    const state = createState();
    startRun(state, 0, classes, 1);
    state.run!.lastReward = offer();
    return state;
  }

  it('adds the picks to the inventory, and swapping takes the old ones back out', () => {
    const state = setup();
    setRewardPicks(state, 'bodyguard', 'longsword');
    expect(state.inventory.skills.map((s) => s.id)).toEqual(['bodyguard']);
    expect(state.inventory.items.map((i) => i.id)).toEqual(['longsword']);
    setRewardPicks(state, 'heal', null);
    expect(state.inventory.skills.map((s) => s.id)).toEqual(['heal']);
    expect(state.inventory.items).toEqual([]);
    expect(state.run!.lastReward).toMatchObject({ skill: 'heal', item: null });
  });

  it('leaves equipped picks alone when the picks are unchanged', () => {
    const state = setup();
    setRewardPicks(state, null, 'longsword');
    state.inventory.items = [];
    state.party[0] = { ...state.party[0], equipment: { weapon: ITEMS_BY_ID.longsword } };
    expect(pickHolder(state, 'item', 'longsword')).toBe(state.party[0]);
    setRewardPicks(state, null, 'longsword');
    expect(state.party[0].equipment.weapon).toBe(ITEMS_BY_ID.longsword);
    expect(state.inventory.items).toEqual([]);
  });

  it('takes back picks a character already equipped, along with skills that needed them', () => {
    const state = setup();
    setRewardPicks(state, 'bodyguard', 'longsword');
    const knight = state.party[0];
    state.party[0] = { ...knight, skills: [...knight.skills, SKILLS_BY_ID.bodyguard, { ...SKILLS_BY_ID.slash, id: 'needsGuard', prerequisite: 'bodyguard' }], equipment: { weapon: ITEMS_BY_ID.longsword } };
    state.inventory = { skills: [], items: [] };
    setRewardPicks(state, null, null);
    expect(state.party[0].skills.map((s) => s.id)).toEqual(knight.skills.map((s) => s.id));
    expect(state.party[0].equipment.weapon).toBeUndefined();
    expect(state.inventory.skills.map((s) => s.id)).toEqual(['needsGuard']);
  });
});

describe('rewards', () => {
  const party = ['knight', 'mage', 'cleric'].map((id) => recruit(CLASSES_BY_ID[id]));

  it('offers 3 distinct skills someone can learn and 2 distinct items someone can wear', () => {
    for (const seed of SEEDS) {
      const reward = rollReward('battle', party, SKILL_LIBRARY, ITEM_LIBRARY, seededRng(seed));
      expect(reward.skills).toHaveLength(3);
      expect(new Set(reward.skills).size).toBe(3);
      expect(reward.items).toHaveLength(2);
      expect(new Set(reward.items).size).toBe(2);
      for (const s of reward.skills) expect(party.some((m) => !skillAccessBlock(m, s))).toBe(true);
      for (const i of reward.items) expect(party.some((m) => !equipItemBlock(m, i))).toBe(true);
    }
  });

  it('pays gold by node type, plus any bonus', () => {
    for (const seed of SEEDS) {
      const gold = (type: Parameters<typeof rollReward>[0], bonus = 0) =>
        rollReward(type, party, SKILL_LIBRARY, ITEM_LIBRARY, seededRng(seed), bonus).gold;
      expect(gold('battle')).toBeGreaterThanOrEqual(15);
      expect(gold('battle')).toBeLessThanOrEqual(25);
      expect(gold('epic')).toBeGreaterThanOrEqual(40);
      expect(gold('epic')).toBeLessThanOrEqual(60);
      expect(gold('boss')).toBe(100);
      expect(gold('boss', 12)).toBe(112);
    }
  });

  it('weights skill rarity toward common, and gear toward better rarities after Epic Monsters', () => {
    const rolls = (type: 'battle' | 'epic') => SEEDS.flatMap((seed) => rollReward(type, party, SKILL_LIBRARY, ITEM_LIBRARY, seededRng(seed)));
    const skills = rolls('battle').flatMap((r) => r.skills);
    const common = skills.filter((s) => s.rarity === 'common').length / skills.length;
    expect(common).toBeGreaterThan(0.45);
    const betterThanCommon = (type: 'battle' | 'epic') => {
      const items = rolls(type).flatMap((r) => r.items);
      return items.filter((i) => i.rarity !== 'common').length / items.length;
    };
    expect(betterThanCommon('epic')).toBeGreaterThan(betterThanCommon('battle'));
  });
});

describe('reachable', () => {
  it('opens the boss after the last floor', () => {
    const map = generateMap(seededRng(3));
    const last = map.floors[FLOORS - 1][0];
    expect(reachable(map, last.id)).toEqual([map.boss]);
  });
});

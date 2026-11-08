import { describe, expect, it } from 'vitest';
import { Battle } from '../combat/battle';
import { CLASSES_BY_ID } from '../content/classes';
import { DUNGEON_MASTER, ENEMIES_BY_ID, ORC } from '../content/enemies';
import { FINALE } from '../content/encounters';
import { createState } from '../game/state';
import { pickEncounter } from './encounters';
import { allUnlocked, newProfile, noteRoom } from './profile';
import { hasAllKeys, KEY_TYPES, pickKeyEpic } from './plus';
import { LEVELS, clearNode, fromSave, nextNodes, setRewardPicks, startRun, toSave } from './run';
import { buyKey } from './store';

const classes = ['knight', 'mage', 'cleric'].map((id) => CLASSES_BY_ID[id]);

function plusRun(seed = 42) {
  const state = createState();
  startRun(state, 0, classes, seed, true);
  return state;
}

// Clears nodes along the first open path until the act's boss is cleared.
function clearAct(run: ReturnType<typeof plusRun>['run'] & object): void {
  const level = run.level;
  const finale = run.finale;
  while (run.level === level && run.result === null && run.finale === finale) clearNode(run, nextNodes(run)[0].id);
}

describe('game++', () => {
  it('opens once every class is unlocked', () => {
    const p = newProfile();
    expect(allUnlocked(p)).toBe(false);
    p.unlocked = Object.keys(CLASSES_BY_ID);
    expect(allUnlocked(p)).toBe(true);
  });

  it('marks one Epic Monster per act until the Elite Key is won, the same on every reload', () => {
    const run = plusRun().run!;
    const epics = run.map.floors.flat().filter((n) => n.type === 'epic').map((n) => n.id);
    expect(epics).toContain(run.keyEpic!.node);
    expect(plusRun().run!.keyEpic).toEqual(run.keyEpic);
    run.keys.elite = true;
    pickKeyEpic(run);
    expect(run.keyEpic).toBeNull();
    expect(startRunPlain().run!.keyEpic).toBeNull();
  });

  it('marks a new Epic Monster in each act', () => {
    const run = plusRun().run!;
    clearAct(run);
    expect(run.level).toBe(1);
    expect(run.map.floors.flat().filter((n) => n.type === 'epic').map((n) => n.id)).toContain(run.keyEpic!.node);
  });

  it('wins at the Act 3 boss without all keys, and opens the Dungeon Master with them', () => {
    const noKeys = plusRun().run!;
    for (let i = 0; i < LEVELS; i++) clearAct(noKeys);
    expect(noKeys.result).toBe('won');

    const state = plusRun();
    const run = state.run!;
    for (const k of KEY_TYPES) run.keys[k] = true;
    expect(hasAllKeys(run.keys)).toBe(true);
    for (let i = 0; i < LEVELS; i++) clearAct(run);
    expect(run.result).toBeNull();
    expect(run.finale).toBe(true);
    expect(nextNodes(run).map((n) => n.type)).toEqual(['boss']);
    expect(pickEncounter(state, nextNodes(run)[0])).toEqual(FINALE);
    clearNode(run, nextNodes(run)[0].id);
    expect(run.result).toBe('won');
  });

  it('records beating the Dungeon Master in the profile', () => {
    const p = newProfile();
    noteRoom(p, 'boss', 2, false);
    expect(p.dungeonMaster).toBe(false);
    noteRoom(p, 'boss', 2, true);
    expect(p.dungeonMaster).toBe(true);
  });

  it('sells the Shop Key once for 150 gold', () => {
    const state = plusRun();
    state.run!.gold = 200;
    expect(buyKey(state)).toBeNull();
    expect(state.run!.gold).toBe(50);
    expect(state.run!.keys.shop).toBe(true);
    expect(buyKey(state)).toBe('ALREADY OWNED');
    expect(buyKey(startRunPlain())).toBe('NOT AVAILABLE');
    const poor = plusRun();
    expect(buyKey(poor)).toBe('NOT ENOUGH GOLD');
  });

  it('takes the Treasure Key in place of the cards, and gives it back when changed', () => {
    const state = plusRun();
    const run = state.run!;
    run.lastReward = { node: '6-0', type: 'treasure', gold: 40, skills: [], items: [], skill: null, item: null, keyOffer: true };
    setRewardPicks(state, null, null, true);
    expect(run.keys.treasure).toBe(true);
    setRewardPicks(state, null, null, false);
    expect(run.keys.treasure).toBe(false);
  });

  it('keeps keys, the marked epic, and the finale through saving', () => {
    const state = plusRun();
    state.run!.keys.shop = true;
    const loaded = createState();
    fromSave(JSON.parse(JSON.stringify(toSave(state))), loaded);
    expect(loaded.run).toMatchObject({ plus: true, keys: state.run!.keys, keyEpic: state.run!.keyEpic, finale: false });
  });

  it('boosts every enemy in the Elite Key fight', () => {
    const grown = (kind: 'hp' | 'damage' | 'defense', stat: 'hp' | 'attack' | 'defense') => {
      const battle = new Battle([], [ORC], () => 0, { enemyBoost: { kind, amount: 0.5 } });
      return battle.get('enemy-0').def.stats[stat];
    };
    expect(grown('hp', 'hp')).toBe(Math.round(ORC.stats.hp * 1.5));
    expect(grown('damage', 'attack')).toBe(Math.round(ORC.stats.attack * 1.5));
    expect(grown('defense', 'defense')).toBe(Math.round(ORC.stats.defense * 1.5));
    const fast = new Battle([], [ORC], () => 0, { enemyBoost: { kind: 'speed', amount: 0.1 } });
    expect(fast.get('enemy-0').speed[0].value).toBeCloseTo(1.1);
  });

  it('gives the Dungeon Master four boss abilities and an elite summon', () => {
    expect(ENEMIES_BY_ID.dungeonMaster).toBe(DUNGEON_MASTER);
    expect(DUNGEON_MASTER.skills.map((s) => s.id)).toEqual(['crimsonFeast', 'inferno', 'markOfDeath', 'glacialTomb', 'summonElites']);
    const summon = DUNGEON_MASTER.skills[4].effects[0];
    expect(summon.kind).toBe('chaos');
    if (summon.kind !== 'chaos') return;
    const elites = summon.options.map((o) => (o.kind === 'spawn' ? o.enemy : ''));
    expect(elites).toHaveLength(6);
    for (const id of elites) expect(ENEMIES_BY_ID[id]).toBeDefined();
  });

  it('the Dungeon Master fights and calls elites to his side', () => {
    const state = plusRun();
    const battle = new Battle(state.party, [null, null, null, null, DUNGEON_MASTER], Math.random, { bestiary: ENEMIES_BY_ID });
    for (let t = 0; t < 60 * 60 && !battle.result; t++) battle.tick(1 / 60);
    const elites = battle.combatants.filter((c) => c.side === 'enemy' && c.def.id !== 'dungeonMaster');
    expect(elites.length).toBeGreaterThan(0);
  });
});

function startRunPlain() {
  const state = createState();
  startRun(state, 0, classes, 42);
  return state;
}

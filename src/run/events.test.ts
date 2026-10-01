import { describe, expect, it } from 'vitest';
import { Battle } from '../combat/battle';
import { CLASSES_BY_ID } from '../content/classes';
import { SLIME } from '../content/enemies';
import { ITEMS_BY_ID } from '../content/items';
import { createState } from '../game/state';
import { checkChance, chooseOption, openEvent, partyStat, takeNextFight, type EventDef } from './events';
import type { MapNode } from './map';
import { beginNode, fromSave, startRun, toSave } from './run';

const node: MapNode = { id: '2-3', floor: 2, column: 3, type: 'event', next: [] };

const SHRINE: EventDef = {
  id: 'shrine',
  title: 'SHRINE',
  art: 'shrine',
  text: 'A SHRINE.',
  choices: [
    {
      label: 'PRAY',
      check: { stat: 'magic', mode: 'highest', difficulty: 18 },
      success: { text: 'BLESSED.', outcomes: [{ kind: 'blessed', bonus: { attack: 5 } }, { kind: 'gold', amount: 30 }] },
      failure: { text: 'CURSED.', outcomes: [{ kind: 'wounded' }, { kind: 'gold', amount: -500 }] },
    },
    { label: 'LOOT', success: { text: 'LOOT.', outcomes: [{ kind: 'item', rarity: 'epic' }, { kind: 'skill', rarity: 'rare' }] } },
    { label: 'FIGHT', success: { text: 'AMBUSH!', outcomes: [{ kind: 'fight', enemies: ['orc'] }] } },
  ],
};
const WELL: EventDef = { ...SHRINE, id: 'well', title: 'WELL' };

function atEvent(gold = 100) {
  const state = createState();
  startRun(state, 0, ['knight', 'mage', 'cleric'].map((id) => CLASSES_BY_ID[id]), 3);
  state.run!.gold = gold;
  beginNode(state.run!, node);
  return state;
}

describe('event checks', () => {
  it('read the best member or the whole party, gear included', () => {
    const state = atEvent();
    state.party[1] = { ...state.party[1], equipment: { weapon: ITEMS_BY_ID.oakStaff } };
    const mage = 18 + (ITEMS_BY_ID.oakStaff.stats.magic ?? 0);
    expect(partyStat(state, { stat: 'magic', mode: 'highest', difficulty: 1 })).toBe(mage);
    expect(partyStat(state, { stat: 'magic', mode: 'total', difficulty: 1 })).toBe(0 + mage + 14);
  });

  it('give 50% at the difficulty, scaling with the stat, clamped to 10–95%', () => {
    const state = atEvent();
    expect(checkChance(state, { stat: 'magic', mode: 'highest', difficulty: 18 })).toBe(0.5);
    expect(checkChance(state, { stat: 'magic', mode: 'highest', difficulty: 36 })).toBe(0.25);
    expect(checkChance(state, { stat: 'magic', mode: 'highest', difficulty: 1 })).toBe(0.95);
    expect(checkChance(state, { stat: 'magic', mode: 'highest', difficulty: 1000 })).toBe(0.1);
  });
});

describe('events', () => {
  it('pick the same event for a node every time, and a different one next', () => {
    const state = atEvent();
    const first = openEvent(state, node, [SHRINE, WELL]);
    expect(openEvent(state, node, [SHRINE, WELL])).toBe(first);
    const other = { ...node, id: '5-1', floor: 5, column: 1 };
    beginNode(state.run!, other);
    expect(openEvent(state, other, [SHRINE, WELL])).not.toBe(first);
    expect(state.run!.seenEvents).toHaveLength(2);
  });

  it('apply a passed check once, even if chosen again', () => {
    const state = atEvent();
    openEvent(state, node, [SHRINE]);
    const result = chooseOption(state, SHRINE, 0, () => 0);
    expect(result).toMatchObject({ success: true, text: 'BLESSED.', lines: ['BLESSED: +5 ATK NEXT FIGHT', '+30 GOLD'], fight: null });
    expect(state.run!.gold).toBe(130);
    expect(chooseOption(state, SHRINE, 1)).toBe(result);
    expect(state.run!.gold).toBe(130);
  });

  it('apply the failure outcome on a failed check; gold never goes below zero', () => {
    const state = atEvent(40);
    openEvent(state, node, [SHRINE]);
    const result = chooseOption(state, SHRINE, 0, () => 0.99);
    expect(result.success).toBe(false);
    expect(result.lines).toEqual(['WOUNDED: NEXT FIGHT STARTS AT 75% HP', '-40 GOLD']);
    expect(state.run!.gold).toBe(0);
  });

  it('grant loot of the asked rarity into the inventory', () => {
    const state = atEvent();
    openEvent(state, node, [SHRINE]);
    chooseOption(state, SHRINE, 1);
    expect(state.inventory.items.map((i) => i.rarity)).toEqual(['epic']);
    expect(state.inventory.skills.map((s) => s.rarity)).toEqual(['rare']);
  });

  it('report a fight instead of applying it', () => {
    const state = atEvent();
    openEvent(state, node, [SHRINE]);
    expect(chooseOption(state, SHRINE, 2).fight).toEqual(['orc']);
  });

  it('take a random piece of gear, equipped or not', () => {
    const state = atEvent();
    state.party[0] = { ...state.party[0], equipment: { weapon: ITEMS_BY_ID.longsword } };
    const lose: EventDef = { ...SHRINE, choices: [{ label: 'X', success: { text: '', outcomes: [{ kind: 'loseItem' }] } }] };
    openEvent(state, node, [lose]);
    expect(chooseOption(state, lose, 0, () => 0).lines).toEqual(['LOST LONGSWORD']);
    expect(state.party[0].equipment.weapon).toBeUndefined();
  });

  it('keep the visit and its result through a save', () => {
    const state = atEvent();
    openEvent(state, node, [SHRINE]);
    chooseOption(state, SHRINE, 0, () => 0);
    const loaded = createState();
    fromSave(JSON.parse(JSON.stringify(toSave(state))), loaded);
    expect(loaded.run!.event).toEqual(state.run!.event);
    expect(loaded.run!.nextFight).toEqual({ bonus: { attack: 5 } });
  });
});

describe('wounded and blessed fights', () => {
  it('apply once to the next fight', () => {
    const state = atEvent();
    state.run!.nextFight = { hpFraction: 0.75, bonus: { attack: 5 } };
    const start = takeNextFight(state);
    expect(takeNextFight(state)).toBeUndefined();
    const battle = new Battle(state.party, [SLIME], () => 0, { party: start });
    const knight = battle.get('party-0');
    expect(knight.hp).toBe(Math.round(knight.maxHp * 0.75));
    expect(knight.def.stats.attack).toBe(CLASSES_BY_ID.knight.stats.attack + 5);
  });
});

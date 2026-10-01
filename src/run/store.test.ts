import { describe, expect, it } from 'vitest';
import { CLASSES_BY_ID } from '../content/classes';
import { ITEMS_BY_ID } from '../content/items';
import { SKILLS_BY_ID } from '../content/skills';
import { equipItemBlock, skillAccessBlock } from '../game/loadout';
import { createState } from '../game/state';
import type { MapNode } from './map';
import { beginNode, startRun } from './run';
import { fromSave, itemRef, toSave } from './run';
import { buy, enchant, enchantPrice, itemPrice, openStore, repair, repairPrice, sell, sellPrice, skillPrice, STORE_ITEMS, STORE_SKILLS } from './store';

const node: MapNode = { id: '3-2', floor: 3, column: 2, type: 'store', next: [] };

function inStore(gold = 500) {
  const state = createState();
  startRun(state, 0, ['knight', 'mage', 'cleric'].map((id) => CLASSES_BY_ID[id]), 9);
  state.run!.gold = gold;
  beginNode(state.run!, node);
  openStore(state, node);
  return state;
}

describe('store', () => {
  it('prices by rarity, skills 20% cheaper, sells for half', () => {
    expect([ITEMS_BY_ID.leatherCap, ITEMS_BY_ID.scaleMail].map(itemPrice)).toEqual([30, 60]);
    expect(skillPrice(SKILLS_BY_ID.bodyguard)).toBe(24);
    expect(sellPrice(ITEMS_BY_ID.scaleMail)).toBe(30);
    expect(sellPrice({ ...ITEMS_BY_ID.scaleMail, boost: { stat: 'hp', amount: 20 } })).toBe(36);
    expect(repairPrice(ITEMS_BY_ID.scaleMail)).toBe(30);
  });

  it('stocks 4 skills and 2 items the party can use, the same every time the store is opened', () => {
    const state = inStore();
    const store = state.run!.store!;
    expect(store.skills).toHaveLength(STORE_SKILLS);
    expect(store.items).toHaveLength(STORE_ITEMS);
    for (const id of store.skills) expect(state.party.some((m) => !skillAccessBlock(m, SKILLS_BY_ID[id]))).toBe(true);
    for (const id of store.items) expect(state.party.some((m) => !equipItemBlock(m, ITEMS_BY_ID[id]))).toBe(true);
    const again = inStore();
    expect(again.run!.store).toEqual(store);
  });

  it('keeps purchases when reopened, and starts fresh at another store', () => {
    const state = inStore();
    buy(state, 'skill', state.run!.store!.skills[0]);
    openStore(state, node);
    expect(state.run!.store!.bought).toHaveLength(1);
    const other = { ...node, id: '9-1', floor: 9, column: 1 };
    beginNode(state.run!, other);
    openStore(state, other);
    expect(state.run!.store!.bought).toEqual([]);
  });

  it('buys into the inventory, once per stock entry, only with enough gold', () => {
    const state = inStore(1000);
    const id = state.run!.store!.items[0];
    expect(buy(state, 'item', id)).toBeNull();
    expect(state.run!.gold).toBe(1000 - itemPrice(ITEMS_BY_ID[id]));
    expect(state.inventory.items.map((i) => i.id)).toEqual([id]);
    expect(buy(state, 'item', id)).toBe('SOLD OUT');
    const poor = inStore(0);
    expect(buy(poor, 'skill', poor.run!.store!.skills[0])).toBe('NOT ENOUGH GOLD');
    expect(poor.inventory.skills).toEqual([]);
  });

  it('sells unequipped gear for half price', () => {
    const state = inStore(0);
    state.inventory.items.push(ITEMS_BY_ID.scaleMail);
    expect(sell(state, ITEMS_BY_ID.scaleMail)).toBeNull();
    expect(state.run!.gold).toBe(30);
    expect(state.inventory.items).toEqual([]);
    expect(sell(state, ITEMS_BY_ID.scaleMail)).toBe('NOT IN INVENTORY');
  });

  it('repairs one broken piece per visit', () => {
    const state = inStore(100);
    state.run!.broken = ['scaleMail', 'leatherCap'];
    expect(repair(state, 0)).toBeNull();
    expect(state.run!.gold).toBe(70);
    expect(state.run!.broken).toEqual(['leatherCap']);
    expect(state.inventory.items.map((i) => i.id)).toEqual(['scaleMail']);
    expect(repair(state, 0)).toBe('ONE REPAIR PER VISIT');
    expect(repair(state, 5)).toBe('NOT BROKEN');
  });

  it('enchant prices start at 50 and rise by half per rarity step', () => {
    expect([ITEMS_BY_ID.leatherCap, ITEMS_BY_ID.scaleMail].map(enchantPrice)).toEqual([50, 75]);
  });

  it('enchants inventory or equipped gear once, adding one random stat boost', () => {
    const state = inStore(200);
    state.inventory.items.push(ITEMS_BY_ID.leatherCap);
    const capped = enchant(state, ITEMS_BY_ID.leatherCap, () => 0);
    expect(capped).toMatchObject({ id: 'leatherCap', boost: { stat: 'hp', amount: 20 } });
    expect((capped as typeof ITEMS_BY_ID.leatherCap).stats.hp).toBe((ITEMS_BY_ID.leatherCap.stats.hp ?? 0) + 20);
    expect(state.inventory.items[0]).toBe(capped);
    expect(ITEMS_BY_ID.leatherCap.boost).toBeUndefined();
    expect(enchant(state, capped as typeof ITEMS_BY_ID.leatherCap)).toBe('ALREADY ENCHANTED');

    state.party[0] = { ...state.party[0], equipment: { weapon: ITEMS_BY_ID.longsword } };
    const sword = enchant(state, ITEMS_BY_ID.longsword, () => 0.3);
    expect(state.party[0].equipment.weapon).toBe(sword);
    expect(sword).toMatchObject({ boost: { stat: 'attack', amount: 5 } });
    expect(state.run!.gold).toBe(200 - 50 - 75);
    expect(enchant(inStore(0), ITEMS_BY_ID.longsword)).toBe('NOT ENOUGH GOLD');
  });

  it('keeps enchantments through saving, breaking, and repair', () => {
    const state = inStore(500);
    state.inventory.items.push(ITEMS_BY_ID.scaleMail);
    const mail = enchant(state, ITEMS_BY_ID.scaleMail, () => 0.7) as typeof ITEMS_BY_ID.scaleMail;
    const loaded = inStore();
    fromSave(JSON.parse(JSON.stringify(toSave(state))), loaded);
    expect(loaded.inventory.items[0]).toEqual(mail);
    state.inventory.items = [];
    state.run!.broken = [itemRef(mail)];
    expect(repair(state, 0)).toBeNull();
    expect(state.inventory.items[0]).toEqual(mail);
  });
});

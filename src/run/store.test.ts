import { describe, expect, it } from 'vitest';
import { CLASSES_BY_ID } from '../content/classes';
import { ITEMS_BY_ID } from '../content/items';
import { SKILLS_BY_ID } from '../content/skills';
import { equipItemBlock, skillAccessBlock } from '../game/loadout';
import { createState } from '../game/state';
import type { MapNode } from './map';
import { beginNode, startRun } from './run';
import { fromSave, itemRef, toSave } from './run';
import { buy, enchant, enchantExtra, enchantPrice, extraEnchantPrice, previewExtra, itemPrice, openStore, repair, repairPrice, sell, sellPrice, skillPrice, STORE_ITEMS, STORE_SKILLS } from './store';

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

  it('enchants inventory or equipped gear once, adding the chosen stat boost', () => {
    const state = inStore(200);
    state.inventory.items.push(ITEMS_BY_ID.leatherCap);
    const capped = enchant(state, ITEMS_BY_ID.leatherCap, 'hp');
    expect(capped).toMatchObject({ id: 'leatherCap', boost: { stat: 'hp', amount: 20 } });
    expect((capped as typeof ITEMS_BY_ID.leatherCap).stats.hp).toBe((ITEMS_BY_ID.leatherCap.stats.hp ?? 0) + 20);
    expect(state.inventory.items[0]).toBe(capped);
    expect(ITEMS_BY_ID.leatherCap.boost).toBeUndefined();
    expect(enchant(state, capped as typeof ITEMS_BY_ID.leatherCap, 'attack')).toBe('ALREADY ENCHANTED');

    state.party[0] = { ...state.party[0], equipment: { weapon: ITEMS_BY_ID.longsword } };
    const sword = enchant(state, ITEMS_BY_ID.longsword, 'attack');
    expect(state.party[0].equipment.weapon).toBe(sword);
    expect(sword).toMatchObject({ boost: { stat: 'attack', amount: 5 } });
    expect(state.run!.gold).toBe(200 - 50 - 75);
    expect(enchant(inStore(0), ITEMS_BY_ID.longsword, 'attack')).toBe('NOT ENOUGH GOLD');
  });

  it('adds a random second enchantment for 50% more, only after the first', () => {
    const state = inStore(500);
    state.inventory.items.push(ITEMS_BY_ID.leatherCap);
    const cap = ITEMS_BY_ID.leatherCap;
    expect(extraEnchantPrice(cap)).toBe(75);
    expect(enchantExtra(state, cap)).toBe('ENCHANT IT ONCE FIRST');
    const first = enchant(state, cap, 'defense') as typeof cap;
    const second = enchantExtra(state, first, () => 0.45) as typeof cap;
    expect(second.boost).toEqual(first.boost);
    expect(second.extra).toMatchObject({ kind: 'thorns' });
    expect(state.inventory.items[0]).toBe(second);
    expect(state.run!.gold).toBe(500 - 50 - 75);
    expect(enchantExtra(state, second)).toBe('ALREADY ENCHANTED TWICE');
    expect(enchantExtra(inStore(0), first)).toBe('NOT ENOUGH GOLD');
  });

  it('previews the second enchantment for free, and accepting gives exactly that result', () => {
    const state = inStore(500);
    state.inventory.items.push(ITEMS_BY_ID.leatherCap);
    const first = enchant(state, ITEMS_BY_ID.leatherCap, 'hp') as typeof ITEMS_BY_ID.leatherCap;
    const gold = state.run!.gold;
    const preview = previewExtra(state, first) as typeof first;
    expect(previewExtra(state, first)).toEqual(preview);
    expect(state.run!.gold).toBe(gold);
    expect(state.inventory.items[0]).toBe(first);
    expect(enchantExtra(state, first)).toEqual(preview);
    expect(state.run!.gold).toBe(gold - 75);
  });

  it('amplify doubles the first stat bonus', () => {
    const state = inStore(500);
    state.inventory.items.push(ITEMS_BY_ID.leatherCap);
    const base = ITEMS_BY_ID.leatherCap;
    const first = enchant(state, base, 'defense') as typeof base;
    // 12 slots in the pool; amplify is the 7th.
    const second = enchantExtra(state, first, () => 6.5 / 12 + 0.001) as typeof base;
    expect(second.extra).toEqual({ kind: 'amplify' });
    expect(second.boost).toEqual({ stat: 'defense', amount: 10 });
    expect(second.stats.defense).toBe((base.stats.defense ?? 0) + 10);
    const loaded = inStore();
    fromSave(JSON.parse(JSON.stringify(toSave(state))), loaded);
    expect(loaded.inventory.items[0]).toEqual(second);
  });

  it('keeps the second enchantment through saving', () => {
    const state = inStore(500);
    state.inventory.items.push(ITEMS_BY_ID.leatherCap);
    const first = enchant(state, ITEMS_BY_ID.leatherCap, 'hp') as typeof ITEMS_BY_ID.leatherCap;
    const second = enchantExtra(state, first, () => 0.2) as typeof first;
    const loaded = inStore();
    fromSave(JSON.parse(JSON.stringify(toSave(state))), loaded);
    expect(loaded.inventory.items[0]).toEqual(second);
    expect(loaded.inventory.items[0].extra).toBeDefined();
  });

  it('keeps enchantments through saving, breaking, and repair', () => {
    const state = inStore(500);
    state.inventory.items.push(ITEMS_BY_ID.scaleMail);
    const mail = enchant(state, ITEMS_BY_ID.scaleMail, 'magic') as typeof ITEMS_BY_ID.scaleMail;
    const loaded = inStore();
    fromSave(JSON.parse(JSON.stringify(toSave(state))), loaded);
    expect(loaded.inventory.items[0]).toEqual(mail);
    state.inventory.items = [];
    state.run!.broken = [itemRef(mail)];
    expect(repair(state, 0)).toBeNull();
    expect(state.inventory.items[0]).toEqual(mail);
  });
});

import { RARITIES, type EquipmentDef, type Rarity, type SkillDef, type Stats } from '../combat/types';
import { ITEM_LIBRARY, ITEMS_BY_ID } from '../content/items';
import { SKILL_LIBRARY, SKILLS_BY_ID } from '../content/skills';
import { seededRng } from '../engine/random';
import { equipItemBlock, skillAccessBlock } from '../game/loadout';
import type { GameState } from '../game/state';
import type { MapNode } from './map';
import { itemFromRef, withBoost } from './run';
import { NORMAL_WEIGHTS, pickWeighted, RICH_WEIGHTS } from './rewards';

export const STORE_SKILLS = 4;
export const STORE_ITEMS = 2;

const ITEM_PRICE: Record<Rarity, number> = { common: 30, rare: 60, epic: 120, legendary: 220 };
const SKILL_DISCOUNT = 0.8;
const SELL_SHARE = 0.5;
// Enchanted gear sells for this much more.
const ENCHANTED_SELL_BONUS = 1.2;
const REPAIR_SHARE = 0.5;
const ENCHANT_BASE = 50;
// Each rarity step above Common adds half the base price.
const ENCHANT_STEP = 0.5;
// One random stat; HP counts 4 to 1, as in the gear budget.
const ENCHANT_BOOSTS: { stat: keyof Stats; amount: number }[] = [
  { stat: 'hp', amount: 20 },
  { stat: 'attack', amount: 5 },
  { stat: 'magic', amount: 5 },
  { stat: 'defense', amount: 5 },
  { stat: 'resistance', amount: 5 },
];

export function skillPrice(skill: SkillDef): number {
  return Math.round(ITEM_PRICE[skill.rarity] * SKILL_DISCOUNT);
}

export function itemPrice(item: EquipmentDef): number {
  return ITEM_PRICE[item.rarity];
}

export function sellPrice(item: EquipmentDef): number {
  return Math.round(itemPrice(item) * SELL_SHARE * (item.boost ? ENCHANTED_SELL_BONUS : 1));
}

export function repairPrice(item: EquipmentDef): number {
  return Math.round(itemPrice(item) * REPAIR_SHARE);
}

export function enchantPrice(item: EquipmentDef): number {
  return Math.round(ENCHANT_BASE * (1 + RARITIES.indexOf(item.rarity) * ENCHANT_STEP));
}

// Opens (or reopens) a store node. Stock is seeded by the run and the node, so it never rerolls.
export function openStore(state: GameState, node: MapNode): void {
  const run = state.run!;
  if (run.store?.node === node.id) return;
  const rng = seededRng(run.seed * 977 + run.level * 131 + node.floor * 7 + node.column);
  const party = state.party;
  const skills = SKILL_LIBRARY.filter((s) => party.some((m) => !skillAccessBlock(m, s)));
  const items = ITEM_LIBRARY.filter((i) => party.some((m) => !equipItemBlock(m, i)));
  run.store = {
    node: node.id,
    skills: pickWeighted(skills, (s) => s.rarity, NORMAL_WEIGHTS, STORE_SKILLS, rng).map((s) => s.id),
    items: pickWeighted(items, (i) => i.rarity, RICH_WEIGHTS, STORE_ITEMS, rng).map((i) => i.id),
    bought: [],
    repaired: false,
  };
}

// Each returns a player-facing reason when not allowed, or null after doing it.

export function buy(state: GameState, kind: 'skill' | 'item', id: string): string | null {
  const run = state.run!;
  const store = run.store!;
  if (store.bought.includes(id)) return 'SOLD OUT';
  const price = kind === 'skill' ? skillPrice(SKILLS_BY_ID[id]) : itemPrice(ITEMS_BY_ID[id]);
  if (run.gold < price) return 'NOT ENOUGH GOLD';
  run.gold -= price;
  store.bought.push(id);
  if (kind === 'skill') state.inventory.skills.push(SKILLS_BY_ID[id]);
  else state.inventory.items.push(ITEMS_BY_ID[id]);
  return null;
}

// Only unequipped gear in the inventory can be sold.
export function sell(state: GameState, item: EquipmentDef): string | null {
  const index = state.inventory.items.indexOf(item);
  if (index < 0) return 'NOT IN INVENTORY';
  state.inventory.items.splice(index, 1);
  state.run!.gold += sellPrice(item);
  return null;
}

// Gear broken this run, in the order it broke.
export function brokenItems(state: GameState): EquipmentDef[] {
  return state.run!.broken.map(itemFromRef).filter((i): i is EquipmentDef => !!i);
}

// One repair per store visit: the `index`th broken piece comes back to the inventory, enchantment and all.
export function repair(state: GameState, index: number): string | null {
  const run = state.run!;
  const ref = run.broken[index];
  const item = ref === undefined ? undefined : itemFromRef(ref);
  if (!item) return 'NOT BROKEN';
  if (run.store!.repaired) return 'ONE REPAIR PER VISIT';
  const price = repairPrice(item);
  if (run.gold < price) return 'NOT ENOUGH GOLD';
  run.gold -= price;
  run.broken.splice(index, 1);
  run.store!.repaired = true;
  state.inventory.items.push(item);
  return null;
}

// Gives one piece of gear (in the inventory or equipped) a random stat boost; each piece can be enchanted once.
// Returns the enchanted copy, or a reason it can't be done.
export function enchant(state: GameState, item: EquipmentDef, rng: () => number = Math.random): EquipmentDef | string {
  const run = state.run!;
  if (item.boost) return 'ALREADY ENCHANTED';
  const price = enchantPrice(item);
  if (run.gold < price) return 'NOT ENOUGH GOLD';
  const enchanted = withBoost(item, ENCHANT_BOOSTS[Math.floor(rng() * ENCHANT_BOOSTS.length)]);
  const index = state.inventory.items.indexOf(item);
  if (index >= 0) state.inventory.items[index] = enchanted;
  else {
    const holder = state.party.find((m) => m.equipment[item.slot] === item);
    if (!holder) return 'NOT OWNED';
    state.party = state.party.map((m) => (m === holder ? { ...m, equipment: { ...m.equipment, [item.slot]: enchanted } } : m));
  }
  run.gold -= price;
  return enchanted;
}

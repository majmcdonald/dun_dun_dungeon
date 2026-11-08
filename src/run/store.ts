import { RARITIES, type Element, type Enchantment, type EquipmentDef, type Rarity, type SkillDef, type Stats } from '../combat/types';
import { ITEM_LIBRARY, ITEMS_BY_ID } from '../content/items';
import { SKILL_LIBRARY, SKILLS_BY_ID } from '../content/skills';
import { seededRng } from '../engine/random';
import { equipItemBlock, skillAccessBlock } from '../game/loadout';
import type { GameState } from '../game/state';
import { logEvent } from './log';
import type { MapNode } from './map';
import { itemFromRef, withBoost } from './run';
import { SHOP_KEY_PRICE } from './plus';
import { actWeights, NORMAL_WEIGHTS, pickWeighted, RICH_WEIGHTS } from './rewards';

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
// The player picks the stat; HP counts 4 to 1, as in the gear budget.
export const ENCHANT_BOOSTS: { stat: keyof Stats; amount: number }[] = [
  { stat: 'hp', amount: 20 },
  { stat: 'attack', amount: 5 },
  { stat: 'magic', amount: 5 },
  { stat: 'defense', amount: 5 },
  { stat: 'resistance', amount: 5 },
];
// The second enchantment costs this much more than the first.
const EXTRA_PRICE_FACTOR = 1.5;
const ELEMENTS: Element[] = ['fire', 'ice', 'lightning', 'holy', 'shadow', 'poison'];

// The second enchantment is one of these at random; each is a little stronger than a +5 stat.
const EXTRA_ENCHANTS: ((element: Element) => Enchantment)[] = [
  // Extra elemental damage on hit.
  (element) => ({ kind: 'onHit', chance: 0.5, effect: { kind: 'damage', damageType: 'magic', stat: 'attack', bestStat: true, scaling: 0.5, element } }),
  // A random spell every 5 seconds: a bolt at a random enemy.
  (element) => ({ kind: 'cast', interval: 5, target: 'enemy', effect: { kind: 'damage', damageType: 'magic', stat: 'attack', bestStat: true, scaling: 1.2, element } }),
  // Or a ward on the wearer.
  () => ({ kind: 'cast', interval: 5, target: 'self', effect: { kind: 'barrier', stat: 'resistance', scaling: 2, duration: 4 } }),
  () => ({ kind: 'regen', perSecond: 0.02 }),
  (element) => ({ kind: 'resist', element, amount: 0.3 }),
  () => ({ kind: 'thorns', fraction: 0.15 }),
  () => ({ kind: 'amplify' }),
  () => ({ kind: 'echo' }),
  () => ({ kind: 'sturdy' }),
  () => ({ kind: 'lastStand', fraction: 0.3 }),
  () => ({ kind: 'desperate', threshold: 0.25, multiplier: 2 }),
  () => ({ kind: 'haste', amount: 0.1 }),
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

// Second enchantment: half again the first one's price.
export function extraEnchantPrice(item: EquipmentDef): number {
  return Math.round(enchantPrice(item) * EXTRA_PRICE_FACTOR);
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
    skills: pickWeighted(skills, (s) => s.rarity, actWeights(NORMAL_WEIGHTS, run.level), STORE_SKILLS, rng).map((s) => s.id),
    items: pickWeighted(items, (i) => i.rarity, actWeights(RICH_WEIGHTS, run.level), STORE_ITEMS, rng).map((i) => i.id),
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
  logEvent(run, 'buy', { kind, id, price });
  return null;
}

// Only unequipped gear in the inventory can be sold.
export function sell(state: GameState, item: EquipmentDef): string | null {
  const index = state.inventory.items.indexOf(item);
  if (index < 0) return 'NOT IN INVENTORY';
  state.inventory.items.splice(index, 1);
  state.run!.gold += sellPrice(item);
  logEvent(state.run!, 'sell', { id: item.id, price: sellPrice(item) });
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
  logEvent(run, 'repair', { id: item.id, price });
  return null;
}

// Swaps an owned piece of gear (in the inventory or equipped) for an upgraded copy. False if the party doesn't own it.
function replaceGear(state: GameState, item: EquipmentDef, next: EquipmentDef): boolean {
  const index = state.inventory.items.indexOf(item);
  if (index >= 0) {
    state.inventory.items[index] = next;
    return true;
  }
  const holder = state.party.find((m) => m.equipment[item.slot] === item);
  if (!holder) return false;
  state.party = state.party.map((m) => (m === holder ? { ...m, equipment: { ...m.equipment, [item.slot]: next } } : m));
  return true;
}

// First enchantment: the chosen stat boost; each piece can have it once.
// Returns the enchanted copy, or a reason it can't be done.
export function enchant(state: GameState, item: EquipmentDef, stat: keyof Stats): EquipmentDef | string {
  const run = state.run!;
  if (item.boost) return 'ALREADY ENCHANTED';
  const boost = ENCHANT_BOOSTS.find((b) => b.stat === stat);
  if (!boost) return 'UNKNOWN STAT';
  const price = enchantPrice(item);
  if (run.gold < price) return 'NOT ENOUGH GOLD';
  const enchanted = withBoost(item, boost);
  if (!replaceGear(state, item, enchanted)) return 'NOT OWNED';
  run.gold -= price;
  logEvent(run, 'enchant', { id: item.id, price, boost: enchanted.boost });
  return enchanted;
}

// The roll is fixed per run and piece of gear, so backing out of a preview can't be used to reroll.
function extraRng(state: GameState, item: EquipmentDef): () => number {
  const key = `${item.id}:${item.boost?.stat}`;
  let hash = 0;
  for (const ch of key) hash = (Math.imul(hash, 31) + ch.charCodeAt(0)) | 0;
  return seededRng(state.run!.seed * 977 + hash);
}

// What the gear would become with its second enchantment, without paying or changing anything.
export function previewExtra(state: GameState, item: EquipmentDef, rng: () => number = extraRng(state, item)): EquipmentDef | string {
  if (!item.boost) return 'ENCHANT IT ONCE FIRST';
  if (item.extra) return 'ALREADY ENCHANTED TWICE';
  const element = ELEMENTS[Math.floor(rng() * ELEMENTS.length)];
  const extra = EXTRA_ENCHANTS[Math.floor(rng() * EXTRA_ENCHANTS.length)](element);
  // Amplify folds into the stat bonus itself: the extra points are added now and the boost reads doubled.
  return extra.kind === 'amplify'
    ? { ...item, extra, stats: { ...item.stats, [item.boost.stat]: (item.stats[item.boost.stat] ?? 0) + item.boost.amount }, boost: { ...item.boost, amount: item.boost.amount * 2 } }
    : { ...item, extra };
}

// Second enchantment: a random extra passive, only on gear that already has the first.
export function enchantExtra(state: GameState, item: EquipmentDef, rng?: () => number): EquipmentDef | string {
  const run = state.run!;
  const enchanted = previewExtra(state, item, rng);
  if (typeof enchanted === 'string') return enchanted;
  const price = extraEnchantPrice(item);
  if (run.gold < price) return 'NOT ENOUGH GOLD';
  if (!replaceGear(state, item, enchanted)) return 'NOT OWNED';
  run.gold -= price;
  logEvent(run, 'enchant2', { id: item.id, price, extra: enchanted.extra });
  return enchanted;
}

// Game++: the Shop Key, once per run.
export function buyKey(state: GameState): string | null {
  const run = state.run!;
  if (!run.plus) return 'NOT AVAILABLE';
  if (run.keys.shop) return 'ALREADY OWNED';
  if (run.gold < SHOP_KEY_PRICE) return 'NOT ENOUGH GOLD';
  run.gold -= SHOP_KEY_PRICE;
  run.keys.shop = true;
  logEvent(run, 'key', { key: 'shop', price: SHOP_KEY_PRICE });
  return null;
}

import { RARITIES, type EquipmentDef, type PartyMember, type Rarity, type SkillDef } from '../combat/types';
import type { Rng } from '../engine/random';
import { equipItemBlock, skillAccessBlock } from '../game/loadout';
import type { NodeType } from './map';

export const SKILL_CHOICES = 2;
export const ITEM_CHOICES = 2;

// Skills (except after a boss), and items after a Battle.
export const NORMAL_WEIGHTS: Record<Rarity, number> = { common: 80, rare: 14, epic: 5, legendary: 1 };
// Items after an Epic Monster or Treasure, and in stores.
export const RICH_WEIGHTS: Record<Rarity, number> = { common: 60, rare: 25, epic: 12, legendary: 3 };
// Skills and items after a boss: never Common.
export const BOSS_WEIGHTS: Record<Rarity, number> = { common: 0, rare: 50, epic: 35, legendary: 15 };
// Points moved to each better rarity, by act, from the lowest rarity that can drop (Common, or Rare for a boss).
export const ACT_BONUS = [0, 2, 4];

export function actWeights(weights: Record<Rarity, number>, level: number): Record<Rarity, number> {
  const bonus = ACT_BONUS[level] ?? 0;
  const lowest = RARITIES.findIndex((r) => weights[r] > 0);
  const shifted = { ...weights };
  for (const r of RARITIES.slice(lowest + 1)) shifted[r] += bonus;
  shifted[RARITIES[lowest]] -= bonus * (RARITIES.length - 1 - lowest);
  return shifted;
}

const GOLD: Record<Exclude<NodeType, 'event' | 'store'>, [number, number]> = {
  battle: [15, 25],
  epic: [40, 60],
  boss: [100, 100],
  treasure: [30, 50],
};

export interface Reward {
  gold: number;
  skills: SkillDef[];
  items: EquipmentDef[];
}

export function rollReward(
  type: NodeType,
  party: PartyMember[],
  skills: SkillDef[],
  items: EquipmentDef[],
  rng: Rng,
  bonusGold = 0,
  level = 0,
): Reward {
  const [min, max] = type in GOLD ? GOLD[type as keyof typeof GOLD] : [0, 0];
  const gold = min + Math.floor(rng() * (max - min + 1)) + bonusGold;
  const normal = actWeights(NORMAL_WEIGHTS, level);
  const boss = actWeights(BOSS_WEIGHTS, level);
  const skillWeights = type === 'boss' ? boss : normal;
  const itemWeights = type === 'boss' ? boss : type === 'battle' ? normal : actWeights(RICH_WEIGHTS, level);
  const usableSkills = skills.filter((s) => party.some((m) => !skillAccessBlock(m, s)));
  const usableItems = items.filter((i) => party.some((m) => !equipItemBlock(m, i)));
  return {
    gold,
    skills: pickWeighted(usableSkills, (s) => s.rarity, skillWeights, SKILL_CHOICES, rng),
    items: pickWeighted(usableItems, (i) => i.rarity, itemWeights, ITEM_CHOICES, rng),
  };
}

// Distinct picks: roll a rarity by weight (among rarities still in the pool), then a uniform pick within it.
export function pickWeighted<T>(pool: T[], rarityOf: (t: T) => Rarity, weights: Record<Rarity, number>, count: number, rng: Rng): T[] {
  const remaining = [...pool];
  const picks: T[] = [];
  while (picks.length < count && remaining.length > 0) {
    const present = RARITIES.filter((r) => remaining.some((t) => rarityOf(t) === r));
    const total = present.reduce((sum, r) => sum + weights[r], 0);
    let roll = rng() * total;
    const rarity = present.find((r) => (roll -= weights[r]) < 0) ?? present[present.length - 1];
    const bucket = remaining.filter((t) => rarityOf(t) === rarity);
    const pick = bucket[Math.floor(rng() * bucket.length)];
    picks.push(pick);
    remaining.splice(remaining.indexOf(pick), 1);
  }
  return picks;
}

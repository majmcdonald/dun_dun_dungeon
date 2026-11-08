import type { EnemyBoost } from '../combat/types';
import { seededRng } from '../engine/random';
import type { RunState } from './run';

// Game++: opens once every class is unlocked. Gather one of each key, then the Dungeon Master waits
// behind the Act 3 boss.
export type KeyType = 'shop' | 'elite' | 'treasure';
export const KEY_TYPES: KeyType[] = ['shop', 'elite', 'treasure'];
export const KEY_LABEL: Record<KeyType, string> = { shop: 'SHOP KEY', elite: 'ELITE KEY', treasure: 'TREASURE KEY' };
export const SHOP_KEY_PRICE = 150;

export type Keys = Record<KeyType, boolean>;
export const noKeys = (): Keys => ({ shop: false, elite: false, treasure: false });
export const hasAllKeys = (keys: Keys): boolean => KEY_TYPES.every((k) => keys[k]);

// One of these, picked at random, strengthens the Elite Key epic's enemies.
export const ENEMY_BOOSTS: EnemyBoost[] = [
  { kind: 'hp', amount: 0.3 },
  { kind: 'damage', amount: 0.25 },
  { kind: 'defense', amount: 0.3 },
  { kind: 'speed', amount: 0.1 },
];

const BOOST_TEXT: Record<EnemyBoost['kind'], string> = { hp: 'HP', damage: 'DAMAGE', defense: 'DEFENSE', speed: 'SPEED' };
export function describeBoost(b: EnemyBoost): string {
  return `+${Math.round(b.amount * 100)}% ${BOOST_TEXT[b.kind]}`;
}

// Each act marks one random Epic Monster as holding the Elite Key, until the key is won.
// Seeded by the run and act, so a reload marks the same one.
export function pickKeyEpic(run: RunState): void {
  run.keyEpic = null;
  if (!run.plus || run.keys.elite) return;
  const epics = run.map.floors.flat().filter((n) => n.type === 'epic');
  if (epics.length === 0) return;
  const rng = seededRng(run.seed * 613 + run.level * 29);
  run.keyEpic = {
    node: epics[Math.floor(rng() * epics.length)].id,
    boost: ENEMY_BOOSTS[Math.floor(rng() * ENEMY_BOOSTS.length)],
  };
}

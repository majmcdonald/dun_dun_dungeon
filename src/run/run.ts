import type { PartyStart } from '../combat/battle';
import type { EquipmentDef, EquipSlot, PartyMember, SkillDef } from '../combat/types';
import { CLASSES_BY_ID, type ClassDef } from '../content/classes';
import { ITEMS_BY_ID } from '../content/items';
import { SKILLS_BY_ID } from '../content/skills';
import { seededRng } from '../engine/random';
import { checkUnlocks, loadProfile, saveProfile } from './profile';
import { loadSlot, saveSlot } from '../engine/save';
import { equippedSkills } from '../game/loadout';
import { recruit, type GameState } from '../game/state';
import { findNode, FLOORS, generateMap, reachable, type MapNode, type NodeType, type RunMap } from './map';
import type { EventVisit } from './events';
import type { Reward } from './rewards';

// Temporarily 2: runs end after Act 2 until Act 3 has its encounters (Phase 6). The full game is 3.
export const LEVELS = 2;

export interface RunState {
  slot: number;
  seed: number;
  // 0-based; the player sees level + 1.
  level: number;
  map: RunMap;
  // The last node entered and cleared; null before the first pick on a level.
  position: string | null;
  // Nodes cleared on this level, in order.
  path: string[];
  // The node being played right now (fight, reward, or placeholder screen); not yet cleared.
  pending: string | null;
  gold: number;
  result: 'won' | 'lost' | null;
  // The latest reward; its picks can be changed until the next node is entered.
  lastReward: LastReward | null;
  stats: RunStats;
  // Gear broken on a KO this run (enchantments included), which a store can repair.
  broken: ItemRef[];
  // The store being visited (stock and what has been done there), kept so a reload shows the same shop.
  store: StoreVisit | null;
  // The event being visited, and every event already met this run.
  event: EventVisit | null;
  seenEvents: string[];
  // Wounded/blessed effects from events, applied to the next fight.
  nextFight: PartyStart | null;
  // The fight picked for the room being played, and every fight used this run (oldest first).
  encounter: { node: string; id: string } | null;
  usedEncounters: string[];
}

export interface StoreVisit {
  node: string;
  skills: string[];
  items: string[];
  // Stock ids already bought.
  bought: string[];
  repaired: boolean;
}

export interface RunStats {
  rooms: number;
  fights: number;
  epics: number;
  bosses: number;
  goldEarned: number;
  // Full hits including what barriers absorbed; summons count as part of the party.
  damageDone: number;
  damageTaken: number;
}

const NO_STATS: RunStats = { rooms: 0, fights: 0, epics: 0, bosses: 0, goldEarned: 0, damageDone: 0, damageTaken: 0 };

export interface LastReward {
  node: string;
  type: NodeType;
  gold: number;
  // Offered skill and item ids, and the ones taken (null = skipped).
  skills: string[];
  items: string[];
  skill: string | null;
  item: string | null;
}

// A fresh run: recruits with their starting skills, an empty inventory, and the level 1 map.
export function startRun(state: GameState, slot: number, classes: ClassDef[], seed: number): void {
  state.party = classes.map(recruit);
  state.inventory = { skills: [], items: [] };
  state.run = { slot, seed, level: 0, map: levelMap(seed, 0), position: null, path: [], pending: null, gold: 0, result: null, lastReward: null, stats: { ...NO_STATS }, broken: [], store: null, event: null, seenEvents: [], nextFight: null, encounter: null, usedEncounters: [] };
}

function levelMap(seed: number, level: number): RunMap {
  return generateMap(seededRng(seed * 31 + level));
}

export function nextNodes(run: RunState): MapNode[] {
  return reachable(run.map, run.position);
}

export function currentNode(run: RunState): MapNode | null {
  return run.position === null ? null : (findNode(run.map, run.position) ?? null);
}

// Marks a node as cleared. Clearing the boss moves to the next level's map, or wins the run after the last.
export function clearNode(run: RunState, id: string): void {
  if (!nextNodes(run).some((n) => n.id === id)) throw new Error(`Node ${id} is not reachable`);
  run.pending = null;
  run.stats.rooms += 1;
  if (id !== run.map.boss.id || run.level + 1 >= LEVELS) {
    run.position = id;
    run.path.push(id);
    if (id === run.map.boss.id) run.result = 'won';
    return;
  }
  run.level += 1;
  run.map = levelMap(run.seed, run.level);
  run.position = null;
  run.path = [];
}

// Entering a node locks in the previous reward's picks.
export function beginNode(run: RunState, node: MapNode): void {
  run.lastReward = null;
  run.pending = node.id;
  if (run.store?.node !== node.id) run.store = null;
  if (run.event?.node !== node.id) run.event = null;
  if (run.encounter?.node !== node.id) run.encounter = null;
}

// What a "?" room turns out to be, rolled when entered and seeded by the room so a reload gets the same.
export const UNKNOWN_ODDS: [NodeType, number][] = [
  ['event', 70],
  ['battle', 15],
  ['store', 10],
  ['treasure', 5],
];

export function roomType(run: RunState, node: MapNode): NodeType {
  if (node.type !== 'event' || run.event?.node === node.id) return node.type;
  const rng = seededRng(run.seed * 457 + run.level * 71 + node.floor * 17 + node.column);
  let roll = rng() * UNKNOWN_ODDS.reduce((sum, [, w]) => sum + w, 0);
  for (const [type, weight] of UNKNOWN_ODDS) {
    roll -= weight;
    if (roll < 0) return type;
  }
  return 'event';
}

export function pendingNodeOf(run: RunState): MapNode | null {
  return run.pending ? (findNode(run.map, run.pending) ?? null) : null;
}

// A won fight or opened treasure: banks the gold, counts it in the stats, clears the node, and stores the
// picks to offer. The last boss wins the run instead, so it stores no picks.
export function recordWin(run: RunState, node: MapNode, reward: Reward): void {
  run.gold += reward.gold;
  run.stats.goldEarned += reward.gold;
  if (node.type !== 'treasure') run.stats.fights += 1;
  if (node.type === 'epic') run.stats.epics += 1;
  if (node.type === 'boss') run.stats.bosses += 1;
  const finalBoss = node.type === 'boss' && run.level + 1 >= LEVELS;
  clearNode(run, node.id);
  if (finalBoss) return;
  run.lastReward = {
    node: node.id,
    type: node.type,
    gold: reward.gold,
    skills: reward.skills.map((s) => s.id),
    items: reward.items.map((i) => i.id),
    skill: null,
    item: null,
  };
}

export interface RunSummary {
  won: boolean;
  level: number;
  // Where the run ended, e.g. "ROOM 7" or "THE BOSS", and that room's number.
  where: string;
  room: number;
  party: string[];
  stats: RunStats;
  // Enemy types in the fight that wiped the party; empty on a win.
  slayers: string[];
  // Classes unlocked during the run.
  unlocked?: string[];
}

// What the victory / Run Over screen shows; `slayers` are the enemy types of the fight that wiped the party.
export function runSummary(state: GameState, slayers: string[] = []): RunSummary {
  const run = state.run!;
  const at = pendingNodeOf(run) ?? (run.position ? (findNode(run.map, run.position) ?? null) : null);
  return {
    won: run.result === 'won',
    level: run.level + 1,
    where: at?.type === 'boss' ? 'THE BOSS' : `ROOM ${at ? Math.min(at.floor + 1, FLOORS) : 1}`,
    room: at ? Math.min(at.floor + 1, FLOORS) : 1,
    party: state.party.map((m) => m.def.id),
    stats: { ...run.stats },
    slayers,
  };
}

// Swaps the taken reward skill/item. Only changed picks move: the old one comes back out (from the inventory,
// or from whoever equipped it) and the new one goes into the inventory.
export function setRewardPicks(state: GameState, skill: string | null, item: string | null): void {
  const reward = state.run?.lastReward;
  if (!reward) return;
  if (skill !== reward.skill) {
    if (reward.skill) takeBackSkill(state, reward.skill);
    if (skill) state.inventory.skills.push(SKILLS_BY_ID[skill]);
    reward.skill = skill;
  }
  if (item !== reward.item) {
    if (reward.item) takeBackItem(state, reward.item);
    if (item) state.inventory.items.push(ITEMS_BY_ID[item]);
    reward.item = item;
  }
}

// Who would lose a pick if it were taken back: nobody while a copy is still in the inventory.
export function pickHolder(state: GameState, kind: 'skill' | 'item', id: string): PartyMember | null {
  if (kind === 'skill') {
    if (state.inventory.skills.some((s) => s.id === id)) return null;
    return state.party.find((m) => equippedSkills(m).some((s) => s.id === id)) ?? null;
  }
  if (state.inventory.items.some((i) => i.id === id)) return null;
  return state.party.find((m) => Object.values(m.equipment).some((i) => i?.id === id)) ?? null;
}

function takeBackSkill(state: GameState, id: string): void {
  const index = state.inventory.skills.findIndex((s) => s.id === id);
  if (index >= 0) {
    state.inventory.skills.splice(index, 1);
    return;
  }
  const holder = state.party.find((m) => equippedSkills(m).some((s) => s.id === id));
  if (!holder) return;
  // Skills that needed it can't stay equipped without it.
  const gone = (s: SkillDef) => s.id === id || s.prerequisite === id;
  state.inventory.skills.push(...equippedSkills(holder).filter((s) => s.prerequisite === id));
  const skills = holder.skills.filter((s) => !gone(s));
  const trigger = holder.trigger && !gone(holder.trigger) ? holder.trigger : null;
  state.party = state.party.map((m) => (m === holder ? { ...m, skills, trigger } : m));
}

function takeBackItem(state: GameState, id: string): void {
  const index = state.inventory.items.findIndex((i) => i.id === id);
  if (index >= 0) {
    state.inventory.items.splice(index, 1);
    return;
  }
  const holder = state.party.find((m) => Object.values(m.equipment).some((i) => i?.id === id));
  if (!holder) return;
  const equipment = Object.fromEntries(Object.entries(holder.equipment).filter(([, i]) => i?.id !== id));
  state.party = state.party.map((m) => (m === holder ? { ...m, equipment } : m));
}

// --- Saving: definitions are stored by id and looked up again on load.

// Plain library items save as their id; store-enchanted copies also keep their boost.
export type ItemRef = string | { id: string; boost: NonNullable<EquipmentDef['boost']> };

export function itemRef(item: EquipmentDef): ItemRef {
  return item.boost ? { id: item.id, boost: item.boost } : item.id;
}

export function itemFromRef(ref: ItemRef): EquipmentDef | undefined {
  if (typeof ref === 'string') return ITEMS_BY_ID[ref];
  const base = ITEMS_BY_ID[ref.id];
  return base && withBoost(base, ref.boost);
}

// A separate copy of the item with the bonus added to its stats.
export function withBoost(item: EquipmentDef, boost: NonNullable<EquipmentDef['boost']>): EquipmentDef {
  return { ...item, stats: { ...item.stats, [boost.stat]: (item.stats[boost.stat] ?? 0) + boost.amount }, boost };
}

interface SavedMember {
  classId: string;
  skills: string[];
  trigger?: string | null;
  equipment: Partial<Record<EquipSlot, ItemRef>>;
}

export interface SavedRun {
  run: RunState;
  party: SavedMember[];
  inventory: { skills: string[]; items: ItemRef[] };
}

export function toSave(state: GameState): SavedRun {
  if (!state.run) throw new Error('No run to save');
  return {
    run: state.run,
    party: state.party.map((m) => ({
      classId: m.def.id,
      skills: m.skills.map((s) => s.id),
      trigger: m.trigger?.id ?? null,
      equipment: Object.fromEntries(Object.entries(m.equipment).map(([slot, item]) => [slot, itemRef(item!)])),
    })),
    inventory: { skills: state.inventory.skills.map((s) => s.id), items: state.inventory.items.map(itemRef) },
  };
}

// A run reloaded mid-node restarts that node from the map.
export function fromSave(saved: SavedRun, state: GameState): void {
  state.run = {
    ...saved.run,
    path: saved.run.path ?? [],
    pending: null,
    lastReward: saved.run.lastReward ?? null,
    stats: { ...NO_STATS, ...saved.run.stats },
    broken: saved.run.broken ?? [],
    store: saved.run.store ?? null,
    event: saved.run.event ?? null,
    seenEvents: saved.run.seenEvents ?? [],
    nextFight: saved.run.nextFight ?? null,
    encounter: saved.run.encounter ?? null,
    usedEncounters: saved.run.usedEncounters ?? [],
  };
  state.party = saved.party.map(
    (m): PartyMember => ({
      def: CLASSES_BY_ID[m.classId],
      skills: m.skills.map((id) => SKILLS_BY_ID[id]).filter(Boolean),
      trigger: (m.trigger && SKILLS_BY_ID[m.trigger]) || null,
      equipment: Object.fromEntries(
        Object.entries(m.equipment).flatMap(([slot, ref]) => {
          const item = itemFromRef(ref!);
          return item ? [[slot, item]] : [];
        }),
      ),
    }),
  );
  state.inventory = {
    skills: saved.inventory.skills.map((id) => SKILLS_BY_ID[id]).filter(Boolean),
    items: saved.inventory.items.map(itemFromRef).filter((i): i is EquipmentDef => !!i),
  };
}

// Also saves the slot's profile, unlocking anything the run's gold now earns.
export function saveRun(state: GameState): boolean {
  if (!state.run) return false;
  if (state.profile) {
    checkUnlocks(state.profile, state.run.gold);
    saveProfile(state.run.slot, state.profile);
  }
  return saveSlot(state.run.slot, toSave(state));
}

export function loadRun(slot: number, state: GameState): boolean {
  const saved = loadSlot<SavedRun>(slot);
  if (!saved) return false;
  fromSave(saved.data, state);
  state.profile = loadProfile(slot);
  return true;
}

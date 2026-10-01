import type { EquipSlot, PartyMember } from '../combat/types';
import { CLASSES_BY_ID, type ClassDef } from '../content/classes';
import { ITEMS_BY_ID } from '../content/items';
import { SKILLS_BY_ID } from '../content/skills';
import { seededRng } from '../engine/random';
import { loadSlot, saveSlot } from '../engine/save';
import { recruit, type GameState } from '../game/state';
import { findNode, generateMap, reachable, type MapNode, type NodeType, type RunMap } from './map';

export const LEVELS = 3;

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
}

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
  state.run = { slot, seed, level: 0, map: levelMap(seed, 0), position: null, path: [], pending: null, gold: 0, result: null, lastReward: null };
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
    return state.party.find((m) => m.skills.some((s) => s.id === id)) ?? null;
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
  const holder = state.party.find((m) => m.skills.some((s) => s.id === id));
  if (!holder) return;
  // Skills that needed it can't stay equipped without it.
  const dependents = holder.skills.filter((s) => s.prerequisite === id);
  state.inventory.skills.push(...dependents);
  const skills = holder.skills.filter((s) => s.id !== id && s.prerequisite !== id);
  state.party = state.party.map((m) => (m === holder ? { ...m, skills } : m));
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

interface SavedMember {
  classId: string;
  skills: string[];
  equipment: Partial<Record<EquipSlot, string>>;
}

export interface SavedRun {
  run: RunState;
  party: SavedMember[];
  inventory: { skills: string[]; items: string[] };
}

export function toSave(state: GameState): SavedRun {
  if (!state.run) throw new Error('No run to save');
  return {
    run: state.run,
    party: state.party.map((m) => ({
      classId: m.def.id,
      skills: m.skills.map((s) => s.id),
      equipment: Object.fromEntries(Object.entries(m.equipment).map(([slot, item]) => [slot, item!.id])),
    })),
    inventory: { skills: state.inventory.skills.map((s) => s.id), items: state.inventory.items.map((i) => i.id) },
  };
}

// A run reloaded mid-node restarts that node from the map.
export function fromSave(saved: SavedRun, state: GameState): void {
  state.run = { ...saved.run, path: saved.run.path ?? [], pending: null, lastReward: saved.run.lastReward ?? null };
  state.party = saved.party.map(
    (m): PartyMember => ({
      def: CLASSES_BY_ID[m.classId],
      skills: m.skills.map((id) => SKILLS_BY_ID[id]).filter(Boolean),
      equipment: Object.fromEntries(
        Object.entries(m.equipment).flatMap(([slot, id]) => (ITEMS_BY_ID[id!] ? [[slot, ITEMS_BY_ID[id!]]] : [])),
      ),
    }),
  );
  state.inventory = {
    skills: saved.inventory.skills.map((id) => SKILLS_BY_ID[id]).filter(Boolean),
    items: saved.inventory.items.map((id) => ITEMS_BY_ID[id]).filter(Boolean),
  };
}

export function saveRun(state: GameState): boolean {
  return !!state.run && saveSlot(state.run.slot, toSave(state));
}

export function loadRun(slot: number, state: GameState): boolean {
  const saved = loadSlot<SavedRun>(slot);
  if (!saved) return false;
  fromSave(saved.data, state);
  return true;
}

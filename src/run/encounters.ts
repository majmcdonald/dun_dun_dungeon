import type { CombatantDef } from '../combat/types';
import { ACTS, type ActEncounters, type EncounterDef } from '../content/encounters';
import { ENEMIES_BY_ID, MAP_ENCOUNTER } from '../content/enemies';
import { seededRng } from '../engine/random';
import type { GameState } from '../game/state';
import type { MapNode } from './map';

export const ROOMS_PER_GROUP = 5;

// Which third of the act a room is in: 0 for rooms 1–5, 1 for 6–10, 2 for 11–15.
export function groupOf(node: MapNode): number {
  return Math.min(2, Math.floor(node.floor / ROOMS_PER_GROUP));
}

function poolFor(acts: ActEncounters[], level: number, node: MapNode): EncounterDef[] {
  const act = acts[Math.min(level, acts.length - 1)];
  if (node.type === 'epic') return act.epics;
  if (node.type === 'boss') return act.bosses;
  return act.battles[groupOf(node)] ?? [];
}

// Picks the fight for a Battle, Epic Monster, or Boss room, seeded by the room so a reload gets the same one.
// Battles never repeat in a run while the group has unused fights (then the least recently used repeats);
// Epic Monsters cycle: once all of an act's have been met, they all become available again.
export function pickEncounter(state: GameState, node: MapNode, acts: ActEncounters[] = ACTS): EncounterDef | null {
  const run = state.run!;
  const pool = poolFor(acts, run.level, node);
  if (run.encounter?.node === node.id) return pool.find((e) => e.id === run.encounter!.id) ?? null;
  if (pool.length === 0) return null;
  const used = run.usedEncounters;
  let options = pool.filter((e) => !used.includes(e.id));
  if (options.length === 0) {
    if (node.type === 'epic') {
      run.usedEncounters = used.filter((id) => !pool.some((e) => e.id === id));
      options = pool;
    } else {
      const lastUse = (e: EncounterDef) => used.lastIndexOf(e.id);
      const oldest = Math.min(...pool.map(lastUse));
      options = pool.filter((e) => lastUse(e) === oldest);
    }
  }
  const rng = seededRng(run.seed * 389 + run.level * 53 + node.floor * 13 + node.column);
  const picked = options[Math.floor(rng() * options.length)];
  run.usedEncounters = [...run.usedEncounters.filter((id) => id !== picked.id), picked.id];
  run.encounter = { node: node.id, id: picked.id };
  return picked;
}

export function encounterById(id: string): EncounterDef | null {
  for (const act of ACTS) {
    for (const e of [...act.battles.flat(), ...act.epics, ...act.bosses]) if (e.id === id) return e;
  }
  return null;
}

export function encounterEnemies(encounter: EncounterDef): (CombatantDef | null)[] {
  return encounter.enemies.map((id) => (id ? ENEMIES_BY_ID[id] : null));
}

// The enemies of the room being played; the old one-of-each fight where an act has no content yet.
export function currentEncounter(state: GameState): (CombatantDef | null)[] {
  const id = state.run?.encounter?.id;
  const encounter = id ? encounterById(id) : null;
  return encounter ? encounterEnemies(encounter) : MAP_ENCOUNTER;
}

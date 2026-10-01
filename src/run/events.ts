import type { PartyStart } from '../combat/battle';
import type { EquipmentDef, Rarity, Stats } from '../combat/types';
import { ITEM_LIBRARY } from '../content/items';
import { SKILL_LIBRARY } from '../content/skills';
import { seededRng, type Rng } from '../engine/random';
import { equipItemBlock, skillAccessBlock } from '../game/loadout';
import type { GameState } from '../game/state';
import { STAT_LABEL } from '../ui/partyCard';
import type { MapNode } from './map';
import { NORMAL_WEIGHTS, pickWeighted, RICH_WEIGHTS } from './rewards';

export const MIN_CHANCE = 0.1;
export const MAX_CHANCE = 0.95;
export const WOUNDED_HP = 0.75;

// A choice can test one party stat: the best single member's, or the whole party's sum (gear included).
// Meeting `difficulty` gives a 50% chance; the chance scales with the stat, clamped to 10–95%.
export interface StatCheck {
  stat: keyof Stats;
  mode: 'highest' | 'total';
  difficulty: number;
}

export type Outcome =
  | { kind: 'gold'; amount: number }
  // A random skill/item someone in the party can use: of `rarity`, or rolled with the usual weights.
  | { kind: 'skill'; rarity?: Rarity }
  | { kind: 'item'; rarity?: Rarity }
  // A random piece of gear, equipped or not.
  | { kind: 'loseItem' }
  | { kind: 'wounded' }
  | { kind: 'blessed'; bonus: Partial<Stats> }
  // A fight against these enemy ids (the map encounter if omitted); a win pays an Epic Monster reward.
  | { kind: 'fight'; enemies?: string[] };

export interface Result {
  text: string;
  outcomes: Outcome[];
}

export interface EventChoice {
  label: string;
  check?: StatCheck;
  // Plain luck instead of a stat: the chance to succeed.
  chance?: number;
  // Gold the party must have to pick it (the payment itself is a gold outcome).
  cost?: number;
  success: Result;
  // Only for checked or chance choices.
  failure?: Result;
}

// The odds of a choice succeeding: 1 when there's nothing to roll.
export function choiceChance(state: GameState, choice: EventChoice): number {
  if (choice.chance !== undefined) return choice.chance;
  return choice.check ? checkChance(state, choice.check) : 1;
}

export interface EventDef {
  id: string;
  title: string;
  // Illustration id (64×64).
  art: string;
  text: string;
  choices: EventChoice[];
}

// The event at a node and, once chosen, what happened; saved so a reload can't reroll it.
export interface EventVisit {
  node: string;
  id: string;
  result: EventResult | null;
}

export interface EventResult {
  choice: number;
  success: boolean;
  text: string;
  // What changed, one line each (e.g. "+30 GOLD").
  lines: string[];
  // Enemy ids to fight next, if the outcome was a fight.
  fight: string[] | null;
}

export function partyStat(state: GameState, check: StatCheck): number {
  const values = state.party.map(
    (m) => m.def.stats[check.stat] + Object.values(m.equipment).reduce((sum, i) => sum + (i?.stats[check.stat] ?? 0), 0),
  );
  if (values.length === 0) return 0;
  return check.mode === 'highest' ? Math.max(...values) : values.reduce((a, b) => a + b, 0);
}

export function checkChance(state: GameState, check: StatCheck): number {
  const chance = (0.5 * partyStat(state, check)) / check.difficulty;
  return Math.min(MAX_CHANCE, Math.max(MIN_CHANCE, chance));
}

// Picks this node's event, seeded by the node so a reload picks the same one. Each event appears once per
// run until all have been seen.
export function openEvent(state: GameState, node: MapNode, library: EventDef[]): EventDef {
  const run = state.run!;
  const byId = (id: string) => library.find((e) => e.id === id)!;
  if (run.event?.node === node.id) return byId(run.event.id);
  const unseen = library.filter((e) => !run.seenEvents.includes(e.id));
  const pool = unseen.length > 0 ? unseen : library;
  const rng = seededRng(run.seed * 613 + run.level * 97 + node.floor * 11 + node.column);
  const event = pool[Math.floor(rng() * pool.length)];
  run.event = { node: node.id, id: event.id, result: null };
  run.seenEvents.push(event.id);
  return event;
}

export function canAfford(state: GameState, choice: EventChoice): boolean {
  return state.run!.gold >= (choice.cost ?? 0);
}

// Resolves a choice once: rolls any check, applies the outcomes, and records what happened.
// Returns null for a choice the party can't afford.
export function chooseOption(state: GameState, event: EventDef, index: number, rng: Rng = Math.random): EventResult | null {
  const visit = state.run!.event!;
  if (visit.result) return visit.result;
  const choice = event.choices[index];
  if (!canAfford(state, choice)) return null;
  const success = rng() < choiceChance(state, choice);
  const result = success || !choice.failure ? choice.success : choice.failure;
  const lines: string[] = [];
  let fight: string[] | null = null;
  for (const outcome of result.outcomes) {
    if (outcome.kind === 'fight') fight = outcome.enemies ?? [];
    else lines.push(...apply(state, outcome, rng));
  }
  visit.result = { choice: index, success, text: result.text, lines, fight };
  return visit.result;
}

function apply(state: GameState, outcome: Exclude<Outcome, { kind: 'fight' }>, rng: Rng): string[] {
  const run = state.run!;
  switch (outcome.kind) {
    case 'gold': {
      const change = Math.max(outcome.amount, -run.gold);
      run.gold += change;
      return change === 0 ? [] : [`${change > 0 ? '+' : ''}${change} GOLD`];
    }
    case 'skill': {
      const pool = SKILL_LIBRARY.filter((s) => state.party.some((m) => !skillAccessBlock(m, s)));
      const weights = outcome.rarity ? only(outcome.rarity) : NORMAL_WEIGHTS;
      const [skill] = pickWeighted(pool, (s) => s.rarity, weights, 1, rng);
      if (!skill) return [];
      state.inventory.skills.push(skill);
      return [`GAINED SKILL: ${skill.name.toUpperCase()}`];
    }
    case 'item': {
      const pool = ITEM_LIBRARY.filter((i) => state.party.some((m) => !equipItemBlock(m, i)));
      const weights = outcome.rarity ? only(outcome.rarity) : RICH_WEIGHTS;
      const [item] = pickWeighted(pool, (i) => i.rarity, weights, 1, rng);
      if (!item) return [];
      state.inventory.items.push(item);
      return [`GAINED ITEM: ${item.name.toUpperCase()}`];
    }
    case 'loseItem': {
      const owned: EquipmentDef[] = [
        ...state.party.flatMap((m) => Object.values(m.equipment).filter((i): i is EquipmentDef => !!i)),
        ...state.inventory.items,
      ];
      if (owned.length === 0) return [];
      const item = owned[Math.floor(rng() * owned.length)];
      const index = state.inventory.items.indexOf(item);
      if (index >= 0) state.inventory.items.splice(index, 1);
      else {
        state.party = state.party.map((m) => {
          if (m.equipment[item.slot] !== item) return m;
          const equipment = { ...m.equipment };
          delete equipment[item.slot];
          return { ...m, equipment };
        });
      }
      return [`LOST ${item.name.toUpperCase()}`];
    }
    case 'wounded':
      run.nextFight = { ...run.nextFight, hpFraction: WOUNDED_HP };
      return [`WOUNDED: NEXT FIGHT STARTS AT ${Math.round(WOUNDED_HP * 100)}% HP`];
    case 'blessed': {
      const bonus = { ...run.nextFight?.bonus };
      for (const [k, v] of Object.entries(outcome.bonus) as [keyof Stats, number][]) bonus[k] = (bonus[k] ?? 0) + v;
      run.nextFight = { ...run.nextFight, bonus };
      const parts = (Object.entries(outcome.bonus) as [keyof Stats, number][]).map(([k, v]) => `+${v} ${label(k)}`);
      return [`BLESSED: ${parts.join(', ')} NEXT FIGHT`];
    }
  }
}

// The wounded/blessed effects waiting for the next fight; using them clears them.
export function takeNextFight(state: GameState): PartyStart | undefined {
  const run = state.run;
  if (!run?.nextFight) return undefined;
  const start = run.nextFight;
  run.nextFight = null;
  return start;
}

function only(rarity: Rarity): Record<Rarity, number> {
  return { common: 0, rare: 0, epic: 0, legendary: 0, [rarity]: 1 };
}

function label(stat: keyof Stats): string {
  return STAT_LABEL.find(([k]) => k === stat)?.[1] ?? stat.toUpperCase();
}

import type { PartyMember } from '../combat/types';
import type { GameState } from '../game/state';
import type { RunState } from './run';

// A record of what happened in a run, for comparing real play with simulated runs. Kept on the run (so it is
// saved with it) and, when the run ends, stored with the last few finished runs for download from the title screen.
export type LogEntry = { kind: string; act: number; room: number } & Record<string, unknown>;

export interface FinishedRunLog {
  finishedAt: string;
  slot: number;
  won: boolean;
  entries: LogEntry[];
}

const STORAGE_KEY = 'autob.runlogs';
export const KEPT_LOGS = 10;

export function logEvent(run: RunState, kind: string, data: Record<string, unknown> = {}): void {
  const at = run.pending ?? run.position;
  const room = at ? Number(at.split('-')[0]) + 1 : 0;
  run.log = [...(run.log ?? []), { kind, act: run.level + 1, room, ...data }];
}

// Each hero's class, skills, trigger, and gear ids.
export function loadout(party: PartyMember[]): Record<string, unknown>[] {
  return party.map((m) => ({
    class: m.def.id,
    skills: m.skills.map((s) => s.id),
    trigger: m.trigger?.id ?? null,
    gear: Object.fromEntries(Object.entries(m.equipment).map(([slot, item]) => [slot, item!.id])),
  }));
}

export function finishedLogs(): FinishedRunLog[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as FinishedRunLog[];
  } catch {
    return [];
  }
}

export function keepFinishedLog(state: GameState, won: boolean): void {
  const run = state.run;
  if (!run) return;
  const entry: FinishedRunLog = { finishedAt: new Date().toISOString(), slot: run.slot, won, entries: run.log ?? [] };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...finishedLogs()].slice(0, KEPT_LOGS)));
  } catch {
    // Storage full or unavailable; the log is lost, the game goes on.
  }
}

// Downloads the kept logs as a JSON file (newest run first).
export function downloadLogs(): void {
  const blob = new Blob([JSON.stringify(finishedLogs(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `dun-dun-dungeon-runs-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

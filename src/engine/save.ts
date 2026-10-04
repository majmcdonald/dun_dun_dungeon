export const SAVE_SLOTS = 3;
const SAVE_VERSION = 1;

interface SaveEnvelope<T> {
  version: number;
  savedAt: number;
  data: T;
}

export interface SlotInfo<T> {
  savedAt: number;
  data: T;
}

// Each slot holds a run in progress ('save') and the player's profile: unlocks and lifetime stats ('profile').
export type SlotKind = 'save' | 'profile';

function key(slot: number, kind: SlotKind): string {
  return `autob.${kind}.${slot}`;
}

export function saveSlot<T>(slot: number, data: T, kind: SlotKind = 'save'): boolean {
  const envelope: SaveEnvelope<T> = { version: SAVE_VERSION, savedAt: Date.now(), data };
  try {
    localStorage.setItem(key(slot, kind), JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

// Null for an empty slot, unreadable data, or a save from an older version.
export function loadSlot<T>(slot: number, kind: SlotKind = 'save'): SlotInfo<T> | null {
  try {
    const raw = localStorage.getItem(key(slot, kind));
    if (!raw) return null;
    const envelope = JSON.parse(raw) as SaveEnvelope<T>;
    if (envelope.version !== SAVE_VERSION) return null;
    return { savedAt: envelope.savedAt, data: envelope.data };
  } catch {
    return null;
  }
}

export function clearSlot(slot: number, kind: SlotKind = 'save'): void {
  try {
    localStorage.removeItem(key(slot, kind));
  } catch {
    // Storage unavailable; nothing to clear.
  }
}

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

function key(slot: number): string {
  return `autob.save.${slot}`;
}

export function saveSlot<T>(slot: number, data: T): boolean {
  const envelope: SaveEnvelope<T> = { version: SAVE_VERSION, savedAt: Date.now(), data };
  try {
    localStorage.setItem(key(slot), JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

// Null for an empty slot, unreadable data, or a save from an older version.
export function loadSlot<T>(slot: number): SlotInfo<T> | null {
  try {
    const raw = localStorage.getItem(key(slot));
    if (!raw) return null;
    const envelope = JSON.parse(raw) as SaveEnvelope<T>;
    if (envelope.version !== SAVE_VERSION) return null;
    return { savedAt: envelope.savedAt, data: envelope.data };
  } catch {
    return null;
  }
}

export function clearSlot(slot: number): void {
  try {
    localStorage.removeItem(key(slot));
  } catch {
    // Storage unavailable; nothing to clear.
  }
}

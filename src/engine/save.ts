const SAVE_KEY = 'autob.save';
const SAVE_VERSION = 1;

interface SaveEnvelope<T> {
  version: number;
  savedAt: number;
  data: T;
}

export function saveGame<T>(data: T): boolean {
  const envelope: SaveEnvelope<T> = { version: SAVE_VERSION, savedAt: Date.now(), data };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function loadGame<T>(): T | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as SaveEnvelope<T>;
    if (envelope.version !== SAVE_VERSION) return null;
    return envelope.data;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Storage unavailable; nothing to clear.
  }
}

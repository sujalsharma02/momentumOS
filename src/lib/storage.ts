/**
 * Raw localStorage access.
 *
 * Every collection lives under its own key so a single corrupt value can never
 * take the whole app down, and writes stay small. Shape repair happens one
 * layer up in `@/lib/normalize`; version stepping in `@/lib/migrate`.
 */

export const STORAGE_PREFIX = "momentum-os:";

/** Bumped whenever a stored shape changes. See `@/lib/migrate`. */
export const SCHEMA_VERSION = 2;

export const STORAGE_KEYS = {
  schemaVersion: "schemaVersion",
  dayLogs: "dayLogs",
  applications: "applications",
  notes: "notes",
  prepNotes: "prepNotes",
  prepProgress: "prepProgress",
  projects: "projects",
  engineeringLog: "engineeringLog",
  roadmap: "roadmap",
  planBlocks: "planBlocks",
  goals: "goals",
  focusSessions: "focusSessions",
  reasons: "reasons",
  celebratedOn: "celebratedOn",
  settings: "settings",
  /* app lock - see @/lib/auth */
  lock: "lock",
  sessionUntil: "sessionUntil",
  lockFailures: "lockFailures",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

function storage(): Storage | null {
  try {
    // Private-mode Safari and some embedded webviews throw on access.
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Reads and JSON-parses a key. Returns `undefined` when absent or unreadable. */
export function readRaw<T = unknown>(key: string): T | undefined {
  const store = storage();
  if (!store) return undefined;
  try {
    const raw = store.getItem(STORAGE_PREFIX + key);
    if (raw === null) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function writeRaw(key: string, value: unknown): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled - state still works in memory.
  }
}

export function removeRaw(key: string): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(STORAGE_PREFIX + key);
  } catch {
    // ignore
  }
}

/** True when the key exists at all, regardless of whether it parses. */
export function hasRaw(key: string): boolean {
  const store = storage();
  if (!store) return false;
  try {
    return store.getItem(STORAGE_PREFIX + key) !== null;
  } catch {
    return false;
  }
}

/** Every Momentum OS key currently in localStorage, without the prefix. */
export function listKeys(): string[] {
  const store = storage();
  if (!store) return [];
  const keys: string[] = [];
  try {
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) keys.push(key.slice(STORAGE_PREFIX.length));
    }
  } catch {
    return [];
  }
  return keys;
}

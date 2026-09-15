/**
 * Local app lock.
 *
 * What this is: a password gate in front of the UI, so someone who picks up
 * your laptop or opens the URL on a shared machine cannot browse your pipeline.
 *
 * What this is not: security against anyone with access to the browser
 * profile. There is no server; the data still lives in localStorage in the
 * clear, and the JavaScript that checks the password ships to the client. For
 * real protection the data would need to be encrypted at rest or moved behind a
 * backend — see README "Security".
 *
 * The password is never stored. Only a random salt and a PBKDF2-SHA256 hash
 * are kept, and nothing about the credential lives in the source repository.
 */

import { readRaw, removeRaw, STORAGE_KEYS, writeRaw } from "@/lib/storage";

export interface LockRecord {
  username: string;
  /** hex */
  salt: string;
  /** hex */
  hash: string;
  iterations: number;
  createdAt: number;
}

const ITERATIONS = 150_000;
const SESSION_KEY = "momentum-os:session";
const REMEMBER_DAYS = 30;
const MAX_FAILURES = 5;
const LOCKOUT_MS = 30_000;

/* ------------------------------------------------------------------ */
/* Hashing                                                             */
/* ------------------------------------------------------------------ */

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  return Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

export function cryptoAvailable(): boolean {
  return typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined";
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password.normalize("NFKC")),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    material,
    256,
  );
  return toHex(bits);
}

/** Constant-time-ish comparison; both inputs are fixed-length hex. */
function equal(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ------------------------------------------------------------------ */
/* Lock record                                                         */
/* ------------------------------------------------------------------ */

export function readLock(): LockRecord | null {
  const raw = readRaw<unknown>(STORAGE_KEYS.lock);
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Partial<LockRecord>;
  if (
    typeof record.username !== "string" ||
    typeof record.salt !== "string" ||
    typeof record.hash !== "string" ||
    typeof record.iterations !== "number"
  ) {
    return null;
  }
  return record as LockRecord;
}

export async function createLock(username: string, password: string): Promise<LockRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const record: LockRecord = {
    username: username.trim(),
    salt: toHex(salt),
    hash: await derive(password, salt, ITERATIONS),
    iterations: ITERATIONS,
    createdAt: Date.now(),
  };
  writeRaw(STORAGE_KEYS.lock, record);
  return record;
}

export function removeLock(): void {
  removeRaw(STORAGE_KEYS.lock);
  clearSession();
}

export async function verify(record: LockRecord, username: string, password: string): Promise<boolean> {
  if (username.trim().toLowerCase() !== record.username.toLowerCase()) {
    // Still run the hash so timing does not reveal whether the username exists.
    await derive(password, fromHex(record.salt), record.iterations);
    return false;
  }
  const hash = await derive(password, fromHex(record.salt), record.iterations);
  return equal(hash, record.hash);
}

/* ------------------------------------------------------------------ */
/* Session                                                             */
/* ------------------------------------------------------------------ */

function sessionStore(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

/** True when this tab has been unlocked, or a remembered session is valid. */
export function hasSession(): boolean {
  try {
    if (sessionStore()?.getItem(SESSION_KEY) === "1") return true;
  } catch {
    // ignore
  }
  const until = readRaw<number>(STORAGE_KEYS.sessionUntil);
  return typeof until === "number" && until > Date.now();
}

export function startSession(remember: boolean): void {
  try {
    sessionStore()?.setItem(SESSION_KEY, "1");
  } catch {
    // ignore
  }
  if (remember) writeRaw(STORAGE_KEYS.sessionUntil, Date.now() + REMEMBER_DAYS * 86_400_000);
}

export function clearSession(): void {
  try {
    sessionStore()?.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
  removeRaw(STORAGE_KEYS.sessionUntil);
}

/* ------------------------------------------------------------------ */
/* Attempt throttling                                                  */
/* ------------------------------------------------------------------ */

interface Failures {
  count: number;
  lockedUntil: number;
}

function readFailures(): Failures {
  const raw = readRaw<Partial<Failures>>(STORAGE_KEYS.lockFailures);
  return {
    count: typeof raw?.count === "number" ? raw.count : 0,
    lockedUntil: typeof raw?.lockedUntil === "number" ? raw.lockedUntil : 0,
  };
}

/** Milliseconds until another attempt is allowed; 0 when allowed now. */
export function lockoutRemaining(): number {
  return Math.max(0, readFailures().lockedUntil - Date.now());
}

export function recordFailure(): number {
  const current = readFailures();
  const count = current.count + 1;
  const lockedUntil = count >= MAX_FAILURES ? Date.now() + LOCKOUT_MS : 0;
  writeRaw(STORAGE_KEYS.lockFailures, { count: lockedUntil ? 0 : count, lockedUntil });
  return lockedUntil ? LOCKOUT_MS : 0;
}

export function clearFailures(): void {
  removeRaw(STORAGE_KEYS.lockFailures);
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  clearFailures,
  clearSession,
  createLock,
  cryptoAvailable,
  lockoutRemaining,
  readLock,
  recordFailure,
  removeLock,
  startSession,
  verify,
  type LockRecord,
} from "@/lib/auth";

export type AuthStatus =
  /** No lock configured yet — first run. */
  | "setup"
  /** Lock configured, this tab not yet unlocked. */
  | "locked"
  | "unlocked"
  /** WebCrypto missing (non-secure context); the lock cannot work. */
  | "unsupported";

interface AuthContextValue {
  status: AuthStatus;
  username: string | null;
  setup: (username: string, password: string) => Promise<void>;
  /** Resolves with an error message, or null on success. */
  unlock: (username: string, password: string, remember: boolean) => Promise<string | null>;
  lock: () => void;
  changePassword: (current: string, next: string) => Promise<string | null>;
  /** Removes the lock entirely; requires the current password. */
  disable: (current: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function initialStatus(record: LockRecord | null): AuthStatus {
  if (!cryptoAvailable()) return "unsupported";
  if (!record) return "setup";
  return "locked";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [record, setRecord] = useState<LockRecord | null>(() => readLock());
  const [status, setStatus] = useState<AuthStatus>(() => initialStatus(readLock()));

  // Trust the server-side signed cookie, not the browser's local-only session flag.
  useEffect(() => {
    let active = true;
    void fetch("/api/session", { cache: "no-store" })
      .then((response) => {
        if (!active) return;
        if (response.ok) setStatus("unlocked");
        else if (record) setStatus("locked");
        else setStatus("setup");
      })
      .catch(() => {
        if (active) setStatus(record ? "locked" : "setup");
      });
    return () => { active = false; };
  }, [record]);

  // Another tab locking or changing the password should lock this one too.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!event.key?.startsWith("momentum-os:")) return;
      const latest = readLock();
      setRecord(latest);
      if (!latest) setStatus("setup");
      else if (!hasSession()) setStatus("locked");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setup = useCallback(async (username: string, password: string) => {
    const response = await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error ?? "Cloud sign-in failed. Check your Vercel environment variables.");
    }
    const created = await createLock(username, password);
    setRecord(created);
    clearFailures();
    startSession(false);
    setStatus("unlocked");
  }, []);

  const unlock = useCallback(
    async (username: string, password: string, remember: boolean) => {
      if (!record) return "No lock is configured.";
      const wait = lockoutRemaining();
      if (wait > 0) return `Too many attempts. Try again in ${Math.ceil(wait / 1000)}s.`;
      const ok = await verify(record, username, password);
      if (!ok) {
        const lockout = recordFailure();
        return lockout > 0
          ? `Too many attempts. Try again in ${Math.ceil(lockout / 1000)}s.`
          : "Wrong username or password.";
      }
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        return result.error ?? "Cloud sign-in failed. Check your Vercel environment variables.";
      }
      clearFailures();
      startSession(remember);
      setStatus("unlocked");
      return null;
    },
    [record],
  );

  const lock = useCallback(() => {
    clearSession();
    void fetch("/api/session", { method: "DELETE" }).catch(() => undefined);
    setStatus("locked");
  }, []);

  const changePassword = useCallback(
    async (current: string, next: string) => {
      if (!record) return "No lock is configured.";
      if (!(await verify(record, record.username, current))) return "Current password is wrong.";
      const created = await createLock(record.username, next);
      setRecord(created);
      return null;
    },
    [record],
  );

  const disable = useCallback(
    async (current: string) => {
      if (!record) return "No lock is configured.";
      if (!(await verify(record, record.username, current))) return "Current password is wrong.";
      removeLock();
      setRecord(null);
      setStatus("setup");
      return null;
    },
    [record],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      username: record?.username ?? null,
      setup,
      unlock,
      lock,
      changePassword,
      disable,
    }),
    [status, record, setup, unlock, lock, changePassword, disable],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AuthStatus = "setup" | "locked" | "unlocked" | "unsupported";

interface AuthContextValue {
  status: AuthStatus;
  username: string | null;
  setup: (username: string, password: string) => Promise<void>;
  unlock: (username: string, password: string, remember: boolean) => Promise<string | null>;
  lock: () => void;
  changePassword: (current: string, next: string) => Promise<string | null>;
  disable: (current: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const DEFAULT_USERNAME = "sujalsharma02";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("locked");
  const [username, setUsername] = useState<string | null>(DEFAULT_USERNAME);

  useEffect(() => {
    let active = true;
    void fetch("/api/session", { cache: "no-store" })
      .then(async (response) => {
        if (!active) return;
        if (response.ok) {
          const result = await response.json().catch(() => ({}));
          setUsername(typeof result.username === "string" ? result.username : DEFAULT_USERNAME);
          setStatus("unlocked");
        } else {
          setStatus("locked");
        }
      })
      .catch(() => { if (active) setStatus("locked"); });
    return () => { active = false; };
  }, []);

  const signIn = useCallback(async (user: string, password: string) => {
    const response = await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: user.trim(), password }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      return result.error ?? "Cloud sign-in failed. Check the Vercel environment variables.";
    }
    setUsername(user.trim());
    setStatus("unlocked");
    return null;
  }, []);

  const setup = useCallback(async (user: string, password: string) => {
    const error = await signIn(user, password);
    if (error) throw new Error(error);
  }, [signIn]);

  const unlock = useCallback(async (user: string, password: string, _remember: boolean) => {
    return signIn(user, password);
  }, [signIn]);

  const lock = useCallback(() => {
    void fetch("/api/session", { method: "DELETE" }).catch(() => undefined);
    setStatus("locked");
  }, []);

  const changePassword = useCallback(async (_current: string, _next: string) => {
    return "Change MOMENTUM_LOGIN_PASSWORD in Vercel Environment Variables, then redeploy.";
  }, []);

  const disable = useCallback(async (_current: string) => {
    return "The cloud login cannot be disabled from the browser. Remove the login protection only by changing the server configuration.";
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    status, username, setup, unlock, lock, changePassword, disable,
  }), [status, username, setup, unlock, lock, changePassword, disable]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

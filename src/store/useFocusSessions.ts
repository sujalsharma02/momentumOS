import { useCallback, useMemo } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { todayISO } from "@/lib/dates";
import { normalizeFocusSessions } from "@/lib/normalize";
import { STORAGE_KEYS } from "@/lib/storage";
import { uid } from "@/lib/utils";
import type { FocusSession } from "@/types";

export interface FocusStore {
  sessions: FocusSession[];
  logSession: (minutes: number, label?: string) => void;
  removeSession: (id: string) => void;
  replaceSessions: (next: FocusSession[]) => void;
}

/**
 * Completed focus sprints. Kept as individual sessions rather than a running
 * count so the Statistics page can show when the work happened, not just how
 * much — the aggregate counters are updated alongside by the caller.
 */
export function useFocusSessions(): FocusStore {
  const [sessions, setSessions] = useLocalStorage<FocusSession[]>(
    STORAGE_KEYS.focusSessions,
    [],
    { normalize: normalizeFocusSessions },
  );

  const logSession = useCallback(
    (minutes: number, label?: string) => {
      if (minutes <= 0) return;
      const session: FocusSession = {
        id: uid(),
        date: todayISO(),
        minutes: Math.round(minutes),
        label: label?.trim() || undefined,
        startedAt: Date.now(),
      };
      setSessions((prev) => [session, ...prev]);
    },
    [setSessions],
  );

  const removeSession = useCallback(
    (id: string) => setSessions((prev) => prev.filter((session) => session.id !== id)),
    [setSessions],
  );

  return useMemo(
    () => ({ sessions, logSession, removeSession, replaceSessions: setSessions }),
    [sessions, logSession, removeSession, setSessions],
  );
}

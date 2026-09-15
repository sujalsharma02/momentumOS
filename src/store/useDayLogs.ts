import { useCallback, useMemo, useRef } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { todayISO } from "@/lib/dates";
import { normalizeDayLogs, type DayLogs } from "@/lib/normalize";
import { STORAGE_KEYS } from "@/lib/storage";
import type { CounterId, DayLog } from "@/types";

export type { DayLogs };

export function getLog(logs: DayLogs, date: string): DayLog {
  return logs[date] ?? { date, tasks: {}, counters: {} };
}

export interface DayLogsStore {
  logs: DayLogs;
  toggleTask: (taskId: string, date?: string) => void;
  adjustCounter: (counter: CounterId, delta: number, date?: string) => void;
  setCounter: (counter: CounterId, value: number, date?: string) => void;
  replaceLogs: (next: DayLogs | ((prev: DayLogs) => DayLogs)) => void;
}

/**
 * Per-day checklist ticks and counters.
 *
 * `planIds` — the ids the current day plan contains — is re-stamped onto a day
 * every time that day is written. Since only the day you are working on gets
 * written, past days keep the snapshot they were scored against and editing the
 * plan can never rewrite history.
 */
export function useDayLogs(planIds: string[], onTick?: () => void): DayLogsStore {
  const [logs, setLogs] = useLocalStorage<DayLogs>(STORAGE_KEYS.dayLogs, {}, {
    normalize: normalizeDayLogs,
  });

  // Held in a ref so the mutators stay referentially stable as the plan changes.
  const planIdsRef = useRef(planIds);
  planIdsRef.current = planIds;
  const tickRef = useRef(onTick);
  tickRef.current = onTick;

  const patch = useCallback(
    (date: string, apply: (log: DayLog) => DayLog) => {
      setLogs((prev) => {
        const current = prev[date] ?? { date, tasks: {}, counters: {} };
        return { ...prev, [date]: apply({ ...current, planIds: planIdsRef.current }) };
      });
    },
    [setLogs],
  );

  const toggleTask = useCallback(
    (taskId: string, date = todayISO()) => {
      tickRef.current?.();
      patch(date, (log) => {
        const tasks = { ...log.tasks };
        if (tasks[taskId]) delete tasks[taskId];
        else tasks[taskId] = true;
        return { ...log, tasks };
      });
    },
    [patch],
  );

  const adjustCounter = useCallback(
    (counter: CounterId, delta: number, date = todayISO()) => {
      patch(date, (log) => ({
        ...log,
        counters: {
          ...log.counters,
          [counter]: Math.max(0, (log.counters[counter] ?? 0) + delta),
        },
      }));
    },
    [patch],
  );

  const setCounter = useCallback(
    (counter: CounterId, value: number, date = todayISO()) => {
      patch(date, (log) => ({
        ...log,
        counters: { ...log.counters, [counter]: Math.max(0, value) },
      }));
    },
    [patch],
  );

  return useMemo(
    () => ({ logs, toggleTask, adjustCounter, setCounter, replaceLogs: setLogs }),
    [logs, toggleTask, adjustCounter, setCounter, setLogs],
  );
}

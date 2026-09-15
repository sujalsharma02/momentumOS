import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { DEFAULT_GOALS } from "@/data/goals";
import { DEFAULT_PROJECTS } from "@/data/projects";
import { DEFAULT_REASONS, DEFAULT_ROADMAP } from "@/data/roadmap";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { celebrate } from "@/lib/confetti";
import { todayISO } from "@/lib/dates";
import { buildDemoData } from "@/lib/demoData";
import {
  normalizeApplications,
  normalizeCelebratedOn,
  normalizeGoals,
  normalizeLogEntries,
  normalizeMilestones,
  normalizeNotes,
  normalizeProjects,
  normalizeReasons,
} from "@/lib/normalize";
import { playAchievement, playTick } from "@/lib/sound";
import { allDailyGoalsMet } from "@/lib/stats";
import { removeRaw, STORAGE_KEYS } from "@/lib/storage";
import { uid } from "@/lib/utils";
import { useCollection, type Collection } from "@/store/useCollection";
import { useDayLogs, type DayLogsStore } from "@/store/useDayLogs";
import { useFocusSessions, type FocusStore } from "@/store/useFocusSessions";
import { usePlan, type PlanStore } from "@/store/usePlan";
import { usePrep, type PrepStore } from "@/store/usePrep";
import type {
  Goal,
  JobApplication,
  LogEntry,
  Milestone,
  Note,
  Project,
  Reason,
} from "@/types";

/** A collection plus the `create` helper that fills in generated fields. */
type Creatable<T extends { id: string }, Input> = Collection<T> & {
  create: (input: Input) => T;
};

export type ApplicationInput = Omit<JobApplication, "id" | "createdAt" | "updatedAt">;
export type ProjectInput = Omit<Project, "id" | "createdAt" | "updatedAt">;
export type LogEntryInput = Omit<LogEntry, "id" | "createdAt">;
export type MilestoneInput = Omit<Milestone, "id">;
export type GoalInput = Omit<Goal, "id">;

interface DataContextValue {
  plan: PlanStore;
  dayLogs: DayLogsStore;
  prep: PrepStore;
  focus: FocusStore;

  applications: Creatable<JobApplication, ApplicationInput>;
  projects: Creatable<Project, ProjectInput>;
  engineeringLog: Creatable<LogEntry, LogEntryInput>;
  roadmap: Creatable<Milestone, MilestoneInput>;
  goals: Creatable<Goal, GoalInput>;
  reasons: Creatable<Reason, { text: string }>;
  notes: Collection<Note> & { create: (title: string) => Note };

  /** True once anything has been logged — drives first-run empty states. */
  hasAnyData: boolean;
  loadDemoData: () => void;
  resetAllData: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const plan = usePlan();
  const dayLogs = useDayLogs(plan.taskIds, playTick);
  const prep = usePrep();
  const focus = useFocusSessions();

  const applicationRows = useCollection<JobApplication>(STORAGE_KEYS.applications, {
    normalize: normalizeApplications,
    touch: (item) => ({ ...item, updatedAt: Date.now() }),
  });

  const projectRows = useCollection<Project>(STORAGE_KEYS.projects, {
    normalize: normalizeProjects,
    initial: DEFAULT_PROJECTS,
    touch: (item) => ({ ...item, updatedAt: Date.now() }),
  });

  const logRows = useCollection<LogEntry>(STORAGE_KEYS.engineeringLog, {
    normalize: normalizeLogEntries,
    sort: (items) =>
      [...items].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
  });

  const roadmapRows = useCollection<Milestone>(STORAGE_KEYS.roadmap, {
    normalize: normalizeMilestones,
    initial: DEFAULT_ROADMAP,
    prepend: false,
  });

  const goalRows = useCollection<Goal>(STORAGE_KEYS.goals, {
    normalize: normalizeGoals,
    initial: DEFAULT_GOALS,
    prepend: false,
  });

  const noteRows = useCollection<Note>(STORAGE_KEYS.notes, { normalize: normalizeNotes });

  const reasonRows = useCollection<Reason>(STORAGE_KEYS.reasons, {
    normalize: normalizeReasons,
    initial: DEFAULT_REASONS.map((text, index) => ({ id: `reason-${index + 1}`, text })),
    prepend: false,
  });

  const [celebratedOn, setCelebratedOn] = useLocalStorage<string>(STORAGE_KEYS.celebratedOn, "", {
    normalize: normalizeCelebratedOn,
  });

  // Confetti and fanfare once per day, the first time every daily goal is met.
  const today = todayISO();
  const goalsComplete = allDailyGoalsMet(goalRows.items, dayLogs.logs, today);
  useEffect(() => {
    if (goalsComplete && celebratedOn !== today) {
      setCelebratedOn(today);
      celebrate();
      playAchievement();
    }
  }, [goalsComplete, celebratedOn, today, setCelebratedOn]);

  const applications = useMemo<Creatable<JobApplication, ApplicationInput>>(
    () => ({
      ...applicationRows,
      create: (input) => {
        const now = Date.now();
        return applicationRows.add({ ...input, id: uid(), createdAt: now, updatedAt: now });
      },
    }),
    [applicationRows],
  );

  const projects = useMemo<Creatable<Project, ProjectInput>>(
    () => ({
      ...projectRows,
      create: (input) => {
        const now = Date.now();
        return projectRows.add({ ...input, id: uid(), createdAt: now, updatedAt: now });
      },
    }),
    [projectRows],
  );

  const engineeringLog = useMemo<Creatable<LogEntry, LogEntryInput>>(
    () => ({
      ...logRows,
      create: (input) => logRows.add({ ...input, id: uid(), createdAt: Date.now() }),
    }),
    [logRows],
  );

  const roadmap = useMemo<Creatable<Milestone, MilestoneInput>>(
    () => ({ ...roadmapRows, create: (input) => roadmapRows.add({ ...input, id: uid() }) }),
    [roadmapRows],
  );

  const goals = useMemo<Creatable<Goal, GoalInput>>(
    () => ({ ...goalRows, create: (input) => goalRows.add({ ...input, id: uid() }) }),
    [goalRows],
  );

  const reasons = useMemo<Creatable<Reason, { text: string }>>(
    () => ({
      ...reasonRows,
      create: ({ text }) => reasonRows.add({ id: uid(), text: text.trim() }),
    }),
    [reasonRows],
  );

  const notes = useMemo(
    () => ({
      ...noteRows,
      create: (title: string) =>
        noteRows.add({ id: uid(), title, content: "", updatedAt: Date.now() }),
    }),
    [noteRows],
  );

  const hasAnyData =
    Object.keys(dayLogs.logs).length > 0 ||
    applicationRows.items.length > 0 ||
    logRows.items.length > 0 ||
    focus.sessions.length > 0;

  /**
   * Fills empty collections with a realistic sample so every surface can be
   * evaluated at once. Existing data always wins — nothing the user has
   * entered is overwritten or merged over.
   */
  const loadDemoData = useCallback(() => {
    const demo = buildDemoData();
    dayLogs.replaceLogs((prev) => ({ ...demo.logs, ...prev }));
    applicationRows.replace((prev) => (prev.length ? prev : demo.applications));
    logRows.replace((prev) => (prev.length ? prev : demo.engineeringLog));
    noteRows.replace((prev) => (prev.length ? prev : demo.notes));
    focus.replaceSessions(focus.sessions.length ? focus.sessions : demo.focusSessions);
    projectRows.replace((prev) => {
      // The seeded Momentum OS entry alone still counts as "empty" here.
      const onlySeed = prev.length <= 1 && prev.every((p) => p.id === "momentum-os");
      return onlySeed ? [...prev, ...demo.projects] : prev;
    });
    prep.replaceProgress({ ...demo.prepProgress, ...prep.progress });
  }, [dayLogs, applicationRows, logRows, noteRows, focus, projectRows, prep]);

  /** Clears every data key (the app lock is kept), then reloads so stores re-seed. */
  const resetAllData = useCallback(() => {
    const keep = new Set<string>([STORAGE_KEYS.lock, STORAGE_KEYS.sessionUntil, STORAGE_KEYS.lockFailures]);
    for (const key of Object.values(STORAGE_KEYS)) {
      if (!keep.has(key)) removeRaw(key);
    }
    window.location.reload();
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      plan,
      dayLogs,
      prep,
      focus,
      applications,
      projects,
      engineeringLog,
      roadmap,
      goals,
      reasons,
      notes,
      hasAnyData,
      loadDemoData,
      resetAllData,
    }),
    [
      plan,
      dayLogs,
      prep,
      focus,
      applications,
      projects,
      engineeringLog,
      roadmap,
      goals,
      reasons,
      notes,
      hasAnyData,
      loadDemoData,
      resetAllData,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}

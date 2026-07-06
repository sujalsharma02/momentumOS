import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { celebrate } from "@/lib/confetti";
import { todayISO } from "@/lib/dates";
import { buildDemoData } from "@/lib/demoData";
import { playAchievement, playTick } from "@/lib/sound";
import { allDailyGoalsMet, getLog, type DayLogs } from "@/lib/stats";
import { uid } from "@/lib/utils";
import type { CounterId, JobApplication, Note } from "@/types";

interface DataContextValue {
  logs: DayLogs;
  applications: JobApplication[];
  notes: Note[];
  prepNotes: Record<string, string>;

  toggleTask: (taskId: string, date?: string) => void;
  adjustCounter: (counter: CounterId, delta: number, date?: string) => void;

  addApplication: (app: Omit<JobApplication, "id">) => void;
  updateApplication: (id: string, patch: Partial<JobApplication>) => void;
  deleteApplication: (id: string) => void;

  addNote: (title: string) => Note;
  updateNote: (id: string, patch: Partial<Pick<Note, "title" | "content">>) => void;
  deleteNote: (id: string) => void;

  setPrepNote: (topicId: string, content: string) => void;

  loadDemoData: () => void;
  hasAnyData: boolean;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useLocalStorage<DayLogs>("dayLogs", {});
  const [applications, setApplications] = useLocalStorage<JobApplication[]>("applications", []);
  const [notes, setNotes] = useLocalStorage<Note[]>("notes", []);
  const [prepNotes, setPrepNotes] = useLocalStorage<Record<string, string>>("prepNotes", {});
  const [celebratedOn, setCelebratedOn] = useLocalStorage<string>("celebratedOn", "");

  // Confetti + fanfare exactly once per day, when every daily goal is met.
  const today = todayISO();
  const goalsComplete = allDailyGoalsMet(logs, today);
  useEffect(() => {
    if (goalsComplete && celebratedOn !== today) {
      setCelebratedOn(today);
      celebrate();
      playAchievement();
    }
  }, [goalsComplete, celebratedOn, today, setCelebratedOn]);

  const value = useMemo<DataContextValue>(() => {
    const patchLog = (date: string, patch: (log: ReturnType<typeof getLog>) => ReturnType<typeof getLog>) => {
      setLogs((prev) => ({ ...prev, [date]: patch(getLog(prev, date)) }));
    };

    return {
      logs,
      applications,
      notes,
      prepNotes,

      toggleTask: (taskId, date = todayISO()) => {
        playTick();
        patchLog(date, (log) => ({
          ...log,
          tasks: { ...log.tasks, [taskId]: !log.tasks[taskId] },
        }));
      },

      adjustCounter: (counter, delta, date = todayISO()) => {
        patchLog(date, (log) => ({
          ...log,
          counters: {
            ...log.counters,
            [counter]: Math.max(0, (log.counters[counter] ?? 0) + delta),
          },
        }));
      },

      addApplication: (app) => {
        setApplications((prev) => [{ id: uid(), ...app }, ...prev]);
      },
      updateApplication: (id, patch) => {
        setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, ...patch } : app)));
      },
      deleteApplication: (id) => {
        setApplications((prev) => prev.filter((app) => app.id !== id));
      },

      addNote: (title) => {
        const note: Note = { id: uid(), title, content: "", updatedAt: Date.now() };
        setNotes((prev) => [note, ...prev]);
        return note;
      },
      updateNote: (id, patch) => {
        setNotes((prev) =>
          prev.map((note) => (note.id === id ? { ...note, ...patch, updatedAt: Date.now() } : note)),
        );
      },
      deleteNote: (id) => {
        setNotes((prev) => prev.filter((note) => note.id !== id));
      },

      setPrepNote: (topicId, content) => {
        setPrepNotes((prev) => ({ ...prev, [topicId]: content }));
      },

      loadDemoData: () => {
        const demo = buildDemoData();
        setLogs((prev) => ({ ...demo.logs, ...prev }));
        setApplications((prev) => (prev.length ? prev : demo.applications));
        setNotes((prev) => (prev.length ? prev : demo.notes));
      },

      hasAnyData: Object.keys(logs).length > 0 || applications.length > 0,
    };
  }, [logs, applications, notes, prepNotes, setLogs, setApplications, setNotes, setPrepNotes]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}

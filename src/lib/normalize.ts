/**
 * Defensive parsing for everything that comes out of localStorage.
 *
 * Nothing in the app trusts stored JSON directly. Each collection is run
 * through a normalizer that fills missing fields, coerces wrong types and
 * drops entries too broken to repair, so a hand-edited or half-migrated
 * payload degrades gracefully instead of crashing a page.
 */

import { todayISO } from "@/lib/dates";
import { uid } from "@/lib/utils";
import {
  APPLICATION_STATUSES,
  BLOCK_CATEGORIES,
  COUNTER_IDS,
  GOAL_CATEGORIES,
  GOAL_PERIODS,
  LOG_CATEGORIES,
  MILESTONE_STATUSES,
  PRIORITIES,
  PROJECT_STATUSES,
  TOPIC_STRENGTHS,
  WORK_MODES,
  type ApplicationStatus,
  type CounterId,
  type DayLog,
  type FocusSession,
  type Goal,
  type JobApplication,
  type LogEntry,
  type Milestone,
  type Note,
  type PlanBlock,
  type PlanTask,
  type PrepProgress,
  type PrepQuestion,
  type Project,
  type ProjectTask,
  type Reason,
  type Settings,
} from "@/types";

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/** Trimmed string, or `undefined` when empty — for optional text fields. */
function optionalStr(value: unknown): string | undefined {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : undefined;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clampNum(value: unknown, min: number, max: number, fallback = min): number {
  const n = num(value, fallback);
  return Math.min(max, Math.max(min, n));
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringArray(value: unknown): string[] {
  return arr(value)
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/** Accepts `YYYY-MM-DD`; anything else falls back (default: today). */
function isoDate(value: unknown, fallback: string = todayISO()): string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}

function optionalIsoDate(value: unknown): string | undefined {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

/** Accepts `H:MM` or `HH:MM`; normalizes to zero-padded `HH:MM`. */
function timeOfDay(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return fallback;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return fallback;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function id(value: unknown): string {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : uid();
}

function timestamp(value: unknown, fallback = Date.now()): number {
  const n = num(value, 0);
  return n > 0 ? n : fallback;
}

/** Keeps the last entry per id so a duplicated id can't render twice. */
function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Map<string, T>();
  for (const item of items) seen.set(item.id, item);
  return [...seen.values()];
}

/* ------------------------------------------------------------------ */
/* Day logs                                                            */
/* ------------------------------------------------------------------ */

export type DayLogs = Record<string, DayLog>;

function normalizeDayLog(value: unknown, date: string): DayLog {
  if (!isRecord(value)) return { date, tasks: {}, counters: {} };

  const tasks: Record<string, boolean> = {};
  if (isRecord(value.tasks)) {
    for (const [taskId, done] of Object.entries(value.tasks)) {
      if (done === true) tasks[taskId] = true;
    }
  }

  const counters: Partial<Record<CounterId, number>> = {};
  if (isRecord(value.counters)) {
    for (const counter of COUNTER_IDS) {
      const raw = value.counters[counter];
      const parsed = num(raw, 0);
      if (parsed > 0) counters[counter] = parsed;
    }
  }

  const planIds = stringArray(value.planIds);

  return {
    date: isoDate(value.date, date),
    tasks,
    counters,
    ...(planIds.length > 0 ? { planIds } : {}),
  };
}

export function normalizeDayLogs(value: unknown): DayLogs {
  if (!isRecord(value)) return {};
  const logs: DayLogs = {};
  for (const [key, log] of Object.entries(value)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
    logs[key] = normalizeDayLog(log, key);
  }
  return logs;
}

/* ------------------------------------------------------------------ */
/* Applications                                                        */
/* ------------------------------------------------------------------ */

/** v1 used four statuses; all four are still valid names in v2. */
function applicationStatus(value: unknown): ApplicationStatus {
  return oneOf(value, APPLICATION_STATUSES, "applied");
}

export function normalizeApplications(value: unknown): JobApplication[] {
  const rows = arr(value)
    .filter(isRecord)
    .map((row): JobApplication => {
      const created = timestamp(row.createdAt);
      return {
        id: id(row.id),
        company: str(row.company).trim() || "Untitled company",
        role: str(row.role).trim() || "Untitled role",
        location: optionalStr(row.location),
        workMode:
          typeof row.workMode === "string" && (WORK_MODES as string[]).includes(row.workMode)
            ? (row.workMode as JobApplication["workMode"])
            : undefined,
        compensation: optionalStr(row.compensation),
        appliedDate: isoDate(row.appliedDate),
        source: optionalStr(row.source),
        status: applicationStatus(row.status),
        contact: optionalStr(row.contact),
        followUpDate: optionalIsoDate(row.followUpDate),
        interviewDate: optionalIsoDate(row.interviewDate),
        notes: optionalStr(row.notes),
        url: optionalStr(row.url),
        priority: oneOf(row.priority, PRIORITIES, "medium"),
        createdAt: created,
        updatedAt: timestamp(row.updatedAt, created),
      };
    });
  return dedupeById(rows);
}

/* ------------------------------------------------------------------ */
/* Day plan                                                            */
/* ------------------------------------------------------------------ */

function normalizePlanTask(value: unknown): PlanTask | null {
  if (!isRecord(value)) return null;
  const label = str(value.label).trim();
  if (!label) return null;
  return { id: id(value.id), label };
}

function normalizeByWeekday(value: unknown): Record<number, string> | undefined {
  if (!isRecord(value)) return undefined;
  const result: Record<number, string> = {};
  for (const [key, focus] of Object.entries(value)) {
    const day = Number(key);
    if (!Number.isInteger(day) || day < 0 || day > 6) continue;
    const text = str(focus).trim();
    if (text) result[day] = text;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export function normalizePlanBlocks(value: unknown): PlanBlock[] {
  const blocks = arr(value)
    .filter(isRecord)
    .map((row): PlanBlock => {
      const start = timeOfDay(row.start, "09:00");
      const tasks = arr(row.tasks)
        .map(normalizePlanTask)
        .filter((task): task is PlanTask => task !== null);
      return {
        id: id(row.id),
        start,
        // An end before the start would make the block invisible on the timeline.
        end: timeOfDay(row.end, start),
        title: str(row.title).trim() || "Untitled block",
        description: optionalStr(row.description),
        category: oneOf(row.category, BLOCK_CATEGORIES, "deep-work"),
        priority: oneOf(row.priority, PRIORITIES, "medium"),
        tasks: dedupeById(tasks),
        byWeekday: normalizeByWeekday(row.byWeekday),
        counter:
          typeof row.counter === "string" && (COUNTER_IDS as string[]).includes(row.counter)
            ? (row.counter as CounterId)
            : undefined,
      };
    });
  return dedupeById(blocks).sort((a, b) => a.start.localeCompare(b.start));
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

function normalizeProjectTask(value: unknown): ProjectTask | null {
  if (!isRecord(value)) return null;
  const label = str(value.label).trim();
  if (!label) return null;
  return { id: id(value.id), label, done: bool(value.done) };
}

export function normalizeProjects(value: unknown): Project[] {
  const rows = arr(value)
    .filter(isRecord)
    .map((row): Project => {
      const created = timestamp(row.createdAt);
      const tasks = arr(row.tasks)
        .map(normalizeProjectTask)
        .filter((task): task is ProjectTask => task !== null);
      return {
        id: id(row.id),
        name: str(row.name).trim() || "Untitled project",
        description: str(row.description),
        status: oneOf(row.status, PROJECT_STATUSES, "building"),
        stack: stringArray(row.stack),
        problem: optionalStr(row.problem),
        architecture: optionalStr(row.architecture),
        deployment: optionalStr(row.deployment),
        repoUrl: optionalStr(row.repoUrl),
        liveUrl: optionalStr(row.liveUrl),
        achievements: stringArray(row.achievements),
        tasks: dedupeById(tasks),
        challenges: optionalStr(row.challenges),
        lessons: optionalStr(row.lessons),
        createdAt: created,
        updatedAt: timestamp(row.updatedAt, created),
      };
    });
  return dedupeById(rows);
}

/* ------------------------------------------------------------------ */
/* Engineering log                                                     */
/* ------------------------------------------------------------------ */

export function normalizeLogEntries(value: unknown): LogEntry[] {
  const rows = arr(value)
    .filter(isRecord)
    .map((row): LogEntry => ({
      id: id(row.id),
      date: isoDate(row.date),
      category: oneOf(row.category, LOG_CATEGORIES, "learning"),
      title: str(row.title).trim() || "Untitled entry",
      description: str(row.description),
      technologies: stringArray(row.technologies),
      impact: optionalStr(row.impact),
      lessons: optionalStr(row.lessons),
      projectId: optionalStr(row.projectId),
      createdAt: timestamp(row.createdAt),
    }));
  return dedupeById(rows).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}

/* ------------------------------------------------------------------ */
/* Interview prep                                                      */
/* ------------------------------------------------------------------ */

function normalizePrepQuestion(value: unknown): PrepQuestion | null {
  if (!isRecord(value)) return null;
  const prompt = str(value.prompt).trim();
  if (!prompt) return null;
  return { id: id(value.id), prompt, answered: bool(value.answered) };
}

export function normalizePrepProgress(value: unknown): Record<string, PrepProgress> {
  if (!isRecord(value)) return {};
  const result: Record<string, PrepProgress> = {};
  for (const [topicId, raw] of Object.entries(value)) {
    if (!isRecord(raw)) continue;
    const questions = arr(raw.questions)
      .map(normalizePrepQuestion)
      .filter((question): question is PrepQuestion => question !== null);
    result[topicId] = {
      readiness: clampNum(raw.readiness, 0, 100, 0),
      strength: oneOf(raw.strength, TOPIC_STRENGTHS, "unrated"),
      lastStudied: optionalIsoDate(raw.lastStudied),
      notes: str(raw.notes),
      questions: dedupeById(questions),
    };
  }
  return result;
}

/** v1 stored prep notes as a flat `topicId -> markdown` map. */
export function normalizePrepNotes(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  const result: Record<string, string> = {};
  for (const [topicId, note] of Object.entries(value)) {
    if (typeof note === "string" && note.length > 0) result[topicId] = note;
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Roadmap                                                             */
/* ------------------------------------------------------------------ */

export function normalizeMilestones(value: unknown): Milestone[] {
  const rows = arr(value)
    .filter(isRecord)
    .map((row): Milestone => ({
      id: id(row.id),
      title: str(row.title).trim() || "Untitled milestone",
      detail: optionalStr(row.detail),
      targetDate: optionalIsoDate(row.targetDate),
      status: oneOf(row.status, MILESTONE_STATUSES, "later"),
      progress: clampNum(row.progress, 0, 100, 0),
      notes: optionalStr(row.notes),
    }));
  return dedupeById(rows);
}

/* ------------------------------------------------------------------ */
/* Goals                                                               */
/* ------------------------------------------------------------------ */

export function normalizeGoals(value: unknown): Goal[] {
  const rows = arr(value)
    .filter(isRecord)
    .map((row): Goal => ({
      id: id(row.id),
      label: str(row.label).trim() || "Untitled goal",
      counter:
        typeof row.counter === "string" && (COUNTER_IDS as string[]).includes(row.counter)
          ? (row.counter as CounterId)
          : "applications",
      target: Math.max(1, Math.round(num(row.target, 1))),
      period: oneOf(row.period, GOAL_PERIODS, "daily"),
      category: oneOf(row.category, GOAL_CATEGORIES, "career"),
    }));
  return dedupeById(rows);
}

/* ------------------------------------------------------------------ */
/* Focus sessions                                                      */
/* ------------------------------------------------------------------ */

export function normalizeFocusSessions(value: unknown): FocusSession[] {
  const rows = arr(value)
    .filter(isRecord)
    .map((row): FocusSession => ({
      id: id(row.id),
      date: isoDate(row.date),
      minutes: clampNum(row.minutes, 0, 24 * 60, 0),
      label: optionalStr(row.label),
      startedAt: timestamp(row.startedAt),
    }))
    .filter((session) => session.minutes > 0);
  return dedupeById(rows).sort((a, b) => b.startedAt - a.startedAt);
}

/* ------------------------------------------------------------------ */
/* Notes, reasons, settings                                            */
/* ------------------------------------------------------------------ */

export function normalizeNotes(value: unknown): Note[] {
  const rows = arr(value)
    .filter(isRecord)
    .map((row): Note => ({
      id: id(row.id),
      title: str(row.title),
      content: str(row.content),
      updatedAt: timestamp(row.updatedAt),
    }));
  return dedupeById(rows);
}

export function normalizeReasons(value: unknown): Reason[] {
  const rows = arr(value)
    .filter(isRecord)
    .map((row): Reason => ({ id: id(row.id), text: str(row.text).trim() }))
    .filter((reason) => reason.text.length > 0);
  return dedupeById(rows);
}

export function normalizeSettings(value: unknown): Settings {
  if (!isRecord(value)) return { theme: "dark", soundEnabled: true };
  return {
    theme: oneOf(value.theme, ["dark", "light"] as const, "dark"),
    soundEnabled: bool(value.soundEnabled, true),
  };
}

export function normalizeCelebratedOn(value: unknown): string {
  return typeof value === "string" ? value : "";
}

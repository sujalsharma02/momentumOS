/**
 * Derived metrics. Every function here is pure: it takes the stored
 * collections and returns numbers, so the same values can be computed for a
 * card, a chart or a test without going through a component.
 */

import {
  ACTIVE_STATUSES,
  INTERVIEW_STATUSES,
  RESPONDED_STATUSES,
} from "@/data/pipeline";
import { addDays, isSameISOWeek, isSameMonth, todayISO } from "@/lib/dates";
import type { DayLogs } from "@/lib/normalize";
import type {
  Achievement,
  ApplicationStatus,
  CounterId,
  DayLog,
  FocusSession,
  Goal,
  JobApplication,
  LogEntry,
  PrepProgress,
  PrepTopic,
} from "@/types";

export type { DayLogs };

export function getLog(logs: DayLogs, date: string): DayLog {
  return logs[date] ?? { date, tasks: {}, counters: {} };
}

export function counterValue(logs: DayLogs, date: string, counter: CounterId): number {
  return getLog(logs, date).counters[counter] ?? 0;
}

/* ------------------------------------------------------------------ */
/* Daily completion & streak                                           */
/* ------------------------------------------------------------------ */

/**
 * Task ids a given day should be scored against.
 *
 * Days log the plan they were scored on, so editing the day plan never
 * rewrites history. `currentPlanIds` only covers days written before
 * snapshots existed and days not yet touched.
 */
export function planIdsFor(logs: DayLogs, date: string, currentPlanIds: string[]): string[] {
  const snapshot = logs[date]?.planIds;
  return snapshot && snapshot.length > 0 ? snapshot : currentPlanIds;
}

/** Percentage of that day's planned checklist completed (0–100). */
export function dayCompletion(logs: DayLogs, date: string, currentPlanIds: string[]): number {
  const planIds = planIdsFor(logs, date, currentPlanIds);
  if (planIds.length === 0) return 0;
  const log = getLog(logs, date);
  const done = planIds.filter((id) => log.tasks[id]).length;
  return Math.round((done / planIds.length) * 100);
}

/** A day keeps the streak alive once at least half the plan is done. */
export function isStreakDay(logs: DayLogs, date: string, currentPlanIds: string[]): boolean {
  return dayCompletion(logs, date, currentPlanIds) >= 50;
}

/** Consecutive streak ending today, or yesterday so mornings do not show 0. */
export function currentStreak(logs: DayLogs, currentPlanIds: string[]): number {
  const today = todayISO();
  let cursor = isStreakDay(logs, today, currentPlanIds) ? today : addDays(today, -1);
  let streak = 0;
  // Bounded so a corrupt log map can never spin forever.
  for (let guard = 0; guard < 3650; guard++) {
    if (!isStreakDay(logs, cursor, currentPlanIds)) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/* ------------------------------------------------------------------ */
/* Counter aggregation                                                 */
/* ------------------------------------------------------------------ */

export function sumCounter(
  logs: DayLogs,
  counter: CounterId,
  filter: (date: string) => boolean = () => true,
): number {
  return Object.values(logs)
    .filter((log) => filter(log.date))
    .reduce((total, log) => total + (log.counters[counter] ?? 0), 0);
}

export function weeklyCounter(logs: DayLogs, counter: CounterId): number {
  return sumCounter(logs, counter, (date) => isSameISOWeek(date));
}

export function monthlyCounter(logs: DayLogs, counter: CounterId): number {
  return sumCounter(logs, counter, (date) => isSameMonth(date));
}

/* ------------------------------------------------------------------ */
/* Goals                                                               */
/* ------------------------------------------------------------------ */

/** Current value for a goal over its own period. */
export function goalValue(goal: Goal, logs: DayLogs, date = todayISO()): number {
  if (goal.period === "daily") return counterValue(logs, date, goal.counter);
  if (goal.period === "weekly") return weeklyCounter(logs, goal.counter);
  return monthlyCounter(logs, goal.counter);
}

export function goalsForPeriod(goals: Goal[], period: Goal["period"]): Goal[] {
  return goals.filter((goal) => goal.period === period);
}

export function dailyGoalsMet(goals: Goal[], logs: DayLogs, date: string): number {
  return goalsForPeriod(goals, "daily").filter(
    (goal) => goalValue(goal, logs, date) >= goal.target,
  ).length;
}

export function allDailyGoalsMet(goals: Goal[], logs: DayLogs, date: string): boolean {
  const daily = goalsForPeriod(goals, "daily");
  return daily.length > 0 && dailyGoalsMet(goals, logs, date) === daily.length;
}

/* ------------------------------------------------------------------ */
/* Job pipeline                                                        */
/* ------------------------------------------------------------------ */

export interface PipelineStats {
  total: number;
  /** Everything actually submitted — excludes saved-but-not-applied. */
  sent: number;
  appliedThisMonth: number;
  active: number;
  responded: number;
  interviewed: number;
  offers: number;
  rejected: number;
  /** 0–100 */
  responseRate: number;
  interviewRate: number;
  offerRate: number;
  byStatus: Record<ApplicationStatus, number>;
  followUpsDue: JobApplication[];
  upcomingInterviews: JobApplication[];
}

function percent(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);
}

/**
 * Applications only carry a current status, so a company that interviewed and
 * then rejected would otherwise vanish from the interview count. A recorded
 * `interviewDate` is treated as proof the stage was reached, which keeps the
 * conversion numbers honest without inventing an event history.
 */
export function pipelineStats(applications: JobApplication[], today = todayISO()): PipelineStats {
  const byStatus = {
    saved: 0,
    applied: 0,
    recruiter: 0,
    assessment: 0,
    interview: 0,
    final: 0,
    offer: 0,
    rejected: 0,
    withdrawn: 0,
  } satisfies Record<ApplicationStatus, number>;

  for (const app of applications) byStatus[app.status] += 1;

  const sent = applications.filter((app) => app.status !== "saved").length;
  const responded = applications.filter(
    (app) => RESPONDED_STATUSES.includes(app.status) || Boolean(app.interviewDate),
  ).length;
  const interviewed = applications.filter(
    (app) => INTERVIEW_STATUSES.includes(app.status) || Boolean(app.interviewDate),
  ).length;

  const followUpsDue = applications
    .filter(
      (app) =>
        app.followUpDate !== undefined &&
        app.followUpDate <= today &&
        ACTIVE_STATUSES.includes(app.status),
    )
    .sort((a, b) => (a.followUpDate ?? "").localeCompare(b.followUpDate ?? ""));

  const upcomingInterviews = applications
    .filter((app) => app.interviewDate !== undefined && app.interviewDate >= today)
    .sort((a, b) => (a.interviewDate ?? "").localeCompare(b.interviewDate ?? ""));

  return {
    total: applications.length,
    sent,
    appliedThisMonth: applications.filter(
      (app) => app.status !== "saved" && isSameMonth(app.appliedDate),
    ).length,
    active: applications.filter((app) => ACTIVE_STATUSES.includes(app.status)).length,
    responded,
    interviewed,
    offers: byStatus.offer,
    rejected: byStatus.rejected,
    responseRate: percent(responded, sent),
    interviewRate: percent(interviewed, sent),
    offerRate: percent(byStatus.offer, interviewed),
    byStatus,
    followUpsDue,
    upcomingInterviews,
  };
}

/* ------------------------------------------------------------------ */
/* Skills                                                              */
/* ------------------------------------------------------------------ */

export interface SkillStats {
  /** Mean readiness across every topic in the catalogue, 0–100. */
  readiness: number;
  rated: number;
  total: number;
  weak: PrepTopic[];
  strong: PrepTopic[];
  recentlyStudied: Array<{ topic: PrepTopic; lastStudied: string }>;
}

export function skillStats(
  topics: PrepTopic[],
  progress: Record<string, PrepProgress>,
): SkillStats {
  const entries = topics.map((topic) => ({ topic, state: progress[topic.id] }));
  const totalReadiness = entries.reduce((sum, entry) => sum + (entry.state?.readiness ?? 0), 0);

  return {
    readiness: topics.length === 0 ? 0 : Math.round(totalReadiness / topics.length),
    rated: entries.filter((entry) => (entry.state?.readiness ?? 0) > 0).length,
    total: topics.length,
    weak: entries.filter((entry) => entry.state?.strength === "weak").map((entry) => entry.topic),
    strong: entries
      .filter((entry) => entry.state?.strength === "strong")
      .map((entry) => entry.topic),
    recentlyStudied: entries
      .filter((entry): entry is { topic: PrepTopic; state: PrepProgress } =>
        Boolean(entry.state?.lastStudied),
      )
      .map((entry) => ({ topic: entry.topic, lastStudied: entry.state.lastStudied as string }))
      .sort((a, b) => b.lastStudied.localeCompare(a.lastStudied))
      .slice(0, 5),
  };
}

/* ------------------------------------------------------------------ */
/* Focus                                                               */
/* ------------------------------------------------------------------ */

export function focusMinutes(sessions: FocusSession[], filter: (date: string) => boolean): number {
  return sessions
    .filter((session) => filter(session.date))
    .reduce((total, session) => total + session.minutes, 0);
}

/* ------------------------------------------------------------------ */
/* Achievements                                                        */
/* ------------------------------------------------------------------ */

export interface AchievementInput {
  logs: DayLogs;
  applications: JobApplication[];
  entries: LogEntry[];
  planIds: string[];
}

export function computeAchievements({
  logs,
  applications,
  entries,
  planIds,
}: AchievementInput): Achievement[] {
  const pipeline = pipelineStats(applications);
  const totalApps = Math.max(sumCounter(logs, "applications"), pipeline.sent);
  const totalDsa = sumCounter(logs, "dsa");
  const totalHours = sumCounter(logs, "studyHours");
  const totalCommits = sumCounter(logs, "commits");
  const streak = currentStreak(logs, planIds);

  return [
    { id: "first-app", title: "First Shot", description: "Send your first application", icon: "Send", unlocked: totalApps >= 1 },
    { id: "apps-50", title: "Half Century", description: "50 applications sent", icon: "Target", unlocked: totalApps >= 50 },
    { id: "apps-100", title: "Centurion", description: "100 applications sent", icon: "Medal", unlocked: totalApps >= 100 },
    { id: "streak-3", title: "Warming Up", description: "3-day streak", icon: "Flame", unlocked: streak >= 3 },
    { id: "streak-7", title: "Consistent", description: "7-day streak", icon: "Zap", unlocked: streak >= 7 },
    { id: "streak-30", title: "Relentless", description: "30-day streak", icon: "Crown", unlocked: streak >= 30 },
    { id: "dsa-25", title: "Pattern Seeker", description: "25 problems solved", icon: "Binary", unlocked: totalDsa >= 25 },
    { id: "dsa-100", title: "Algorithm Fluent", description: "100 problems solved", icon: "BrainCircuit", unlocked: totalDsa >= 100 },
    { id: "hours-50", title: "Deep Diver", description: "50 hours of study", icon: "BookOpen", unlocked: totalHours >= 50 },
    { id: "commits-30", title: "Shipper", description: "30 project commits", icon: "GitCommitHorizontal", unlocked: totalCommits >= 30 },
    { id: "log-10", title: "Documented", description: "10 engineering log entries", icon: "NotebookPen", unlocked: entries.length >= 10 },
    { id: "log-50", title: "Track Record", description: "50 engineering log entries", icon: "Library", unlocked: entries.length >= 50 },
    { id: "response-1", title: "They Replied", description: "First recruiter response", icon: "MessageCircle", unlocked: pipeline.responded >= 1 },
    { id: "interview-1", title: "In the Room", description: "First interview reached", icon: "Mic", unlocked: pipeline.interviewed >= 1 },
    { id: "final-1", title: "Last Round", description: "Reach a final round", icon: "Flag", unlocked: pipeline.byStatus.final + pipeline.offers >= 1 },
    { id: "offer-1", title: "Offer", description: "First offer received", icon: "Trophy", unlocked: pipeline.offers >= 1 },
  ];
}

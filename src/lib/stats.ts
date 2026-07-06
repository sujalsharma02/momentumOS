import { DAILY_GOALS } from "@/data/goals";
import { ALL_TASK_IDS } from "@/data/timetable";
import { addDays, isSameISOWeek, isSameMonth, todayISO } from "@/lib/dates";
import type { Achievement, CounterId, DayLog, JobApplication } from "@/types";

export type DayLogs = Record<string, DayLog>;

export const EMPTY_LOG: Omit<DayLog, "date"> = { tasks: {}, counters: {} };

export function getLog(logs: DayLogs, date: string): DayLog {
  return logs[date] ?? { date, ...EMPTY_LOG };
}

export function counterValue(logs: DayLogs, date: string, counter: CounterId): number {
  return getLog(logs, date).counters[counter] ?? 0;
}

/** % of today's timetable checklist completed (0–100). */
export function dayCompletion(logs: DayLogs, date: string): number {
  const log = getLog(logs, date);
  const done = ALL_TASK_IDS.filter((id) => log.tasks[id]).length;
  return Math.round((done / ALL_TASK_IDS.length) * 100);
}

/** A day keeps the streak alive when at least half of the timetable is done. */
export function isStreakDay(logs: DayLogs, date: string): boolean {
  return dayCompletion(logs, date) >= 50;
}

/** Consecutive streak ending today (or yesterday, so mornings don't show 0). */
export function currentStreak(logs: DayLogs): number {
  const today = todayISO();
  let cursor = isStreakDay(logs, today) ? today : addDays(today, -1);
  let streak = 0;
  while (isStreakDay(logs, cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

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

export function dailyGoalsMet(logs: DayLogs, date: string): number {
  return DAILY_GOALS.filter((goal) => counterValue(logs, date, goal.counter) >= goal.target).length;
}

export function allDailyGoalsMet(logs: DayLogs, date: string): boolean {
  return dailyGoalsMet(logs, date) === DAILY_GOALS.length;
}

export interface DreamMeterStats {
  applicationsThisMonth: number;
  recruitersThisMonth: number;
  interviews: number;
  offers: number;
}

export function dreamMeterStats(logs: DayLogs, applications: JobApplication[]): DreamMeterStats {
  return {
    applicationsThisMonth: monthlyCounter(logs, "applications"),
    recruitersThisMonth: monthlyCounter(logs, "recruiters"),
    interviews: applications.filter((a) => a.status === "interview").length,
    offers: applications.filter((a) => a.status === "offer").length,
  };
}

export function computeAchievements(logs: DayLogs, applications: JobApplication[]): Achievement[] {
  const totalApps = sumCounter(logs, "applications") + applications.length;
  const totalDsa = sumCounter(logs, "dsa");
  const totalHours = sumCounter(logs, "studyHours");
  const totalCommits = sumCounter(logs, "commits");
  const streak = currentStreak(logs);
  const interviews = applications.filter((a) => a.status === "interview").length;
  const offers = applications.filter((a) => a.status === "offer").length;

  return [
    { id: "first-app", title: "First Shot", description: "Send your first application", icon: "Send", unlocked: totalApps >= 1 },
    { id: "apps-50", title: "Half Century", description: "50 total applications", icon: "Target", unlocked: totalApps >= 50 },
    { id: "apps-100", title: "Centurion", description: "100 total applications", icon: "Medal", unlocked: totalApps >= 100 },
    { id: "streak-3", title: "Warming Up", description: "3-day streak", icon: "Flame", unlocked: streak >= 3 },
    { id: "streak-7", title: "On Fire", description: "7-day streak", icon: "Zap", unlocked: streak >= 7 },
    { id: "streak-30", title: "Unstoppable", description: "30-day streak", icon: "Crown", unlocked: streak >= 30 },
    { id: "dsa-25", title: "Pattern Seeker", description: "25 DSA questions solved", icon: "Binary", unlocked: totalDsa >= 25 },
    { id: "dsa-100", title: "Algorithm Ace", description: "100 DSA questions solved", icon: "BrainCircuit", unlocked: totalDsa >= 100 },
    { id: "hours-50", title: "Deep Diver", description: "50 hours of AI study", icon: "BookOpen", unlocked: totalHours >= 50 },
    { id: "commits-30", title: "Shipper", description: "30 project commits", icon: "GitCommitHorizontal", unlocked: totalCommits >= 30 },
    { id: "interview-1", title: "In the Room", description: "First interview landed", icon: "Mic", unlocked: interviews >= 1 },
    { id: "offer-1", title: "Dream Unlocked", description: "First offer received", icon: "Trophy", unlocked: offers >= 1 },
  ];
}

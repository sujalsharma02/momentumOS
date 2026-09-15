/**
 * Domain models for Momentum OS.
 *
 * Everything persisted to localStorage is described here. Fields added after
 * v1 are optional or defaulted in `@/lib/normalize` so older payloads keep
 * loading — see `@/lib/migrate` for the version history.
 */

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */

export type Priority = "low" | "medium" | "high";

export const PRIORITIES: Priority[] = ["low", "medium", "high"];

/* ------------------------------------------------------------------ */
/* Daily logging                                                       */
/* ------------------------------------------------------------------ */

/**
 * Counters aggregated per day. `alumni`, `hiringManagers` and `linkedinPosts`
 * predate the 2026 rewrite; they are no longer surfaced by default but stay in
 * the union so historical logs keep their values.
 */
export type CounterId =
  | "applications"
  | "recruiters"
  | "alumni"
  | "hiringManagers"
  | "dsa"
  | "studyHours"
  | "commits"
  | "linkedinPosts"
  | "focusSessions"
  | "focusMinutes";

export const COUNTER_IDS: CounterId[] = [
  "applications",
  "recruiters",
  "alumni",
  "hiringManagers",
  "dsa",
  "studyHours",
  "commits",
  "linkedinPosts",
  "focusSessions",
  "focusMinutes",
];

export interface DayLog {
  date: string;
  /** taskId -> done, for day-plan checklist items */
  tasks: Record<string, boolean>;
  counters: Partial<Record<CounterId, number>>;
  /**
   * Task ids that were planned on this date. Snapshotted the first time the day
   * is touched so editing the plan never rewrites historical completion.
   */
  planIds?: string[];
}

/* ------------------------------------------------------------------ */
/* Day plan (formerly "timetable")                                     */
/* ------------------------------------------------------------------ */

export type BlockCategory =
  | "deep-work"
  | "job-search"
  | "interview-prep"
  | "learning"
  | "project"
  | "admin"
  | "personal";

export const BLOCK_CATEGORIES: BlockCategory[] = [
  "deep-work",
  "job-search",
  "interview-prep",
  "learning",
  "project",
  "admin",
  "personal",
];

export interface PlanTask {
  id: string;
  label: string;
}

export interface PlanBlock {
  id: string;
  /** 24h "HH:MM" */
  start: string;
  end: string;
  title: string;
  description?: string;
  category: BlockCategory;
  priority: Priority;
  tasks: PlanTask[];
  /** weekday-specific focus, keyed 0 (Sunday) .. 6 (Saturday) */
  byWeekday?: Record<number, string>;
  counter?: CounterId;
}

/* ------------------------------------------------------------------ */
/* Job pipeline                                                        */
/* ------------------------------------------------------------------ */

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "recruiter"
  | "assessment"
  | "interview"
  | "final"
  | "offer"
  | "rejected"
  | "withdrawn";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "saved",
  "applied",
  "recruiter",
  "assessment",
  "interview",
  "final",
  "offer",
  "rejected",
  "withdrawn",
];

export type WorkMode = "remote" | "hybrid" | "onsite";

export const WORK_MODES: WorkMode[] = ["remote", "hybrid", "onsite"];

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  location?: string;
  workMode?: WorkMode;
  /** free text, so any currency or "not disclosed" works */
  compensation?: string;
  appliedDate: string;
  /** where the role came from: LinkedIn, referral, careers page... */
  source?: string;
  status: ApplicationStatus;
  /** recruiter or hiring-manager contact */
  contact?: string;
  followUpDate?: string;
  interviewDate?: string;
  notes?: string;
  url?: string;
  priority: Priority;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

export type ProjectStatus = "idea" | "building" | "shipped" | "maintaining" | "archived";

export const PROJECT_STATUSES: ProjectStatus[] = [
  "idea",
  "building",
  "shipped",
  "maintaining",
  "archived",
];

export interface ProjectTask {
  id: string;
  label: string;
  done: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  stack: string[];
  /** the real-world problem it solves - the bit interviewers ask about */
  problem?: string;
  architecture?: string;
  deployment?: string;
  repoUrl?: string;
  liveUrl?: string;
  achievements: string[];
  tasks: ProjectTask[];
  challenges?: string;
  lessons?: string;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/* Engineering log                                                     */
/* ------------------------------------------------------------------ */

export type LogCategory =
  | "bug"
  | "architecture"
  | "incident"
  | "performance"
  | "ai"
  | "deployment"
  | "debugging"
  | "learning"
  | "decision";

export const LOG_CATEGORIES: LogCategory[] = [
  "bug",
  "architecture",
  "incident",
  "performance",
  "ai",
  "deployment",
  "debugging",
  "learning",
  "decision",
];

export interface LogEntry {
  id: string;
  date: string;
  category: LogCategory;
  title: string;
  description: string;
  technologies: string[];
  /** what measurably changed - the sentence you reuse in an interview */
  impact?: string;
  lessons?: string;
  projectId?: string;
  createdAt: number;
}

/* ------------------------------------------------------------------ */
/* Interview prep                                                      */
/* ------------------------------------------------------------------ */

export type PrepDomain = "frontend" | "backend" | "engineering" | "ai";

export const PREP_DOMAINS: PrepDomain[] = ["frontend", "backend", "engineering", "ai"];

export type TopicStrength = "unrated" | "weak" | "developing" | "strong";

export const TOPIC_STRENGTHS: TopicStrength[] = ["unrated", "weak", "developing", "strong"];

export interface PrepTopic {
  id: string;
  title: string;
  domain: PrepDomain;
  description: string;
  icon: string;
}

export interface PrepQuestion {
  id: string;
  prompt: string;
  answered: boolean;
}

export interface PrepProgress {
  /** 0-100, self-assessed */
  readiness: number;
  strength: TopicStrength;
  lastStudied?: string;
  notes: string;
  questions: PrepQuestion[];
}

/* ------------------------------------------------------------------ */
/* Career roadmap                                                      */
/* ------------------------------------------------------------------ */

export type MilestoneStatus = "done" | "active" | "next" | "later";

export const MILESTONE_STATUSES: MilestoneStatus[] = ["done", "active", "next", "later"];

export interface Milestone {
  id: string;
  title: string;
  detail?: string;
  /** optional - this is a planning tool, not a prediction engine */
  targetDate?: string;
  status: MilestoneStatus;
  /** 0-100, self-assessed */
  progress: number;
  notes?: string;
}

/* ------------------------------------------------------------------ */
/* Goals                                                               */
/* ------------------------------------------------------------------ */

export type GoalPeriod = "daily" | "weekly" | "monthly";

export const GOAL_PERIODS: GoalPeriod[] = ["daily", "weekly", "monthly"];

export type GoalCategory = "career" | "technical" | "build" | "personal";

export const GOAL_CATEGORIES: GoalCategory[] = ["career", "technical", "build", "personal"];

export interface Goal {
  id: string;
  label: string;
  counter: CounterId;
  target: number;
  period: GoalPeriod;
  category: GoalCategory;
}

/* ------------------------------------------------------------------ */
/* Focus                                                               */
/* ------------------------------------------------------------------ */

export interface FocusSession {
  id: string;
  date: string;
  minutes: number;
  label?: string;
  startedAt: number;
}

/* ------------------------------------------------------------------ */
/* Notes & misc                                                        */
/* ------------------------------------------------------------------ */

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export interface Reason {
  id: string;
  text: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface Settings {
  theme: "dark" | "light";
  soundEnabled: boolean;
}

export type CounterId =
  | "applications"
  | "recruiters"
  | "alumni"
  | "hiringManagers"
  | "dsa"
  | "studyHours"
  | "commits"
  | "linkedinPosts";

export interface DayLog {
  date: string;
  /** taskId -> done, for timetable checklist items */
  tasks: Record<string, boolean>;
  counters: Partial<Record<CounterId, number>>;
}

export type ApplicationStatus = "applied" | "interview" | "offer" | "rejected";

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  appliedDate: string;
  status: ApplicationStatus;
  followUpDate?: string;
  notes?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export interface Goal {
  id: string;
  label: string;
  counter: CounterId;
  target: number;
  period: "daily" | "weekly";
}

export interface TimetableTask {
  id: string;
  label: string;
}

export interface TimetableBlock {
  id: string;
  start: string;
  end: string;
  title: string;
  description?: string;
  icon: string;
  accent: string;
  tasks: TimetableTask[];
  /** weekday-specific focus, keyed 0 (Sunday) .. 6 (Saturday) */
  byWeekday?: Record<number, string>;
  counter?: CounterId;
}

export interface PrepTopic {
  id: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
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

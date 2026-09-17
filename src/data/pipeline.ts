import type { ApplicationStatus, LogCategory, Priority, WorkMode } from "@/types";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "destructive"
  | "info";

export interface StatusMeta {
  label: string;
  accent: string;
  variant: BadgeVariant;
  /** Where the status sits in the funnel. Drives which metrics count it. */
  stage: "prospect" | "open" | "closed" | "won";
}

/**
 * Colours come from the reserved status palette (blue / amber / green / red),
 * never from the categorical series palette used by charts.
 */
export const STATUS_META: Record<ApplicationStatus, StatusMeta> = {
  saved: { label: "Saved", accent: "#898791", variant: "outline", stage: "prospect" },
  applied: { label: "Applied", accent: "#3987e5", variant: "info", stage: "open" },
  recruiter: { label: "Recruiter", accent: "#5b8def", variant: "info", stage: "open" },
  assessment: { label: "Assessment", accent: "#c98500", variant: "warning", stage: "open" },
  interview: { label: "Interview", accent: "#c98500", variant: "warning", stage: "open" },
  final: { label: "Final Round", accent: "#d95926", variant: "warning", stage: "open" },
  offer: { label: "Offer", accent: "#0ca30c", variant: "success", stage: "won" },
  rejected: { label: "Rejected", accent: "#e66767", variant: "destructive", stage: "closed" },
  withdrawn: { label: "Withdrawn", accent: "#898791", variant: "secondary", stage: "closed" },
};

/** Pipeline order, left to right — used by the board view and the funnel. */
export const PIPELINE_ORDER: ApplicationStatus[] = [
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

/** Statuses that represent a live opportunity needing attention. */
export const ACTIVE_STATUSES: ApplicationStatus[] = [
  "applied",
  "recruiter",
  "assessment",
  "interview",
  "final",
];

/** Reaching any of these means the company responded. */
export const RESPONDED_STATUSES: ApplicationStatus[] = [
  "recruiter",
  "assessment",
  "interview",
  "final",
  "offer",
];

/** Reaching any of these means an interview actually happened. */
export const INTERVIEW_STATUSES: ApplicationStatus[] = ["interview", "final", "offer"];

export const WORK_MODE_LABEL: Record<WorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

export const PRIORITY_META: Record<Priority, { label: string; accent: string }> = {
  low: { label: "Low", accent: "#898791" },
  medium: { label: "Medium", accent: "#3987e5" },
  high: { label: "High", accent: "#d95926" },
};

export interface LogCategoryMeta {
  label: string;
  icon: string;
  accent: string;
}

export const LOG_CATEGORY_META: Record<LogCategory, LogCategoryMeta> = {
  bug: { label: "Bug fixed", icon: "Bug", accent: "#e66767" },
  architecture: { label: "Architecture", icon: "Network", accent: "#f04e23" },
  incident: { label: "Incident", icon: "Siren", accent: "#d95926" },
  performance: { label: "Performance", icon: "Gauge", accent: "#c98500" },
  ai: { label: "AI experiment", icon: "Sparkles", accent: "#9085e9" },
  deployment: { label: "Deployment", icon: "Rocket", accent: "#3987e5" },
  debugging: { label: "Debugging", icon: "Search", accent: "#5b8def" },
  learning: { label: "Learned", icon: "BookOpen", accent: "#199e70" },
  decision: { label: "Decision", icon: "GitFork", accent: "#c2569a" },
};

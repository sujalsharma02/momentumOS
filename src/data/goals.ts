import type { Goal, GoalCategory } from "@/types";

export interface GoalCategoryMeta {
  label: string;
  description: string;
  icon: string;
  accent: string;
}

export const GOAL_CATEGORY_META: Record<GoalCategory, GoalCategoryMeta> = {
  career: {
    label: "Career",
    description: "Applications, outreach, interview reps.",
    icon: "Briefcase",
    accent: "#3987e5",
  },
  technical: {
    label: "Technical",
    description: "Depth in the things interviews actually probe.",
    icon: "BrainCircuit",
    accent: "#7c6cf0",
  },
  build: {
    label: "Building",
    description: "Shipping real software you can point at.",
    icon: "Hammer",
    accent: "#d95926",
  },
  personal: {
    label: "Personal",
    description: "The habits that make the rest sustainable.",
    icon: "Heart",
    accent: "#c2569a",
  },
};

/**
 * Starting goals for a new install. Editable at runtime — targets are
 * deliberately modest and sustainable rather than the old volume-first numbers
 * (20 applications a day burns out and produces worse applications).
 */
export const DEFAULT_GOALS: Goal[] = [
  /* ---- Daily ---- */
  {
    id: "d-apps",
    label: "Targeted applications",
    counter: "applications",
    target: 5,
    period: "daily",
    category: "career",
  },
  {
    id: "d-prep",
    label: "Hours of focused study",
    counter: "studyHours",
    target: 2,
    period: "daily",
    category: "technical",
  },
  {
    id: "d-dsa",
    label: "Problems solved",
    counter: "dsa",
    target: 2,
    period: "daily",
    category: "technical",
  },
  {
    id: "d-commit",
    label: "Project commits",
    counter: "commits",
    target: 1,
    period: "daily",
    category: "build",
  },
  {
    id: "d-focus",
    label: "Deep focus sessions",
    counter: "focusSessions",
    target: 3,
    period: "daily",
    category: "personal",
  },

  /* ---- Weekly ---- */
  {
    id: "w-apps",
    label: "Applications sent",
    counter: "applications",
    target: 25,
    period: "weekly",
    category: "career",
  },
  {
    id: "w-recruiters",
    label: "Recruiter / referral conversations",
    counter: "recruiters",
    target: 5,
    period: "weekly",
    category: "career",
  },
  {
    id: "w-commits",
    label: "Commits shipped",
    counter: "commits",
    target: 10,
    period: "weekly",
    category: "build",
  },
  {
    id: "w-study",
    label: "Hours of study",
    counter: "studyHours",
    target: 12,
    period: "weekly",
    category: "technical",
  },

  /* ---- Monthly ---- */
  {
    id: "m-apps",
    label: "Applications sent",
    counter: "applications",
    target: 100,
    period: "monthly",
    category: "career",
  },
  {
    id: "m-study",
    label: "Hours of study",
    counter: "studyHours",
    target: 50,
    period: "monthly",
    category: "technical",
  },
];

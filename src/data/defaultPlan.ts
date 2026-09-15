import type { BlockCategory, PlanBlock } from "@/types";

/**
 * The exact checklist item ids shipped by the pre-2026 hardcoded timetable.
 *
 * Frozen on purpose: the v1 -> v2 migration stamps this list onto every day log
 * that predates the editable day plan, so historical completion percentages
 * (and the streak derived from them) stay exactly what they were. Never edit.
 */
export const LEGACY_TASK_IDS: readonly string[] = Object.freeze([
  "morning:wake",
  "morning:exercise",
  "morning:breakfast",
  "applications:jd",
  "applications:resume",
  "applications:apply",
  "applications:recruiter",
  "applications:track",
  "networking:recruiters",
  "networking:alumni",
  "networking:managers",
  "lunch:eat",
  "prep:study",
  "prep:notes",
  "prep:questions",
  "dsa:q1",
  "dsa:q2",
  "dsa:review",
  "ai:study",
  "ai:handson",
  "dinner:eat",
  "project:work",
  "project:commit",
  "linkedin:engage",
  "linkedin:draft",
  "mock:practice",
  "mock:feedback",
]);

/**
 * Starting template for a new install. Fully editable at runtime — this is a
 * default, not a schedule the app enforces.
 *
 * Task ids are deliberately reused from the legacy timetable wherever the
 * activity is the same, so anyone upgrading mid-day keeps their ticks.
 */
export const DEFAULT_PLAN: PlanBlock[] = [
  {
    id: "morning",
    start: "07:30",
    end: "08:30",
    title: "Morning",
    description: "Move first, screens second.",
    category: "personal",
    priority: "low",
    tasks: [
      { id: "morning:wake", label: "Wake up, hydrate" },
      { id: "morning:exercise", label: "Train / move" },
      { id: "morning:breakfast", label: "Breakfast + set today's focus" },
    ],
  },
  {
    id: "deep-work",
    start: "09:00",
    end: "11:00",
    title: "Deep Work",
    description: "The one thing that moves the needle, before anything else can interrupt it.",
    category: "deep-work",
    priority: "high",
    tasks: [
      { id: "deep:primary", label: "Ship today's most important thing" },
      { id: "deep:review", label: "Review what you shipped" },
    ],
  },
  {
    id: "job-search",
    start: "11:00",
    end: "12:30",
    title: "Job Search",
    description: "Quality over volume — roles worth tailoring for.",
    category: "job-search",
    priority: "high",
    counter: "applications",
    tasks: [
      { id: "applications:jd", label: "Shortlist roles worth applying to" },
      { id: "applications:resume", label: "Tailor CV + cover note" },
      { id: "applications:apply", label: "Submit applications" },
      { id: "applications:track", label: "Log them in the tracker" },
      { id: "networking:recruiters", label: "Message a recruiter or referral" },
    ],
  },
  {
    id: "lunch",
    start: "12:30",
    end: "13:30",
    title: "Lunch",
    category: "personal",
    priority: "low",
    tasks: [{ id: "lunch:eat", label: "Lunch, away from the screen" }],
  },
  {
    id: "interview-prep",
    start: "13:30",
    end: "15:00",
    title: "Interview Prep",
    description: "Rotating focus — depth beats breadth.",
    category: "interview-prep",
    priority: "high",
    byWeekday: {
      1: "React + TypeScript",
      2: "FastAPI + API design",
      3: "PostgreSQL + Redis",
      4: "System design",
      5: "AI engineering: RAG, agents, evals",
      6: "Docker, CI/CD, Linux",
      0: "Mock interview + weakest topics",
    },
    tasks: [
      { id: "prep:study", label: "Study today's topic" },
      { id: "prep:notes", label: "Write notes in Interview Prep" },
      { id: "prep:questions", label: "Answer 3 questions out loud" },
    ],
  },
  {
    id: "problem-solving",
    start: "15:00",
    end: "16:00",
    title: "Problem Solving",
    description: "Patterns, not puzzle count.",
    category: "interview-prep",
    priority: "medium",
    counter: "dsa",
    tasks: [
      { id: "dsa:q1", label: "Solve a problem" },
      { id: "dsa:q2", label: "Solve a second problem" },
      { id: "dsa:review", label: "Write down the pattern" },
    ],
  },
  {
    id: "learning",
    start: "16:00",
    end: "17:30",
    title: "Learning",
    description: "One concept, studied properly, then used in code.",
    category: "learning",
    priority: "medium",
    counter: "studyHours",
    tasks: [
      { id: "ai:study", label: "Study one concept deeply" },
      { id: "ai:handson", label: "Build something small with it" },
    ],
  },
  {
    id: "build",
    start: "18:30",
    end: "20:30",
    title: "Build",
    description: "Portfolio work that becomes interview material.",
    category: "project",
    priority: "high",
    counter: "commits",
    tasks: [
      { id: "project:work", label: "Move one project forward" },
      { id: "project:commit", label: "Commit & push" },
      { id: "project:log", label: "Record it in the Engineering Log" },
    ],
  },
  {
    id: "wind-down",
    start: "21:00",
    end: "21:30",
    title: "Wind Down",
    description: "Close the loop so tomorrow starts with a decision already made.",
    category: "admin",
    priority: "low",
    tasks: [
      { id: "admin:review", label: "Review the day" },
      { id: "admin:plan", label: "Pick tomorrow's top 3" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Category presentation                                               */
/* ------------------------------------------------------------------ */

export interface CategoryMeta {
  label: string;
  icon: string;
  accent: string;
}

/**
 * One place where a block category becomes an icon and a colour, so blocks
 * carry meaning rather than each storing its own styling.
 */
export const CATEGORY_META: Record<BlockCategory, CategoryMeta> = {
  "deep-work": { label: "Deep Work", icon: "Brain", accent: "#7c6cf0" },
  "job-search": { label: "Job Search", icon: "Send", accent: "#3987e5" },
  "interview-prep": { label: "Interview Prep", icon: "GraduationCap", accent: "#c98500" },
  learning: { label: "Learning", icon: "BookOpen", accent: "#199e70" },
  project: { label: "Project", icon: "Hammer", accent: "#d95926" },
  admin: { label: "Admin", icon: "ClipboardList", accent: "#898791" },
  personal: { label: "Personal", icon: "Heart", accent: "#c2569a" },
};

import type { Goal } from "@/types";

export const DAILY_GOALS: Goal[] = [
  { id: "d-apps", label: "20 Applications", counter: "applications", target: 20, period: "daily" },
  { id: "d-recruiters", label: "3 Recruiters", counter: "recruiters", target: 3, period: "daily" },
  { id: "d-alumni", label: "2 Alumni", counter: "alumni", target: 2, period: "daily" },
  { id: "d-dsa", label: "2 DSA Questions", counter: "dsa", target: 2, period: "daily" },
  { id: "d-ai", label: "2 Hours AI Study", counter: "studyHours", target: 2, period: "daily" },
  { id: "d-commit", label: "1 Project Commit", counter: "commits", target: 1, period: "daily" },
];

export const WEEKLY_GOALS: Goal[] = [
  { id: "w-apps", label: "100 Applications", counter: "applications", target: 100, period: "weekly" },
  { id: "w-recruiters", label: "15 Recruiters", counter: "recruiters", target: 15, period: "weekly" },
  { id: "w-post", label: "1 LinkedIn Post", counter: "linkedinPosts", target: 1, period: "weekly" },
  { id: "w-commits", label: "5 GitHub Commits", counter: "commits", target: 5, period: "weekly" },
];

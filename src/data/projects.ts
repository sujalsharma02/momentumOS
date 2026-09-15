import type { Project, ProjectStatus } from "@/types";

export interface ProjectStatusMeta {
  label: string;
  accent: string;
  /** Badge variant used wherever the status is rendered. */
  variant: "secondary" | "info" | "success" | "warning" | "outline";
}

export const PROJECT_STATUS_META: Record<ProjectStatus, ProjectStatusMeta> = {
  idea: { label: "Idea", accent: "#898791", variant: "secondary" },
  building: { label: "Building", accent: "#3987e5", variant: "info" },
  shipped: { label: "Shipped", accent: "#0ca30c", variant: "success" },
  maintaining: { label: "Maintaining", accent: "#c98500", variant: "warning" },
  archived: { label: "Archived", accent: "#898791", variant: "outline" },
};

/**
 * Seeded on a fresh install so the Projects page opens with a real example
 * rather than an empty grid — and because this app is itself portfolio
 * evidence worth keeping up to date.
 */
export const DEFAULT_PROJECTS: Project[] = [
  {
    id: "momentum-os",
    name: "Momentum OS",
    description:
      "A local-first career and engineering operating system: job pipeline, interview readiness, project portfolio and an engineering journal in one dashboard.",
    status: "building",
    stack: ["React 18", "TypeScript", "Vite", "Tailwind CSS", "Radix UI", "Recharts"],
    problem:
      "Job searching while trying to grow as an engineer generates evidence in a dozen places — spreadsheets, notes apps, commit history — and none of it is there when an interviewer asks for a concrete example. This keeps the pipeline, the learning and the work in one place.",
    architecture:
      "Single-page React app with no backend. Domain models are typed in one module; every collection is persisted under its own localStorage key through a normalize-on-read layer, with versioned migrations that run before first render so an upgrade can never lose or corrupt existing data.",
    deployment: "Static build; deployable to any static host.",
    repoUrl: "https://github.com/sujalsharma02/momentumOS",
    achievements: [
      "Versioned localStorage schema with defensive normalizers — malformed or half-migrated data degrades instead of crashing a page",
      "Day-plan snapshots per log entry, so editing the schedule never rewrites historical completion metrics",
      "Zero-asset WebAudio feedback and CVD-safe chart palette",
    ],
    tasks: [
      { id: "momentum-os:t1", label: "Wire the engineering log into project detail views", done: false },
      { id: "momentum-os:t2", label: "Export / import a JSON backup of all data", done: false },
      { id: "momentum-os:t3", label: "Evaluate a sync backend for multi-device use", done: false },
    ],
    challenges:
      "Keeping historical statistics honest once the day plan became user-editable — the original version divided completion by a hardcoded task list, so any edit silently rewrote every past day.",
    lessons:
      "Derived metrics need to record the inputs they were computed from. Storing a per-day snapshot of the planned task ids was a smaller change than any attempt to reconstruct history afterwards.",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

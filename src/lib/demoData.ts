import { ALL_TASK_IDS } from "@/data/timetable";
import { addDays, todayISO } from "@/lib/dates";
import type { DayLogs } from "@/lib/stats";
import { uid } from "@/lib/utils";
import type { DayLog, JobApplication, Note } from "@/types";

const COMPANIES: Array<[string, string]> = [
  ["Vercel", "AI Full Stack Engineer"],
  ["Linear", "Product Engineer"],
  ["DeepL", "Full Stack Developer"],
  ["Celonis", "AI Engineer"],
  ["SAP", "Full Stack Developer, AI"],
  ["Zalando", "Software Engineer"],
  ["Klarna", "AI Full Stack Engineer"],
  ["Personio", "Full Stack Engineer"],
  ["HelloFresh", "Backend Engineer"],
  ["N26", "Full Stack Engineer"],
  ["Delivery Hero", "AI Platform Engineer"],
  ["Siemens", "AI Software Engineer"],
  ["Bosch", "ML Engineer"],
  ["Anthropic", "Full Stack Engineer"],
  ["Raycast", "Software Engineer"],
  ["Supabase", "Full Stack Engineer"],
];

/** Deterministic pseudo-random so demo data is stable across reloads. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function buildDemoData(): { logs: DayLogs; applications: JobApplication[]; notes: Note[] } {
  const rand = seeded(42);
  const logs: DayLogs = {};
  const applications: JobApplication[] = [];

  for (let i = 29; i >= 1; i--) {
    const date = addDays(todayISO(), -i);
    const effort = 0.45 + rand() * 0.55;
    const tasks: DayLog["tasks"] = {};
    for (const taskId of ALL_TASK_IDS) {
      if (rand() < effort) tasks[taskId] = true;
    }
    logs[date] = {
      date,
      tasks,
      counters: {
        applications: Math.round(8 + rand() * 14),
        recruiters: Math.round(rand() * 4),
        alumni: Math.round(rand() * 3),
        hiringManagers: Math.round(rand() * 2),
        dsa: Math.round(rand() * 3),
        studyHours: Math.round(rand() * 3 * 2) / 2,
        commits: rand() > 0.35 ? Math.round(1 + rand() * 2) : 0,
        linkedinPosts: rand() > 0.88 ? 1 : 0,
      },
    };
  }

  COMPANIES.forEach(([company, role], index) => {
    const roll = rand();
    const status = roll > 0.93 ? "offer" : roll > 0.72 ? "interview" : roll > 0.45 ? "rejected" : "applied";
    const appliedDate = addDays(todayISO(), -Math.round(rand() * 28));
    applications.push({
      id: uid(),
      company,
      role,
      appliedDate,
      status,
      followUpDate: status === "applied" && index % 3 === 0 ? addDays(appliedDate, 7) : undefined,
      notes: status === "interview" ? "Recruiter screen done — tech round next." : undefined,
    });
  });

  const notes: Note[] = [
    {
      id: uid(),
      title: "React interview notes",
      content:
        "# React\n\n## Reconciliation\n- Fiber architecture splits render work into units\n- Keys tell React which items changed\n\n## Hooks rules\n1. Only call at top level\n2. Only call from React functions\n\n> Practice explaining `useEffect` cleanup out loud.",
      updatedAt: Date.now() - 86_400_000,
    },
    {
      id: uid(),
      title: "System design checklist",
      content:
        "# System Design\n\n1. Clarify requirements & scale\n2. Back-of-envelope estimates\n3. API design\n4. Data model\n5. High-level architecture\n6. Deep dive: caching, queues, sharding\n7. Trade-offs & failure modes",
      updatedAt: Date.now() - 3_600_000,
    },
  ];

  return { logs, applications, notes };
}

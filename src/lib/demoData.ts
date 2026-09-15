/**
 * Sample data for evaluating every surface of the app at once.
 *
 * Deterministic (seeded) so the demo looks the same on every load, and sized
 * like a real month of a real job search rather than a highlight reel: a
 * handful of applications a day, mostly silence, a few interviews, one offer.
 */

import { DEFAULT_PLAN } from "@/data/defaultPlan";
import { addDays, todayISO } from "@/lib/dates";
import type { DayLogs } from "@/lib/normalize";
import { uid } from "@/lib/utils";
import type {
  ApplicationStatus,
  DayLog,
  FocusSession,
  JobApplication,
  LogEntry,
  Note,
  PrepProgress,
  Project,
} from "@/types";

interface DemoData {
  logs: DayLogs;
  applications: JobApplication[];
  projects: Project[];
  engineeringLog: LogEntry[];
  notes: Note[];
  focusSessions: FocusSession[];
  prepProgress: Record<string, PrepProgress>;
}

/** Deterministic pseudo-random so demo data is stable across reloads. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

interface DemoApplication {
  company: string;
  role: string;
  location: string;
  workMode: JobApplication["workMode"];
  compensation?: string;
  source: string;
  status: ApplicationStatus;
  daysAgo: number;
  priority: JobApplication["priority"];
  contact?: string;
  notes?: string;
  /** days relative to today; negative = past */
  followUpIn?: number;
  interviewIn?: number;
  url?: string;
}

const APPLICATIONS: DemoApplication[] = [
  {
    company: "Personio",
    role: "Backend Engineer (Python)",
    location: "Munich, DE",
    workMode: "hybrid",
    compensation: "€75-90k",
    source: "LinkedIn",
    status: "interview",
    daysAgo: 19,
    priority: "high",
    contact: "Lena K. (Talent Partner)",
    notes: "Recruiter screen done. Technical interview is a live coding + system design pairing.",
    interviewIn: 3,
  },
  {
    company: "GitLab",
    role: "Fullstack Engineer, AI-powered features",
    location: "Remote (EMEA)",
    workMode: "remote",
    compensation: "Band published on handbook",
    source: "Careers page",
    status: "assessment",
    daysAgo: 12,
    priority: "high",
    notes: "Take-home: extend a Rails/Vue feature. 5-day window.",
    followUpIn: -1,
  },
  {
    company: "Celonis",
    role: "Software Engineer, AI Platform",
    location: "Munich, DE",
    workMode: "hybrid",
    source: "Referral",
    status: "recruiter",
    daysAgo: 8,
    priority: "high",
    contact: "Referred by Arjun (ex-colleague)",
    followUpIn: 2,
  },
  {
    company: "Razorpay",
    role: "SDE II, Backend",
    location: "Bengaluru, IN",
    workMode: "hybrid",
    compensation: "₹28-34 LPA",
    source: "LinkedIn",
    status: "final",
    daysAgo: 26,
    priority: "medium",
    notes: "Two technical rounds cleared. Hiring manager round next.",
    interviewIn: 5,
  },
  {
    company: "Supabase",
    role: "Full Stack Engineer",
    location: "Singapore (HQ)",
    workMode: "remote",
    source: "Careers page",
    status: "applied",
    daysAgo: 4,
    priority: "high",
    followUpIn: 6,
    url: "https://supabase.com/careers",
  },
  {
    company: "DeepL",
    role: "Software Engineer, Backend",
    location: "Cologne, DE",
    workMode: "hybrid",
    source: "LinkedIn",
    status: "rejected",
    daysAgo: 24,
    priority: "medium",
    notes: "Auto-rejection after 10 days. No feedback.",
  },
  {
    company: "Zalando",
    role: "Software Engineer, Search & Discovery",
    location: "Berlin, DE",
    workMode: "hybrid",
    compensation: "€70-85k",
    source: "Careers page",
    status: "applied",
    daysAgo: 6,
    priority: "medium",
    followUpIn: 4,
  },
  {
    company: "Postman",
    role: "Software Engineer, AI",
    location: "Bengaluru, IN",
    workMode: "onsite",
    source: "Referral",
    status: "offer",
    daysAgo: 29,
    priority: "medium",
    compensation: "₹32 LPA + ESOPs",
    notes: "Offer received. Deadline to respond in 7 days. Comparing against Razorpay.",
  },
  {
    company: "Trade Republic",
    role: "Backend Engineer",
    location: "Berlin, DE",
    workMode: "onsite",
    source: "LinkedIn",
    status: "applied",
    daysAgo: 9,
    priority: "low",
    followUpIn: -2,
  },
  {
    company: "Sentry",
    role: "Software Engineer, Product",
    location: "Vienna, AT",
    workMode: "hybrid",
    source: "Careers page",
    status: "withdrawn",
    daysAgo: 21,
    priority: "low",
    notes: "Withdrew: role required German at C1.",
  },
  {
    company: "Grafana Labs",
    role: "Senior Software Engineer, Backend",
    location: "Remote (EMEA)",
    workMode: "remote",
    source: "LinkedIn",
    status: "rejected",
    daysAgo: 17,
    priority: "medium",
    notes: "Recruiter call, then declined: looking for 7+ years.",
    interviewIn: -14,
  },
  {
    company: "CRED",
    role: "Backend Engineer",
    location: "Bengaluru, IN",
    workMode: "onsite",
    source: "Cutshort",
    status: "applied",
    daysAgo: 3,
    priority: "low",
  },
  {
    company: "GetYourGuide",
    role: "Software Engineer, Backend",
    location: "Berlin, DE",
    workMode: "hybrid",
    source: "Careers page",
    status: "recruiter",
    daysAgo: 11,
    priority: "high",
    contact: "Marta R. (Tech Recruiter)",
    followUpIn: 1,
  },
  {
    company: "Vercel",
    role: "Software Engineer, AI SDK",
    location: "San Francisco, US",
    workMode: "remote",
    source: "Careers page",
    status: "saved",
    daysAgo: 1,
    priority: "high",
    url: "https://vercel.com/careers",
    notes: "Needs a small demo built on the AI SDK before applying.",
  },
  {
    company: "N26",
    role: "Backend Engineer, Python",
    location: "Berlin, DE",
    workMode: "hybrid",
    source: "LinkedIn",
    status: "saved",
    daysAgo: 2,
    priority: "medium",
  },
  {
    company: "Atlassian",
    role: "Software Engineer, Backend",
    location: "Remote (IN)",
    workMode: "remote",
    source: "Careers page",
    status: "applied",
    daysAgo: 14,
    priority: "medium",
  },
];

const LOG_ENTRIES: Array<Omit<LogEntry, "id" | "createdAt" | "date"> & { daysAgo: number }> = [
  {
    daysAgo: 1,
    category: "performance",
    title: "Cut dashboard API p95 from 1.4s to 210ms",
    description:
      "The /summary endpoint ran one query per widget (11 round-trips). Rewrote it as two queries with window functions and moved the per-user aggregation into PostgreSQL.",
    technologies: ["FastAPI", "PostgreSQL", "SQLAlchemy"],
    impact: "p95 1.4s -> 210ms on production traffic; DB CPU down ~30%.",
    lessons: "Measure round-trips before micro-optimising any single query.",
  },
  {
    daysAgo: 3,
    category: "ai",
    title: "Reranking step improved RAG answer accuracy",
    description:
      "Added a cross-encoder reranker between vector retrieval and the LLM. Retrieval k raised to 20, top 5 passed to the model after reranking.",
    technologies: ["Python", "pgvector", "LangGraph", "OpenAI"],
    impact: "Eval set accuracy 68% -> 81% with no latency regression after batching.",
    lessons: "Retrieval quality was the bottleneck, not the model. Build the eval set first.",
  },
  {
    daysAgo: 5,
    category: "incident",
    title: "Celery workers stuck after Redis failover",
    description:
      "After a managed Redis failover, workers kept a dead connection and stopped consuming. Root cause: no socket keepalive and a very long visibility timeout.",
    technologies: ["Celery", "Redis", "Docker"],
    impact: "45 minutes of delayed background jobs. Added keepalive + health check; alert on queue depth.",
    lessons: "Anything holding a long-lived connection needs an explicit liveness check.",
  },
  {
    daysAgo: 7,
    category: "architecture",
    title: "Split the monolith's notification module into a worker",
    description:
      "Email and push notifications were sent inline in request handlers. Moved them behind a queue with an outbox table so a failed send cannot roll back the user's write.",
    technologies: ["FastAPI", "PostgreSQL", "Celery"],
    impact: "Request latency for write endpoints dropped by ~300ms; retries are now observable.",
  },
  {
    daysAgo: 9,
    category: "bug",
    title: "Timezone bug double-counting daily stats",
    description:
      "Dates were bucketed in UTC on the server but displayed in local time on the client, so late-evening events appeared on the next day.",
    technologies: ["TypeScript", "PostgreSQL"],
    impact: "Fixed by storing the user's timezone and bucketing server-side.",
    lessons: "Store the timezone with the event, not just the timestamp.",
  },
  {
    daysAgo: 12,
    category: "deployment",
    title: "Zero-downtime deploys with Docker + Caddy",
    description:
      "Replaced the stop/start deploy script with blue/green containers behind Caddy and a health-check gate before swapping upstreams.",
    technologies: ["Docker", "Caddy", "GitHub Actions", "Linux"],
    impact: "No dropped requests during deploy; rollback is a one-line upstream swap.",
  },
  {
    daysAgo: 15,
    category: "debugging",
    title: "Memory leak in a long-running WebSocket handler",
    description:
      "Tracked a slow RSS growth with tracemalloc to a per-connection dict that was never cleared on abnormal disconnect.",
    technologies: ["Python", "FastAPI", "WebSockets"],
    lessons: "Cleanup must live in a finally block, not after the happy-path return.",
  },
  {
    daysAgo: 18,
    category: "decision",
    title: "Chose pgvector over a separate vector database",
    description:
      "For under ~2M embeddings the operational cost of a second datastore outweighed the recall gains. HNSW index in Postgres met the latency budget.",
    technologies: ["PostgreSQL", "pgvector"],
    lessons: "Pick the boring option until the numbers say otherwise.",
  },
  {
    daysAgo: 22,
    category: "learning",
    title: "Structured outputs with tool calling",
    description:
      "Worked through schema-constrained generation and validation retries. Built a small extraction pipeline that parses invoices into a typed model.",
    technologies: ["Python", "Pydantic", "OpenAI"],
  },
  {
    daysAgo: 27,
    category: "ai",
    title: "Built an eval harness before touching prompts",
    description:
      "120 labelled examples, exact-match + LLM-as-judge scoring, results tracked per commit. Caught a regression the first day.",
    technologies: ["Python", "pytest"],
    impact: "Prompt changes now ship with a number attached.",
  },
];

const PROJECTS: Array<Omit<Project, "id" | "createdAt" | "updatedAt">> = [
  {
    name: "Invoice Copilot",
    description:
      "Upload PDF invoices, extract line items with a vision model, reconcile against purchase orders, and flag mismatches for review.",
    status: "shipped",
    stack: ["FastAPI", "PostgreSQL", "pgvector", "Celery", "Redis", "React", "Docker"],
    problem:
      "A small business was manually keying 300+ invoices a month into a spreadsheet and missing over-billing.",
    architecture:
      "React front end -> FastAPI API -> Celery workers for extraction. Documents in object storage, metadata + embeddings in Postgres. Human review queue for low-confidence rows.",
    deployment: "Docker Compose on a single VPS behind Caddy; GitHub Actions builds and deploys on tag.",
    repoUrl: "https://github.com/",
    achievements: [
      "94% line-item extraction accuracy on a 200-invoice eval set",
      "Cut monthly reconciliation from ~20 hours to under 2",
    ],
    tasks: [
      { id: uid(), label: "Add multi-currency support", done: false },
      { id: uid(), label: "Export reconciled batches to CSV", done: true },
    ],
    challenges: "Vision model output was inconsistent across scanned vs. digital PDFs.",
    lessons: "A confidence score plus a review queue beats chasing 100% accuracy.",
  },
  {
    name: "Ops Agent",
    description:
      "A LangGraph agent that triages alerts, pulls logs and metrics via tools, and drafts an incident summary for a human to approve.",
    status: "building",
    stack: ["Python", "LangGraph", "FastAPI", "Grafana", "Docker"],
    problem: "On-call engineers spent the first 15 minutes of every alert gathering context by hand.",
    architecture:
      "Graph with plan -> gather (tool calls) -> summarise -> approve nodes. Checkpoints in Postgres so a run can be resumed after a human edits the plan.",
    achievements: ["Tool-calling loop with budget limits and full trace logging"],
    tasks: [
      { id: uid(), label: "Add Slack approval step", done: false },
      { id: uid(), label: "Eval set of 30 historical incidents", done: false },
    ],
    challenges: "Keeping the agent from calling the same tool repeatedly when results are ambiguous.",
  },
];

export function buildDemoData(): DemoData {
  const rand = seeded(2026);
  const today = todayISO();
  const planIds = DEFAULT_PLAN.flatMap((block) => block.tasks.map((task) => task.id));

  // --- 30 days of logs, with weekends visibly lighter -------------------
  const logs: DayLogs = {};
  const focusSessions: FocusSession[] = [];
  for (let i = 29; i >= 1; i--) {
    const date = addDays(today, -i);
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const weekend = weekday === 0 || weekday === 6;
    const effort = (weekend ? 0.3 : 0.55) + rand() * 0.4;

    const tasks: DayLog["tasks"] = {};
    for (const taskId of planIds) {
      if (rand() < effort) tasks[taskId] = true;
    }

    const sessions = weekend ? Math.round(rand() * 2) : Math.round(1 + rand() * 3);
    let focusMinutesTotal = 0;
    for (let s = 0; s < sessions; s++) {
      const minutes = rand() > 0.5 ? 50 : 25;
      focusMinutesTotal += minutes;
      focusSessions.push({
        id: uid(),
        date,
        minutes,
        label: ["Interview prep", "Ops Agent", "Invoice Copilot", "System design"][Math.floor(rand() * 4)],
        startedAt: new Date(`${date}T${String(9 + s * 2).padStart(2, "0")}:00:00`).getTime(),
      });
    }

    logs[date] = {
      date,
      tasks,
      planIds,
      counters: {
        applications: weekend ? Math.round(rand() * 2) : Math.round(1 + rand() * 4),
        recruiters: rand() > 0.6 ? 1 : 0,
        dsa: weekend ? Math.round(rand()) : Math.round(rand() * 3),
        studyHours: Math.round((weekend ? rand() * 2 : 1 + rand() * 2) * 2) / 2,
        commits: rand() > 0.3 ? Math.round(1 + rand() * 3) : 0,
        focusSessions: sessions,
        focusMinutes: focusMinutesTotal,
      },
    };
  }

  // --- Applications -----------------------------------------------------
  const applications: JobApplication[] = APPLICATIONS.map((app) => {
    const appliedDate = addDays(today, -app.daysAgo);
    const createdAt = new Date(`${appliedDate}T10:00:00`).getTime();
    return {
      id: uid(),
      company: app.company,
      role: app.role,
      location: app.location,
      workMode: app.workMode,
      compensation: app.compensation,
      appliedDate,
      source: app.source,
      status: app.status,
      contact: app.contact,
      followUpDate: app.followUpIn !== undefined ? addDays(today, app.followUpIn) : undefined,
      interviewDate: app.interviewIn !== undefined ? addDays(today, app.interviewIn) : undefined,
      notes: app.notes,
      url: app.url,
      priority: app.priority,
      createdAt,
      updatedAt: createdAt + Math.round(rand() * 5) * 86_400_000,
    };
  });

  // --- Projects & engineering log --------------------------------------
  const projects: Project[] = PROJECTS.map((project, index) => {
    const createdAt = Date.now() - (60 + index * 30) * 86_400_000;
    return { ...project, id: uid(), createdAt, updatedAt: Date.now() - index * 3 * 86_400_000 };
  });

  const engineeringLog: LogEntry[] = LOG_ENTRIES.map(({ daysAgo, ...entry }) => {
    const date = addDays(today, -daysAgo);
    return {
      ...entry,
      id: uid(),
      date,
      createdAt: new Date(`${date}T18:30:00`).getTime(),
      projectId:
        entry.title.includes("RAG") || entry.title.includes("eval") || entry.title.includes("pgvector")
          ? projects[0]?.id
          : undefined,
    };
  });

  // --- Prep progress ----------------------------------------------------
  const prepProgress: Record<string, PrepProgress> = {
    react: { readiness: 75, strength: "strong", lastStudied: addDays(today, -2), notes: "", questions: [] },
    typescript: { readiness: 70, strength: "strong", lastStudied: addDays(today, -4), notes: "", questions: [] },
    fastapi: {
      readiness: 80,
      strength: "strong",
      lastStudied: addDays(today, -1),
      notes:
        "# FastAPI\n\n- Dependency injection via `Depends` - request-scoped DB sessions\n- `lifespan` replaces startup/shutdown events\n- BackgroundTasks vs Celery: in-process only, no retries",
      questions: [
        { id: uid(), prompt: "How would you handle a slow dependency without blocking the event loop?", answered: true },
        { id: uid(), prompt: "Explain the difference between sync and async route handlers in FastAPI.", answered: true },
      ],
    },
    postgresql: {
      readiness: 55,
      strength: "developing",
      lastStudied: addDays(today, -3),
      notes: "",
      questions: [
        { id: uid(), prompt: "When does Postgres choose a sequential scan over an index scan?", answered: false },
      ],
    },
    "system-design": {
      readiness: 40,
      strength: "weak",
      lastStudied: addDays(today, -6),
      notes: "",
      questions: [
        { id: uid(), prompt: "Design a rate limiter for a public API.", answered: false },
        { id: uid(), prompt: "Design a notification system with at-least-once delivery.", answered: false },
      ],
    },
    redis: { readiness: 50, strength: "developing", lastStudied: addDays(today, -8), notes: "", questions: [] },
    docker: { readiness: 65, strength: "developing", lastStudied: addDays(today, -5), notes: "", questions: [] },
    rag: { readiness: 70, strength: "strong", lastStudied: addDays(today, -3), notes: "", questions: [] },
    "ai-evaluation": { readiness: 45, strength: "developing", lastStudied: addDays(today, -7), notes: "", questions: [] },
    "ai-agents": { readiness: 50, strength: "developing", lastStudied: addDays(today, -2), notes: "", questions: [] },
    auth: { readiness: 30, strength: "weak", notes: "", questions: [] },
    "background-jobs": { readiness: 60, strength: "developing", lastStudied: addDays(today, -5), notes: "", questions: [] },
    testing: { readiness: 35, strength: "weak", lastStudied: addDays(today, -12), notes: "", questions: [] },
  };

  // --- Notes --------------------------------------------------------------
  const notes: Note[] = [
    {
      id: uid(),
      title: "Personio technical interview prep",
      content:
        "# Personio - technical round\n\n**Format:** 60 min pairing, then 30 min design.\n\n## Likely topics\n- Python async, FastAPI dependency injection\n- Postgres indexing and transactions\n- Designing a payroll run that must be idempotent\n\n## Questions to ask\n1. How is on-call structured?\n2. What does the promotion path from mid to senior look like?",
      updatedAt: Date.now() - 2 * 3_600_000,
    },
    {
      id: uid(),
      title: "Offer comparison",
      content:
        "# Postman vs Razorpay\n\n| | Postman | Razorpay |\n|---|---|---|\n| Base | 32 LPA | TBD |\n| Equity | ESOPs, 4y vest | ? |\n| Remote | No | Hybrid |\n| Team | AI features | Payments core |\n\n> Decision factor: which one is a better story for a Germany application in 18 months?",
      updatedAt: Date.now() - 26 * 3_600_000,
    },
  ];

  return { logs, applications, projects, engineeringLog, notes, focusSessions, prepProgress };
}

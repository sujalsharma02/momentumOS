import type { PrepDomain, PrepTopic } from "@/types";

export interface DomainMeta {
  label: string;
  description: string;
  icon: string;
  accent: string;
}

export const DOMAIN_META: Record<PrepDomain, DomainMeta> = {
  frontend: {
    label: "Frontend",
    description: "What runs in the browser, and why it is slow when it is slow.",
    icon: "MonitorSmartphone",
    accent: "#3987e5",
  },
  backend: {
    label: "Backend",
    description: "Services, data, and the contracts between them.",
    icon: "Server",
    accent: "#199e70",
  },
  engineering: {
    label: "Engineering",
    description: "The craft around the code: design, shipping, operating.",
    icon: "Wrench",
    accent: "#c98500",
  },
  ai: {
    label: "AI Engineering",
    description: "Building with models in production, not demos.",
    icon: "Sparkles",
    accent: "#f04e23",
  },
};

/**
 * The topic catalogue is static config, not user data — progress against each
 * topic lives in localStorage keyed by id. Ids are stable; `react`, `typescript`,
 * `fastapi`, `postgresql`, `system-design`, `docker`, `redis`, `langgraph` and
 * `ai-agents` carry over from the pre-2026 version so existing notes survive.
 */
export const PREP_TOPICS: PrepTopic[] = [
  /* ---- Frontend ---- */
  {
    id: "react",
    title: "React",
    domain: "frontend",
    description: "Hooks, reconciliation, Suspense, server components, re-render cost.",
    icon: "Atom",
  },
  {
    id: "typescript",
    title: "TypeScript",
    domain: "frontend",
    description: "Generics, narrowing, utility types, typing an API boundary.",
    icon: "FileType2",
  },
  {
    id: "javascript",
    title: "JavaScript",
    domain: "frontend",
    description: "Event loop, closures, prototypes, async patterns, modules.",
    icon: "Braces",
  },
  {
    id: "browser",
    title: "Browser Fundamentals",
    domain: "frontend",
    description: "Rendering pipeline, DOM, events, storage, CORS, security model.",
    icon: "Globe",
  },
  {
    id: "web-performance",
    title: "Web Performance",
    domain: "frontend",
    description: "Core Web Vitals, bundle budgets, caching, profiling a real page.",
    icon: "Gauge",
  },

  /* ---- Backend ---- */
  {
    id: "fastapi",
    title: "FastAPI",
    domain: "backend",
    description: "Pydantic models, dependency injection, async, lifespan, testing.",
    icon: "Zap",
  },
  {
    id: "api-design",
    title: "API Design",
    domain: "backend",
    description: "Resource modelling, versioning, pagination, idempotency, errors.",
    icon: "Webhook",
  },
  {
    id: "rest",
    title: "REST & HTTP",
    domain: "backend",
    description: "Methods, status codes, caching headers, content negotiation.",
    icon: "ArrowLeftRight",
  },
  {
    id: "postgresql",
    title: "PostgreSQL",
    domain: "backend",
    description: "Indexes, query plans, transactions, isolation, window functions.",
    icon: "Database",
  },
  {
    id: "redis",
    title: "Redis",
    domain: "backend",
    description: "Cache strategies, invalidation, locks, rate limiting, streams.",
    icon: "Layers",
  },
  {
    id: "auth",
    title: "Authentication",
    domain: "backend",
    description: "Sessions vs JWT, OAuth2/OIDC, refresh rotation, RBAC.",
    icon: "KeyRound",
  },
  {
    id: "background-jobs",
    title: "Background Jobs",
    domain: "backend",
    description: "Queues, workers, retries, idempotency, dead letters, scheduling.",
    icon: "ListTodo",
  },

  /* ---- Engineering ---- */
  {
    id: "system-design",
    title: "System Design",
    domain: "engineering",
    description: "Requirements, estimates, data model, scaling, failure modes.",
    icon: "Network",
  },
  {
    id: "docker",
    title: "Docker",
    domain: "engineering",
    description: "Images, layers, multi-stage builds, compose, networking, size.",
    icon: "Container",
  },
  {
    id: "linux",
    title: "Linux",
    domain: "engineering",
    description: "Processes, permissions, networking, logs, disk and memory tools.",
    icon: "Terminal",
  },
  {
    id: "git",
    title: "Git",
    domain: "engineering",
    description: "Branching, rebase vs merge, bisect, reflog, resolving real conflicts.",
    icon: "GitBranch",
  },
  {
    id: "ci-cd",
    title: "CI/CD",
    domain: "engineering",
    description: "Pipelines, caching, environments, rollbacks, release strategies.",
    icon: "GitPullRequestArrow",
  },
  {
    id: "cloud",
    title: "Cloud & Deployment",
    domain: "engineering",
    description: "Compute options, networking, secrets, observability, cost.",
    icon: "Cloud",
  },
  {
    id: "testing",
    title: "Testing",
    domain: "engineering",
    description: "Unit/integration/e2e balance, fixtures, flakiness, what not to test.",
    icon: "FlaskConical",
  },
  {
    id: "debugging",
    title: "Debugging",
    domain: "engineering",
    description: "Reading stack traces, bisecting, instrumenting, reproducing reliably.",
    icon: "Bug",
  },

  /* ---- AI Engineering ---- */
  {
    id: "llm-fundamentals",
    title: "LLM Fundamentals",
    domain: "ai",
    description: "Tokens, context windows, sampling, cost and latency trade-offs.",
    icon: "BrainCircuit",
  },
  {
    id: "embeddings",
    title: "Embeddings",
    domain: "ai",
    description: "Vector representations, similarity, chunking, dimensionality.",
    icon: "Spline",
  },
  {
    id: "vector-databases",
    title: "Vector Databases",
    domain: "ai",
    description: "Indexing (HNSW/IVF), filtering, hybrid search, recall vs latency.",
    icon: "Boxes",
  },
  {
    id: "rag",
    title: "RAG",
    domain: "ai",
    description: "Retrieval quality, reranking, grounding, citations, failure modes.",
    icon: "Search",
  },
  {
    id: "multimodal",
    title: "Multimodal AI",
    domain: "ai",
    description: "Vision and audio inputs, document understanding, OCR pipelines.",
    icon: "Image",
  },
  {
    id: "ai-agents",
    title: "AI Agents",
    domain: "ai",
    description: "Planning loops, memory, guardrails, human handoff, cost control.",
    icon: "Bot",
  },
  {
    id: "tool-calling",
    title: "Tool Calling",
    domain: "ai",
    description: "Schema design, validation, parallel calls, error recovery, MCP.",
    icon: "Wrench",
  },
  {
    id: "langgraph",
    title: "LangGraph",
    domain: "ai",
    description: "Graph state machines, checkpoints, branching, streaming output.",
    icon: "Workflow",
  },
  {
    id: "ai-evaluation",
    title: "Evaluation",
    domain: "ai",
    description: "Eval sets, LLM-as-judge, regression tracking, offline vs online.",
    icon: "ClipboardCheck",
  },
  {
    id: "prompt-engineering",
    title: "Prompt Engineering",
    domain: "ai",
    description: "Structure, few-shot, decomposition, output contracts, caching.",
    icon: "MessageSquareCode",
  },
  {
    id: "ai-architecture",
    title: "Production AI Architecture",
    domain: "ai",
    description: "Serving, queuing, fallbacks, observability, safety, spend limits.",
    icon: "Factory",
  },
];

export const TOPICS_BY_DOMAIN = (domain: PrepDomain): PrepTopic[] =>
  PREP_TOPICS.filter((topic) => topic.domain === domain);

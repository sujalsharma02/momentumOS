import type { PrepTopic } from "@/types";

export const PREP_TOPICS: PrepTopic[] = [
  {
    id: "react",
    title: "React",
    description: "Hooks, reconciliation, Suspense, performance, RSC.",
    icon: "Atom",
    accent: "#22d3ee",
  },
  {
    id: "typescript",
    title: "TypeScript",
    description: "Generics, narrowing, utility types, type-safe APIs.",
    icon: "FileType2",
    accent: "#3b82f6",
  },
  {
    id: "fastapi",
    title: "FastAPI",
    description: "Pydantic, dependency injection, async, WebSockets.",
    icon: "Zap",
    accent: "#34d399",
  },
  {
    id: "postgresql",
    title: "PostgreSQL",
    description: "Indexes, query plans, transactions, window functions.",
    icon: "Database",
    accent: "#60a5fa",
  },
  {
    id: "system-design",
    title: "System Design",
    description: "Scaling, caching, queues, consistency, trade-offs.",
    icon: "Network",
    accent: "#f472b6",
  },
  {
    id: "docker",
    title: "Docker",
    description: "Images, multi-stage builds, compose, networking.",
    icon: "Container",
    accent: "#38bdf8",
  },
  {
    id: "aws",
    title: "AWS",
    description: "EC2, ECS, S3, IAM, load balancing, deployments.",
    icon: "Cloud",
    accent: "#fb923c",
  },
  {
    id: "redis",
    title: "Redis",
    description: "Caching patterns, pub/sub, rate limiting, streams.",
    icon: "Gauge",
    accent: "#ef4444",
  },
  {
    id: "langgraph",
    title: "LangGraph",
    description: "Agent graphs, state machines, tools, checkpoints.",
    icon: "Workflow",
    accent: "#a78bfa",
  },
  {
    id: "ai-agents",
    title: "AI Agents",
    description: "RAG, MCP, tool use, memory, evaluation, guardrails.",
    icon: "Bot",
    accent: "#8b5cf6",
  },
];

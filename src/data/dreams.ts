export interface Dream {
  id: string;
  title: string;
  emoji: string;
  description: string;
}

export const REASONS_WHY = [
  "To prove to myself that consistency beats talent.",
  "To give my parents the life they sacrificed for.",
  "To never again feel stuck without options.",
  "Because the person I become in this grind matters more than the job itself.",
];

export const DREAMS: Dream[] = [
  {
    id: "germany",
    title: "Germany",
    emoji: "🇩🇪",
    description: "Land an AI engineering role in Berlin or Munich — new country, new life.",
  },
  {
    id: "switzerland",
    title: "Switzerland",
    emoji: "🇨🇭",
    description: "Work among the Alps — precision engineering, world-class quality of life.",
  },
  {
    id: "remote",
    title: "Remote AI Engineer",
    emoji: "🌍",
    description: "Work from anywhere, building AI systems used around the world.",
  },
  {
    id: "freedom",
    title: "Financial Freedom",
    emoji: "💸",
    description: "Enough to never make a decision out of fear again.",
  },
  {
    id: "parents",
    title: "Parents",
    emoji: "❤️",
    description: "Retire them. Repay everything. Make them proud every single day.",
  },
];

export const DREAM_PATH = [
  { id: "current", label: "Land AI Full Stack Job", emoji: "🎯", status: "current" as const },
  { id: "next", label: "Germany", emoji: "🇩🇪", status: "next" as const },
];

import type { Milestone } from "@/types";

/**
 * The default career path. Every field is editable — no target dates are
 * pre-filled, because inventing them would be fake precision in a planning
 * tool. Progress is self-assessed, not derived from activity.
 */
export const DEFAULT_ROADMAP: Milestone[] = [
  {
    id: "rm-foundation",
    title: "Strong software engineer",
    detail:
      "Fundamentals that hold up under questioning: data modelling, API design, testing, debugging, and the ability to explain trade-offs out loud.",
    status: "active",
    progress: 0,
  },
  {
    id: "rm-role",
    title: "Better-paying engineering role",
    detail:
      "A team where code review is real, systems are non-trivial, and the work is worth writing about afterwards.",
    status: "next",
    progress: 0,
  },
  {
    id: "rm-specialise",
    title: "Specialisation: AI / backend / full stack",
    detail:
      "Deep in one lane rather than shallow across three. Production AI systems, not demos.",
    status: "next",
    progress: 0,
  },
  {
    id: "rm-international",
    title: "International exposure",
    detail:
      "Remote work for a foreign company, or a role at a startup with an international team — proof of working across timezones and cultures.",
    status: "later",
    progress: 0,
  },
  {
    id: "rm-europe",
    title: "Germany / Europe",
    detail:
      "EU Blue Card route: relevant degree or equivalent experience, a qualifying salary offer, and a portfolio that survives a technical panel.",
    status: "later",
    progress: 0,
  },
  {
    id: "rm-switzerland",
    title: "Switzerland",
    detail:
      "Long-term. Harder to enter from outside the EU/EFTA, so realistically a move made from inside Europe with several years of track record.",
    status: "later",
    progress: 0,
  },
];

/**
 * Editable prompts for the "Why" page. Replaces the old hardcoded
 * motivational copy — these are the user's own reasons, stored as data.
 */
export const DEFAULT_REASONS: string[] = [
  "Because I want the work itself to be interesting, not just the paycheque.",
  "To build things people actually rely on, and be trusted with harder problems.",
  "To have options — the ability to leave any room I do not want to be in.",
  "To give my family security that does not depend on luck.",
];

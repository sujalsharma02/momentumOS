export interface NavItem {
  path: string;
  label: string;
  icon: string;
  /** Single key that jumps here from anywhere outside a text field. */
  shortcut: string;
  /** Short line shown in the command palette / mobile menu. */
  hint: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "home",
    label: "Home",
    items: [
      {
        path: "/",
        label: "Command Center",
        icon: "LayoutDashboard",
        shortcut: "1",
        hint: "Everything that needs you today",
      },
      {
        path: "/today",
        label: "Today",
        icon: "CalendarClock",
        shortcut: "2",
        hint: "Time blocks and the day's checklist",
      },
    ],
  },
  {
    id: "career",
    label: "Career",
    items: [
      {
        path: "/tracker",
        label: "Job Tracker",
        icon: "Briefcase",
        shortcut: "3",
        hint: "Pipeline, follow-ups, conversion",
      },
      {
        path: "/prep",
        label: "Interview Prep",
        icon: "GraduationCap",
        shortcut: "4",
        hint: "Readiness by topic, notes, questions",
      },
      {
        path: "/roadmap",
        label: "Career Roadmap",
        icon: "Route",
        shortcut: "5",
        hint: "Milestones from here to abroad",
      },
    ],
  },
  {
    id: "build",
    label: "Build",
    items: [
      {
        path: "/projects",
        label: "Projects",
        icon: "Boxes",
        shortcut: "6",
        hint: "Portfolio work as career assets",
      },
      {
        path: "/log",
        label: "Engineering Log",
        icon: "NotebookPen",
        shortcut: "7",
        hint: "Evidence of real engineering work",
      },
    ],
  },
  {
    id: "personal",
    label: "Personal",
    items: [
      {
        path: "/goals",
        label: "Goals",
        icon: "Target",
        shortcut: "8",
        hint: "Daily, weekly and monthly targets",
      },
      {
        path: "/stats",
        label: "Statistics",
        icon: "BarChart3",
        shortcut: "9",
        hint: "Trends across career and craft",
      },
      {
        path: "/notes",
        label: "Notes",
        icon: "FileText",
        shortcut: "0",
        hint: "Markdown scratchpad",
      },
      {
        path: "/focus",
        label: "Focus",
        icon: "Timer",
        shortcut: "f",
        hint: "Timed deep-work sprints",
      },
      {
        path: "/why",
        label: "Why",
        icon: "Compass",
        shortcut: "w",
        hint: "The reasons behind the work",
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

/** Longest-prefix match, so `/projects/x` still highlights Projects. */
export function activeNavItem(pathname: string): NavItem | undefined {
  if (pathname === "/") return NAV_ITEMS[0];
  return NAV_ITEMS.filter((item) => item.path !== "/" && pathname.startsWith(item.path)).sort(
    (a, b) => b.path.length - a.path.length,
  )[0];
}

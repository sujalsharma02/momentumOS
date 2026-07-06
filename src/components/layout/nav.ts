export interface NavItem {
  path: string;
  label: string;
  icon: string;
  shortcut: string;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "Dashboard", icon: "LayoutDashboard", shortcut: "1" },
  { path: "/timetable", label: "Timetable", icon: "CalendarClock", shortcut: "2" },
  { path: "/prep", label: "Interview Prep", icon: "GraduationCap", shortcut: "3" },
  { path: "/tracker", label: "Job Tracker", icon: "Briefcase", shortcut: "4" },
  { path: "/goals", label: "Goals", icon: "Target", shortcut: "5" },
  { path: "/stats", label: "Stats", icon: "BarChart3", shortcut: "6" },
  { path: "/notes", label: "Notes", icon: "NotebookPen", shortcut: "7" },
  { path: "/pomodoro", label: "Pomodoro", icon: "Timer", shortcut: "8" },
  { path: "/motivation", label: "Motivation", icon: "Sparkles", shortcut: "9" },
];

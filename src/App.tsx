import { lazy, Suspense } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { CommandCenterPage } from "@/features/dashboard/CommandCenterPage";
import { FocusPage } from "@/features/focus/FocusPage";
import { GoalsPage } from "@/features/goals/GoalsPage";
import { EngineeringLogPage } from "@/features/log/EngineeringLogPage";
import { NotesPage } from "@/features/notes/NotesPage";
import { PrepPage } from "@/features/prep/PrepPage";
import { ProjectsPage } from "@/features/projects/ProjectsPage";
import { RoadmapPage } from "@/features/roadmap/RoadmapPage";
import { TodayPage } from "@/features/today/TodayPage";
import { TrackerPage } from "@/features/tracker/TrackerPage";
import { WhyPage } from "@/features/why/WhyPage";
import { LockGate } from "@/features/auth/LockScreen";

// Charts are the heaviest dependency; only fetched when Statistics is opened.
const StatsPage = lazy(() =>
  import("@/features/stats/StatsPage").then((module) => ({ default: module.StatsPage })),
);

function RouteFallback() {
  return <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>;
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <LockGate>
          <DataProvider>
            <HashRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<CommandCenterPage />} />
              <Route path="/today" element={<TodayPage />} />

              <Route path="/tracker" element={<TrackerPage />} />
              <Route path="/prep" element={<PrepPage />} />
              <Route path="/roadmap" element={<RoadmapPage />} />

              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/log" element={<EngineeringLogPage />} />

              <Route path="/goals" element={<GoalsPage />} />
              <Route
                path="/stats"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <StatsPage />
                  </Suspense>
                }
              />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/focus" element={<FocusPage />} />
              <Route path="/why" element={<WhyPage />} />

              {/* Pre-2026 routes, kept so old bookmarks still land somewhere. */}
              <Route path="/timetable" element={<Navigate to="/today" replace />} />
              <Route path="/pomodoro" element={<Navigate to="/focus" replace />} />
              <Route path="/motivation" element={<Navigate to="/why" replace />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
            </HashRouter>
          </DataProvider>
        </LockGate>
      </AuthProvider>
    </SettingsProvider>
  );
}

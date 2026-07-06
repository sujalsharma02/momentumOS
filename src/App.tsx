import { HashRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataProvider } from "@/context/DataContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { HomePage } from "@/features/dashboard/HomePage";
import { GoalsPage } from "@/features/goals/GoalsPage";
import { MotivationPage } from "@/features/motivation/MotivationPage";
import { NotesPage } from "@/features/notes/NotesPage";
import { PomodoroPage } from "@/features/pomodoro/PomodoroPage";
import { PrepPage } from "@/features/prep/PrepPage";
import { StatsPage } from "@/features/stats/StatsPage";
import { TimetablePage } from "@/features/timetable/TimetablePage";
import { TrackerPage } from "@/features/tracker/TrackerPage";

export default function App() {
  return (
    <SettingsProvider>
      <DataProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/timetable" element={<TimetablePage />} />
              <Route path="/prep" element={<PrepPage />} />
              <Route path="/tracker" element={<TrackerPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/pomodoro" element={<PomodoroPage />} />
              <Route path="/motivation" element={<MotivationPage />} />
              <Route path="*" element={<HomePage />} />
            </Route>
          </Routes>
        </HashRouter>
      </DataProvider>
    </SettingsProvider>
  );
}

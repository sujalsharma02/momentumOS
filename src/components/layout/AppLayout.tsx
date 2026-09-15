import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export function AppLayout() {
  useKeyboardShortcuts();
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <div className="ambient" aria-hidden />
      <Sidebar />
      <div className="lg:pl-60">
        <TopBar />
        <main className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
          {/* Re-mount on route change so a page's fade-in runs once per visit. */}
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

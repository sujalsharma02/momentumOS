import { motion } from "framer-motion";
import { Flame, Rocket } from "lucide-react";
import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "@/components/layout/nav";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { useData } from "@/context/DataContext";
import { currentStreak } from "@/lib/stats";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { logs } = useData();
  const streak = currentStreak(logs);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/[0.06] bg-background/60 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 shadow-glow-violet">
          <Rocket className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight">Momentum OS</div>
          <div className="text-[11px] text-muted-foreground">AI career command center</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.path === "/"}>
            {({ isActive }) => (
              <div
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg border border-primary/25 bg-primary/10"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <DynamicIcon name={item.icon} className="relative z-10 h-4 w-4" />
                <span className="relative z-10 flex-1">{item.label}</span>
                <kbd className="relative z-10 hidden rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground group-hover:inline-block">
                  {item.shortcut}
                </kbd>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/[0.06] p-4">
        <div className="glass flex items-center gap-3 rounded-lg px-3 py-2.5">
          <Flame className={cn("h-5 w-5", streak > 0 ? "text-orange-400" : "text-muted-foreground")} />
          <div>
            <div className="tabular text-sm font-bold">{streak} day streak</div>
            <div className="text-[11px] text-muted-foreground">
              {streak > 0 ? "Keep the fire alive" : "Complete 50% today to start"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

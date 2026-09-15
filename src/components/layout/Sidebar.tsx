import { Flame } from "lucide-react";
import { NavLink } from "react-router-dom";
import { NAV_GROUPS, type NavItem } from "@/components/layout/nav";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { useData } from "@/context/DataContext";
import { currentStreak } from "@/lib/stats";
import { cn } from "@/lib/utils";

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <span className="text-sm font-bold">M</span>
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">Momentum OS</div>
        <div className="text-[11px] text-muted-foreground">Career operating system</div>
      </div>
    </div>
  );
}

export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.id}>
          <div className="eyebrow mb-1.5 px-3">{group.label}</div>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.path}>
                <NavItemLink item={item} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function NavItemLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors",
          isActive
            ? "bg-accent font-medium text-foreground"
            : "text-muted-foreground hover:bg-elevated hover:text-foreground",
        )
      }
    >
      <DynamicIcon name={item.icon} className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      <kbd className="hidden rounded border border-border bg-background px-1 font-mono text-[10px] text-muted-foreground group-hover:inline-block">
        {item.shortcut}
      </kbd>
    </NavLink>
  );
}

export function Sidebar() {
  const { dayLogs, plan } = useData();
  const streak = currentStreak(dayLogs.logs, plan.taskIds);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-background lg:flex">
      <div className="px-5 py-5">
        <Logo />
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <NavList />
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <Flame
            className={cn("h-4 w-4", streak > 0 ? "text-orange-500" : "text-muted-foreground")}
          />
          <div className="leading-tight">
            <div className="tabular text-sm font-semibold">
              {streak} day{streak === 1 ? "" : "s"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {streak > 0 ? "current streak" : "finish half the plan to start"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

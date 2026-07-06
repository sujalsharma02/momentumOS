import { Keyboard, Moon, Rocket, Sun, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { NAV_ITEMS } from "@/components/layout/nav";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSettings } from "@/context/SettingsContext";
import { useNow } from "@/hooks/useNow";
import { cn } from "@/lib/utils";

const SHORTCUTS: Array<[string, string]> = [
  ...NAV_ITEMS.map((item) => [item.shortcut, `Go to ${item.label}`] as [string, string]),
  ["t", "Toggle dark / light theme"],
  ["s", "Toggle sound"],
  ["?", "Show this help"],
];

export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Fly through the app without touching the mouse.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          {SHORTCUTS.map(([key, label]) => (
            <div key={label} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-white/[0.04]">
              <span className="text-muted-foreground">{label}</span>
              <kbd className="rounded border border-border bg-secondary px-2 py-0.5 font-mono text-xs">{key}</kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TopBar() {
  const { settings, toggleTheme, toggleSound } = useSettings();
  const now = useNow();
  const location = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);
  const currentPage = NAV_ITEMS.find((item) =>
    item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path),
  );

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-cyan-400">
              <Rocket className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold">Momentum OS</span>
          </div>
          <div className="hidden text-sm font-medium text-muted-foreground lg:block">
            {currentPage?.label ?? "Momentum OS"}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <span className="tabular mr-2 hidden text-sm font-medium text-muted-foreground sm:block">
              {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHelpOpen(true)}
              aria-label="Keyboard shortcuts"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSound}
              aria-label={settings.soundEnabled ? "Mute sounds" : "Enable sounds"}
            >
              {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={settings.theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {settings.theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav strip */}
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "border border-primary/25 bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-white/[0.04]",
                )
              }
            >
              <DynamicIcon name={item.icon} className="h-3.5 w-3.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <ShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}

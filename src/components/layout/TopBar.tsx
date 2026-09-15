import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Keyboard, Menu, Moon, ShieldCheck, Sun, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { activeNavItem, NAV_ITEMS } from "@/components/layout/nav";
import { NavList } from "@/components/layout/Sidebar";
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
import { SecurityDialog } from "@/features/auth/SecurityDialog";

const SHORTCUTS: Array<[string, string]> = [
  ...NAV_ITEMS.map((item) => [item.shortcut, item.label] as [string, string]),
  ["t", "Toggle theme"],
  ["s", "Toggle sound"],
  ["?", "This help"],
];

export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Work anywhere except inside a text field.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
          {SHORTCUTS.map(([key, label]) => (
            <div key={label} className="flex items-center justify-between py-1 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Slide-in navigation for narrow screens. */
function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-background shadow-raised">
          <div className="flex items-center justify-between px-4 py-3">
            <DialogPrimitive.Title className="text-sm font-semibold">Navigate</DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close navigation">
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            <NavList onNavigate={() => setOpen(false)} />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function TopBar() {
  const { settings, toggleTheme, toggleSound } = useSettings();
  const now = useNow(1000);
  const location = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const currentPage = activeNavItem(location.pathname);

  // "?" opens the shortcut list from anywhere outside a text field.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "?" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      event.preventDefault();
      setHelpOpen((open) => !open);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header className="glass sticky top-0 z-30 border-b border-t-0 border-x-0 rounded-none">
        <div className="flex h-12 items-center gap-2 px-3 sm:px-5">
          <MobileNav />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{currentPage?.label ?? "Momentum OS"}</div>
          </div>

          <span className="tabular hidden text-xs text-muted-foreground sm:block">
            {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            <span className="mx-1.5 text-border">|</span>
            {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSecurityOpen(true)}
              aria-label="Security and data"
            >
              <ShieldCheck className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setHelpOpen(true)}
              aria-label="Keyboard shortcuts"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSound}
              aria-label={settings.soundEnabled ? "Mute sounds" : "Enable sounds"}
            >
              {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleTheme}
              aria-label={settings.theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {settings.theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>
      <ShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
      <SecurityDialog open={securityOpen} onOpenChange={setSecurityOpen} />
    </>
  );
}

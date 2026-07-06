import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "@/components/layout/nav";
import { useSettings } from "@/context/SettingsContext";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

/** Global shortcuts: 1–9 navigate, t = theme, s = sound. */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const { toggleTheme, toggleSound } = useSettings();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const navItem = NAV_ITEMS.find((item) => item.shortcut === event.key);
      if (navItem) {
        event.preventDefault();
        navigate(navItem.path);
        return;
      }
      if (event.key === "t") {
        event.preventDefault();
        toggleTheme();
      }
      if (event.key === "s") {
        event.preventDefault();
        toggleSound();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate, toggleTheme, toggleSound]);
}

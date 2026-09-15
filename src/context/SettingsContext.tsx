import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { normalizeSettings } from "@/lib/normalize";
import { setSoundEnabled } from "@/lib/sound";
import { STORAGE_KEYS } from "@/lib/storage";
import type { Settings } from "@/types";

interface SettingsContextValue {
  settings: Settings;
  toggleTheme: () => void;
  toggleSound: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const DEFAULT_SETTINGS: Settings = { theme: "dark", soundEnabled: true };

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage<Settings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS, {
    normalize: normalizeSettings,
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
  }, [settings.theme]);

  useEffect(() => {
    setSoundEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  const toggleTheme = useCallback(
    () => setSettings((prev) => ({ ...prev, theme: prev.theme === "dark" ? "light" : "dark" })),
    [setSettings],
  );

  const toggleSound = useCallback(
    () => setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled })),
    [setSettings],
  );

  const value = useMemo(
    () => ({ settings, toggleTheme, toggleSound }),
    [settings, toggleTheme, toggleSound],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
}

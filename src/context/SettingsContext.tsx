import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { setSoundEnabled } from "@/lib/sound";
import type { Settings } from "@/types";

interface SettingsContextValue {
  settings: Settings;
  toggleTheme: () => void;
  toggleSound: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const DEFAULT_SETTINGS: Settings = { theme: "dark", soundEnabled: true };

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage<Settings>("settings", DEFAULT_SETTINGS);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
  }, [settings.theme]);

  useEffect(() => {
    setSoundEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  const toggleTheme = () =>
    setSettings((prev) => ({ ...prev, theme: prev.theme === "dark" ? "light" : "dark" }));

  const toggleSound = () =>
    setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));

  return (
    <SettingsContext.Provider value={{ settings, toggleTheme, toggleSound }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
}

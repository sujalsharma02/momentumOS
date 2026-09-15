import { useCallback, useEffect, useRef, useState } from "react";
import { readRaw, writeRaw } from "@/lib/storage";

interface Options<T> {
  /**
   * Repairs whatever came out of storage. Runs once on mount, so a malformed
   * or half-migrated payload can never reach a component.
   */
  normalize?: (value: unknown) => T;
}

/**
 * State backed by localStorage.
 *
 * Nothing is written until the value actually changes — mounting a provider
 * should not stamp defaults over an empty store, because "has this user any
 * data?" is answered by key presence.
 */
export function useLocalStorage<T>(key: string, initialValue: T, options: Options<T> = {}) {
  const normalizeRef = useRef(options.normalize);
  normalizeRef.current = options.normalize;

  const [value, setValue] = useState<T>(() => {
    const raw = readRaw(key);
    if (raw === undefined) return initialValue;
    const normalize = normalizeRef.current;
    if (!normalize) return raw as T;
    try {
      return normalize(raw);
    } catch {
      return initialValue;
    }
  });

  const keyRef = useRef(key);
  keyRef.current = key;
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    writeRaw(keyRef.current, value);
  }, [value]);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => (typeof next === "function" ? (next as (p: T) => T)(prev) : next));
  }, []);

  return [value, set] as const;
}

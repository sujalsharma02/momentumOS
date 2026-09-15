import { useCallback, useMemo, useRef } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/storage";

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export interface Collection<T extends { id: string }> {
  items: T[];
  add: (item: T) => T;
  update: (id: string, patch: Partial<T>) => void;
  remove: (id: string) => void;
  replace: (next: T[] | ((prev: T[]) => T[])) => void;
}

interface Options<T> {
  /** Repairs stored JSON. Required — nothing loads unvalidated. */
  normalize: (value: unknown) => T[];
  /**
   * Seed used only when the key has never been written. Once the key exists the
   * stored value wins, including when the user has emptied the collection.
   */
  initial?: T[];
  /** Newest first. Default true. */
  prepend?: boolean;
  /** Applied to an item after `update`, e.g. to bump `updatedAt`. */
  touch?: (item: T) => T;
  /** Applied to the whole list after any write, e.g. to re-sort. */
  sort?: (items: T[]) => T[];
}

/**
 * The add / update / remove trio shared by every id-keyed collection, so each
 * store hook only describes what is different about its model.
 */
export function useCollection<T extends { id: string }>(
  key: StorageKey,
  { normalize, initial, prepend = true, touch, sort }: Options<T>,
): Collection<T> {
  const [items, setItems] = useLocalStorage<T[]>(key, initial ?? [], { normalize });

  const behaviour = useRef({ prepend, touch, sort });
  behaviour.current = { prepend, touch, sort };

  const applySort = useCallback((list: T[]) => {
    const { sort: sortFn } = behaviour.current;
    return sortFn ? sortFn(list) : list;
  }, []);

  const add = useCallback(
    (item: T) => {
      setItems((prev) => applySort(behaviour.current.prepend ? [item, ...prev] : [...prev, item]));
      return item;
    },
    [setItems, applySort],
  );

  const update = useCallback(
    (id: string, patch: Partial<T>) => {
      setItems((prev) =>
        applySort(
          prev.map((item) => {
            if (item.id !== id) return item;
            const next = { ...item, ...patch, id: item.id };
            return behaviour.current.touch ? behaviour.current.touch(next) : next;
          }),
        ),
      );
    },
    [setItems, applySort],
  );

  const remove = useCallback(
    (id: string) => setItems((prev) => prev.filter((item) => item.id !== id)),
    [setItems],
  );

  return useMemo(
    () => ({ items, add, update, remove, replace: setItems }),
    [items, add, update, remove, setItems],
  );
}

import { useCallback, useMemo } from "react";
import { DEFAULT_PLAN } from "@/data/defaultPlan";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { normalizePlanBlocks } from "@/lib/normalize";
import { STORAGE_KEYS } from "@/lib/storage";
import { uid } from "@/lib/utils";
import type { PlanBlock } from "@/types";

export interface PlanStore {
  blocks: PlanBlock[];
  /** Every checklist id in the current plan, in plan order. */
  taskIds: string[];
  addBlock: (block: Omit<PlanBlock, "id">) => PlanBlock;
  updateBlock: (id: string, patch: Partial<Omit<PlanBlock, "id">>) => void;
  removeBlock: (id: string) => void;
  resetToDefault: () => void;
}

/**
 * The editable day plan. Seeded from `DEFAULT_PLAN` on a fresh install; once
 * the key exists, the user's version wins even when they have emptied it.
 */
export function usePlan(): PlanStore {
  const [blocks, setBlocks] = useLocalStorage<PlanBlock[]>(STORAGE_KEYS.planBlocks, DEFAULT_PLAN, {
    normalize: normalizePlanBlocks,
  });

  const sorted = useMemo(
    () => [...blocks].sort((a, b) => a.start.localeCompare(b.start)),
    [blocks],
  );

  const taskIds = useMemo(
    () => sorted.flatMap((block) => block.tasks.map((task) => task.id)),
    [sorted],
  );

  const addBlock = useCallback(
    (block: Omit<PlanBlock, "id">) => {
      const created: PlanBlock = { ...block, id: uid() };
      setBlocks((prev) => [...prev, created]);
      return created;
    },
    [setBlocks],
  );

  const updateBlock = useCallback(
    (id: string, patch: Partial<Omit<PlanBlock, "id">>) => {
      setBlocks((prev) => prev.map((block) => (block.id === id ? { ...block, ...patch } : block)));
    },
    [setBlocks],
  );

  const removeBlock = useCallback(
    (id: string) => setBlocks((prev) => prev.filter((block) => block.id !== id)),
    [setBlocks],
  );

  const resetToDefault = useCallback(() => setBlocks(DEFAULT_PLAN), [setBlocks]);

  return useMemo(
    () => ({ blocks: sorted, taskIds, addBlock, updateBlock, removeBlock, resetToDefault }),
    [sorted, taskIds, addBlock, updateBlock, removeBlock, resetToDefault],
  );
}

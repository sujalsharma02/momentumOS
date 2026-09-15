import { useCallback, useMemo } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { todayISO } from "@/lib/dates";
import { normalizePrepProgress } from "@/lib/normalize";
import { STORAGE_KEYS } from "@/lib/storage";
import { uid } from "@/lib/utils";
import type { PrepProgress, TopicStrength } from "@/types";

export const EMPTY_PROGRESS: PrepProgress = {
  readiness: 0,
  strength: "unrated",
  notes: "",
  questions: [],
};

export interface PrepStore {
  progress: Record<string, PrepProgress>;
  getProgress: (topicId: string) => PrepProgress;
  setNotes: (topicId: string, notes: string) => void;
  setReadiness: (topicId: string, readiness: number) => void;
  setStrength: (topicId: string, strength: TopicStrength) => void;
  markStudied: (topicId: string) => void;
  addQuestion: (topicId: string, prompt: string) => void;
  toggleQuestion: (topicId: string, questionId: string) => void;
  removeQuestion: (topicId: string, questionId: string) => void;
  replaceProgress: (next: Record<string, PrepProgress>) => void;
}

/**
 * Per-topic interview readiness. Topics themselves are static config in
 * `@/data/prepTopics`; only the user's progress against them is stored, so
 * adding a topic to the catalogue never needs a migration.
 */
export function usePrep(): PrepStore {
  const [progress, setProgress] = useLocalStorage<Record<string, PrepProgress>>(
    STORAGE_KEYS.prepProgress,
    {},
    { normalize: normalizePrepProgress },
  );

  const patch = useCallback(
    (topicId: string, apply: (current: PrepProgress) => PrepProgress) => {
      setProgress((prev) => ({
        ...prev,
        [topicId]: apply(prev[topicId] ?? EMPTY_PROGRESS),
      }));
    },
    [setProgress],
  );

  const getProgress = useCallback(
    (topicId: string) => progress[topicId] ?? EMPTY_PROGRESS,
    [progress],
  );

  const setNotes = useCallback(
    (topicId: string, notes: string) => patch(topicId, (current) => ({ ...current, notes })),
    [patch],
  );

  const setReadiness = useCallback(
    (topicId: string, readiness: number) =>
      patch(topicId, (current) => ({
        ...current,
        readiness: Math.min(100, Math.max(0, Math.round(readiness))),
        lastStudied: todayISO(),
      })),
    [patch],
  );

  const setStrength = useCallback(
    (topicId: string, strength: TopicStrength) =>
      patch(topicId, (current) => ({ ...current, strength })),
    [patch],
  );

  const markStudied = useCallback(
    (topicId: string) => patch(topicId, (current) => ({ ...current, lastStudied: todayISO() })),
    [patch],
  );

  const addQuestion = useCallback(
    (topicId: string, prompt: string) => {
      const text = prompt.trim();
      if (!text) return;
      patch(topicId, (current) => ({
        ...current,
        questions: [...current.questions, { id: uid(), prompt: text, answered: false }],
      }));
    },
    [patch],
  );

  const toggleQuestion = useCallback(
    (topicId: string, questionId: string) =>
      patch(topicId, (current) => ({
        ...current,
        questions: current.questions.map((question) =>
          question.id === questionId ? { ...question, answered: !question.answered } : question,
        ),
      })),
    [patch],
  );

  const removeQuestion = useCallback(
    (topicId: string, questionId: string) =>
      patch(topicId, (current) => ({
        ...current,
        questions: current.questions.filter((question) => question.id !== questionId),
      })),
    [patch],
  );

  return useMemo(
    () => ({
      progress,
      getProgress,
      setNotes,
      setReadiness,
      setStrength,
      markStudied,
      addQuestion,
      toggleQuestion,
      removeQuestion,
      replaceProgress: setProgress,
    }),
    [
      progress,
      getProgress,
      setNotes,
      setReadiness,
      setStrength,
      markStudied,
      addQuestion,
      toggleQuestion,
      removeQuestion,
      setProgress,
    ],
  );
}

/**
 * Schema migrations, run once from `main.tsx` before React renders.
 *
 * Rules that keep upgrades safe:
 *  - migrations only ever add or rewrite in place, never delete a user's rows;
 *  - every step is idempotent, so a half-applied run can simply be repeated;
 *  - a step that throws is swallowed and the version is still advanced, because
 *    `@/lib/normalize` repairs whatever the step failed to convert. Blocking the
 *    app on a bad migration would be worse than loading slightly stale data.
 *
 * Version history
 *   v0  pre-versioning. Keys: dayLogs, applications, notes, prepNotes,
 *       celebratedOn, settings. Four application statuses, hardcoded timetable.
 *   v1  marker for installs that already had v0 data (no shape change).
 *   v2  2026 rewrite. Applications gain pipeline fields; day logs gain a
 *       `planIds` snapshot; prep notes fan out into prep progress.
 */

import { DEFAULT_PLAN, LEGACY_TASK_IDS } from "@/data/defaultPlan";
import { todayISO } from "@/lib/dates";
import { hasRaw, readRaw, SCHEMA_VERSION, STORAGE_KEYS, writeRaw } from "@/lib/storage";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Detects the version of whatever is already in localStorage.
 *
 * A stored version wins. Otherwise: any legacy key present means v0; a
 * completely empty store is a fresh install and starts at the current version.
 */
function detectVersion(): number {
  const stored = readRaw<number>(STORAGE_KEYS.schemaVersion);
  if (typeof stored === "number" && Number.isFinite(stored)) return stored;

  const hasLegacyData =
    hasRaw(STORAGE_KEYS.dayLogs) ||
    hasRaw(STORAGE_KEYS.applications) ||
    hasRaw(STORAGE_KEYS.notes) ||
    hasRaw(STORAGE_KEYS.prepNotes);

  return hasLegacyData ? 0 : SCHEMA_VERSION;
}

/** v0 -> v1: nothing to convert, just record where we are. */
function migrateV0toV1(): void {
  // Intentionally empty. v1 exists so v0 installs get a version stamp before
  // the v2 step runs, making the upgrade path explicit rather than implied.
}

/**
 * v1 -> v2: the 2026 rewrite.
 *
 * Applications keep their id, company, role, date, notes and status — the four
 * legacy statuses are all still valid names in the nine-status pipeline — and
 * gain the new optional fields with sensible defaults.
 *
 * Day logs get `planIds` stamped so the editable day plan can never rewrite
 * history: past days are pinned to the legacy checklist, today is pinned to the
 * new default plan (which reuses most legacy ids, so ticks carry over).
 */
function migrateV1toV2(): void {
  const today = todayISO();

  // --- Applications: backfill fields added in v2 -------------------------
  const applications = readRaw<unknown>(STORAGE_KEYS.applications);
  if (Array.isArray(applications)) {
    const now = Date.now();
    const upgraded = applications.filter(isRecord).map((app) => ({
      ...app,
      priority: typeof app.priority === "string" ? app.priority : "medium",
      createdAt: typeof app.createdAt === "number" ? app.createdAt : now,
      updatedAt: typeof app.updatedAt === "number" ? app.updatedAt : now,
    }));
    writeRaw(STORAGE_KEYS.applications, upgraded);
  }

  // --- Day logs: pin each day to the checklist it was actually scored on --
  const dayLogs = readRaw<unknown>(STORAGE_KEYS.dayLogs);
  if (isRecord(dayLogs)) {
    const defaultPlanIds = DEFAULT_PLAN.flatMap((block) => block.tasks.map((task) => task.id));
    const upgraded: Record<string, unknown> = {};
    for (const [date, log] of Object.entries(dayLogs)) {
      if (!isRecord(log)) continue;
      upgraded[date] = {
        ...log,
        planIds: Array.isArray(log.planIds)
          ? log.planIds
          : date === today
            ? defaultPlanIds
            : [...LEGACY_TASK_IDS],
      };
    }
    writeRaw(STORAGE_KEYS.dayLogs, upgraded);
  }

  // --- Prep: lift the flat notes map into structured progress -----------
  const prepNotes = readRaw<unknown>(STORAGE_KEYS.prepNotes);
  if (isRecord(prepNotes) && !hasRaw(STORAGE_KEYS.prepProgress)) {
    const progress: Record<string, unknown> = {};
    for (const [topicId, note] of Object.entries(prepNotes)) {
      if (typeof note !== "string" || note.trim().length === 0) continue;
      progress[topicId] = {
        readiness: 0,
        strength: "unrated",
        notes: note,
        questions: [],
      };
    }
    if (Object.keys(progress).length > 0) writeRaw(STORAGE_KEYS.prepProgress, progress);
    // prepNotes is left in place as a rollback safety net; nothing reads it now.
  }
}

const MIGRATIONS: Array<{ to: number; run: () => void }> = [
  { to: 1, run: migrateV0toV1 },
  { to: 2, run: migrateV1toV2 },
];

/**
 * Brings localStorage up to `SCHEMA_VERSION`. Safe to call more than once.
 * Returns the version migrated from, which the UI can use to explain what
 * changed (or ignore entirely).
 */
export function runMigrations(): number {
  const from = detectVersion();
  if (from >= SCHEMA_VERSION) {
    writeRaw(STORAGE_KEYS.schemaVersion, SCHEMA_VERSION);
    return from;
  }

  for (const migration of MIGRATIONS) {
    if (migration.to <= from) continue;
    try {
      migration.run();
    } catch (error) {
      // Normalizers downstream will repair anything this step left half-done.
      console.warn(`[momentum-os] migration to v${migration.to} failed`, error);
    }
    writeRaw(STORAGE_KEYS.schemaVersion, migration.to);
  }

  return from;
}

import { valuesEqual } from "@/modules/import/persistence/lifecycle-reconciler";

export function isEmptyImportValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  return false;
}

export type FillMissingResult<T extends Record<string, unknown>> = {
  fill: Partial<T>;
  conflicts: Partial<T>;
};

/**
 * Backfill strategy: only fill empty fields on existing records.
 * Conflicts are recorded for editor review — never overwrite approved values.
 */
export function pickFillMissingFields<T extends Record<string, unknown>>(
  existing: T,
  incoming: Partial<T>,
  keys: Array<keyof T>,
): FillMissingResult<T> {
  const fill: Partial<T> = {};
  const conflicts: Partial<T> = {};

  for (const key of keys) {
    const current = existing[key];
    const next = incoming[key];
    if (isEmptyImportValue(next)) continue;

    if (isEmptyImportValue(current)) {
      fill[key] = next;
    } else if (!valuesEqual(current as never, next as never)) {
      conflicts[key] = next;
    }
  }

  return { fill, conflicts };
}

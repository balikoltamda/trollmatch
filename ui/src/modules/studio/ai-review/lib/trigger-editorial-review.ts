import type { StudioReviewEntityType } from "@/generated/prisma/client";
import { buildEntitySnapshot } from "@/modules/studio/ai-review/lib/entity-snapshots";
import {
  runEditorialReview,
  type EditorialReviewResult,
  type ReviewTrigger,
} from "@/modules/studio/ai-review/lib/run-editorial-review";

/** Queue a full editorial review after lifecycle or import events. */
export async function triggerEditorialReview(
  entityType: StudioReviewEntityType,
  entityId: string,
  trigger: ReviewTrigger,
  createdBy = "system",
): Promise<EditorialReviewResult | null> {
  const snapshot = await buildEntitySnapshot(entityType, entityId);
  if (!snapshot) return null;

  return runEditorialReview({
    entityType,
    entityId,
    seedInput: snapshot,
    createdBy,
    trigger,
  });
}

/** Batch trigger for import pipeline — never blocks on individual failures. */
export async function triggerEditorialReviewBatch(
  items: Array<{ entityType: StudioReviewEntityType; entityId: string }>,
  trigger: ReviewTrigger = "IMPORT",
  createdBy = "importer",
): Promise<number> {
  let count = 0;
  for (const item of items) {
    try {
      await triggerEditorialReview(item.entityType, item.entityId, trigger, createdBy);
      count += 1;
    } catch {
      /* per-entity isolation */
    }
  }
  return count;
}

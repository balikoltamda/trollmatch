import type { StudioReviewEntityType } from "@/generated/prisma/client";
import type { QualityCheckItem } from "@/modules/studio/ai-review/lib/quality-report";
import { validateEntity as validateEntityImpl, validateSeedInput } from "@/modules/studio/ai-review/validators/validate-entity";

export type EntityValidator = (entityId: string) => Promise<QualityCheckItem[]>;
export type SeedValidator = (seed: Record<string, unknown>) => QualityCheckItem[];

const entityValidators = new Map<StudioReviewEntityType, EntityValidator>();

/** Register a pluggable entity validator — future entity types plug in here. */
export function registerEntityValidator(
  entityType: StudioReviewEntityType,
  validator: EntityValidator,
): void {
  entityValidators.set(entityType, validator);
}

export async function runEntityValidator(
  entityType: StudioReviewEntityType,
  entityId: string,
): Promise<QualityCheckItem[]> {
  const custom = entityValidators.get(entityType);
  if (custom) return custom(entityId);
  return validateEntityImpl(entityType, entityId);
}

export function runSeedValidator(
  entityType: StudioReviewEntityType,
  seed: Record<string, unknown>,
): QualityCheckItem[] {
  return validateSeedInput(entityType, seed);
}

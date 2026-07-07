import type { StudioReviewEntityType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { triggerEditorialReview } from "@/modules/studio/ai-review/lib/trigger-editorial-review";
import type { EditorialReviewResult } from "@/modules/studio/ai-review/lib/run-editorial-review";

export type ScannableEntity = {
  entityType: StudioReviewEntityType;
  entityId: string;
  label: string;
};

export type BackgroundScanResult = {
  scanned: number;
  failed: number;
  results: Array<{
    entityType: StudioReviewEntityType;
    entityId: string;
    label: string;
    ok: boolean;
    sessionId?: string;
    overallScore?: number;
    error?: string;
  }>;
};

/** List every entity in the knowledge graph eligible for editorial scanning. */
export async function listScannableEntities(): Promise<ScannableEntity[]> {
  const [
    species,
    techniques,
    lures,
    manufacturers,
    regions,
    knowledgeSources,
    catchReports,
    lureVariants,
    productLines,
  ] = await Promise.all([
    prisma.fishSpecies.findMany({
      where: { deletedAt: null },
      select: { id: true, nameEn: true },
    }),
    prisma.technique.findMany({
      where: { deletedAt: null },
      select: { id: true, nameEn: true },
    }),
    prisma.lureModel.findMany({
      where: { deletedAt: null },
      select: { id: true, nameEn: true },
    }),
    prisma.manufacturer.findMany({
      select: { id: true, nameEn: true },
    }),
    prisma.region.findMany({
      select: { id: true, nameEn: true },
    }),
    prisma.knowledgeSource.findMany({
      where: { active: true },
      select: { id: true, nameEn: true },
    }),
    prisma.catchReport.findMany({
      where: { mergedIntoId: null },
      select: { id: true, fishSpecies: { select: { nameEn: true } } },
      take: 200,
      orderBy: { createdAt: "desc" },
    }),
    prisma.lureVariant.findMany({
      where: { deletedAt: null },
      select: { id: true, labelEn: true },
      take: 500,
    }),
    prisma.productLine.findMany({
      select: { id: true, nameEn: true },
    }),
  ]);

  return [
    ...species.map((r) => ({ entityType: "SPECIES" as const, entityId: r.id, label: r.nameEn })),
    ...techniques.map((r) => ({
      entityType: "TECHNIQUE" as const,
      entityId: r.id,
      label: r.nameEn,
    })),
    ...lures.map((r) => ({ entityType: "LURE" as const, entityId: r.id, label: r.nameEn })),
    ...manufacturers.map((r) => ({
      entityType: "MANUFACTURER" as const,
      entityId: r.id,
      label: r.nameEn,
    })),
    ...regions.map((r) => ({ entityType: "REGION" as const, entityId: r.id, label: r.nameEn })),
    ...knowledgeSources.map((r) => ({
      entityType: "KNOWLEDGE_SOURCE" as const,
      entityId: r.id,
      label: r.nameEn,
    })),
    ...catchReports.map((r) => ({
      entityType: "CATCH_REPORT" as const,
      entityId: r.id,
      label: r.fishSpecies.nameEn,
    })),
    ...lureVariants.map((r) => ({
      entityType: "LURE_VARIANT" as const,
      entityId: r.id,
      label: r.labelEn,
    })),
    ...productLines.map((r) => ({
      entityType: "PRODUCT_LINE" as const,
      entityId: r.id,
      label: r.nameEn,
    })),
  ];
}

/** Scan a single entity — reusable by cron, lifecycle hooks, and manual triggers. */
export async function scanEntity(
  entityType: StudioReviewEntityType,
  entityId: string,
  createdBy = "background-scanner",
): Promise<EditorialReviewResult | null> {
  return triggerEditorialReview(entityType, entityId, "BACKGROUND_SCAN", createdBy);
}

/** Scan the full knowledge graph — per-entity isolation; never modifies production data. */
export async function scanAllEntities(
  createdBy = "background-scanner",
  options?: { limit?: number },
): Promise<BackgroundScanResult> {
  const entities = await listScannableEntities();
  const batch = options?.limit ? entities.slice(0, options.limit) : entities;

  const results: BackgroundScanResult["results"] = [];
  let scanned = 0;
  let failed = 0;

  for (const entity of batch) {
    try {
      const result = await scanEntity(entity.entityType, entity.entityId, createdBy);
      if (result) {
        scanned += 1;
        results.push({
          entityType: entity.entityType,
          entityId: entity.entityId,
          label: entity.label,
          ok: true,
          sessionId: result.sessionId,
          overallScore: result.readinessScore,
        });
      } else {
        failed += 1;
        results.push({
          entityType: entity.entityType,
          entityId: entity.entityId,
          label: entity.label,
          ok: false,
          error: "Entity snapshot unavailable",
        });
      }
    } catch (error) {
      failed += 1;
      results.push({
        entityType: entity.entityType,
        entityId: entity.entityId,
        label: entity.label,
        ok: false,
        error: error instanceof Error ? error.message : "Scan failed",
      });
    }
  }

  return { scanned, failed, results };
}

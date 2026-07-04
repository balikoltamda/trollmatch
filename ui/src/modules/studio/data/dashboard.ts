import { prisma } from "@/lib/prisma";
import type { DashboardStats, ProductListRow } from "@/modules/studio/types";
import { countReviewQueue } from "@/modules/studio/data/review-queue";
import {
  computeCompleteness,
  editorNoteHasMeaningfulContent,
} from "@/modules/studio/lib/completeness";

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    lureModels,
    manufacturers,
    fishSpecies,
    images,
    pendingReview,
    readyToPublish,
    published,
    reviewQueue,
    pendingImportDiffs,
  ] = await Promise.all([
    prisma.lureModel.count({ where: { deletedAt: null } }),
    prisma.manufacturer.count({ where: { deletedAt: null } }),
    prisma.fishSpecies.count({ where: { deletedAt: null } }),
    prisma.image.count({ where: { deletedAt: null } }),
    prisma.lureModel.count({
      where: { deletedAt: null, lifecycleState: "PENDING_REVIEW" },
    }),
    prisma.lureModel.count({
      where: { deletedAt: null, lifecycleState: "READY" },
    }),
    prisma.lureModel.count({
      where: { deletedAt: null, lifecycleState: "PUBLISHED" },
    }),
    countReviewQueue(),
    prisma.importFieldChange.count({ where: { status: "PENDING" } }),
  ]);

  return {
    lureModels,
    manufacturers,
    fishSpecies,
    images,
    pendingReview,
    readyToPublish,
    published,
    reviewQueue,
    pendingImportDiffs,
  };
}

export async function getLatestImports(limit = 8) {
  return prisma.importBatch.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
    select: {
      id: true,
      manufacturerCode: true,
      displayName: true,
      status: true,
      startedAt: true,
      durationMs: true,
      createdCount: true,
      updatedCount: true,
      missingCount: true,
      errorCount: true,
      reportPath: true,
    },
  });
}

export async function getLatestEditedProducts(
  limit = 8,
): Promise<ProductListRow[]> {
  const rows = await prisma.lureModel.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      slug: true,
      nameEn: true,
      nameTr: true,
      bodyTypeEn: true,
      actionEn: true,
      buoyancyEn: true,
      divingDepthMinM: true,
      divingDepthMaxM: true,
      lifecycleState: true,
      manufacturerStatus: true,
      updatedAt: true,
      manufacturer: { select: { nameEn: true, slug: true } },
      editorNote: {
        select: {
          id: true,
          shortRecommendationEn: true,
          shortRecommendationTr: true,
          currentRecommendationEn: true,
          currentRecommendationTr: true,
          mediterraneanNotesEn: true,
          mediterraneanNotesTr: true,
          internalNotes: true,
        },
      },
      images: {
        where: { deletedAt: null },
        take: 1,
        orderBy: [{ role: "asc" }, { sortOrder: "asc" }],
        select: { url: true, role: true },
      },
      lureSpeciesLinks: {
        where: { deletedAt: null, associationKind: "MODERATOR_CURATED" },
        select: { id: true },
      },
      _count: {
        select: { images: { where: { deletedAt: null } } },
      },
    },
  });

  return rows.map((row) => {
    const hasCover = row.images.some((img) => img.role === "HERO");
    const completeness = computeCompleteness({
      nameTr: row.nameTr,
      bodyTypeEn: row.bodyTypeEn,
      actionEn: row.actionEn,
      buoyancyEn: row.buoyancyEn,
      divingDepthMinM: row.divingDepthMinM?.toString() ?? null,
      divingDepthMaxM: row.divingDepthMaxM?.toString() ?? null,
      imageCount: row._count.images,
      hasCoverImage: hasCover,
      moderatorSpeciesCount: row.lureSpeciesLinks.length,
      hasEditorNote: row.editorNote !== null,
      editorNoteHasContent: editorNoteHasMeaningfulContent(row.editorNote),
    });

    return {
      id: row.id,
      slug: row.slug,
      nameEn: row.nameEn,
      nameTr: row.nameTr,
      manufacturerName: row.manufacturer.nameEn,
      manufacturerSlug: row.manufacturer.slug,
      bodyTypeEn: row.bodyTypeEn,
      lifecycleState: row.lifecycleState,
      manufacturerStatus: row.manufacturerStatus,
      hasEditorNote: row.editorNote !== null,
      updatedAt: row.updatedAt,
      imageUrl: row.images[0]?.url ?? null,
      completenessScore: completeness.score,
      completenessMissing: completeness.missing,
    };
  });
}

export async function getRecentImporterActivity(limit = 10) {
  return prisma.catalogAuditEntry.findMany({
    where: { action: { in: ["IMPORT_BATCH", "IMPORT_UPDATE", "IMPORT_CREATE"] } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      actor: true,
      summary: true,
      createdAt: true,
      metadata: true,
    },
  });
}

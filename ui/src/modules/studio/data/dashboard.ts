import { prisma } from "@/lib/prisma";
import type { DashboardStats, ProductListRow } from "@/modules/studio/types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const [lureModels, manufacturers, fishSpecies, images, pendingReview] =
    await Promise.all([
      prisma.lureModel.count({ where: { deletedAt: null } }),
      prisma.manufacturer.count({ where: { deletedAt: null } }),
      prisma.fishSpecies.count({ where: { deletedAt: null } }),
      prisma.image.count({ where: { deletedAt: null } }),
      prisma.lureModel.count({
        where: { deletedAt: null, lifecycleState: "PENDING_REVIEW" },
      }),
    ]);

  return { lureModels, manufacturers, fishSpecies, images, pendingReview };
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
      lifecycleState: true,
      manufacturerStatus: true,
      updatedAt: true,
      manufacturer: { select: { nameEn: true, slug: true } },
      editorNote: { select: { id: true } },
      images: {
        where: { deletedAt: null, role: "HERO" },
        take: 1,
        select: { url: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return rows.map((row) => ({
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
  }));
}

export async function getRecentImporterActivity(limit = 10) {
  return prisma.catalogAuditEntry.findMany({
    where: { action: "IMPORT_BATCH" },
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

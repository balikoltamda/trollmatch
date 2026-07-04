import { prisma } from "@/lib/prisma";

export type ManufacturerDetailStats = {
  slug: string;
  nameEn: string;
  nameTr: string;
  countryCode: string | null;
  website: string | null;
  productCount: number;
  needsReview: number;
  published: number;
  missing: number;
  lastImport: {
    id: string;
    startedAt: Date;
    status: string;
    createdCount: number;
    updatedCount: number;
    errorCount: number;
    reportPath: string | null;
  } | null;
  importHistory: {
    id: string;
    startedAt: Date;
    status: string;
    createdCount: number;
    updatedCount: number;
    missingCount: number;
    errorCount: number;
    durationMs: number | null;
  }[];
};

export async function getManufacturerDetail(
  slug: string,
): Promise<ManufacturerDetailStats | null> {
  const manufacturer = await prisma.manufacturer.findFirst({
    where: { slug, deletedAt: null },
    include: {
      lureModels: {
        where: { deletedAt: null },
        select: {
          lifecycleState: true,
          manufacturerStatus: true,
        },
      },
      importBatches: {
        orderBy: { startedAt: "desc" },
        take: 20,
        select: {
          id: true,
          startedAt: true,
          status: true,
          createdCount: true,
          updatedCount: true,
          missingCount: true,
          errorCount: true,
          durationMs: true,
          reportPath: true,
        },
      },
    },
  });

  if (!manufacturer) return null;

  const products = manufacturer.lureModels;
  const needsReview = products.filter(
    (p) => p.lifecycleState === "PENDING_REVIEW",
  ).length;
  const published = products.filter(
    (p) => p.lifecycleState === "PUBLISHED",
  ).length;
  const missing = products.filter(
    (p) => p.manufacturerStatus === "MISSING",
  ).length;

  const lastBatch = manufacturer.importBatches[0] ?? null;

  return {
    slug: manufacturer.slug,
    nameEn: manufacturer.nameEn,
    nameTr: manufacturer.nameTr,
    countryCode: manufacturer.countryCode,
    website: manufacturer.website,
    productCount: products.length,
    needsReview,
    published,
    missing,
    lastImport: lastBatch
      ? {
          id: lastBatch.id,
          startedAt: lastBatch.startedAt,
          status: lastBatch.status,
          createdCount: lastBatch.createdCount,
          updatedCount: lastBatch.updatedCount,
          errorCount: lastBatch.errorCount,
          reportPath: lastBatch.reportPath,
        }
      : null,
    importHistory: manufacturer.importBatches.map((b) => ({
      id: b.id,
      startedAt: b.startedAt,
      status: b.status,
      createdCount: b.createdCount,
      updatedCount: b.updatedCount,
      missingCount: b.missingCount,
      errorCount: b.errorCount,
      durationMs: b.durationMs,
    })),
  };
}

export async function getManufacturerBySlug(slug: string) {
  return prisma.manufacturer.findFirst({
    where: { slug, deletedAt: null },
    select: { slug: true, nameEn: true },
  });
}

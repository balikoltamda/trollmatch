import { prisma } from "@/lib/prisma";
import { manufacturerRegistry } from "@/modules/import/registry/registered-manufacturers";
import type { ImportManufacturerRow } from "@/modules/studio/types";

export async function getImportCenterRows(): Promise<ImportManufacturerRow[]> {
  const registry = manufacturerRegistry.list();

  const allBatches = await prisma.importBatch.findMany({
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      manufacturerCode: true,
      startedAt: true,
      durationMs: true,
      createdCount: true,
      updatedCount: true,
      missingCount: true,
      status: true,
      reportPath: true,
    },
  });

  const batchByCode = new Map<string, (typeof allBatches)[number]>();
  for (const batch of allBatches) {
    if (!batchByCode.has(batch.manufacturerCode)) {
      batchByCode.set(batch.manufacturerCode, batch);
    }
  }

  const [productCounts] = await Promise.all([
    prisma.lureModel.groupBy({
      by: ["manufacturerId"],
      where: { deletedAt: null },
      _count: { id: true },
    }),
  ]);

  const manufacturers = await prisma.manufacturer.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true },
  });
  const countBySlug = new Map<string, number>();
  for (const row of productCounts) {
    const mfr = manufacturers.find((m) => m.id === row.manufacturerId);
    if (mfr) countBySlug.set(mfr.slug, row._count.id);
  }

  return registry.map((entry) => {
    const lastImport = batchByCode.get(entry.code);
    return {
      code: entry.code,
      displayName: entry.displayName,
      status: entry.status,
      lastImport: lastImport
        ? {
            id: lastImport.id,
            startedAt: lastImport.startedAt,
            durationMs: lastImport.durationMs,
            createdCount: lastImport.createdCount,
            updatedCount: lastImport.updatedCount,
            missingCount: lastImport.missingCount,
            status: lastImport.status,
            reportPath: lastImport.reportPath,
          }
        : null,
      productCount: countBySlug.get(entry.code) ?? 0,
    };
  });
}

export async function getImportHistory(manufacturerCode: string, limit = 20) {
  return prisma.importBatch.findMany({
    where: { manufacturerCode },
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

export async function getImportBatchById(id: string) {
  return prisma.importBatch.findUnique({ where: { id } });
}

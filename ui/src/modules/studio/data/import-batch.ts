import type {
  ImportBatchStatus,
  Prisma,
  PrismaClient,
} from "@/generated/prisma/client";
import type { ManufacturerImportResult } from "@/modules/import/registry/manufacturer-importer";
import type { ImportReport } from "@/modules/import/reporting/import-report";
import { recordCatalogAudit } from "@/modules/studio/data/audit";

function countMissing(summary: ImportReport["summary"]): number {
  return (
    summary.removed?.filter((entry) => entry.startsWith("MISSING:")).length ?? 0
  );
}

export async function persistImportBatch(
  prisma: PrismaClient,
  result: ManufacturerImportResult,
  report: ImportReport,
): Promise<string> {
  const manufacturer = await prisma.manufacturer.findFirst({
    where: { slug: result.manufacturer, deletedAt: null },
    select: { id: true },
  });

  const status: ImportBatchStatus = result.success ? "COMPLETED" : "FAILED";
  const missingCount = countMissing(report.summary);

  const batch = await prisma.importBatch.create({
    data: {
      manufacturerId: manufacturer?.id,
      manufacturerCode: result.manufacturer,
      displayName: result.displayName,
      status,
      startedAt: new Date(result.startedAt),
      completedAt: new Date(result.completedAt),
      durationMs: result.durationMs,
      productsProcessed: result.productsProcessed,
      createdCount: report.created,
      updatedCount: report.updated,
      skippedCount: report.skipped,
      removedCount: report.removed,
      missingCount,
      warningCount: report.warnings.length,
      errorCount: report.errors.length,
      reportPath: report.reportPath,
      reportJson: report as unknown as Prisma.InputJsonValue,
    },
  });

  await recordCatalogAudit({
    entityType: "import_batch",
    entityId: batch.id,
    action: "IMPORT_BATCH",
    actor: `importer:${result.manufacturer}`,
    summary: `${result.displayName}: ${report.created} created, ${report.updated} updated, ${report.removed} removed`,
    metadata: {
      batchId: batch.id,
      manufacturer: result.manufacturer,
      reportPath: report.reportPath,
    },
  });

  return batch.id;
}

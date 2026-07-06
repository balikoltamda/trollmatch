import { resolve } from "node:path";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import {
  buildImportReport,
  writeImportReport,
} from "@/modules/import/reporting/import-report";
import { manufacturerRegistry } from "@/modules/import/registry/registered-manufacturers";
import { resolveImporterSlug } from "@/modules/import/registry/manufacturer-slugs";
import type { ManufacturerImportResult } from "@/modules/import/registry/manufacturer-importer";
import type { ImportReport } from "@/modules/import/reporting/import-report";
import { recordCatalogAudit } from "@/modules/studio/data/audit";

const REPO_ROOT = resolve(process.cwd(), "..");

function countMissing(summary: ImportReport["summary"]): number {
  return (
    summary.removed?.filter((entry) => entry.startsWith("MISSING:")).length ?? 0
  );
}

export async function createQueuedImportBatch(
  prisma: PrismaClient,
  manufacturerCode: string,
): Promise<{ batchId: string } | { error: string }> {
  const entry = manufacturerRegistry.get(manufacturerCode);
  if (!entry) {
    return { error: `Unknown manufacturer: ${manufacturerCode}` };
  }

  const active = await prisma.importBatch.findFirst({
    where: {
      manufacturerCode,
      status: { in: ["QUEUED", "RUNNING"] },
    },
    select: { id: true, status: true },
  });

  if (active) {
    return {
      error: `Import already ${active.status.toLowerCase()} for ${entry.displayName}`,
    };
  }

  const manufacturer = await prisma.manufacturer.findFirst({
    where: { slug: resolveImporterSlug(manufacturerCode), deletedAt: null },
    select: { id: true },
  });

  const batch = await prisma.importBatch.create({
    data: {
      manufacturerId: manufacturer?.id,
      manufacturerCode,
      displayName: entry.displayName,
      status: "QUEUED",
      startedAt: new Date(),
    },
  });

  return { batchId: batch.id };
}

async function finalizeImportBatch(
  prisma: PrismaClient,
  batchId: string,
  result: ManufacturerImportResult,
  report: ImportReport,
): Promise<void> {
  const status = result.success ? "COMPLETED" : "FAILED";
  const missingCount = countMissing(report.summary);

  await prisma.importBatch.update({
    where: { id: batchId },
    data: {
      status,
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
    entityId: batchId,
    action: "IMPORT_BATCH",
    actor: `importer:${result.manufacturer}`,
    summary: `${result.displayName}: ${report.created} created, ${report.updated} updated, ${report.removed} removed`,
    metadata: {
      batchId,
      manufacturer: result.manufacturer,
      reportPath: report.reportPath,
    },
  });
}

async function markImportBatchFailed(
  prisma: PrismaClient,
  batchId: string,
  message: string,
  startedAt: Date,
): Promise<void> {
  const completedAt = new Date();
  await prisma.importBatch.update({
    where: { id: batchId },
    data: {
      status: "FAILED",
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      errorCount: 1,
      reportJson: {
        errors: [message],
        warnings: [],
        summary: { created: [], updated: [], skipped: [], errors: [message] },
      } as unknown as Prisma.InputJsonValue,
    },
  });
}

/**
 * Runs importer work for a queued batch. Invoked only from the detached worker process.
 */
export async function executeImportBatch(
  prisma: PrismaClient,
  batchId: string,
): Promise<void> {
  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
  });

  if (!batch) {
    throw new Error(`Import batch not found: ${batchId}`);
  }

  if (batch.status === "CANCELLED") {
    return;
  }

  if (batch.status !== "QUEUED") {
    return;
  }

  const claim = await prisma.importBatch.updateMany({
    where: { id: batchId, status: "QUEUED" },
    data: { status: "RUNNING", startedAt: new Date() },
  });

  if (claim.count === 0) {
    return;
  }

  const startedAt = new Date();

  try {
    const importer = manufacturerRegistry.get(batch.manufacturerCode);
    if (!importer) {
      await markImportBatchFailed(
        prisma,
        batchId,
        `Unknown manufacturer: ${batch.manufacturerCode}`,
        startedAt,
      );
      return;
    }

    const result = await importer.run({
      prisma,
      offline: false,
      downloadImages: true,
    });

    const report = buildImportReport({
      manufacturer: result.manufacturer,
      displayName: result.displayName,
      startedAt: new Date(result.startedAt),
      completedAt: new Date(result.completedAt),
      productsProcessed: result.productsProcessed,
      summary: result.summary,
      warnings: result.summary.warnings,
    });

    const reportPath = await writeImportReport(report, REPO_ROOT);
    report.reportPath = reportPath;

    await finalizeImportBatch(prisma, batchId, result, {
      ...report,
      reportPath,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Import failed unexpectedly";
    await markImportBatchFailed(prisma, batchId, message, startedAt);
    throw error;
  }
}

export async function cancelQueuedImportBatch(
  prisma: PrismaClient,
  batchId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const updated = await prisma.importBatch.updateMany({
    where: { id: batchId, status: "QUEUED" },
    data: { status: "CANCELLED", completedAt: new Date() },
  });

  if (updated.count === 0) {
    return { ok: false, error: "Only queued imports can be cancelled" };
  }

  return { ok: true };
}

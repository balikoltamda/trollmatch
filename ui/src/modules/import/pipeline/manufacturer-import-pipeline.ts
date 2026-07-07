import type { PrismaClient } from "@/generated/prisma/client";
import type { CanonicalLureImport } from "../core/canonical-lure";
import {
  collectImageUrlsFromRecords,
  downloadManufacturerImages,
  resolveManufacturerImagesRoot,
} from "../images/image-download-pipeline";
import { reconcileManufacturerLifecycle } from "../persistence/lifecycle-reconciler";
import {
  upsertCanonicalImport,
  type UpsertCanonicalImportResult,
} from "../persistence/canonical-import-persister";
import {
  createEmptyImportSummary,
  mergeImportSummaries,
  type ImportSummary,
} from "../persistence/types";
import {
  buildImportReport,
  writeImportReport,
  type ImportReport,
} from "../reporting/import-report";

export type PersistRecordOutcome = {
  recordKey: string;
  modelSlug?: string;
  lureModelId?: string;
  status: "imported" | "updated" | "skipped" | "failed";
  message?: string;
};

export type ManufacturerImportFinalizeInput = {
  manufacturerCode: string;
  manufacturerSlug: string;
  displayName: string;
  startedAt: Date;
  records: CanonicalLureImport[];
  summary: ImportSummary;
  observedLureModelIds: string[];
  productsProcessed: number;
  outcomes?: PersistRecordOutcome[];
  downloadImages?: boolean;
  fetchFn?: typeof fetch;
  repoRoot: string;
  reportsRoot: string;
};

export type ManufacturerImportFinalizeResult = {
  summary: ImportSummary;
  reconcile?: Awaited<ReturnType<typeof reconcileManufacturerLifecycle>>;
  imageDownloads?: ImportReport["imageDownloads"];
  report: ImportReport;
  reportPath: string;
};

export type PersistValidatedRecordsInput = {
  prisma: PrismaClient;
  records: CanonicalLureImport[];
  importedAt: Date;
  importBatchId?: string;
  onRecordPersisted?: (
    outcome: PersistRecordOutcome,
    index: number,
    total: number,
  ) => void | Promise<void>;
};

function classifyPersistOutcome(
  result: UpsertCanonicalImportResult,
  modelSlug: string,
): PersistRecordOutcome["status"] {
  if (result.summary.errors.length > 0) {
    return "failed";
  }

  if (result.isNew) {
    return "imported";
  }

  const modelUpdated = result.summary.updated.some(
    (line) => line === `LureModel: ${modelSlug}`,
  );

  if (modelUpdated || result.dataChanged) {
    return "updated";
  }

  return "skipped";
}

/**
 * Persist validated canonical records with per-product isolation.
 * One broken product never stops the batch.
 */
export async function persistValidatedRecords(
  input: PersistValidatedRecordsInput,
): Promise<{
  summary: ImportSummary;
  observedLureModelIds: string[];
  outcomes: PersistRecordOutcome[];
}> {
  const summary = createEmptyImportSummary();
  const observedLureModelIds: string[] = [];
  const outcomes: PersistRecordOutcome[] = [];
  const total = input.records.length;

  for (const [index, record] of input.records.entries()) {
    try {
      const persistResult = await upsertCanonicalImport(
        input.prisma,
        record,
        input.importedAt,
        input.importBatchId,
      );

      mergeImportSummaries(summary, persistResult.summary);

      if (persistResult.lureModelId) {
        observedLureModelIds.push(persistResult.lureModelId);
      }

      const status = classifyPersistOutcome(
        persistResult,
        record.model.slug,
      );

      const outcome: PersistRecordOutcome = {
        recordKey: record.recordKey,
        modelSlug: record.model.slug,
        lureModelId: persistResult.lureModelId || undefined,
        status,
        message:
          status === "failed"
            ? persistResult.summary.errors.join("; ")
            : undefined,
      };

      outcomes.push(outcome);

      if (input.onRecordPersisted) {
        await input.onRecordPersisted(outcome, index + 1, total);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown persistence error";
      summary.errors.push(`${record.recordKey}: ${message}`);

      const outcome: PersistRecordOutcome = {
        recordKey: record.recordKey,
        modelSlug: record.model.slug,
        status: "failed",
        message,
      };

      outcomes.push(outcome);

      if (input.onRecordPersisted) {
        await input.onRecordPersisted(outcome, index + 1, total);
      }
    }
  }

  return { summary, observedLureModelIds, outcomes };
}

/**
 * Shared post-persist lifecycle: reconcile unseen models, download images, write report.
 */
export async function finalizeManufacturerImport(
  prisma: PrismaClient,
  input: ManufacturerImportFinalizeInput,
): Promise<ManufacturerImportFinalizeResult> {
  const summary = input.summary;
  const completedAt = new Date();

  const reconcile = await reconcileManufacturerLifecycle(
    prisma,
    input.manufacturerSlug,
    input.observedLureModelIds,
  );

  for (const slug of reconcile.missing) {
    summary.removed?.push(`MISSING: ${slug}`);
  }

  for (const slug of reconcile.discontinued) {
    summary.removed?.push(`DISCONTINUED: ${slug}`);
  }

  let imageDownloads: ImportReport["imageDownloads"];

  if (input.downloadImages !== false && input.records.length > 0) {
    const imageUrls = collectImageUrlsFromRecords(input.records);
    const imageResult = await downloadManufacturerImages(
      input.manufacturerSlug,
      imageUrls,
      resolveManufacturerImagesRoot(input.repoRoot),
      input.fetchFn,
    );

    imageDownloads = {
      downloaded: imageResult.downloaded.length,
      skipped: imageResult.skipped.length,
      broken: imageResult.errors.length,
      errors: imageResult.errors,
    };

    summary.warnings.push(
      ...imageResult.errors.map((error) => `Broken image: ${error}`),
    );
  }

  const report = buildImportReport({
    manufacturer: input.manufacturerCode,
    displayName: input.displayName,
    startedAt: input.startedAt,
    completedAt,
    productsProcessed: input.productsProcessed,
    summary,
    imageDownloads,
    outcomes: input.outcomes,
  });

  const reportPath = await writeImportReport(report, input.reportsRoot);
  report.reportPath = reportPath;

  return {
    summary,
    reconcile,
    imageDownloads,
    report,
    reportPath,
  };
}

export async function updateImportBatchProgress(
  prisma: PrismaClient,
  batchId: string,
  productsProcessed: number,
): Promise<void> {
  await prisma.importBatch.updateMany({
    where: { id: batchId, status: "RUNNING" },
    data: { productsProcessed },
  });
}

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createEmptyImportSummary,
  mergeImportSummaries,
  type ImportSummary,
} from "../persistence/types";
import {
  buildImportReport,
  writeImportReport,
} from "../reporting/import-report";
import type {
  ManufacturerImporter,
  ManufacturerImportResult,
  ManufacturerImportRunOptions,
} from "../registry/manufacturer-importer";
import {
  runDuelImport,
  type DuelImportRunResult,
} from "../providers/duel/duel-import-runner";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(MODULE_DIR, "..", "..", "..", "..", "..");

function mapDuelResultToSummary(result: DuelImportRunResult): ImportSummary {
  const summary = createEmptyImportSummary();

  mergeImportSummaries(summary, result.persistence);

  for (const outcome of result.outcomes) {
    if (outcome.status === "failed") {
      summary.errors.push(
        outcome.pid === "batch"
          ? (outcome.message ?? "Batch import incomplete")
          : `PID ${outcome.pid}: ${outcome.message ?? "Validation or import failed"}`,
      );
    }

    if (outcome.validationWarnings?.length) {
      summary.warnings.push(
        ...outcome.validationWarnings.map(
          (warning) => `PID ${outcome.pid}: ${warning}`,
        ),
      );
    }
  }

  if (result.reconcile) {
    for (const slug of result.reconcile.missing) {
      summary.removed?.push(`MISSING: ${slug}`);
    }

    for (const slug of result.reconcile.discontinued) {
      summary.removed?.push(`DISCONTINUED: ${slug}`);
    }
  }

  if (result.imageDownloads) {
    summary.warnings.push(
      ...result.imageDownloads.errors.map((error) => `Image: ${error}`),
    );
  }

  return summary;
}

export const duelManufacturerImporter: ManufacturerImporter = {
  code: "duel",
  displayName: "DUEL",
  status: "active",

  async run(options: ManufacturerImportRunOptions): Promise<ManufacturerImportResult> {
    const startedAt = new Date();

    const duelResult = await runDuelImport({
      prisma: options.prisma,
      limit: options.limit,
      offline: options.offline,
      downloadImages: options.downloadImages,
      fetchFn: options.fetchFn,
      repoRoot: REPO_ROOT,
      reportsRoot: REPO_ROOT,
      importBatchId: options.importBatchId,
      onProgress: options.onProgress,
    });

    const summary = mapDuelResultToSummary(duelResult);
    const completedAt = new Date(duelResult.completedAt);

    const report = buildImportReport({
      manufacturer: "duel",
      displayName: "DUEL",
      startedAt,
      completedAt,
      productsProcessed: duelResult.processedProducts,
      summary,
      imageDownloads: duelResult.imageDownloads,
      outcomes: duelResult.outcomes.map((outcome) => ({
        recordKey: outcome.recordKey ?? `duel:pid:${outcome.pid}`,
        modelSlug: outcome.modelSlug,
        status: outcome.status,
        message: outcome.message,
      })),
    });

    const reportPath =
      duelResult.reportPath ??
      (await writeImportReport(report, REPO_ROOT));

    return {
      manufacturer: "duel",
      displayName: "DUEL",
      startedAt: duelResult.startedAt,
      completedAt: duelResult.completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      productsProcessed: duelResult.processedProducts,
      summary,
      observedLureModelIds: duelResult.observedLureModelIds,
      success: summary.errors.length === 0 && duelResult.summary.failed === 0,
      reportPath,
      report,
    };
  },
};

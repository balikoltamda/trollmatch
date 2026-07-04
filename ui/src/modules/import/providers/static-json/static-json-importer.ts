import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CanonicalLureImport } from "../../core/canonical-lure";
import {
  collectImageUrlsFromRecords,
  downloadManufacturerImages,
  resolveManufacturerImagesRoot,
} from "../../images/image-download-pipeline";
import { reconcileManufacturerLifecycle } from "../../persistence/lifecycle-reconciler";
import {
  createEmptyImportSummary,
  mergeImportSummaries,
} from "../../persistence/types";
import {
  buildImportReport,
  writeImportReport,
} from "../../reporting/import-report";
import { validateCanonicalLureImport } from "../../validators/canonical-lure-validator";
import { upsertDuelCanonicalImport } from "../duel/duel-persister";
import type {
  ManufacturerImporter,
  ManufacturerImportResult,
  ManufacturerImportRunOptions,
} from "../../registry/manufacturer-importer";

export type StaticJsonImporterConfig = {
  code: string;
  displayName: string;
  manufacturerSlug: string;
  productsDir: string;
  repoRoot: string;
  reportsRoot: string;
};

async function loadCanonicalRecords(
  productsDir: string,
): Promise<CanonicalLureImport[]> {
  let entries: string[];

  try {
    entries = await readdir(productsDir);
  } catch {
    return [];
  }

  const records: CanonicalLureImport[] = [];

  for (const entry of entries) {
    if (!entry.endsWith(".json")) {
      continue;
    }

    const raw = await readFile(join(productsDir, entry), "utf8");
    records.push(JSON.parse(raw) as CanonicalLureImport);
  }

  return records;
}

export function createStaticJsonImporter(
  config: StaticJsonImporterConfig,
): ManufacturerImporter {
  return {
    code: config.code,
    displayName: config.displayName,
    status: "stub",

    async run(options: ManufacturerImportRunOptions): Promise<ManufacturerImportResult> {
      const startedAt = new Date();
      const summary = createEmptyImportSummary();
      const observedLureModelIds: string[] = [];
      const productsDir = join(config.repoRoot, config.productsDir);

      const records = await loadCanonicalRecords(productsDir);

      if (records.length === 0) {
        summary.warnings.push(
          `No product JSON found in ${config.productsDir}. Add CanonicalLureImport files to enable ${config.displayName} imports.`,
        );
      }

      const limit = options.limit ?? records.length;
      const selected = records.slice(0, limit);

      for (const record of selected) {
        const validation = validateCanonicalLureImport(record);

        if (!validation.valid) {
          summary.errors.push(
            `${record.recordKey}: ${validation.errors.map((issue: { code: string }) => issue.code).join(", ")}`,
          );
          continue;
        }

        const persistResult = await upsertDuelCanonicalImport(
          options.prisma,
          validation.normalized,
          startedAt,
        );

        mergeImportSummaries(summary, persistResult.summary);
        if (persistResult.lureModelId) {
          observedLureModelIds.push(persistResult.lureModelId);
        }
      }

      const reconcile = await reconcileManufacturerLifecycle(
        options.prisma,
        config.manufacturerSlug,
        observedLureModelIds,
      );

      for (const slug of reconcile.missing) {
        summary.removed?.push(`MISSING: ${slug}`);
      }

      for (const slug of reconcile.discontinued) {
        summary.removed?.push(`DISCONTINUED: ${slug}`);
      }

      if (options.downloadImages !== false && selected.length > 0) {
        const imageUrls = collectImageUrlsFromRecords(selected);
        const imageResult = await downloadManufacturerImages(
          config.manufacturerSlug,
          imageUrls,
          resolveManufacturerImagesRoot(config.repoRoot),
          options.fetchFn,
        );

        summary.warnings.push(
          ...imageResult.errors.map((error: string) => `Image: ${error}`),
        );
      }

      const completedAt = new Date();
      const report = buildImportReport({
        manufacturer: config.code,
        displayName: config.displayName,
        startedAt,
        completedAt,
        productsProcessed: selected.length,
        summary,
      });

      const reportPath = await writeImportReport(report, config.reportsRoot);

      return {
        manufacturer: config.code,
        displayName: config.displayName,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: completedAt.getTime() - startedAt.getTime(),
        productsProcessed: selected.length,
        summary,
        observedLureModelIds,
        success: summary.errors.length === 0,
        reportPath,
      };
    },
  };
}

export async function runStaticJsonImport(
  config: StaticJsonImporterConfig,
  options: ManufacturerImportRunOptions,
): Promise<ManufacturerImportResult> {
  return createStaticJsonImporter(config).run(options);
}

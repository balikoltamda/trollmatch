import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CanonicalLureImport } from "../../core/canonical-lure";
import {
  finalizeManufacturerImport,
  persistValidatedRecords,
  updateImportBatchProgress,
} from "../../pipeline/manufacturer-import-pipeline";
import { validateCanonicalLureImport } from "../../validators/canonical-lure-validator";
import { normalizeProductRecord } from "./normalize-product-record";
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
  providerCode: string,
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
    const parsed = JSON.parse(raw) as Parameters<typeof normalizeProductRecord>[0];
    records.push(
      normalizeProductRecord(parsed, join(productsDir, entry), providerCode),
    );
  }

  return records;
}

export function createStaticJsonImporter(
  config: StaticJsonImporterConfig,
): ManufacturerImporter {
  return {
    code: config.code,
    displayName: config.displayName,
    status: "active",

    async run(options: ManufacturerImportRunOptions): Promise<ManufacturerImportResult> {
      const startedAt = new Date();
      const productsDir = join(config.repoRoot, config.productsDir);
      const records = await loadCanonicalRecords(productsDir, config.code);
      const validationErrors: string[] = [];
      const validationWarnings: string[] = [];

      if (records.length === 0) {
        validationWarnings.push(
          `No product JSON found in ${config.productsDir}. Add CanonicalLureImport files to enable ${config.displayName} imports.`,
        );
      }

      const limit = options.limit ?? records.length;
      const selected = records.slice(0, limit);
      const validated: CanonicalLureImport[] = [];

      for (const record of selected) {
        const validation = validateCanonicalLureImport(record);

        if (!validation.valid) {
          validationErrors.push(
            `${record.recordKey}: ${validation.errors.map((issue) => issue.code).join(", ")}`,
          );
          continue;
        }

        validated.push(validation.normalized);
      }

      const { summary, observedLureModelIds, outcomes } =
        await persistValidatedRecords({
          prisma: options.prisma,
          records: validated,
          importedAt: startedAt,
          importBatchId: options.importBatchId,
          onRecordPersisted: async (_outcome, processed, total) => {
            if (options.onProgress) {
              await options.onProgress(processed, total);
            }

            if (options.importBatchId) {
              await updateImportBatchProgress(
                options.prisma,
                options.importBatchId,
                processed,
              );
            }
          },
        });

      for (const message of validationErrors) {
        summary.errors.push(message);
      }

      summary.warnings.push(...validationWarnings);

      const finalized = await finalizeManufacturerImport(options.prisma, {
        manufacturerCode: config.code,
        manufacturerSlug: config.manufacturerSlug,
        displayName: config.displayName,
        startedAt,
        records: validated,
        summary,
        observedLureModelIds,
        productsProcessed: selected.length,
        outcomes,
        downloadImages: options.downloadImages,
        fetchFn: options.fetchFn,
        repoRoot: config.repoRoot,
        reportsRoot: config.reportsRoot,
      });

      const completedAt = new Date(finalized.report.completedAt);

      return {
        manufacturer: config.code,
        displayName: config.displayName,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: completedAt.getTime() - startedAt.getTime(),
        productsProcessed: selected.length,
        summary: finalized.summary,
        observedLureModelIds,
        success:
          finalized.summary.errors.length === 0 &&
          finalized.report.failed === 0,
        reportPath: finalized.reportPath,
        report: finalized.report,
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

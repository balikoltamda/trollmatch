import {
  createEmptyImportSummary,
  type ImportSummary,
} from "../persistence/types";
import {
  runDuelImport,
  type DuelImportRunResult,
} from "../providers/duel/duel-import-runner";
import type {
  CatalogImporter,
  CatalogImporterRunOptions,
  CatalogImporterRunResult,
} from "./import-registry";

function mapDuelResultToSummary(result: DuelImportRunResult): ImportSummary {
  const summary = createEmptyImportSummary();

  summary.created.push(...result.persistence.created);
  summary.updated.push(...result.persistence.updated);
  summary.skipped.push(...result.persistence.skipped);
  summary.errors.push(...result.persistence.errors);

  for (const outcome of result.outcomes) {
    if (outcome.status === "failed") {
      summary.errors.push(
        outcome.pid === "batch"
          ? (outcome.message ?? "Batch import incomplete")
          : `PID ${outcome.pid}: ${outcome.message ?? "Validation or import failed"}`,
      );
    }
  }

  return summary;
}

export const duelCatalogImporter: CatalogImporter = {
  code: "duel",
  displayName: "DUEL Manufacturer Importer",

  async run({ prisma, argv }: CatalogImporterRunOptions): Promise<CatalogImporterRunResult> {
    const minProducts = parseOptionalInt(argv?.[0]) ?? 20;

    const duelResult = await runDuelImport({ prisma, minProducts });
    const summary = mapDuelResultToSummary(duelResult);

    return {
      providerCode: "duel",
      summary,
      success: summary.errors.length === 0 && duelResult.summary.failed === 0,
    };
  },
};

function parseOptionalInt(value: string | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function runDuelCatalogImport(
  options: CatalogImporterRunOptions,
): Promise<CatalogImporterRunResult> {
  return duelCatalogImporter.run(options);
}

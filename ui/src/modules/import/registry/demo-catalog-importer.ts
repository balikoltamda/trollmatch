import { resolveDemoSamplePath, runDemoImport } from "../providers/demo/demo-importer";
import { persistCanonicalImports } from "../persistence/canonical-persister";
import type {
  ManufacturerImporter,
  ManufacturerImportRunOptions,
  ManufacturerImportResult,
} from "./manufacturer-importer";

export const demoCatalogImporter: ManufacturerImporter = {
  code: "demo",
  displayName: "Demo Static JSON Importer",
  status: "stub",

  async run({ prisma }: ManufacturerImportRunOptions): Promise<ManufacturerImportResult> {
    const startedAt = new Date();
    const samplePath = resolveDemoSamplePath();
    const canonical = await runDemoImport(samplePath);
    const summary = await persistCanonicalImports(prisma, canonical);
    const completedAt = new Date();

    return {
      manufacturer: "demo",
      displayName: "Demo Static JSON Importer",
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: completedAt.getTime() - startedAt.getTime(),
      productsProcessed: canonical.length,
      summary,
      observedLureModelIds: [],
      success: summary.errors.length === 0,
    };
  },
};

import { resolveDemoSamplePath, runDemoImport } from "../providers/demo/demo-importer";
import {
  persistCanonicalImports,
} from "../persistence/canonical-persister";
import type {
  CatalogImporter,
  CatalogImporterRunOptions,
  CatalogImporterRunResult,
} from "./import-registry";

export const demoCatalogImporter: CatalogImporter = {
  code: "demo",
  displayName: "Demo Static JSON Importer",

  async run({ prisma }: CatalogImporterRunOptions): Promise<CatalogImporterRunResult> {
    const samplePath = resolveDemoSamplePath();
    const canonical = await runDemoImport(samplePath);
    const summary = await persistCanonicalImports(prisma, canonical);

    return {
      providerCode: "demo",
      summary,
      success: summary.errors.length === 0,
    };
  },
};

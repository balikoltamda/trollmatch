import { demoCatalogImporter } from "./demo-catalog-importer";
import { duelCatalogImporter } from "./duel-catalog-importer";
import { createImportRegistry } from "./import-registry";

/** Application import registry — add new manufacturers here, not in `run-import.ts`. */
export const importRegistry = createImportRegistry()
  .register(duelCatalogImporter)
  .register(demoCatalogImporter)
  .setDefault("duel");

export { demoCatalogImporter } from "./demo-catalog-importer";
export { duelCatalogImporter } from "./duel-catalog-importer";
export type {
  CatalogImporter,
  CatalogImporterRunOptions,
  CatalogImporterRunResult,
  ImportRegistry,
} from "./import-registry";
export { createImportRegistry } from "./import-registry";

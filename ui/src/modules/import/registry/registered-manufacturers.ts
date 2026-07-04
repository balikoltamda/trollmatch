import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createStaticJsonImporter } from "../providers/static-json/static-json-importer";
import { duelManufacturerImporter } from "./duel-manufacturer-importer";
import { createManufacturerRegistry } from "./manufacturer-registry";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(MODULE_DIR, "..", "..", "..", "..", "..");

function staticImporter(
  code: string,
  displayName: string,
  manufacturerSlug: string,
  productsDir: string,
) {
  return createStaticJsonImporter({
    code,
    displayName,
    manufacturerSlug,
    productsDir,
    repoRoot: REPO_ROOT,
    reportsRoot: REPO_ROOT,
  });
}

/** Application manufacturer registry — register new manufacturers here. */
export const manufacturerRegistry = createManufacturerRegistry()
  .register(duelManufacturerImporter)
  .register(
    staticImporter(
      "yozuri",
      "Yo-Zuri",
      "yo-zuri",
      "research/manufacturers/yo-zuri/products",
    ),
  )
  .register(
    staticImporter(
      "halco",
      "Halco",
      "halco",
      "research/manufacturers/halco/products",
    ),
  )
  .register(
    staticImporter(
      "maria",
      "Maria",
      "maria",
      "research/manufacturers/maria/products",
    ),
  )
  .register(
    staticImporter(
      "shimano",
      "Shimano",
      "shimano",
      "research/manufacturers/shimano/products",
    ),
  )
  .register(
    staticImporter(
      "daiwa",
      "Daiwa",
      "daiwa",
      "research/manufacturers/daiwa/products",
    ),
  )
  .register(
    staticImporter(
      "jackson",
      "Jackson",
      "jackson",
      "research/manufacturers/jackson/products",
    ),
  )
  .setDefault("duel");

export { duelManufacturerImporter } from "./duel-manufacturer-importer";
export { createManufacturerRegistry, ManufacturerRegistry } from "./manufacturer-registry";
export { parseManufacturerCliFlags } from "./manufacturer-importer";
export type {
  ManufacturerImporter,
  ManufacturerImportResult,
  ManufacturerImportRunOptions,
} from "./manufacturer-importer";

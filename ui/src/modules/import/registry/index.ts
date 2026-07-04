export {
  manufacturerRegistry,
  manufacturerRegistry as importRegistry,
  duelManufacturerImporter,
  duelManufacturerImporter as duelCatalogImporter,
  createManufacturerRegistry,
  ManufacturerRegistry,
  parseManufacturerCliFlags,
} from "./registered-manufacturers";

export type {
  ManufacturerImporter,
  ManufacturerImportResult,
  ManufacturerImportRunOptions,
} from "./manufacturer-importer";

export type {
  ManufacturerImporter as CatalogImporter,
  ManufacturerImportRunOptions as CatalogImporterRunOptions,
  ManufacturerImportResult as CatalogImporterRunResult,
} from "./manufacturer-importer";

export {
  createManufacturerRegistry as createImportRegistry,
  ManufacturerRegistry as ImportRegistry,
} from "./registered-manufacturers";

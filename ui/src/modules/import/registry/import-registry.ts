import type { PrismaClient } from "@/generated/prisma/client";
import type { ImportSummary } from "../persistence/types";

/** @deprecated Use ManufacturerImportRunOptions */
export type CatalogImporterRunOptions = {
  prisma: PrismaClient;
  argv?: string[];
};

/** @deprecated Use ManufacturerImportResult */
export type CatalogImporterRunResult = {
  providerCode: string;
  summary: ImportSummary;
  success: boolean;
};

/** @deprecated Use ManufacturerImporter */
export interface CatalogImporter {
  readonly code: string;
  readonly displayName: string;
  run(options: CatalogImporterRunOptions): Promise<CatalogImporterRunResult>;
}

export type {
  ManufacturerImporter,
  ManufacturerImportRunOptions,
  ManufacturerImportResult,
} from "./manufacturer-importer";

export {
  manufacturerRegistry as importRegistry,
  createManufacturerRegistry as createImportRegistry,
} from "./registered-importers";

export { ManufacturerRegistry } from "./manufacturer-registry";

import type { ImportProviderMetadata } from "./provider-metadata";
import type { CatalogMapper } from "../mappers/catalog-mapper";
import type { SourceParser } from "../parsers/source-parser";
import type { RecordValidator } from "../validators/record-validator";

/**
 * Contract every manufacturer importer (Halco, Rapala, Yo-Zuri, Maria, Shimano…)
 * must implement. Bundles format-specific parser, validator, and catalog mapper.
 */
export interface ManufacturerImportProvider {
  readonly metadata: ImportProviderMetadata;
  createParser(): SourceParser;
  createValidator(): RecordValidator;
  createMapper(): CatalogMapper;
}

/**
 * Registry for discovering and resolving import providers by code.
 * Implementations register providers at application bootstrap — not in this sprint.
 */
export interface ImportProviderRegistry {
  register(provider: ManufacturerImportProvider): void;
  get(providerCode: string): ManufacturerImportProvider | undefined;
  list(): ImportProviderMetadata[];
  has(providerCode: string): boolean;
}

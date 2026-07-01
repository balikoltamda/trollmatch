import type { ImportContext, ImportIssue } from "../core/types";
import type { ValidatedImportRecord } from "../core/types";
import type { MappedCatalogBundle } from "./mapped-records";

/** Outcome of the map stage. */
export interface MappingResult {
  bundles: MappedCatalogBundle[];
  skippedRecords: ValidatedImportRecord[];
  issues: ImportIssue[];
}

/** Context for mapping — includes target manufacturer slug from provider metadata. */
export interface ImportMappingContext extends ImportContext {
  manufacturerSlug: string;
}

/**
 * Maps validated provider rows to platform-neutral catalog bundles.
 * Does not persist — a future persistence adapter consumes MappingResult.
 */
export interface CatalogMapper {
  map(
    records: ValidatedImportRecord[],
    context: ImportMappingContext,
  ): Promise<MappingResult>;
}

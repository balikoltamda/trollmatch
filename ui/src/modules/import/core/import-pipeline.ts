import type { ImportContext, ImportJobResult } from "./types";
import type { ManufacturerImportProvider } from "./import-provider";
import type { ImportSourceInput } from "./types";

/**
 * Orchestrates parse → validate → map for a single manufacturer provider.
 * Persistence and moderation case creation are out of scope for this interface.
 */
export interface ImportPipeline {
  execute(
    provider: ManufacturerImportProvider,
    source: ImportSourceInput,
    context: ImportContext,
  ): Promise<ImportJobResult>;
}

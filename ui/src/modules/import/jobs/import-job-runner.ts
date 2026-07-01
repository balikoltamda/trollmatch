import type { ImportJobOptions } from "./import-job-options";
import type { ImportJobResult } from "../core/types";
import type { ImportJob } from "./import-job";
import type { ManufacturerImportProvider } from "../core/import-provider";
import type { ImportProviderRegistry } from "../core/import-provider";

/**
 * Resolves a provider from the registry and executes the import pipeline.
 * Entry point for CLI scripts and future background workers.
 */
export interface ImportJobRunner {
  run(options: ImportJobOptions): Promise<ImportJobResult>;
}

/** Resolves provider + builds job — separates orchestration from pipeline stages. */
export interface ImportJobRunnerDependencies {
  registry: ImportProviderRegistry;
  createJob(
    provider: ManufacturerImportProvider,
    options: ImportJobOptions,
  ): ImportJob;
}

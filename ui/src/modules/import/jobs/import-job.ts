import type { ImportJobOptions, ImportJobProgress } from "./import-job-options";
import type { ImportJobResult } from "../core/types";

/**
 * Represents a single import execution unit tied to an Ingestion Batch.
 * Implementations may run synchronously (CLI) or asynchronously (worker).
 */
export interface ImportJob {
  readonly id: string;
  readonly options: ImportJobOptions;

  getProgress(): ImportJobProgress;
  run(): Promise<ImportJobResult>;
  cancel?(): Promise<void>;
}

/** Factory that creates ImportJob instances from options. */
export interface ImportJobFactory {
  create(options: ImportJobOptions): ImportJob;
}

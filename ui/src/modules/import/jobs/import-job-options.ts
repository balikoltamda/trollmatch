import type { ImportContext, ImportSourceInput } from "../core/types";
import type { ManufacturerProviderCode } from "../core/types";

/** Options when enqueueing or running an import job. */
export interface ImportJobOptions {
  providerCode: ManufacturerProviderCode;
  source: ImportSourceInput;
  context: ImportContext;
}

/** Status of a long-running import job (future worker integration). */
export type ImportJobStatus =
  | "queued"
  | "parsing"
  | "validating"
  | "mapping"
  | "completed"
  | "failed";

/** Progress snapshot for observability. */
export interface ImportJobProgress {
  status: ImportJobStatus;
  batchKey: string;
  providerCode: ManufacturerProviderCode;
  processedRows: number;
  totalRows?: number;
  updatedAt: string;
}

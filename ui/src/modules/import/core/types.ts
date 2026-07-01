/**
 * Shared types for the LureAtlas import framework.
 * Aligns with Ingestion Batch (007 §15.1) and idempotent external identifiers (007 §5.6).
 */

/** Known manufacturer provider codes — each future importer registers one. */
export type ManufacturerProviderCode =
  | "halco"
  | "rapala"
  | "yo-zuri"
  | "maria"
  | "shimano"
  | (string & {});

/** Supported raw source formats a provider may accept. */
export type ImportSourceFormat =
  | "json"
  | "csv"
  | "xlsx"
  | "html"
  | "api_feed"
  | "pdf_catalog";

/** Lifecycle state assigned to records created by import (default: draft). */
export type ImportLifecycleState = "draft" | "pending_review";

/** Severity for validation and job issues. */
export type ImportIssueSeverity = "error" | "warning" | "info";

/** A single validation or job-level issue. */
export interface ImportIssue {
  code: string;
  severity: ImportIssueSeverity;
  message: string;
  recordKey?: string;
  fieldPath?: string;
  details?: Record<string, unknown>;
}

/** Reference to a source document per 007 §6.4 (press kit, spec sheet, feed URL). */
export interface ImportSourceDocumentRef {
  uri: string;
  title?: string;
  licenseClass?: string;
  retrievedAt?: string;
}

/** Descriptor for an idempotent ingestion batch run. */
export interface ImportBatchDescriptor {
  batchKey: string;
  idempotencyKey: string;
  providerCode: ManufacturerProviderCode;
  sourceReference: string;
  sourceDocuments?: ImportSourceDocumentRef[];
  startedAt: string;
}

/** Runtime context passed through parse → validate → map stages. */
export interface ImportContext {
  batch: ImportBatchDescriptor;
  locale: "tr" | "en";
  dryRun: boolean;
  options?: Record<string, unknown>;
}

/** Raw input envelope before parsing. */
export interface ImportSourceInput<TPayload = unknown> {
  format: ImportSourceFormat;
  payload: TPayload;
  encoding?: string;
  sourceUri?: string;
}

/** Stable key for a row within a batch (provider-defined, used in error manifests). */
export interface ImportRecordKey {
  providerCode: ManufacturerProviderCode;
  externalId: string;
}

/** Opaque parsed row before validation — provider-specific shape in `data`. */
export interface RawImportRecord {
  key: ImportRecordKey;
  sourceLine?: number;
  data: unknown;
}

/** Row that passed structural validation — ready for mapping. */
export interface ValidatedImportRecord {
  key: ImportRecordKey;
  sourceLine?: number;
  data: unknown;
}

/** Aggregate statistics for a completed import job. */
export interface ImportBatchStatistics {
  totalSourceRows: number;
  parsedRows: number;
  validRows: number;
  invalidRows: number;
  mappedRows: number;
  skippedRows: number;
  warningCount: number;
  errorCount: number;
}

import type { MappedCatalogBundle } from "../mappers/mapped-records";

/** Result of a full import pipeline execution. */
export interface ImportJobResult {
  batch: ImportBatchDescriptor;
  statistics: ImportBatchStatistics;
  mappedRecords: MappedCatalogBundle[];
  issues: ImportIssue[];
  completedAt: string;
}

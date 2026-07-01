import type { ImportIssue, RawImportRecord } from "../core/types";

/** Outcome of the parse stage. */
export interface ParseResult {
  records: RawImportRecord[];
  issues: ImportIssue[];
}

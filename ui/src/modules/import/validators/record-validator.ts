import type {
  ImportContext,
  ImportIssue,
  RawImportRecord,
  ValidatedImportRecord,
} from "../core/types";

/** Outcome of the validate stage. Valid rows proceed to mapping; invalid rows appear in issues. */
export interface ValidationResult {
  validRecords: ValidatedImportRecord[];
  invalidRecords: RawImportRecord[];
  issues: ImportIssue[];
}

/** Context for validation — may include publish requirement rule version in future sprints. */
export interface ImportValidationContext extends ImportContext {
  strictMode?: boolean;
}

/**
 * Validates parsed rows against provider rules and platform publish requirements.
 * Does not write to the database.
 */
export interface RecordValidator {
  validate(
    records: RawImportRecord[],
    context: ImportValidationContext,
  ): Promise<ValidationResult>;
}

/** Declarative rule descriptor for provider-specific validation extensions. */
export interface ValidationRuleDescriptor {
  code: string;
  description: string;
  required: boolean;
  fieldPath?: string;
}

/** Optional: validator exposes its rule set for documentation and moderation UI. */
export interface ValidationRuleCatalog {
  listRules(): ValidationRuleDescriptor[];
}

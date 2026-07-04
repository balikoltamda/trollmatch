export interface ImportSummary {
  created: string[];
  updated: string[];
  skipped: string[];
  warnings: string[];
  errors: string[];
  removed?: string[];
}

export function createEmptyImportSummary(): ImportSummary {
  return {
    created: [],
    updated: [],
    skipped: [],
    warnings: [],
    errors: [],
    removed: [],
  };
}

export function mergeImportSummaries(
  target: ImportSummary,
  source: ImportSummary,
): ImportSummary {
  target.created.push(...source.created);
  target.updated.push(...source.updated);
  target.skipped.push(...source.skipped);
  target.warnings.push(...source.warnings);
  target.errors.push(...source.errors);
  if (source.removed?.length) {
    target.removed = [...(target.removed ?? []), ...source.removed];
  }
  return target;
}

export function printImportSummary(summary: ImportSummary): void {
  console.log("Import Summary\n");
  console.log("Created:");
  if (summary.created.length === 0) {
    console.log("  (none)");
  } else {
    for (const line of summary.created) {
      console.log(`  ${line}`);
    }
  }
  console.log("\nUpdated:");
  if (summary.updated.length === 0) {
    console.log("  (none)");
  } else {
    for (const line of summary.updated) {
      console.log(`  ${line}`);
    }
  }
  console.log("\nSkipped:");
  if (summary.skipped.length === 0) {
    console.log("  (none)");
  } else {
    for (const line of summary.skipped) {
      console.log(`  ${line}`);
    }
  }
  console.log("\nWarnings:");
  if (summary.warnings.length === 0) {
    console.log("  (none)");
  } else {
    for (const line of summary.warnings) {
      console.log(`  ${line}`);
    }
  }
  if (summary.removed && summary.removed.length > 0) {
    console.log("\nRemoved (marked inactive):");
    for (const line of summary.removed) {
      console.log(`  ${line}`);
    }
  }
  console.log("\nErrors:");
  if (summary.errors.length === 0) {
    console.log("  (none)");
  } else {
    for (const line of summary.errors) {
      console.log(`  ${line}`);
    }
  }
}

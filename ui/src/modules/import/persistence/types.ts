export interface ImportSummary {
  created: string[];
  updated: string[];
  skipped: string[];
  errors: string[];
}

export function createEmptyImportSummary(): ImportSummary {
  return {
    created: [],
    updated: [],
    skipped: [],
    errors: [],
  };
}

export function mergeImportSummaries(
  target: ImportSummary,
  source: ImportSummary,
): ImportSummary {
  target.created.push(...source.created);
  target.updated.push(...source.updated);
  target.skipped.push(...source.skipped);
  target.errors.push(...source.errors);
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
  console.log("\nErrors:");
  if (summary.errors.length === 0) {
    console.log("  (none)");
  } else {
    for (const line of summary.errors) {
      console.log(`  ${line}`);
    }
  }
}

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ImportSummary } from "../persistence/types";

export type ImportReport = {
  manufacturer: string;
  displayName: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  productsProcessed: number;
  created: number;
  updated: number;
  skipped: number;
  removed: number;
  warnings: string[];
  errors: string[];
  summary: ImportSummary;
  reportPath?: string;
  imageDownloads?: {
    downloaded: number;
    skipped: number;
    errors: string[];
  };
};

export function buildImportReport(input: {
  manufacturer: string;
  displayName: string;
  startedAt: Date;
  completedAt: Date;
  productsProcessed: number;
  summary: ImportSummary;
  warnings?: string[];
  imageDownloads?: ImportReport["imageDownloads"];
}): ImportReport {
  const durationMs = input.completedAt.getTime() - input.startedAt.getTime();

  return {
    manufacturer: input.manufacturer,
    displayName: input.displayName,
    startedAt: input.startedAt.toISOString(),
    completedAt: input.completedAt.toISOString(),
    durationMs,
    productsProcessed: input.productsProcessed,
    created: input.summary.created.length,
    updated: input.summary.updated.length,
    skipped: input.summary.skipped.length,
    removed: input.summary.removed?.length ?? 0,
    warnings: input.warnings ?? input.summary.warnings ?? [],
    errors: input.summary.errors,
    summary: input.summary,
    imageDownloads: input.imageDownloads,
  };
}

export function formatImportReportConsole(report: ImportReport): string {
  const lines = [
    `Manufacturer: ${report.displayName} (${report.manufacturer})`,
    `Products processed: ${report.productsProcessed}`,
    `Created: ${report.created}`,
    `Updated: ${report.updated}`,
    `Skipped: ${report.skipped}`,
    `Removed (inactive): ${report.removed}`,
    `Warnings: ${report.warnings.length}`,
    `Errors: ${report.errors.length}`,
    `Duration: ${(report.durationMs / 1000).toFixed(1)}s`,
  ];

  if (report.imageDownloads) {
    lines.push(
      `Images downloaded: ${report.imageDownloads.downloaded}`,
      `Images skipped (unchanged): ${report.imageDownloads.skipped}`,
    );
  }

  lines.push(`Report: ${report.reportPath ?? "(pending)"}`);

  return lines.join("\n");
}

export async function writeImportReport(
  report: ImportReport,
  reportsRoot: string,
): Promise<string> {
  const timestamp = report.startedAt.replace(/[:.]/g, "-");
  const fileName = `${timestamp}-${report.manufacturer}.json`;
  const reportPath = join(reportsRoot, "import", fileName);

  await mkdir(join(reportsRoot, "import"), { recursive: true });
  await writeFile(
    reportPath,
    `${JSON.stringify({ ...report, reportPath }, null, 2)}\n`,
    "utf8",
  );

  return reportPath;
}

export function printImportReport(report: ImportReport): void {
  console.log("\nImport Report\n");
  console.log(formatImportReportConsole(report));

  if (report.warnings.length > 0) {
    console.log("\nWarnings:");
    for (const warning of report.warnings) {
      console.log(`  ${warning}`);
    }
  }

  if (report.errors.length > 0) {
    console.log("\nErrors:");
    for (const error of report.errors) {
      console.log(`  ${error}`);
    }
  }
}

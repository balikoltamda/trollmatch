import { prisma } from "@/lib/prisma";

export type ImportReportSection = {
  title: string;
  items: string[];
};

export type ImportReportView = {
  id: string;
  manufacturerCode: string;
  displayName: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
  productsProcessed: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  removedCount: number;
  missingCount: number;
  warningCount: number;
  errorCount: number;
  sections: ImportReportSection[];
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function parseReportJson(json: unknown): ImportReportSection[] {
  if (!json || typeof json !== "object") return [];

  const report = json as Record<string, unknown>;
  const sections: ImportReportSection[] = [];
  const summary =
    report.summary && typeof report.summary === "object"
      ? (report.summary as Record<string, unknown>)
      : null;

  const created = asStringArray(summary?.created ?? report.created);
  if (created.length > 0) {
    sections.push({ title: "Imported", items: created });
  }

  const updated = asStringArray(summary?.updated ?? report.updated);
  if (updated.length > 0) {
    sections.push({ title: "Updated", items: updated });
  }

  const skipped = asStringArray(summary?.skipped ?? report.skipped);
  if (skipped.length > 0) {
    sections.push({ title: "Skipped", items: skipped });
  }

  const removed = asStringArray(summary?.removed ?? report.removed);
  if (removed.length > 0) {
    sections.push({ title: "Removed", items: removed });
  }

  const missing = asStringArray(summary?.missing ?? report.missing);
  if (missing.length > 0) {
    sections.push({ title: "Missing from feed", items: missing });
  }

  const warnings = asStringArray(report.warnings);
  if (warnings.length > 0) {
    sections.push({ title: "Warnings", items: warnings });
  }

  const errors = asStringArray(report.errors);
  if (errors.length > 0) {
    sections.push({ title: "Errors", items: errors });
  }

  return sections;
}

export async function getImportBatchReport(
  id: string,
): Promise<ImportReportView | null> {
  const batch = await prisma.importBatch.findUnique({
    where: { id },
  });

  if (!batch) return null;

  return {
    id: batch.id,
    manufacturerCode: batch.manufacturerCode,
    displayName: batch.displayName,
    status: batch.status,
    startedAt: batch.startedAt,
    completedAt: batch.completedAt,
    durationMs: batch.durationMs,
    productsProcessed: batch.productsProcessed,
    createdCount: batch.createdCount,
    updatedCount: batch.updatedCount,
    skippedCount: batch.skippedCount,
    removedCount: batch.removedCount,
    missingCount: batch.missingCount,
    warningCount: batch.warningCount,
    errorCount: batch.errorCount,
    sections: parseReportJson(batch.reportJson),
  };
}

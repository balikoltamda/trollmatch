"use server";

import { revalidatePath } from "next/cache";
import { resolve } from "node:path";
import { prisma } from "@/lib/prisma";
import {
  buildImportReport,
  writeImportReport,
} from "@/modules/import/reporting/import-report";
import { manufacturerRegistry } from "@/modules/import/registry/registered-manufacturers";
import { persistImportBatch } from "@/modules/studio/data/import-batch";

const REPO_ROOT = resolve(process.cwd(), "..");

export async function runManufacturerImport(
  manufacturerCode: string,
): Promise<
  | { ok: true; batchId: string; reportPath?: string }
  | { ok: false; error: string }
> {
  let importer;
  try {
    importer = manufacturerRegistry.get(manufacturerCode);
    if (!importer) {
      return { ok: false, error: `Unknown manufacturer: ${manufacturerCode}` };
    }
  } catch {
    return { ok: false, error: `Unknown manufacturer: ${manufacturerCode}` };
  }

  try {
    const result = await importer.run({
      prisma,
      offline: false,
      downloadImages: true,
    });

    const report = buildImportReport({
      manufacturer: result.manufacturer,
      displayName: result.displayName,
      startedAt: new Date(result.startedAt),
      completedAt: new Date(result.completedAt),
      productsProcessed: result.productsProcessed,
      summary: result.summary,
      warnings: result.summary.warnings,
    });

    const reportPath = await writeImportReport(report, REPO_ROOT);
    report.reportPath = reportPath;

    const batchId = await persistImportBatch(prisma, result, {
      ...report,
      reportPath,
    });

    revalidatePath("/studio");
    revalidatePath("/studio/import");
    revalidatePath("/studio/products");

    return {
      ok: true,
      batchId,
      reportPath,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Import failed",
    };
  }
}

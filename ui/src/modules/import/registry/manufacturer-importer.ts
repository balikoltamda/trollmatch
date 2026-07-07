import type { PrismaClient } from "@/generated/prisma/client";
import type { ImportSummary } from "../persistence/types";

/** CLI/runtime options shared by every manufacturer importer. */
export type ManufacturerImportRunOptions = {
  prisma: PrismaClient;
  argv?: string[];
  /** Cap products processed (undefined = no cap). */
  limit?: number;
  /** Skip live network fetch where supported. */
  offline?: boolean;
  /** Download manufacturer images to local storage. */
  downloadImages?: boolean;
  fetchFn?: typeof fetch;
  /** Studio import batch — links field diffs and progress updates. */
  importBatchId?: string;
  /** Called after each product is persisted (for live progress). */
  onProgress?: (processed: number, total: number) => void | Promise<void>;
};

/** Result returned by every manufacturer importer. */
export type ManufacturerImportResult = {
  manufacturer: string;
  displayName: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  productsProcessed: number;
  summary: ImportSummary;
  observedLureModelIds: string[];
  success: boolean;
  reportPath?: string;
  report?: import("../reporting/import-report").ImportReport;
};

/**
 * Contract every supported manufacturer importer must implement.
 * DUEL is fully active; other manufacturers use static-json or future connectors.
 */
export interface ManufacturerImporter {
  readonly code: string;
  readonly displayName: string;
  /** `active` = production connector; `stub` = registry placeholder with static-json fallback. */
  readonly status: "active" | "stub";
  run(options: ManufacturerImportRunOptions): Promise<ManufacturerImportResult>;
}

export function parseManufacturerCliFlags(argv: string[]): {
  manufacturers: string[];
  all: boolean;
  limit?: number;
  offline: boolean;
  downloadImages: boolean;
  help: boolean;
} {
  const manufacturers: string[] = [];
  let all = false;
  let limit: number | undefined;
  let offline = false;
  let downloadImages = true;
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }

    if (arg === "--all") {
      all = true;
      continue;
    }

    if (arg === "--offline") {
      offline = true;
      continue;
    }

    if (arg === "--no-images") {
      downloadImages = false;
      continue;
    }

    if (arg === "--manufacturer" || arg === "-m") {
      const value = argv[index + 1];
      if (value) {
        manufacturers.push(value.trim().toLowerCase());
        index += 1;
      }
      continue;
    }

    if (arg.startsWith("--manufacturer=")) {
      manufacturers.push(arg.slice("--manufacturer=".length).trim().toLowerCase());
      continue;
    }

    if (arg === "--limit") {
      const value = argv[index + 1];
      if (value) {
        const parsed = Number.parseInt(value, 10);
        if (Number.isFinite(parsed) && parsed > 0) {
          limit = parsed;
        }
        index += 1;
      }
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const parsed = Number.parseInt(arg.slice("--limit=".length), 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        limit = parsed;
      }
    }
  }

  return {
    manufacturers,
    all,
    limit,
    offline,
    downloadImages,
    help,
  };
}

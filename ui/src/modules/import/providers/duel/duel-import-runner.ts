import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  collectImageUrlsFromRecords,
  downloadManufacturerImages,
  resolveManufacturerImagesRoot,
} from "../../images/image-download-pipeline";
import { reconcileManufacturerLifecycle } from "../../persistence/lifecycle-reconciler";
import { createEmptyImportSummary, type ImportSummary } from "../../persistence/types";
import {
  buildImportReport,
  writeImportReport,
} from "../../reporting/import-report";
import { validateCanonicalLureImport } from "../../validators/canonical-lure-validator";
import { fetchDuelSnapshots } from "./duel-fetcher";
import { mapDuelProductToCanonical } from "./duel-mapper";
import { upsertDuelCanonicalImport } from "./duel-persister";
import { parseDuelCategoryHtml, parseDuelProductHtml } from "./duel-parser";
import {
  DUEL_DEFAULT_CATEGORY_SOURCE_URL,
  DUEL_SITE_ORIGIN,
} from "./parser.types";
import {
  DUEL_FETCH_USER_AGENT,
  type DuelFetchTarget,
} from "./types";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = join(MODULE_DIR, "..", "..", "..", "..", "..", "..");
const LEGACY_REPORT_PATH = join(
  DEFAULT_REPO_ROOT,
  "research",
  "manufacturers",
  "duel",
  "import-report.md",
);

export type DuelImportRunOptions = {
  /** Cap products processed (undefined = import all discovered). */
  limit?: number;
  /** @deprecated Use `limit` — kept for backward compatibility. */
  minProducts?: number;
  /** Max category listing pages per category (default 5). */
  maxPagesPerCategory?: number;
  /** Delay between HTTP requests in ms (default 1000). */
  requestDelayMs?: number;
  /** Skip live HTTP fetch and use offline PID set. */
  offline?: boolean;
  /** Download manufacturer images to local storage. */
  downloadImages?: boolean;
  /** Repository root for reports and image storage. */
  repoRoot?: string;
  /** Reports root directory. */
  reportsRoot?: string;
  /** Legacy markdown report path. */
  reportPath?: string;
  /** Custom fetch implementation (for tests). */
  fetchFn?: typeof fetch;
  prisma?: PrismaClient;
};

export type DuelProductOutcome = {
  pid: string;
  title?: string;
  recordKey?: string;
  modelSlug?: string;
  status: "imported" | "updated" | "skipped" | "failed";
  message?: string;
  validationErrors?: string[];
  validationWarnings?: string[];
};

export type DuelImportRunResult = {
  startedAt: string;
  completedAt: string;
  discoveredPids: string[];
  processedProducts: number;
  dryRun: boolean;
  summary: {
    imported: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  persistence: ImportSummary;
  outcomes: DuelProductOutcome[];
  observedLureModelIds: string[];
  reconcile?: {
    missing: string[];
    discontinued: string[];
  };
  imageDownloads?: {
    downloaded: number;
    skipped: number;
    errors: string[];
  };
  reportPath: string;
};

/** English lure category IDs from `docs/connectors/DUEL_CONNECTOR.md`. */
export const DUEL_LURE_CATEGORY_IDS = [
  448,
  445,
  464,
  452,
  449,
];

function categoryListUrl(categoryId: number, page = 1): string {
  const base = `${DUEL_SITE_ORIGIN}/english/products/list.html?category=${categoryId}`;
  return page > 1 ? `${base}&page=${page}` : base;
}

function productDetailUrl(pid: string): string {
  return `${DUEL_SITE_ORIGIN}/english/products/detail.html?pid=${pid}`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadHtml(
  url: string,
  locale: DuelFetchTarget["locale"],
  fetchFn: typeof fetch,
): Promise<string> {
  const response = await fetchFn(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": locale === "ja" ? "ja,en;q=0.9" : "en,ja;q=0.9",
      "User-Agent": DUEL_FETCH_USER_AGENT,
    },
    redirect: "follow",
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.text();
}

export async function discoverDuelProductPids(
  options: Pick<
    DuelImportRunOptions,
    "maxPagesPerCategory" | "requestDelayMs" | "fetchFn"
  > = {},
): Promise<string[]> {
  const fetchFn = options.fetchFn ?? fetch;
  const maxPages = options.maxPagesPerCategory ?? 5;
  const requestDelayMs = options.requestDelayMs ?? 1000;
  const discovered = new Set<string>();

  for (const categoryId of DUEL_LURE_CATEGORY_IDS) {
    for (let page = 1; page <= maxPages; page += 1) {
      if (discovered.size > 0 || page > 1 || categoryId !== DUEL_LURE_CATEGORY_IDS[0]) {
        await sleep(requestDelayMs);
      }

      const url = categoryListUrl(categoryId, page);
      let html: string;

      try {
        html = await downloadHtml(url, "en", fetchFn);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Category fetch skipped (${url}): ${message}`);
        break;
      }

      const parsed = parseDuelCategoryHtml(html, { sourceUrl: url, locale: "en" });
      const before = discovered.size;

      for (const product of parsed.products) {
        if (product.pid) {
          discovered.add(product.pid);
        }
      }

      if (parsed.products.length === 0 || discovered.size === before) {
        break;
      }
    }
  }

  return [...discovered];
}

function classifyProductOutcome(
  persistResult: {
    isNew: boolean;
    dataChanged: boolean;
    summary: ImportSummary;
  },
  modelSlug: string,
): "imported" | "updated" | "skipped" {
  if (persistResult.isNew) {
    return "imported";
  }

  const modelUpdated = persistResult.summary.updated.some(
    (line) => line === `LureModel: ${modelSlug}`,
  );

  if (modelUpdated || persistResult.dataChanged) {
    return "updated";
  }

  return "skipped";
}

function countSummary(outcomes: DuelProductOutcome[]) {
  return outcomes.reduce(
    (acc, outcome) => {
      acc[outcome.status] += 1;
      return acc;
    },
    { imported: 0, updated: 0, skipped: 0, failed: 0 },
  );
}

export function renderDuelImportReport(result: DuelImportRunResult): string {
  const lines: string[] = [
    "# DUEL Import Report",
    "",
    `**Started:** ${result.startedAt}`,
    `**Completed:** ${result.completedAt}`,
    "",
    "## Summary",
    "",
    "```",
    `Imported: ${result.summary.imported}`,
    `Updated: ${result.summary.updated}`,
    `Skipped: ${result.summary.skipped}`,
    `Failed: ${result.summary.failed}`,
    "```",
    "",
    "| Metric | Count |",
    "|--------|------:|",
    `| Imported | ${result.summary.imported} |`,
    `| Updated | ${result.summary.updated} |`,
    `| Skipped | ${result.summary.skipped} |`,
    `| Failed | ${result.summary.failed} |`,
    `| Discovered PIDs | ${result.discoveredPids.length} |`,
    `| Processed | ${result.processedProducts} |`,
    `| Dry run | ${result.dryRun ? "yes (validation only)" : "no"} |`,
    "",
    "## Products",
    "",
    "| PID | Model | Status | Notes |",
    "|-----|-------|--------|-------|",
  ];

  for (const outcome of result.outcomes) {
    const notes = [
      outcome.message,
      outcome.validationWarnings?.length
        ? `warnings: ${outcome.validationWarnings.join(", ")}`
        : undefined,
    ]
      .filter(Boolean)
      .join("; ");
    lines.push(
      `| ${outcome.pid} | ${outcome.modelSlug ?? "—"} | ${outcome.status} | ${notes || "—"} |`,
    );
  }

  const failures = result.outcomes.filter((outcome) => outcome.status === "failed");
  if (failures.length > 0) {
    lines.push("", "## Failures", "");
    for (const failure of failures) {
      lines.push(`### PID ${failure.pid}`, "");
      lines.push(failure.message ?? "Unknown failure");
      if (failure.validationErrors?.length) {
        lines.push("", "Validation errors:");
        for (const error of failure.validationErrors) {
          lines.push(`- ${error}`);
        }
      }
      lines.push("");
    }
  }

  lines.push(
    "",
    "## Execution",
    "",
    result.dryRun
      ? "This run validated products only (no database client). Run `npm run import:duel:run` with Postgres up to persist."
      : "Products were upserted to PostgreSQL via `duel-persister.ts` (lifecycle fields updated, no deletes).",
    "",
    "## Policy",
    "",
    "- UPSERT only — no catalog rows deleted",
    "- Manufacturer lifecycle: `ACTIVE`, `lastSeenAt`, `lastImportedAt` updated on success",
    "- Validation errors are non-blocking for the batch; failed products are skipped",
    "",
  );

  return lines.join("\n");
}

export async function runDuelImport(
  options: DuelImportRunOptions = {},
): Promise<DuelImportRunResult> {
  const startedAt = new Date();
  const fetchFn = options.fetchFn ?? fetch;
  const requestDelayMs = options.requestDelayMs ?? 1000;
  const limit = options.limit ?? options.minProducts;
  const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
  const reportsRoot = options.reportsRoot ?? repoRoot;
  const legacyReportPath = options.reportPath ?? LEGACY_REPORT_PATH;
  const outcomes: DuelProductOutcome[] = [];
  const aggregatePersistence = createEmptyImportSummary();
  const observedLureModelIds: string[] = [];
  const normalizedRecords: Array<ReturnType<typeof mapDuelProductToCanonical>> = [];

  if (!options.offline) {
    await fetchDuelSnapshots({
      fetchFn,
      requestDelayMs,
      categoryUrl: DUEL_DEFAULT_CATEGORY_SOURCE_URL,
    });
  }

  const discoveredPids = options.offline
    ? ["1332"]
    : await discoverDuelProductPids({
        fetchFn,
        requestDelayMs,
        maxPagesPerCategory: options.maxPagesPerCategory,
      });

  let processedCount = 0;

  for (let index = 0; index < discoveredPids.length; index += 1) {
    if (limit !== undefined && processedCount >= limit) {
      break;
    }

    const pid = discoveredPids[index]!;

    if (index > 0) {
      await sleep(requestDelayMs);
    }

    const url = productDetailUrl(pid);

    try {
      const html = await downloadHtml(url, "en", fetchFn);
      const parsedProduct = parseDuelProductHtml(html, { sourceUrl: url, locale: "en" });
      const canonical = mapDuelProductToCanonical(parsedProduct);
      const validation = validateCanonicalLureImport(canonical);

      if (!validation.valid) {
        outcomes.push({
          pid,
          title: parsedProduct.productName,
          recordKey: canonical.recordKey,
          modelSlug: canonical.model.slug,
          status: "failed",
          message: "Validation failed",
          validationErrors: validation.errors.map(
            (issue) => `${issue.code}: ${issue.message}`,
          ),
          validationWarnings: validation.warnings.map(
            (issue) => `${issue.code}: ${issue.message}`,
          ),
        });
        continue;
      }

      normalizedRecords.push(validation.normalized);

      if (!options.prisma) {
        outcomes.push({
          pid,
          title: parsedProduct.productName,
          recordKey: validation.normalized.recordKey,
          modelSlug: validation.normalized.model.slug,
          status: "imported",
          message: "Validated (dry run — no database client)",
          validationWarnings: validation.warnings.map(
            (issue) => `${issue.code}: ${issue.message}`,
          ),
        });
        processedCount += 1;
        continue;
      }

      const persistResult = await upsertDuelCanonicalImport(
        options.prisma,
        validation.normalized,
        startedAt,
      );

      aggregatePersistence.created.push(...persistResult.summary.created);
      aggregatePersistence.updated.push(...persistResult.summary.updated);
      aggregatePersistence.skipped.push(...persistResult.summary.skipped);
      aggregatePersistence.warnings.push(...persistResult.summary.warnings);
      aggregatePersistence.errors.push(...persistResult.summary.errors);

      if (persistResult.lureModelId) {
        observedLureModelIds.push(persistResult.lureModelId);
      }

      if (persistResult.summary.errors.length > 0) {
        outcomes.push({
          pid,
          title: parsedProduct.productName,
          recordKey: validation.normalized.recordKey,
          modelSlug: validation.normalized.model.slug,
          status: "failed",
          message: persistResult.summary.errors.join("; "),
          validationWarnings: validation.warnings.map(
            (issue) => `${issue.code}: ${issue.message}`,
          ),
        });
        continue;
      }

      const status = classifyProductOutcome(
        persistResult,
        validation.normalized.model.slug,
      );

      outcomes.push({
        pid,
        title: parsedProduct.productName,
        recordKey: validation.normalized.recordKey,
        modelSlug: validation.normalized.model.slug,
        status,
        validationWarnings: validation.warnings.map(
          (issue) => `${issue.code}: ${issue.message}`,
        ),
      });

      processedCount += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      outcomes.push({
        pid,
        status: "failed",
        message,
      });
    }
  }

  const completedAt = new Date();
  let reconcile: DuelImportRunResult["reconcile"];
  let imageDownloads: DuelImportRunResult["imageDownloads"];

  if (options.prisma) {
    reconcile = await reconcileManufacturerLifecycle(
      options.prisma,
      "duel",
      observedLureModelIds,
    );

    for (const slug of reconcile.missing) {
      aggregatePersistence.removed?.push(`MISSING: ${slug}`);
    }

    for (const slug of reconcile.discontinued) {
      aggregatePersistence.removed?.push(`DISCONTINUED: ${slug}`);
    }
  }

  if (options.downloadImages !== false && normalizedRecords.length > 0) {
    const imageUrls = collectImageUrlsFromRecords(normalizedRecords);
    const imageResult = await downloadManufacturerImages(
      "duel",
      imageUrls,
      resolveManufacturerImagesRoot(repoRoot),
      fetchFn,
    );

    imageDownloads = {
      downloaded: imageResult.downloaded.length,
      skipped: imageResult.skipped.length,
      errors: imageResult.errors,
    };

    aggregatePersistence.warnings.push(
      ...imageResult.errors.map((error) => `Image: ${error}`),
    );
  }

  const summary = countSummary(outcomes);

  const jsonReport = buildImportReport({
    manufacturer: "duel",
    displayName: "DUEL",
    startedAt,
    completedAt,
    productsProcessed: outcomes.length,
    summary: aggregatePersistence,
    imageDownloads,
  });

  const reportPath = await writeImportReport(jsonReport, reportsRoot);

  await mkdir(dirname(legacyReportPath), { recursive: true });
  await writeFile(
    legacyReportPath,
    renderDuelImportReport({
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      discoveredPids,
      processedProducts: outcomes.length,
      dryRun: !options.prisma,
      summary,
      persistence: aggregatePersistence,
      outcomes,
      observedLureModelIds,
      reconcile,
      imageDownloads,
      reportPath,
    }),
    "utf8",
  );

  return {
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    discoveredPids,
    processedProducts: outcomes.length,
    dryRun: !options.prisma,
    summary,
    persistence: aggregatePersistence,
    outcomes,
    observedLureModelIds,
    reconcile,
    imageDownloads,
    reportPath,
  };
}

export function printDuelImportSummary(result: DuelImportRunResult): void {
  console.log("DUEL Import Summary\n");
  console.log(`Imported: ${result.summary.imported}`);
  console.log(`Updated: ${result.summary.updated}`);
  console.log(`Skipped: ${result.summary.skipped}`);
  console.log(`Failed: ${result.summary.failed}`);
  console.log(`\nReport: ${result.reportPath}`);
}

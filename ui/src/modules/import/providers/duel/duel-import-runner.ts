import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PrismaClient } from "@/generated/prisma/client";
import { createEmptyImportSummary, type ImportSummary } from "../../persistence/types";
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
const REPO_ROOT = join(MODULE_DIR, "..", "..", "..", "..", "..", "..");
const DEFAULT_REPORT_PATH = join(
  REPO_ROOT,
  "research",
  "manufacturers",
  "duel",
  "import-report.md",
);

/** English lure category IDs from `docs/connectors/DUEL_CONNECTOR.md`. */
export const DUEL_LURE_CATEGORY_IDS = [
  448, // DUEL SALT WATER LURE
  445, // HARDCORE SALT WATER LURE
  464, // BIG GAME SERIES
  452, // 3DB SERIES
  449, // AILE MAGNET SERIES
];

export type DuelImportRunOptions = {
  /** Minimum number of distinct products to import (default 20). */
  minProducts?: number;
  /** Max category listing pages per category (default 5). */
  maxPagesPerCategory?: number;
  /** Delay between HTTP requests in ms (default 1000). */
  requestDelayMs?: number;
  /** Skip live HTTP fetch and use latest on-disk snapshot only. */
  offline?: boolean;
  /** Path for markdown import report. */
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
  reportPath: string;
};

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
  persistence: ImportSummary,
  recordKey: string,
  modelSlug: string,
): "imported" | "updated" | "skipped" {
  const createdModel = persistence.created.some(
    (line) => line === `LureModel: ${modelSlug}`,
  );
  if (createdModel) {
    return "imported";
  }

  const updatedModel = persistence.updated.some(
    (line) => line === `LureModel: ${modelSlug}`,
  );
  if (updatedModel) {
    return "updated";
  }

  const touched =
    persistence.created.some((line) => line.includes(recordKey)) ||
    persistence.updated.some((line) => line.includes(modelSlug)) ||
    persistence.created.length > 0 ||
    persistence.updated.length > 0;

  return touched ? "updated" : "skipped";
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
  const minProducts = options.minProducts ?? 20;
  const reportPath = options.reportPath ?? DEFAULT_REPORT_PATH;
  const outcomes: DuelProductOutcome[] = [];
  const aggregatePersistence = createEmptyImportSummary();

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

  let successCount = 0;

  for (let index = 0; index < discoveredPids.length; index += 1) {
    if (successCount >= minProducts) {
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
        successCount += 1;
        continue;
      }

      const persistence = await upsertDuelCanonicalImport(
        options.prisma,
        validation.normalized,
        startedAt,
      );

      aggregatePersistence.created.push(...persistence.created);
      aggregatePersistence.updated.push(...persistence.updated);
      aggregatePersistence.skipped.push(...persistence.skipped);
      aggregatePersistence.errors.push(...persistence.errors);

      if (persistence.errors.length > 0) {
        outcomes.push({
          pid,
          title: parsedProduct.productName,
          recordKey: validation.normalized.recordKey,
          modelSlug: validation.normalized.model.slug,
          status: "failed",
          message: persistence.errors.join("; "),
          validationWarnings: validation.warnings.map(
            (issue) => `${issue.code}: ${issue.message}`,
          ),
        });
        continue;
      }

      const status = classifyProductOutcome(
        persistence,
        validation.normalized.recordKey,
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

      if (status === "imported" || status === "updated") {
        successCount += 1;
      }
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

  if (successCount < minProducts && !options.offline) {
    outcomes.push({
      pid: "batch",
      status: "failed",
      message: `Only ${successCount} products passed validation/import; required ${minProducts}.`,
    });
  }

  const summary = countSummary(outcomes.filter((outcome) => outcome.pid !== "batch"));

  const result: DuelImportRunResult = {
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    discoveredPids,
    processedProducts: outcomes.filter((outcome) => outcome.pid !== "batch").length,
    dryRun: !options.prisma,
    summary,
    persistence: aggregatePersistence,
    outcomes,
    reportPath,
  };

  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, renderDuelImportReport(result), "utf8");

  return result;
}

export function printDuelImportSummary(result: DuelImportRunResult): void {
  console.log("DUEL Import Summary\n");
  console.log(`Imported: ${result.summary.imported}`);
  console.log(`Updated: ${result.summary.updated}`);
  console.log(`Skipped: ${result.summary.skipped}`);
  console.log(`Failed: ${result.summary.failed}`);
  console.log(`\nReport: ${result.reportPath}`);
}

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  DuelFetchResult,
  DuelFetcherOptions,
  DuelFetchTarget,
  DuelSavedSnapshot,
} from "./types";
import {
  DUEL_DEFAULT_CATEGORY_URL,
  DUEL_DEFAULT_PRODUCT_URL,
  DUEL_FETCH_USER_AGENT,
} from "./types";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(MODULE_DIR, "..", "..", "..", "..", "..", "..");
const DEFAULT_SNAPSHOT_ROOT = join(
  REPO_ROOT,
  "research",
  "manufacturers",
  "duel",
  "snapshots",
);

function formatSnapshotTimestamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function resolveSnapshotRoot(options: DuelFetcherOptions): string {
  return options.snapshotRoot ?? DEFAULT_SNAPSHOT_ROOT;
}

function resolveTargets(options: DuelFetcherOptions): DuelFetchTarget[] {
  return [
    {
      kind: "product",
      locale: "en",
      url: options.productUrl ?? DUEL_DEFAULT_PRODUCT_URL,
    },
    {
      kind: "category",
      locale: "en",
      url: options.categoryUrl ?? DUEL_DEFAULT_CATEGORY_URL,
    },
  ];
}

function snapshotFilename(kind: DuelFetchTarget["kind"], locale: DuelFetchTarget["locale"]): string {
  return `${kind}-${locale}.html`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadPage(
  target: DuelFetchTarget,
  fetchFn: typeof fetch,
): Promise<{ html: string; statusCode: number; contentType: string | null }> {
  const response = await fetchFn(target.url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language":
        target.locale === "ja" ? "ja,en;q=0.9" : "en,ja;q=0.9",
      "User-Agent": DUEL_FETCH_USER_AGENT,
    },
    redirect: "follow",
  });

  const html = await response.text();

  return {
    html,
    statusCode: response.status,
    contentType: response.headers.get("content-type"),
  };
}

/**
 * Download one DUEL product page and one category page; save raw HTML snapshots.
 * No parsing, validation, mapping, or persistence.
 */
export async function fetchDuelSnapshots(
  options: DuelFetcherOptions = {},
): Promise<DuelFetchResult> {
  const startedAt = new Date();
  const snapshotDir = join(
    resolveSnapshotRoot(options),
    formatSnapshotTimestamp(startedAt),
  );
  const fetchFn = options.fetchFn ?? fetch;
  const requestDelayMs = options.requestDelayMs ?? 1000;
  const targets = resolveTargets(options);
  const snapshots: DuelSavedSnapshot[] = [];

  await mkdir(snapshotDir, { recursive: true });

  for (let index = 0; index < targets.length; index += 1) {
    const target = targets[index];

    if (index > 0 && requestDelayMs > 0) {
      await sleep(requestDelayMs);
    }

    const fetchedAt = new Date().toISOString();
    const { html, statusCode, contentType } = await downloadPage(target, fetchFn);

    if (statusCode < 200 || statusCode >= 300) {
      throw new Error(
        `DUEL fetch failed for ${target.url}: HTTP ${statusCode}`,
      );
    }

    const filename = snapshotFilename(target.kind, target.locale);
    const absolutePath = join(snapshotDir, filename);
    await writeFile(absolutePath, html, "utf8");

    snapshots.push({
      kind: target.kind,
      locale: target.locale,
      url: target.url,
      filename,
      absolutePath,
      statusCode,
      contentType,
      byteLength: Buffer.byteLength(html, "utf8"),
      fetchedAt,
    });
  }

  const completedAt = new Date().toISOString();

  return {
    snapshotDir,
    snapshots,
    startedAt: startedAt.toISOString(),
    completedAt,
  };
}

export function resolveDuelSnapshotRoot(options: DuelFetcherOptions = {}): string {
  return resolveSnapshotRoot(options);
}

async function main(): Promise<void> {
  const result = await fetchDuelSnapshots();
  console.log(JSON.stringify(result, null, 2));
}

const entryPath = process.argv[1]?.replace(/\\/g, "/");
const modulePath = fileURLToPath(import.meta.url).replace(/\\/g, "/");

if (entryPath?.endsWith("duel-fetcher.ts") && modulePath.endsWith("duel-fetcher.ts")) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}

import { enrichCanonicalForEditorial } from "@/modules/import/enrichment/editorial-product-enricher";
import { mapDuelProductToCanonical } from "@/modules/import/providers/duel/duel-mapper";
import { parseDuelProductHtml } from "@/modules/import/providers/duel/duel-parser";
import { DUEL_FETCH_USER_AGENT } from "@/modules/import/providers/duel/types";
import { validateCanonicalLureImport } from "@/modules/import/validators/canonical-lure-validator";
import type { CanonicalLureImport } from "@/modules/import/core/canonical-lure";
import { duelProductUrl } from "@/modules/import/sync/resolve-manufacturer-source";

async function downloadHtml(url: string, fetchFn: typeof fetch): Promise<string> {
  const response = await fetchFn(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en,ja;q=0.9",
      "User-Agent": DUEL_FETCH_USER_AGENT,
    },
    redirect: "follow",
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.text();
}

/** Fetch, parse, validate, and editorially enrich a single DUEL product page. */
export async function fetchDuelProductCanonical(
  pid: string,
  fetchFn: typeof fetch = fetch,
): Promise<CanonicalLureImport> {
  const url = duelProductUrl(pid);
  const html = await downloadHtml(url, fetchFn);
  const parsed = parseDuelProductHtml(html, { sourceUrl: url, locale: "en" });
  const canonical = mapDuelProductToCanonical(parsed);
  const validation = validateCanonicalLureImport(canonical);

  if (!validation.valid) {
    throw new Error(
      `Validation failed: ${validation.errors.map((e) => e.message).join("; ")}`,
    );
  }

  const enriched = enrichCanonicalForEditorial({
    ...validation.normalized,
    metadata: {
      ...validation.normalized.metadata,
      extras: {
        ...validation.normalized.metadata.extras,
        singleProductRefresh: true,
        syncDeferMedia: true,
      },
    },
  });

  return enriched;
}

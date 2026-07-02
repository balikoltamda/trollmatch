/** Page kinds supported by the DUEL fetcher (HTML snapshot only). */
export type DuelPageKind = "product" | "category";

/** Locale hint for the target URL — used in metadata, not for parsing. */
export type DuelLocale = "ja" | "en";

/** A single page target to download. */
export type DuelFetchTarget = {
  kind: DuelPageKind;
  locale: DuelLocale;
  url: string;
};

/** Options for {@link fetchDuelSnapshots}. */
export type DuelFetcherOptions = {
  /** Override product detail URL (default: JP canonical `pid=1332`). */
  productUrl?: string;
  /** Override category listing URL (default: EN DUEL SALT WATER LURE `category=448`). */
  categoryUrl?: string;
  /** Root directory for timestamped snapshot folders. */
  snapshotRoot?: string;
  /** Custom fetch implementation (for tests). */
  fetchFn?: typeof fetch;
  /** Delay in ms between requests (default: 1000). */
  requestDelayMs?: number;
};

/** Metadata for one saved HTML file. */
export type DuelSavedSnapshot = {
  kind: DuelPageKind;
  locale: DuelLocale;
  url: string;
  filename: string;
  absolutePath: string;
  statusCode: number;
  contentType: string | null;
  byteLength: number;
  fetchedAt: string;
};

/** Result of a fetch run. */
export type DuelFetchResult = {
  snapshotDir: string;
  snapshots: DuelSavedSnapshot[];
  startedAt: string;
  completedAt: string;
};

/** Default targets from `docs/connectors/DUEL_CONNECTOR.md`. */
export const DUEL_DEFAULT_PRODUCT_URL =
  "https://www.duel.co.jp/english/products/detail.html?pid=1332";

export const DUEL_DEFAULT_CATEGORY_URL =
  "https://www.duel.co.jp/english/products/list.html?category=448";

export const DUEL_FETCH_USER_AGENT =
  "TrollMatch-DuelFetcher/1.0 (research snapshot; +https://github.com/balikoltamda/trollmatch)";

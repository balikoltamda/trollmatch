import type { CanonicalLureImport } from "../../core/canonical-lure";

/** Parsed breadcrumb segment from a DUEL product or category page. */
export type DuelParsedBreadcrumb = {
  label: string;
  href?: string;
  isCurrent: boolean;
};

/** One row from the SPEC table on a product detail page. */
export type DuelParsedSpecRow = {
  catalogNumberPrefix: string;
  type: string;
  sizeLabel: string;
  lengthMm?: number;
  weightG?: number;
  ring?: string;
  hook?: string;
  castingRange?: string;
  rangeLabel?: string;
  divingDepthCm?: number;
};

/** Color entry from the COLORS section. */
export type DuelParsedColor = {
  code: string;
  name: string;
  description?: string;
  tags: string[];
  imageUrl?: string;
};

/** Intermediate product parse — all fields extracted before canonical mapping. */
export type DuelParsedProduct = {
  pid: string;
  locale: "en" | "ja";
  sourceUrl: string;
  brand: string;
  manufacturerName: string;
  productLineName: string;
  productName: string;
  productCodes: string[];
  description: string;
  featureBullets: string[];
  features: Array<{ title: string; text: string; patent?: string }>;
  breadcrumbs: DuelParsedBreadcrumb[];
  categories: string[];
  heroImageUrls: string[];
  featureImageUrls: string[];
  colors: DuelParsedColor[];
  specRows: DuelParsedSpecRow[];
  /** JAN / UPC values when present (typically Japanese snapshots only). */
  janSku: Array<{ catalogNumber: string; colorCode?: string; value: string }>;
  availableSizes: string[];
  availableColors: string[];
};

/** Product card from a category listing snapshot. */
export type DuelCategoryProductCard = {
  pid: string;
  title: string;
  thumbnailUrl?: string;
  detailPath?: string;
};

/** Parsed category listing page. */
export type DuelParsedCategory = {
  locale: "en" | "ja";
  sourceUrl: string;
  categoryName: string;
  breadcrumbs: DuelParsedBreadcrumb[];
  products: DuelCategoryProductCard[];
};

/** Options for {@link parseDuelSnapshots}. */
export type DuelParserOptions = {
  /** Snapshot directory containing `product-*.html` and optional `category-*.html`. */
  snapshotDir?: string;
  /** Root directory holding timestamped snapshot folders. */
  snapshotRoot?: string;
  /** Product page source URL (used for pid when not embedded in HTML). */
  productSourceUrl?: string;
  /** Category page source URL (used for category id metadata). */
  categorySourceUrl?: string;
  /** Override product HTML filename inside snapshot dir (default: `product-en.html`). */
  productFilename?: string;
  /** Override category HTML filename (default: `category-en.html`). */
  categoryFilename?: string;
};

/** Parser output envelope. */
export type DuelParserResult = {
  snapshotDir: string;
  records: CanonicalLureImport[];
  category?: DuelParsedCategory;
  parsedProduct?: DuelParsedProduct;
  warnings: string[];
};

export const DUEL_PARSER_PROVIDER_CODE = "duel";
export const DUEL_PARSER_SCHEMA_VERSION = "1.0.0";

export const DUEL_DEFAULT_PRODUCT_SOURCE_URL =
  "https://www.duel.co.jp/english/products/detail.html?pid=1332";

export const DUEL_DEFAULT_CATEGORY_SOURCE_URL =
  "https://www.duel.co.jp/english/products/list.html?category=448";

export const DUEL_SITE_ORIGIN = "https://www.duel.co.jp";

/** Filename patterns written by {@link fetchDuelSnapshots}. */
export const DUEL_SNAPSHOT_PRODUCT_FILENAME = "product-en.html";
export const DUEL_SNAPSHOT_CATEGORY_FILENAME = "category-en.html";

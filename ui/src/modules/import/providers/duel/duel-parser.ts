import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import type {
  CanonicalBuoyancy,
  CanonicalColor,
  CanonicalDivingDepth,
  CanonicalHookConfiguration,
  CanonicalImage,
  CanonicalLureImport,
  CanonicalLureVariant,
  CanonicalLocalizedText,
  CanonicalTag,
} from "../../core/canonical-lure";
import type {
  DuelParsedBreadcrumb,
  DuelParsedCategory,
  DuelParsedColor,
  DuelParsedProduct,
  DuelParsedSpecRow,
  DuelParserOptions,
  DuelParserResult,
} from "./parser.types";
import {
  DUEL_DEFAULT_CATEGORY_SOURCE_URL,
  DUEL_DEFAULT_PRODUCT_SOURCE_URL,
  DUEL_PARSER_PROVIDER_CODE,
  DUEL_PARSER_SCHEMA_VERSION,
  DUEL_SITE_ORIGIN,
  DUEL_SNAPSHOT_CATEGORY_FILENAME,
  DUEL_SNAPSHOT_PRODUCT_FILENAME,
} from "./parser.types";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(MODULE_DIR, "..", "..", "..", "..", "..", "..");
const DEFAULT_SNAPSHOT_ROOT = join(
  REPO_ROOT,
  "research",
  "manufacturers",
  "duel",
  "snapshots",
);

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function localized(en: string): CanonicalLocalizedText {
  const trimmed = en.trim();
  return trimmed ? { en: trimmed, default: trimmed } : {};
}

function resolveAbsoluteUrl(url: string | undefined): string | undefined {
  if (!url?.trim()) {
    return undefined;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  if (url.startsWith("/")) {
    return `${DUEL_SITE_ORIGIN}${url}`;
  }

  return `${DUEL_SITE_ORIGIN}/${url.replace(/^\.\//, "")}`;
}

function extractPidFromUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("pid") ?? undefined;
  } catch {
    return undefined;
  }
}

function extractCategoryIdFromUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("category") ?? undefined;
  } catch {
    return undefined;
  }
}

function parseLengthMm(value: string): number | undefined {
  const match = value.match(/([\d.]+)\s*mm/i);
  return match ? Math.round(Number.parseFloat(match[1])) : undefined;
}

function parseWeightG(value: string): number | undefined {
  const match = value.match(/([\d.]+)\s*g/i);
  return match ? Math.round(Number.parseFloat(match[1])) : undefined;
}

function parseDepthCm(value: string): number | undefined {
  const match = value.match(/([\d.]+)\s*cm/i);
  return match ? Number.parseFloat(match[1]) : undefined;
}

function inferBrandFromBreadcrumbs(breadcrumbs: DuelParsedBreadcrumb[]): string {
  const joined = breadcrumbs.map((item) => item.label.toUpperCase()).join(" ");

  if (joined.includes("YO-ZURI")) {
    return "YO-ZURI";
  }

  if (joined.includes("HARDCORE")) {
    return "HARDCORE";
  }

  return "DUEL";
}

function parseBreadcrumbs($: cheerio.CheerioAPI): DuelParsedBreadcrumb[] {
  const items: DuelParsedBreadcrumb[] = [];

  $(".p-breadcrumns_list .p-breadcrumns_item").each((_, element) => {
    const node = $(element);
    const link = node.find(".p-breadcrumns_link").first();
    const label = link.length
      ? link.text().replace(/\s+/g, " ").trim()
      : node.text().replace(/\s+/g, " ").trim();

    if (!label) {
      return;
    }

    items.push({
      label,
      href: resolveAbsoluteUrl(link.attr("href")),
      isCurrent: node.hasClass("current"),
    });
  });

  return items;
}

function parseSpecTable($: cheerio.CheerioAPI): DuelParsedSpecRow[] {
  const table = $("#spec table.p-spec-table").first();
  if (!table.length) {
    return [];
  }

  const headers = table
    .find("thead th")
    .map((_, cell) => $(cell).text().replace(/\s+/g, " ").trim().toUpperCase())
    .get();

  const columnIndex = (name: string): number =>
    headers.findIndex((header) => header.includes(name));

  const rows: DuelParsedSpecRow[] = [];

  table.find("tbody tr").each((_, rowElement) => {
    const cells = $(rowElement)
      .find("td")
      .map((__, cell) => $(cell).text().replace(/\s+/g, " ").trim())
      .get();

    if (cells.length === 0) {
      return;
    }

    const getCell = (name: string): string | undefined => {
      const index = columnIndex(name);
      return index >= 0 ? cells[index] : undefined;
    };

    const sizeLabel = getCell("SIZE") ?? "";
    const rangeLabel = getCell("RANGE") ?? "";

    rows.push({
      catalogNumberPrefix: getCell("CAT.NO.") ?? getCell("CAT.NO") ?? "",
      type: getCell("TYPE") ?? "",
      sizeLabel,
      lengthMm: parseLengthMm(sizeLabel),
      weightG: parseWeightG(getCell("WEIGHT") ?? ""),
      ring: getCell("RING"),
      hook: getCell("HOOK"),
      castingRange: getCell("CASTING RANGE"),
      rangeLabel,
      divingDepthCm: parseDepthCm(rangeLabel),
    });
  });

  return rows;
}

function parseColors($: cheerio.CheerioAPI): DuelParsedColor[] {
  const colors: DuelParsedColor[] = [];

  $(".p-product-list_colors_ttl").each((_, titleElement) => {
    const title = $(titleElement);
    const wrapper = title.closest(".p-product-list_wrapper");
    const code = title.find("span._c").text().replace(/\s+/g, " ").trim();
    const name = title.find("span._t").text().replace(/\s+/g, " ").trim();

    if (!code) {
      return;
    }

    const tags = wrapper
      .find(".p-product-list_tag li")
      .map((__, tag) => $(tag).text().replace(/\s+/g, " ").trim())
      .get()
      .filter(Boolean);

    const imageSrc = wrapper.find(".p-thumbnail.-colors img").attr("src");
    const descriptionParts = wrapper
      .contents()
      .filter((__, node) => node.type === "text")
      .map((__, node) => $(node).text().replace(/\s+/g, " ").trim())
      .get()
      .filter(Boolean);

    colors.push({
      code,
      name,
      description: descriptionParts.join(" ").trim() || undefined,
      tags,
      imageUrl: resolveAbsoluteUrl(imageSrc),
    });
  });

  return colors;
}

function parseJanSkuTable($: cheerio.CheerioAPI): DuelParsedProduct["janSku"] {
  const entries: DuelParsedProduct["janSku"] = [];

  $("table").each((_, tableElement) => {
    const table = $(tableElement);
    const headers = table
      .find("thead th, tr:first-child th, tr:first-child td")
      .map((__, cell) => $(cell).text().replace(/\s+/g, " ").trim().toUpperCase())
      .get();

    const janIndex = headers.findIndex(
      (header) => header.includes("JAN") || header.includes("UPC"),
    );
    const catalogIndex = headers.findIndex(
      (header) => header.includes("CAT.NO") || header.includes("注文番号"),
    );
    const colorIndex = headers.findIndex(
      (header) => header.includes("カラー") || header === "COLOR",
    );

    if (janIndex < 0) {
      return;
    }

    table.find("tbody tr").each((__, rowElement) => {
      const cells = $(rowElement)
        .find("td")
        .map((___, cell) => $(cell).text().replace(/\s+/g, " ").trim())
        .get();

      const value = cells[janIndex];
      if (!value || !/^\d{8,14}$/.test(value.replace(/\s/g, ""))) {
        return;
      }

      entries.push({
        catalogNumber: catalogIndex >= 0 ? cells[catalogIndex] ?? "" : "",
        colorCode: colorIndex >= 0 ? cells[colorIndex] : undefined,
        value: value.replace(/\s/g, ""),
      });
    });
  });

  return entries;
}

function parseDescription($: cheerio.CheerioAPI): {
  headline: string;
  bullets: string[];
} {
  const headline = $(".p-product_ttl").text().replace(/\s+/g, " ").trim();
  const bullets = $(".p-check-list li")
    .map((_, item) => $(item).text().replace(/\s+/g, " ").trim())
    .get()
    .filter(Boolean);

  return { headline, bullets };
}

function parseFeatures($: cheerio.CheerioAPI): DuelParsedProduct["features"] {
  return $("#feature .p-product-feature")
    .map((_, element) => {
      const block = $(element);
      return {
        title: block.find("._ttl").text().replace(/\s+/g, " ").trim(),
        text: block.find("._text").text().replace(/\s+/g, " ").trim(),
        patent: block.find("._patent").text().replace(/\s+/g, " ").trim() || undefined,
      };
    })
    .get()
    .filter((feature) => feature.title || feature.text);
}

function parseHeroImages($: cheerio.CheerioAPI): string[] {
  const urls = new Set<string>();

  for (const selector of [".p-slick-slide img", ".p-slick-thumb img"]) {
    $(selector).each((_, img) => {
      const resolved = resolveAbsoluteUrl($(img).attr("src"));
      if (resolved) {
        urls.add(resolved);
      }
    });
  }

  return [...urls];
}

function parseFeatureImages($: cheerio.CheerioAPI): string[] {
  const urls = new Set<string>();

  $("#feature .p-product-feature img").each((_, img) => {
    const resolved = resolveAbsoluteUrl($(img).attr("src"));
    if (resolved) {
      urls.add(resolved);
    }
  });

  return [...urls];
}

/** Parse a DUEL English/Japanese product detail HTML snapshot. */
export function parseDuelProductHtml(
  html: string,
  options: {
    sourceUrl: string;
    locale?: "en" | "ja";
  },
): DuelParsedProduct {
  const $ = cheerio.load(html);
  const breadcrumbs = parseBreadcrumbs($);
  const productName =
    $(".l-hero_ttl").first().text().replace(/\s+/g, " ").trim() ||
    $("title").text().replace(/\s*-\s*DUEL.*$/i, "").trim();

  const productLineName =
    breadcrumbs.find((item) => !item.isCurrent && item.label !== "PRODUCTS" && item.label.toLowerCase() !== "home")?.label ??
    "";

  const categories = breadcrumbs
    .filter((item) => !item.isCurrent && item.label !== "home" && item.label !== "PRODUCTS")
    .map((item) => item.label);

  const { headline, bullets } = parseDescription($);
  const specRows = parseSpecTable($);
  const colors = parseColors($);
  const janSku = parseJanSkuTable($);

  const descriptionParts = [headline, ...bullets].filter(Boolean);
  const locale = options.locale ?? (options.sourceUrl.includes("/english/") ? "en" : "ja");
  const pid = extractPidFromUrl(options.sourceUrl) ?? "unknown";

  return {
    pid,
    locale,
    sourceUrl: options.sourceUrl,
    brand: inferBrandFromBreadcrumbs(breadcrumbs),
    manufacturerName: "DUEL",
    productLineName,
    productName,
    productCodes: specRows.map((row) => row.catalogNumberPrefix).filter(Boolean),
    description: descriptionParts.join("\n"),
    featureBullets: bullets,
    features: parseFeatures($),
    breadcrumbs,
    categories,
    heroImageUrls: parseHeroImages($),
    featureImageUrls: parseFeatureImages($),
    colors,
    specRows,
    janSku,
    availableSizes: specRows.map((row) => row.sizeLabel).filter(Boolean),
    availableColors: colors.map((color) => color.code),
  };
}

/** Parse a DUEL category listing HTML snapshot. */
export function parseDuelCategoryHtml(
  html: string,
  options: {
    sourceUrl: string;
    locale?: "en" | "ja";
  },
): DuelParsedCategory {
  const $ = cheerio.load(html);
  const breadcrumbs = parseBreadcrumbs($);
  const locale = options.locale ?? (options.sourceUrl.includes("/english/") ? "en" : "ja");

  const categoryName =
    breadcrumbs.find((item) => item.isCurrent)?.label ??
    $(".l-hero_text").first().text().replace(/\s+/g, " ").trim() ??
    $("title").text().replace(/\s*-\s*DUEL.*$/i, "").trim();

  const products = $("a.p-product-list_link")
    .map((_, anchor) => {
      const link = $(anchor);
      const href = link.attr("href") ?? "";
      const pid =
        extractPidFromUrl(
          href.startsWith("http") ? href : `${DUEL_SITE_ORIGIN}/english/products/${href.replace(/^\.\//, "")}`,
        ) ?? "";

      return {
        pid,
        title: link.find(".p-product-list_text").text().replace(/\s+/g, " ").trim(),
        thumbnailUrl: resolveAbsoluteUrl(link.find(".p-thumbnail img").attr("src")),
        detailPath: href,
      };
    })
    .get()
    .filter((product) => product.pid && product.title);

  return {
    locale,
    sourceUrl: options.sourceUrl,
    categoryName,
    breadcrumbs,
    products,
  };
}

function buildBuoyancy(typeLabel: string): CanonicalBuoyancy | undefined {
  const normalized = typeLabel.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  return {
    slug: normalized.replace(/\s+/g, "-"),
    manufacturerTerm: typeLabel.trim(),
    label: localized(typeLabel.trim()),
  };
}

function buildDivingDepthFromSpec(row: DuelParsedSpecRow): CanonicalDivingDepth | undefined {
  if (row.divingDepthCm === undefined) {
    return undefined;
  }

  const meters = row.divingDepthCm / 100;

  return {
    minMeters: meters,
    maxMeters: meters,
    manufacturerLabel: localized(row.rangeLabel ?? ""),
  };
}

function buildHookConfig(row: DuelParsedSpecRow): CanonicalHookConfiguration | undefined {
  if (!row.hook && !row.ring) {
    return undefined;
  }

  return {
    hookSize: row.hook,
    configuration: row.ring ? `Ring ${row.ring}` : undefined,
    factoryDefault: true,
  };
}

function toCanonicalColor(color: DuelParsedColor): CanonicalColor {
  const aliases = color.tags.map((tag) => ({
    kind: "marketing_name",
    value: tag,
    locale: "en",
  }));

  return {
    code: color.code,
    name: localized(color.name || color.code),
    aliases: aliases.length > 0 ? aliases : undefined,
  };
}

function buildCategoryTags(categories: string[]): CanonicalTag[] {
  return categories.map((category) => ({
    kind: "search",
    value: slugify(category),
    locale: "en" as const,
  }));
}

/** Map intermediate parse result to {@link CanonicalLureImport}. */
export function mapDuelProductToCanonical(
  product: DuelParsedProduct,
  category?: DuelParsedCategory,
): CanonicalLureImport {
  const modelSlug = slugify(product.productName);
  const productLineSlug = slugify(product.productLineName || product.categories.at(-1) || "duel");

  const modelImages: CanonicalImage[] = [
    ...product.heroImageUrls.map((url, index) => ({
      url,
      role: (index === 0 ? "hero" : "gallery") as CanonicalImage["role"],
      sortOrder: index,
    })),
    ...product.featureImageUrls.map((url, index) => ({
      url,
      role: "technical_diagram" as const,
      sortOrder: product.heroImageUrls.length + index,
    })),
  ];

  const modelTags: CanonicalTag[] = [
    { kind: "marketing", value: product.brand, locale: "en" },
    ...buildCategoryTags(product.categories),
    ...product.features.map((feature) => ({
      kind: "feature" as const,
      value: feature.title,
      locale: "en" as const,
    })),
  ];

  if (category) {
    modelTags.push({
      kind: "search",
      value: `category:${slugify(category.categoryName)}`,
      locale: "en",
    });
  }

  const specRows = product.specRows.length > 0 ? product.specRows : [{} as DuelParsedSpecRow];
  const colors = product.colors.length > 0 ? product.colors : [{ code: "default", name: "Default", tags: [] }];

  const variants: CanonicalLureVariant[] = [];

  for (const spec of specRows) {
    for (const color of colors) {
      const variantSlug = slugify(
        `${color.code}-${spec.lengthMm ?? (spec.sizeLabel || "std")}`,
      );
      const skuPrefix = spec.catalogNumberPrefix.replace(/-+$/, "");
      const manufacturerSku =
        skuPrefix && color.code ? `${skuPrefix}${color.code}` : undefined;

      const janEntry = product.janSku.find(
        (entry) =>
          entry.colorCode?.toUpperCase() === color.code.toUpperCase() ||
          entry.catalogNumber.startsWith(skuPrefix),
      );

      const variantImages: CanonicalImage[] = [];
      if (color.imageUrl) {
        variantImages.push({
          url: color.imageUrl,
          role: "product",
          colorCode: color.code,
          alt: localized(color.name),
        });
      }

      const hook = buildHookConfig(spec);

      variants.push({
        slug: variantSlug,
        name: localized(
          [spec.sizeLabel, color.name].filter(Boolean).join(" · ") || product.productName,
        ),
        sku: manufacturerSku,
        colors: [toCanonicalColor(color)],
        sizes: spec.lengthMm ? [{ lengthMm: spec.lengthMm, label: localized(spec.sizeLabel) }] : undefined,
        weights: spec.weightG ? [{ weightG: spec.weightG }] : undefined,
        divingDepth: buildDivingDepthFromSpec(spec),
        buoyancy: spec.type ? buildBuoyancy(spec.type) : undefined,
        hooks: hook ? [hook] : undefined,
        images: variantImages.length > 0 ? variantImages : undefined,
        externalIdentifiers: [
          ...(manufacturerSku
            ? [{ scheme: "manufacturer_sku" as const, value: manufacturerSku }]
            : []),
          ...(janEntry
            ? [{ scheme: (janEntry.value.length === 12 ? "upc" : "ean") as "upc" | "ean", value: janEntry.value }]
            : []),
        ],
        tags: color.tags.map((tag) => ({
          kind: "marketing" as const,
          value: tag,
          locale: "en" as const,
        })),
      });
    }
  }

  const primarySpec = product.specRows[0];

  return {
    recordKey: `duel:pid:${product.pid}`,
    manufacturer: {
      slug: "duel",
      name: localized(product.manufacturerName),
      countryCode: "JP",
      website: DUEL_SITE_ORIGIN,
    },
    productLine: {
      slug: productLineSlug,
      name: localized(product.productLineName || category?.categoryName || "DUEL"),
    },
    model: {
      slug: modelSlug,
      name: localized(product.productName),
      modelCode: product.productCodes[0]?.replace(/-+$/, "") || undefined,
      description: localized(product.description),
      formFactorTerm: product.productLineName || undefined,
      sizes: product.specRows
        .filter((row) => row.lengthMm)
        .map((row) => ({ lengthMm: row.lengthMm, label: localized(row.sizeLabel) })),
      weights: product.specRows
        .filter((row) => row.weightG)
        .map((row) => ({ weightG: row.weightG })),
      divingDepth: primarySpec ? buildDivingDepthFromSpec(primarySpec) : undefined,
      buoyancy: primarySpec?.type ? buildBuoyancy(primarySpec.type) : undefined,
      hooks: product.specRows
        .map((row) => buildHookConfig(row))
        .filter((hook): hook is CanonicalHookConfiguration => Boolean(hook)),
      images: modelImages,
      tags: modelTags,
      externalIdentifiers: product.productCodes[0]
        ? [{ scheme: "manufacturer_sku", value: product.productCodes[0] }]
        : undefined,
    },
    variants,
    source: {
      url: product.sourceUrl,
      type: "website_scrape",
      documentTitle: product.productName,
      retrievedAt: new Date().toISOString(),
    },
    metadata: {
      providerCode: DUEL_PARSER_PROVIDER_CODE,
      providerSchemaVersion: DUEL_PARSER_SCHEMA_VERSION,
      idempotencyKey: `duel:pid:${product.pid}`,
      sourceRecordId: product.pid,
      extras: {
        brand: product.brand,
        locale: product.locale,
        breadcrumbs: product.breadcrumbs,
        categories: product.categories,
        categoryId: extractCategoryIdFromUrl(category?.sourceUrl ?? ""),
        availableSizes: product.availableSizes,
        availableColors: product.availableColors,
        specifications: product.specRows,
        featureBlocks: product.features,
        categoryListing: category?.products ?? [],
        janSkuMissing: product.janSku.length === 0,
      },
    },
    importedAt: new Date().toISOString(),
  };
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

export async function resolveLatestSnapshotDir(
  snapshotRoot: string = DEFAULT_SNAPSHOT_ROOT,
): Promise<string | undefined> {
  let entries: string[];

  try {
    entries = await readdir(snapshotRoot);
  } catch {
    return undefined;
  }

  const directories = entries
    .filter((entry) => !entry.startsWith("."))
    .sort()
    .reverse();

  return directories[0] ? join(snapshotRoot, directories[0]) : undefined;
}

export async function parseDuelSnapshots(
  options: DuelParserOptions = {},
): Promise<DuelParserResult> {
  const warnings: string[] = [];
  const snapshotDir =
    options.snapshotDir ??
    (await resolveLatestSnapshotDir(options.snapshotRoot ?? DEFAULT_SNAPSHOT_ROOT));

  if (!snapshotDir) {
    throw new Error(
      "No DUEL snapshot directory found. Run `npm run import:duel:fetch` first.",
    );
  }

  const productFilename = options.productFilename ?? DUEL_SNAPSHOT_PRODUCT_FILENAME;
  const categoryFilename = options.categoryFilename ?? DUEL_SNAPSHOT_CATEGORY_FILENAME;
  const productPath = join(snapshotDir, productFilename);
  const categoryPath = join(snapshotDir, categoryFilename);

  if (!(await fileExists(productPath))) {
    throw new Error(`Product snapshot not found: ${productPath}`);
  }

  const productHtml = await readFile(productPath, "utf8");
  const productSourceUrl =
    options.productSourceUrl ?? DUEL_DEFAULT_PRODUCT_SOURCE_URL;

  const parsedProduct = parseDuelProductHtml(productHtml, {
    sourceUrl: productSourceUrl,
    locale: productFilename.includes("-ja.") ? "ja" : "en",
  });

  let category: DuelParsedCategory | undefined;

  if (await fileExists(categoryPath)) {
    const categoryHtml = await readFile(categoryPath, "utf8");
    category = parseDuelCategoryHtml(categoryHtml, {
      sourceUrl: options.categorySourceUrl ?? DUEL_DEFAULT_CATEGORY_SOURCE_URL,
      locale: categoryFilename.includes("-ja.") ? "ja" : "en",
    });
  } else {
    warnings.push(`Category snapshot missing: ${categoryPath}`);
  }

  if (parsedProduct.janSku.length === 0) {
    warnings.push(
      "No JAN/UPC rows found in snapshot (expected on Japanese detail pages).",
    );
  }

  const record = mapDuelProductToCanonical(parsedProduct, category);

  return {
    snapshotDir,
    records: [record],
    category,
    parsedProduct,
    warnings,
  };
}

async function main(): Promise<void> {
  const result = await parseDuelSnapshots();
  console.log(JSON.stringify(result, null, 2));
}

const entryPath = process.argv[1]?.replace(/\\/g, "/");
const modulePath = fileURLToPath(import.meta.url).replace(/\\/g, "/");

if (entryPath?.endsWith("duel-parser.ts") && modulePath.endsWith("duel-parser.ts")) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}

import type {
  CanonicalBodyType,
  CanonicalBuoyancy,
  CanonicalCoatingType,
  CanonicalColor,
  CanonicalDivingDepth,
  CanonicalExternalIdentifier,
  CanonicalHookConfiguration,
  CanonicalImage,
  CanonicalLocalizedText,
  CanonicalLureImport,
  CanonicalLureVariant,
  CanonicalSize,
  CanonicalTag,
  CanonicalTechniqueRef,
  CanonicalTrollingSpeedRange,
  CanonicalWeight,
} from "../../core/canonical-lure";
import type {
  DuelParsedCategory,
  DuelParsedColor,
  DuelParsedProduct,
  DuelParsedSpecRow,
} from "./parser.types";
import {
  DUEL_PARSER_PROVIDER_CODE,
  DUEL_PARSER_SCHEMA_VERSION,
  DUEL_SITE_ORIGIN,
} from "./parser.types";

export const DUEL_MAPPER_SCHEMA_VERSION = "1.1.0";

const TROLLING_SPEED_PATTERN =
  /\b([\d.]+)\s*(?:~|–|-|to)\s*([\d.]+)\s*(?:knots?|kt|kn)\b|\b([\d.]+)\s*(?:knots?|kt|kn)\b/i;
const UV_PATTERN = /\buv\b|ultra[\s-]?violet|uv[\s-]?reactive|uv[\s-]?coat/i;
const GLOW_PATTERN = /\bglow\b|luminous|phosphor|fluorescent|夜光/i;
const HOLOGRAPHIC_PATTERN = /\bholographic\b|ホログラフィック/i;

const BODY_TYPE_PATTERNS: Array<{ pattern: RegExp; slug: string }> = [
  { pattern: /\bminnow\b|ミノー/i, slug: "minnow" },
  { pattern: /\bstick\s*bait\b|\bpencil\b|ペンシル/i, slug: "stickbait" },
  { pattern: /\bcrank\b|\bshad\b|クランク/i, slug: "crankbait" },
  { pattern: /\bpopper\b|\bpopping\b|ポッパー/i, slug: "popper" },
  { pattern: /\bjerk\s*bait\b|ジャーク/i, slug: "jerkbait" },
  { pattern: /\bswim\s*bait\b|スイム/i, slug: "swimbait" },
  { pattern: /\blipless\b|リップレス/i, slug: "lipless" },
  { pattern: /\bspoon\b|スプーン/i, slug: "spoon" },
  { pattern: /\bjig\b|ジグ/i, slug: "jig" },
  { pattern: /\bspinner\b|スピナー/i, slug: "spinnerbait" },
  { pattern: /\bdeep\s*diver\b|ディープ/i, slug: "minnow" },
  { pattern: /\bsurface\b|サーフェス/i, slug: "stickbait" },
];

const BUOYANCY_SLUGS: Record<string, string> = {
  floating: "floating",
  float: "floating",
  suspending: "suspending",
  suspend: "suspending",
  suspension: "suspending",
  sinking: "sinking",
  sink: "sinking",
  "slow sinking": "slow-sinking",
  "fast sinking": "fast-sinking",
  "semi-sinking": "semi-sinking",
  "neutral buoyancy": "neutral",
};

const TECHNIQUE_PATTERNS: Array<{ pattern: RegExp; slug: string }> = [
  { pattern: /\btrolling\b|トローリング/i, slug: "trolling" },
  { pattern: /\bpopp(?:ing|er)\b|ポッピング|ポップ/i, slug: "popping" },
  { pattern: /\bjigging\b|ジギング/i, slug: "jigging" },
  { pattern: /\bcrank(?:bait|ing)?\b|クランク/i, slug: "crankbait" },
  { pattern: /\bcasting\b|キャス(?:ティング)?/i, slug: "casting" },
  { pattern: /\bshore\b|ショア/i, slug: "shore-fishing" },
  { pattern: /\boffshore\b|オフショア/i, slug: "offshore" },
  { pattern: /\btrolling\s*lure\b/i, slug: "trolling" },
  { pattern: /\btop\s*water\b|トップウォーター/i, slug: "topwater" },
  { pattern: /\bvertical\b|バーティカル/i, slug: "vertical-jigging" },
  { pattern: /\bsurface\b|サーフェス/i, slug: "surface" },
];

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

function extractCategoryIdFromUrl(url: string): string {
  try {
    return new URL(url).searchParams.get("category") ?? "";
  } catch {
    return "";
  }
}

/** Normalize manufacturer color codes to uppercase alphanumeric tokens. */
export function normalizeColorCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/** Strip trailing dashes and whitespace from DUEL CAT.NO. prefixes. */
export function normalizeCatalogCode(code: string): string {
  return code.trim().replace(/-+\s*$/, "").replace(/\s+/g, "");
}

/** Build variant SKU from spec prefix + color code (DUEL convention). */
export function buildManufacturerSku(
  catalogPrefix: string,
  colorCode: string,
): string | undefined {
  const prefix = normalizeCatalogCode(catalogPrefix);
  const color = normalizeColorCode(colorCode);
  if (!prefix || !color) {
    return undefined;
  }
  return `${prefix}${color}`;
}

/** Parse length from DUEL size labels (mm, cm, in). */
export function normalizeLengthMm(
  sizeLabel: string,
  parsedMm?: number,
): number | undefined {
  if (parsedMm !== undefined && Number.isFinite(parsedMm)) {
    return Math.round(parsedMm);
  }

  const trimmed = sizeLabel.trim();
  if (!trimmed) {
    return undefined;
  }

  const mmMatch = trimmed.match(/([\d.]+)\s*mm/i);
  if (mmMatch) {
    return Math.round(Number.parseFloat(mmMatch[1]));
  }

  const cmMatch = trimmed.match(/([\d.]+)\s*cm/i);
  if (cmMatch) {
    return Math.round(Number.parseFloat(cmMatch[1]) * 10);
  }

  const inMatch = trimmed.match(/([\d.]+)\s*(?:in|inch|")/i);
  if (inMatch) {
    return Math.round(Number.parseFloat(inMatch[1]) * 25.4);
  }

  return undefined;
}

/** Parse weight from DUEL spec cells (g, oz). */
export function normalizeWeightG(
  weightLabel: string,
  parsedG?: number,
): number | undefined {
  if (parsedG !== undefined && Number.isFinite(parsedG)) {
    return Math.round(parsedG);
  }

  const trimmed = weightLabel.trim();
  if (!trimmed) {
    return undefined;
  }

  const gMatch = trimmed.match(/([\d.]+)\s*g(?:ram)?s?\b/i);
  if (gMatch) {
    return Math.round(Number.parseFloat(gMatch[1]));
  }

  const ozMatch = trimmed.match(/([\d.]+)\s*oz/i);
  if (ozMatch) {
    return Math.round(Number.parseFloat(ozMatch[1]) * 28.3495);
  }

  return undefined;
}

/** Convert DUEL RANGE labels to canonical diving depth in meters. */
export function normalizeDivingDepth(
  rangeLabel: string,
  divingDepthCm?: number,
): CanonicalDivingDepth | undefined {
  const trimmed = rangeLabel.trim();
  const surfacePattern = /^(surface|top|floating|—|-)$/i;

  if (!trimmed && divingDepthCm === undefined) {
    return undefined;
  }

  if (surfacePattern.test(trimmed)) {
    return {
      minMeters: 0,
      maxMeters: 0,
      manufacturerLabel: localized(trimmed || "Surface"),
    };
  }

  const rangeMeters = trimmed.match(
    /([\d.]+)\s*(?:~|–|-|to)\s*([\d.]+)\s*(m|cm|meter|meters|metre|metres)?/i,
  );
  if (rangeMeters) {
    const unit = (rangeMeters[3] ?? "m").toLowerCase();
    const factor = unit.startsWith("c") ? 0.01 : 1;
    const min = Number.parseFloat(rangeMeters[1]) * factor;
    const max = Number.parseFloat(rangeMeters[2]) * factor;
    return {
      minMeters: min,
      maxMeters: max,
      manufacturerLabel: localized(trimmed),
    };
  }

  const singleM = trimmed.match(/([\d.]+)\s*m(?:eter)?s?\b/i);
  if (singleM) {
    const meters = Number.parseFloat(singleM[1]);
    return {
      minMeters: meters,
      maxMeters: meters,
      manufacturerLabel: localized(trimmed),
    };
  }

  const singleCm = trimmed.match(/([\d.]+)\s*cm/i);
  if (singleCm) {
    const meters = Number.parseFloat(singleCm[1]) / 100;
    return {
      minMeters: meters,
      maxMeters: meters,
      manufacturerLabel: localized(trimmed),
    };
  }

  if (divingDepthCm !== undefined) {
    const meters = divingDepthCm / 100;
    return {
      minMeters: meters,
      maxMeters: meters,
      manufacturerLabel: localized(trimmed),
    };
  }

  return trimmed ? { manufacturerLabel: localized(trimmed) } : undefined;
}

/** Map DUEL TYPE column values to platform buoyancy slugs. */
export function normalizeBuoyancy(typeLabel: string): CanonicalBuoyancy | undefined {
  const trimmed = typeLabel.trim();
  if (!trimmed) {
    return undefined;
  }

  const key = trimmed.toLowerCase().replace(/\s+/g, " ");
  const slug = BUOYANCY_SLUGS[key] ?? slugify(trimmed);

  return {
    slug,
    manufacturerTerm: trimmed,
    label: localized(trimmed),
  };
}

/** Infer compatible techniques from DUEL categories, copy, and features. */
export function normalizeTechniqueTags(product: DuelParsedProduct): CanonicalTag[] {
  const corpus = [
    ...product.categories,
    product.productLineName,
    product.productName,
    product.description,
    ...product.featureBullets,
    ...product.features.map((feature) => `${feature.title} ${feature.text}`),
  ]
    .join("\n")
    .toLowerCase();

  const slugs = new Set<string>();

  for (const { pattern, slug } of TECHNIQUE_PATTERNS) {
    if (pattern.test(corpus)) {
      slugs.add(slug);
    }
  }

  return [...slugs].map((value) => ({
    kind: "technique" as const,
    value,
    locale: "en" as const,
  }));
}

/** Map technique tags to explicit canonical technique references. */
export function normalizeTechniqueRefs(tags: CanonicalTag[]): CanonicalTechniqueRef[] {
  const slugs = new Set<string>();

  for (const tag of tags) {
    if (tag.kind === "technique" && tag.value.trim()) {
      slugs.add(tag.value.trim().toLowerCase());
    }
  }

  return [...slugs].map((slug) => ({
    slug,
    label: localized(slug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")),
  }));
}

/** Infer hard-bait body type from DUEL categories and product line. */
export function normalizeBodyType(product: DuelParsedProduct): CanonicalBodyType | undefined {
  const corpus = [
    ...product.categories,
    product.productLineName,
    product.productName,
    product.description,
  ].join("\n");

  for (const { pattern, slug } of BODY_TYPE_PATTERNS) {
    if (pattern.test(corpus)) {
      const term = corpus.match(pattern)?.[0]?.trim();
      return {
        slug,
        manufacturerTerm: term,
        label: localized(term ?? slug),
      };
    }
  }

  return undefined;
}

/** Infer factory coating from marketing copy and color tags. */
export function normalizeCoatingType(product: DuelParsedProduct): CanonicalCoatingType | undefined {
  const corpus = [
    product.description,
    ...product.featureBullets,
    ...product.features.map((feature) => `${feature.title} ${feature.text}`),
    ...product.colors.flatMap((color) => [color.name, ...color.tags]),
  ].join("\n");

  if (UV_PATTERN.test(corpus)) {
    return {
      slug: "uv-reactive",
      manufacturerTerm: "UV",
      label: localized("UV-reactive"),
    };
  }

  if (GLOW_PATTERN.test(corpus)) {
    return {
      slug: "glow",
      manufacturerTerm: "Glow",
      label: localized("Glow"),
    };
  }

  if (HOLOGRAPHIC_PATTERN.test(corpus)) {
    return {
      slug: "holographic",
      manufacturerTerm: "Holographic",
      label: localized("Holographic"),
    };
  }

  return undefined;
}

/** Parse factory trolling speed range from DUEL marketing copy. */
export function normalizeTrollingSpeed(product: DuelParsedProduct): CanonicalTrollingSpeedRange | undefined {
  const corpus = [
    product.description,
    ...product.featureBullets,
    ...product.features.map((feature) => `${feature.title} ${feature.text}`),
  ].join("\n");

  const rangeMatch = corpus.match(TROLLING_SPEED_PATTERN);
  if (!rangeMatch) {
    return undefined;
  }

  if (rangeMatch[1] && rangeMatch[2]) {
    const minKnots = Number.parseFloat(rangeMatch[1]);
    const maxKnots = Number.parseFloat(rangeMatch[2]);
    if (Number.isFinite(minKnots) && Number.isFinite(maxKnots)) {
      return {
        minKnots: Math.min(minKnots, maxKnots),
        maxKnots: Math.max(minKnots, maxKnots),
        manufacturerLabel: localized(rangeMatch[0]),
      };
    }
  }

  if (rangeMatch[3]) {
    const knots = Number.parseFloat(rangeMatch[3]);
    if (Number.isFinite(knots)) {
      return {
        minKnots: knots,
        maxKnots: knots,
        manufacturerLabel: localized(rangeMatch[0]),
      };
    }
  }

  return undefined;
}

function normalizeSize(row: DuelParsedSpecRow): CanonicalSize | undefined {
  const lengthMm = normalizeLengthMm(row.sizeLabel, row.lengthMm);
  if (lengthMm === undefined) {
    return undefined;
  }

  return {
    lengthMm,
    label: row.sizeLabel ? localized(row.sizeLabel) : undefined,
  };
}

function normalizeWeight(row: DuelParsedSpecRow): CanonicalWeight | undefined {
  const weightG = normalizeWeightG("", row.weightG);
  if (weightG === undefined) {
    return undefined;
  }

  return { weightG };
}

function normalizeColor(color: DuelParsedColor): CanonicalColor {
  const code = normalizeColorCode(color.code);
  const aliases = color.tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => ({
      kind: "marketing_name",
      value: tag,
      locale: "en",
    }));

  return {
    code,
    name: localized(color.name || code),
    aliases: aliases.length > 0 ? aliases : undefined,
  };
}

function normalizeHookConfig(row: DuelParsedSpecRow): CanonicalHookConfiguration | undefined {
  if (!row.hook && !row.ring) {
    return undefined;
  }

  return {
    hookSize: row.hook?.trim(),
    configuration: row.ring ? `Ring ${row.ring.trim()}` : undefined,
    factoryDefault: true,
  };
}

function normalizeModelImages(product: DuelParsedProduct): CanonicalImage[] {
  const seen = new Set<string>();
  const images: CanonicalImage[] = [];

  const push = (image: CanonicalImage) => {
    if (seen.has(image.url)) {
      return;
    }
    seen.add(image.url);
    images.push(image);
  };

  product.heroImageUrls.forEach((url, index) => {
    push({
      url,
      role: index === 0 ? "hero" : "gallery",
      sortOrder: index,
    });
  });

  product.featureImageUrls.forEach((url, index) => {
    push({
      url,
      role: "technical_diagram",
      sortOrder: product.heroImageUrls.length + index,
    });
  });

  return images;
}

function normalizeVariantImages(color: DuelParsedColor): CanonicalImage[] {
  if (!color.imageUrl) {
    return [];
  }

  const code = normalizeColorCode(color.code);
  return [
    {
      url: color.imageUrl,
      role: "product",
      colorCode: code,
      alt: localized(color.name),
    },
  ];
}

function normalizeExternalIdentifiers(
  catalogPrefix: string,
  colorCode: string,
  janSku: DuelParsedProduct["janSku"],
): CanonicalExternalIdentifier[] {
  const identifiers: CanonicalExternalIdentifier[] = [];
  const sku = buildManufacturerSku(catalogPrefix, colorCode);

  if (sku) {
    identifiers.push({ scheme: "manufacturer_sku", value: sku });
  }

  const prefix = normalizeCatalogCode(catalogPrefix);
  const normalizedColor = normalizeColorCode(colorCode);

  const janEntry = janSku.find((entry) => {
    const entryColor = entry.colorCode?.toUpperCase();
    const entryCatalog = normalizeCatalogCode(entry.catalogNumber);
    return (
      (entryColor && entryColor === normalizedColor) ||
      (prefix && entryCatalog.startsWith(prefix))
    );
  });

  if (janEntry) {
    const scheme = janEntry.value.length === 12 ? "upc" : "ean";
    identifiers.push({ scheme, value: janEntry.value });
  }

  return identifiers;
}

function normalizeModelProductCodes(codes: string[]): string[] {
  return [...new Set(codes.map(normalizeCatalogCode).filter(Boolean))];
}

function buildCategoryTags(categories: string[]): CanonicalTag[] {
  return categories.map((category) => ({
    kind: "search" as const,
    value: slugify(category),
    locale: "en" as const,
  }));
}

function dedupeSizes(sizes: CanonicalSize[]): CanonicalSize[] {
  const byLength = new Map<number, CanonicalSize>();
  for (const size of sizes) {
    if (size.lengthMm !== undefined) {
      byLength.set(size.lengthMm, size);
    }
  }
  return [...byLength.values()];
}

function dedupeWeights(weights: CanonicalWeight[]): CanonicalWeight[] {
  const byWeight = new Map<number, CanonicalWeight>();
  for (const weight of weights) {
    if (weight.weightG !== undefined) {
      byWeight.set(weight.weightG, weight);
    }
  }
  return [...byWeight.values()];
}

/**
 * Map intermediate DUEL parse output to {@link CanonicalLureImport}.
 *
 * Normalizes length, weight, diving depth, buoyancy, technique tags, colors,
 * images, and product codes before emitting the canonical DTO.
 */
export function mapDuelProductToCanonical(
  product: DuelParsedProduct,
  category?: DuelParsedCategory,
): CanonicalLureImport {
  const modelSlug = slugify(product.productName);
  const productLineSlug = slugify(
    product.productLineName || product.categories.at(-1) || "duel",
  );
  const productCodes = normalizeModelProductCodes(product.productCodes);
  const techniqueTags = normalizeTechniqueTags(product);
  const techniqueRefs = normalizeTechniqueRefs(techniqueTags);
  const bodyType = normalizeBodyType(product);
  const coatingType = normalizeCoatingType(product);
  const trollingSpeed = normalizeTrollingSpeed(product);

  const modelTags: CanonicalTag[] = [
    { kind: "marketing", value: product.brand, locale: "en" },
    ...buildCategoryTags(product.categories),
    ...techniqueTags,
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

  const specRows =
    product.specRows.length > 0 ? product.specRows : [{} as DuelParsedSpecRow];
  const colors =
    product.colors.length > 0
      ? product.colors
      : [{ code: "DEFAULT", name: "Default", tags: [] }];

  const variants: CanonicalLureVariant[] = [];

  for (const spec of specRows) {
    for (const color of colors) {
      const normalizedColor = normalizeColor(color);
      const size = normalizeSize(spec);
      const weight = normalizeWeight(spec);
      const hook = normalizeHookConfig(spec);
      const lengthMm = normalizeLengthMm(spec.sizeLabel, spec.lengthMm);
      const variantSlug = slugify(
        `${normalizedColor.code}-${lengthMm ?? (spec.sizeLabel || "std")}`,
      );
      const manufacturerSku = buildManufacturerSku(
        spec.catalogNumberPrefix,
        normalizedColor.code,
      );
      const variantImages = normalizeVariantImages(color);

      variants.push({
        slug: variantSlug,
        name: localized(
          [spec.sizeLabel, color.name].filter(Boolean).join(" · ") ||
            product.productName,
        ),
        sku: manufacturerSku,
        colors: [normalizedColor],
        sizes: size ? [size] : undefined,
        weights: weight ? [weight] : undefined,
        divingDepth: normalizeDivingDepth(
          spec.rangeLabel ?? "",
          spec.divingDepthCm,
        ),
        buoyancy: spec.type ? normalizeBuoyancy(spec.type) : undefined,
        hooks: hook ? [hook] : undefined,
        images: variantImages.length > 0 ? variantImages : undefined,
        externalIdentifiers: normalizeExternalIdentifiers(
          spec.catalogNumberPrefix,
          normalizedColor.code,
          product.janSku,
        ),
        tags: color.tags.map((tag) => ({
          kind: "marketing" as const,
          value: tag,
          locale: "en" as const,
        })),
      });
    }
  }

  const primarySpec = product.specRows[0];
  const modelSizes = dedupeSizes(
    product.specRows
      .map((row) => normalizeSize(row))
      .filter((size): size is CanonicalSize => Boolean(size)),
  );
  const modelWeights = dedupeWeights(
    product.specRows
      .map((row) => normalizeWeight(row))
      .filter((weight): weight is CanonicalWeight => Boolean(weight)),
  );

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
      name: localized(
        product.productLineName || category?.categoryName || "DUEL",
      ),
    },
    model: {
      slug: modelSlug,
      name: localized(product.productName),
      modelCode: productCodes[0] || undefined,
      description: localized(product.description),
      formFactorTerm: product.productLineName || undefined,
      bodyType,
      coatingType,
      trollingSpeed,
      techniques: techniqueRefs.length > 0 ? techniqueRefs : undefined,
      sizes: modelSizes.length > 0 ? modelSizes : undefined,
      weights: modelWeights.length > 0 ? modelWeights : undefined,
      divingDepth: primarySpec
        ? normalizeDivingDepth(
            primarySpec.rangeLabel ?? "",
            primarySpec.divingDepthCm,
          )
        : undefined,
      buoyancy: primarySpec?.type
        ? normalizeBuoyancy(primarySpec.type)
        : undefined,
      hooks: product.specRows
        .map((row) => normalizeHookConfig(row))
        .filter((hook): hook is CanonicalHookConfiguration => Boolean(hook)),
      images: normalizeModelImages(product),
      tags: modelTags,
      externalIdentifiers: productCodes[0]
        ? [{ scheme: "manufacturer_sku", value: productCodes[0] }]
        : undefined,
    },
    variants,
    tags: techniqueTags.length > 0 ? techniqueTags : undefined,
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
        mapperSchemaVersion: DUEL_MAPPER_SCHEMA_VERSION,
        brand: product.brand,
        locale: product.locale,
        breadcrumbs: product.breadcrumbs,
        categories: product.categories,
        categoryId: extractCategoryIdFromUrl(category?.sourceUrl ?? ""),
        availableSizes: product.availableSizes,
        availableColors: product.availableColors.map(normalizeColorCode),
        productCodes,
        specifications: product.specRows,
        featureBlocks: product.features,
        categoryListing: category?.products ?? [],
        janSkuMissing: product.janSku.length === 0,
        normalizedTechniques: techniqueTags.map((tag) => tag.value),
        bodyTypeSlug: bodyType?.slug,
        coatingTypeSlug: coatingType?.slug,
        trollingSpeed,
      },
    },
    importedAt: new Date().toISOString(),
  };
}

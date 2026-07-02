import type {
  CanonicalBuoyancy,
  CanonicalColor,
  CanonicalDivingDepth,
  CanonicalImage,
  CanonicalLocalizedText,
  CanonicalLureImport,
  CanonicalLureVariant,
  CanonicalSize,
  CanonicalTag,
  CanonicalWeight,
} from "../core/canonical-lure";
import type { ImportIssue } from "../core/types";
import type {
  ValidationRuleCatalog,
  ValidationRuleDescriptor,
} from "./record-validator";

/** Platform validation outcome for a single {@link CanonicalLureImport} record. */
export interface CanonicalLureValidationResult {
  /** Blocking issues — record must not persist when present. */
  errors: ImportIssue[];
  /** Non-blocking gaps — record may persist as draft. */
  warnings: ImportIssue[];
  /** Input after platform normalization (trim, dedupe, inheritance). */
  normalized: CanonicalLureImport;
  /** True when {@link errors} is empty. */
  valid: boolean;
}

export interface CanonicalLureValidationOptions {
  recordKey?: string;
  /** When true, missing optional fields do not emit warnings. */
  suppressOptionalWarnings?: boolean;
}

const UV_PATTERN = /\buv\b|ultra[\s-]?violet|uv[\s-]?reactive|uv[\s-]?coat/i;
const GLOW_PATTERN = /\bglow\b|luminous|phosphor|fluorescent|夜光/i;
const TROLLING_SPEED_PATTERN =
  /\b([\d.]+)\s*(?:~|–|-|to)\s*([\d.]+)\s*(?:knots?|kt|kn)\b|\b([\d.]+)\s*(?:knots?|kt|kn)\b/i;

export const CANONICAL_LURE_VALIDATION_RULES: ValidationRuleDescriptor[] = [
  {
    code: "CANONICAL_MANUFACTURER",
    description: "Manufacturer slug and localized name are required.",
    required: true,
    fieldPath: "manufacturer",
  },
  {
    code: "CANONICAL_MODEL_NAME",
    description: "Model slug and localized name are required.",
    required: true,
    fieldPath: "model.name",
  },
  {
    code: "CANONICAL_VARIANTS",
    description: "At least one variant is required.",
    required: true,
    fieldPath: "variants",
  },
  {
    code: "CANONICAL_LENGTH",
    description: "Each variant must resolve a length (variant or model scope).",
    required: true,
    fieldPath: "variants[].sizes",
  },
  {
    code: "CANONICAL_WEIGHT",
    description: "Each variant must resolve a weight (variant or model scope).",
    required: true,
    fieldPath: "variants[].weights",
  },
  {
    code: "CANONICAL_LURE_TYPE",
    description: "Lure form factor (slug or term) is required on the model.",
    required: true,
    fieldPath: "model.formFactorSlug",
  },
  {
    code: "CANONICAL_BUOYANCY",
    description: "Buoyancy class is required on the model or each variant.",
    required: true,
    fieldPath: "model.buoyancy",
  },
  {
    code: "CANONICAL_IMAGES",
    description: "At least one image URL is required on the model or variants.",
    required: true,
    fieldPath: "model.images",
  },
  {
    code: "CANONICAL_DIVING_DEPTH",
    description: "Factory diving depth improves publish readiness.",
    required: false,
    fieldPath: "model.divingDepth",
  },
  {
    code: "CANONICAL_TECHNIQUE",
    description: "Compatible technique tags aid discovery.",
    required: false,
    fieldPath: "tags",
  },
  {
    code: "CANONICAL_COLORS",
    description: "Manufacturer color codes improve variant identity.",
    required: false,
    fieldPath: "variants[].colors",
  },
  {
    code: "CANONICAL_UV",
    description: "UV-reactive finish noted in color or marketing copy.",
    required: false,
    fieldPath: "variants[].colors",
  },
  {
    code: "CANONICAL_GLOW",
    description: "Glow or luminous finish noted in color or marketing copy.",
    required: false,
    fieldPath: "variants[].colors",
  },
  {
    code: "CANONICAL_TROLLING_SPEED",
    description: "Factory trolling speed range when trolling technique applies.",
    required: false,
    fieldPath: "model.tags",
  },
  {
    code: "CANONICAL_PRODUCT_CODE",
    description: "Manufacturer SKU or model code aids idempotent upsert.",
    required: false,
    fieldPath: "model.modelCode",
  },
];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pickLocalizedText(text: CanonicalLocalizedText | undefined): string | undefined {
  if (!text) {
    return undefined;
  }

  for (const candidate of [text.en, text.tr, text.default]) {
    if (isNonEmptyString(candidate)) {
      return candidate.trim();
    }
  }

  return undefined;
}

function normalizeLocalizedText(
  text: CanonicalLocalizedText | undefined,
): CanonicalLocalizedText | undefined {
  if (!text) {
    return undefined;
  }

  const normalized: CanonicalLocalizedText = {};
  if (isNonEmptyString(text.en)) {
    normalized.en = text.en.trim();
  }
  if (isNonEmptyString(text.tr)) {
    normalized.tr = text.tr.trim();
  }
  if (isNonEmptyString(text.default)) {
    normalized.default = text.default.trim();
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function hasNumericLength(sizes: CanonicalSize[] | undefined): boolean {
  return (
    sizes?.some(
      (size) =>
        (size.lengthMm !== undefined && size.lengthMm > 0) ||
        (size.lengthCm !== undefined && size.lengthCm > 0) ||
        (size.lengthIn !== undefined && size.lengthIn > 0) ||
        (size.value !== undefined &&
          size.value > 0 &&
          (size.unit === "mm" || size.unit === "cm" || size.unit === "in")),
    ) ?? false
  );
}

function hasNumericWeight(weights: CanonicalWeight[] | undefined): boolean {
  return (
    weights?.some(
      (weight) =>
        (weight.weightG !== undefined && weight.weightG > 0) ||
        (weight.weightOz !== undefined && weight.weightOz > 0) ||
        (weight.value !== undefined &&
          weight.value > 0 &&
          (weight.unit === "g" || weight.unit === "oz")),
    ) ?? false
  );
}

function hasBuoyancyClass(buoyancy: CanonicalBuoyancy | undefined): boolean {
  if (!buoyancy) {
    return false;
  }

  return (
    isNonEmptyString(buoyancy.slug) ||
    isNonEmptyString(buoyancy.manufacturerTerm) ||
    Boolean(pickLocalizedText(buoyancy.label))
  );
}

function hasDivingDepth(depth: CanonicalDivingDepth | undefined): boolean {
  if (!depth) {
    return false;
  }

  return (
    depth.minMeters !== undefined ||
    depth.maxMeters !== undefined ||
    depth.ratedDepthMeters !== undefined ||
    depth.range?.min !== undefined ||
    depth.range?.max !== undefined ||
    Boolean(pickLocalizedText(depth.manufacturerLabel))
  );
}

function collectTags(record: CanonicalLureImport): CanonicalTag[] {
  return [
    ...(record.tags ?? []),
    ...(record.model.tags ?? []),
    ...record.variants.flatMap((variant) => variant.tags ?? []),
  ];
}

function hasTechniqueTag(record: CanonicalLureImport): boolean {
  return collectTags(record).some((tag) => tag.kind === "technique");
}

function hasTrollingTechnique(record: CanonicalLureImport): boolean {
  return collectTags(record).some(
    (tag) =>
      tag.kind === "technique" &&
      /trolling|offshore-trolling/i.test(tag.value),
  );
}

function hasTrollingSpeedClaim(record: CanonicalLureImport): boolean {
  const corpus = [
    record.model.description ? pickLocalizedText(record.model.description) : "",
    JSON.stringify(record.metadata.extras ?? {}),
    ...collectTags(record).map((tag) => tag.value),
  ].join("\n");

  return TROLLING_SPEED_PATTERN.test(corpus);
}

function hasProductCode(record: CanonicalLureImport): boolean {
  if (isNonEmptyString(record.model.modelCode)) {
    return true;
  }

  const modelIds = record.model.externalIdentifiers ?? [];
  if (
    modelIds.some(
      (identifier) =>
        identifier.scheme === "manufacturer_sku" && isNonEmptyString(identifier.value),
    )
  ) {
    return true;
  }

  return record.variants.some(
    (variant) =>
      isNonEmptyString(variant.sku) ||
      (variant.externalIdentifiers ?? []).some(
        (identifier) =>
          identifier.scheme === "manufacturer_sku" &&
          isNonEmptyString(identifier.value),
      ),
  );
}

function collectImageUrls(record: CanonicalLureImport): string[] {
  const urls = new Set<string>();

  for (const image of record.model.images ?? []) {
    if (isNonEmptyString(image.url)) {
      urls.add(image.url.trim());
    }
  }

  for (const variant of record.variants) {
    for (const image of variant.images ?? []) {
      if (isNonEmptyString(image.url)) {
        urls.add(image.url.trim());
      }
    }
  }

  return [...urls];
}

function hasLureType(record: CanonicalLureImport): boolean {
  const model = record.model;
  if (isNonEmptyString(model.formFactorSlug) || isNonEmptyString(model.formFactorTerm)) {
    return true;
  }

  return collectTags(record).some((tag) => tag.kind === "form_factor");
}

function colorCorpus(color: CanonicalColor): string {
  const parts = [
    color.code,
    pickLocalizedText(color.name),
    ...(color.aliases ?? []).map((alias) => alias.value),
  ];
  return parts.filter(isNonEmptyString).join(" ");
}

function hasUvClaim(record: CanonicalLureImport): boolean {
  for (const variant of record.variants) {
    for (const color of variant.colors ?? []) {
      if (UV_PATTERN.test(colorCorpus(color))) {
        return true;
      }
    }
  }

  return collectTags(record).some((tag) => UV_PATTERN.test(tag.value));
}

function hasGlowClaim(record: CanonicalLureImport): boolean {
  for (const variant of record.variants) {
    for (const color of variant.colors ?? []) {
      if (GLOW_PATTERN.test(colorCorpus(color))) {
        return true;
      }
    }
  }

  return collectTags(record).some((tag) => GLOW_PATTERN.test(tag.value));
}

function hasMeaningfulColors(variant: CanonicalLureVariant): boolean {
  return (
    variant.colors?.some(
      (color) =>
        isNonEmptyString(color.code) &&
        color.code.trim().toUpperCase() !== "DEFAULT",
    ) ?? false
  );
}

function hasDivingDepthOnRecord(record: CanonicalLureImport): boolean {
  if (hasDivingDepth(record.model.divingDepth)) {
    return true;
  }

  return record.variants.some((variant) => hasDivingDepth(variant.divingDepth));
}

function normalizeColor(color: CanonicalColor): CanonicalColor {
  return {
    ...color,
    code: color.code.trim().toUpperCase(),
    name: normalizeLocalizedText(color.name) ?? { default: color.code.trim().toUpperCase() },
    aliases: color.aliases
      ?.map((alias) => ({
        ...alias,
        value: alias.value.trim(),
      }))
      .filter((alias) => alias.value.length > 0),
  };
}

function normalizeImages(images: CanonicalImage[] | undefined): CanonicalImage[] | undefined {
  if (!images?.length) {
    return undefined;
  }

  const seen = new Set<string>();
  const normalized: CanonicalImage[] = [];

  for (const image of images) {
    const url = image.url.trim();
    if (!url || seen.has(url)) {
      continue;
    }

    seen.add(url);
    normalized.push({
      ...image,
      url,
      alt: normalizeLocalizedText(image.alt),
      colorCode: image.colorCode?.trim().toUpperCase(),
    });
  }

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeTags(tags: CanonicalTag[] | undefined): CanonicalTag[] | undefined {
  if (!tags?.length) {
    return undefined;
  }

  const seen = new Set<string>();
  const normalized: CanonicalTag[] = [];

  for (const tag of tags) {
    const value = tag.value.trim();
    if (!value) {
      continue;
    }

    const key = `${tag.kind}:${value.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push({ ...tag, value });
  }

  return normalized.length > 0 ? normalized : undefined;
}

function inheritVariantAttributes(
  variant: CanonicalLureVariant,
  model: CanonicalLureImport["model"],
): CanonicalLureVariant {
  return {
    ...variant,
    sizes: hasNumericLength(variant.sizes)
      ? variant.sizes
      : model.sizes?.length
        ? model.sizes
        : variant.sizes,
    weights: hasNumericWeight(variant.weights)
      ? variant.weights
      : model.weights?.length
        ? model.weights
        : variant.weights,
    buoyancy: hasBuoyancyClass(variant.buoyancy)
      ? variant.buoyancy
      : model.buoyancy,
    divingDepth: hasDivingDepth(variant.divingDepth)
      ? variant.divingDepth
      : model.divingDepth,
  };
}

/** Apply platform normalization without mutating the input record. */
export function normalizeCanonicalLureImport(
  input: CanonicalLureImport,
): CanonicalLureImport {
  const formFactorTerm = isNonEmptyString(input.model.formFactorTerm)
    ? input.model.formFactorTerm.trim()
    : undefined;
  const formFactorSlug = isNonEmptyString(input.model.formFactorSlug)
    ? slugify(input.model.formFactorSlug)
    : formFactorTerm
      ? slugify(formFactorTerm)
      : undefined;

  const normalizedModel = {
    ...input.model,
    slug: slugify(input.model.slug || pickLocalizedText(input.model.name) || "model"),
    name:
      normalizeLocalizedText(input.model.name) ??
      ({ default: "Unnamed Model" } satisfies CanonicalLocalizedText),
    modelCode: input.model.modelCode?.trim(),
    description: normalizeLocalizedText(input.model.description),
    formFactorTerm,
    formFactorSlug,
    sizes: input.model.sizes,
    weights: input.model.weights,
    images: normalizeImages(input.model.images),
    tags: normalizeTags(input.model.tags),
  };

  const normalizedVariants = input.variants.map((variant) => {
    const enriched = inheritVariantAttributes(variant, normalizedModel);
    return {
      ...enriched,
      slug: slugify(enriched.slug || pickLocalizedText(enriched.name) || "variant"),
      name:
        normalizeLocalizedText(enriched.name) ??
        ({ default: "Unnamed Variant" } satisfies CanonicalLocalizedText),
      sku: enriched.sku?.trim(),
      colors: enriched.colors.map(normalizeColor),
      images: normalizeImages(enriched.images),
      tags: normalizeTags(enriched.tags),
    };
  });

  return {
    ...input,
    recordKey: input.recordKey.trim(),
    manufacturer: {
      ...input.manufacturer,
      slug: slugify(input.manufacturer.slug || pickLocalizedText(input.manufacturer.name) || "manufacturer"),
      name:
        normalizeLocalizedText(input.manufacturer.name) ??
        ({ default: input.manufacturer.slug } satisfies CanonicalLocalizedText),
      website: input.manufacturer.website?.trim(),
    },
    productLine: {
      ...input.productLine,
      slug: slugify(
        input.productLine.slug ||
          pickLocalizedText(input.productLine.name) ||
          "product-line",
      ),
      name:
        normalizeLocalizedText(input.productLine.name) ??
        ({ default: "Product Line" } satisfies CanonicalLocalizedText),
      description: normalizeLocalizedText(input.productLine.description),
    },
    model: normalizedModel,
    variants: normalizedVariants,
    tags: normalizeTags(input.tags),
    source: {
      ...input.source,
      url: input.source.url.trim(),
      type: input.source.type,
      documentTitle: input.source.documentTitle?.trim(),
    },
  };
}

function pushError(
  issues: ImportIssue[],
  code: string,
  message: string,
  fieldPath: string,
  recordKey?: string,
): void {
  issues.push({
    code,
    severity: "error",
    message,
    fieldPath,
    recordKey,
  });
}

function pushWarning(
  issues: ImportIssue[],
  code: string,
  message: string,
  fieldPath: string,
  recordKey?: string,
): void {
  issues.push({
    code,
    severity: "warning",
    message,
    fieldPath,
    recordKey,
  });
}

/**
 * Validate a {@link CanonicalLureImport} against platform publish requirements.
 * Does not write to the database.
 */
export function validateCanonicalLureImport(
  input: CanonicalLureImport,
  options: CanonicalLureValidationOptions = {},
): CanonicalLureValidationResult {
  const normalized = normalizeCanonicalLureImport(input);
  const recordKey = options.recordKey ?? normalized.recordKey;
  const errors: ImportIssue[] = [];
  const warnings: ImportIssue[] = [];

  if (!isNonEmptyString(normalized.recordKey)) {
    pushError(errors, "CANONICAL_MISSING_RECORD_KEY", "recordKey is required", "recordKey", recordKey);
  }

  if (!isNonEmptyString(normalized.manufacturer.slug)) {
    pushError(
      errors,
      "CANONICAL_MANUFACTURER_SLUG",
      "Manufacturer slug is required",
      "manufacturer.slug",
      recordKey,
    );
  }

  if (!pickLocalizedText(normalized.manufacturer.name)) {
    pushError(
      errors,
      "CANONICAL_MANUFACTURER_NAME",
      "Manufacturer name requires at least one locale or default",
      "manufacturer.name",
      recordKey,
    );
  }

  if (!isNonEmptyString(normalized.model.slug)) {
    pushError(errors, "CANONICAL_MODEL_SLUG", "Model slug is required", "model.slug", recordKey);
  }

  if (!pickLocalizedText(normalized.model.name)) {
    pushError(
      errors,
      "CANONICAL_MODEL_NAME",
      "Model name requires at least one locale or default",
      "model.name",
      recordKey,
    );
  }

  if (!normalized.variants.length) {
    pushError(
      errors,
      "CANONICAL_VARIANTS",
      "At least one variant is required",
      "variants",
      recordKey,
    );
  }

  if (!hasLureType(normalized)) {
    pushError(
      errors,
      "CANONICAL_LURE_TYPE",
      "Lure type (formFactorSlug, formFactorTerm, or form_factor tag) is required",
      "model.formFactorSlug",
      recordKey,
    );
  }

  if (
    !hasBuoyancyClass(normalized.model.buoyancy) &&
    normalized.variants.some((variant) => !hasBuoyancyClass(variant.buoyancy))
  ) {
    pushError(
      errors,
      "CANONICAL_BUOYANCY",
      "Buoyancy is required on the model or on every variant",
      "model.buoyancy",
      recordKey,
    );
  }

  if (collectImageUrls(normalized).length === 0) {
    pushError(
      errors,
      "CANONICAL_IMAGES",
      "At least one image URL is required on the model or variants",
      "model.images",
      recordKey,
    );
  }

  for (const variant of normalized.variants) {
    const variantPath = `variants[${variant.slug}]`;

    if (!hasNumericLength(variant.sizes)) {
      pushError(
        errors,
        "CANONICAL_LENGTH",
        `Variant "${variant.slug}" is missing length (lengthMm, lengthCm, or lengthIn)`,
        `${variantPath}.sizes`,
        recordKey,
      );
    }

    if (!hasNumericWeight(variant.weights)) {
      pushError(
        errors,
        "CANONICAL_WEIGHT",
        `Variant "${variant.slug}" is missing weight (weightG or weightOz)`,
        `${variantPath}.weights`,
        recordKey,
      );
    }
  }

  if (!options.suppressOptionalWarnings) {
    if (!hasDivingDepthOnRecord(normalized)) {
      pushWarning(
        warnings,
        "CANONICAL_DIVING_DEPTH",
        "Diving depth is not specified",
        "model.divingDepth",
        recordKey,
      );
    }

    if (!hasTechniqueTag(normalized)) {
      pushWarning(
        warnings,
        "CANONICAL_TECHNIQUE",
        "No technique tags are present",
        "tags",
        recordKey,
      );
    }

    if (normalized.variants.some((variant) => !hasMeaningfulColors(variant))) {
      pushWarning(
        warnings,
        "CANONICAL_COLORS",
        "One or more variants lack manufacturer color codes",
        "variants[].colors",
        recordKey,
      );
    }

    if (!hasUvClaim(normalized)) {
      pushWarning(
        warnings,
        "CANONICAL_UV",
        "UV-reactive finish is not documented",
        "variants[].colors",
        recordKey,
      );
    }

    if (!hasGlowClaim(normalized)) {
      pushWarning(
        warnings,
        "CANONICAL_GLOW",
        "Glow or luminous finish is not documented",
        "variants[].colors",
        recordKey,
      );
    }

    if (hasTrollingTechnique(normalized) && !hasTrollingSpeedClaim(normalized)) {
      pushWarning(
        warnings,
        "CANONICAL_TROLLING_SPEED",
        "Trolling technique is tagged but no factory trolling speed range was found",
        "model.tags",
        recordKey,
      );
    }

    if (!hasProductCode(normalized)) {
      pushWarning(
        warnings,
        "CANONICAL_PRODUCT_CODE",
        "No model code, SKU, or manufacturer_sku identifier is present",
        "model.modelCode",
        recordKey,
      );
    }
  }

  return {
    errors,
    warnings,
    normalized,
    valid: errors.length === 0,
  };
}

/** Validate multiple canonical records; does not write to the database. */
export function validateCanonicalLureImports(
  records: CanonicalLureImport[],
  options: CanonicalLureValidationOptions = {},
): CanonicalLureValidationResult[] {
  return records.map((record) =>
    validateCanonicalLureImport(record, {
      ...options,
      recordKey: options.recordKey ?? record.recordKey,
    }),
  );
}

/** Rule catalog for moderation UI and provider documentation. */
export class CanonicalLureValidator implements ValidationRuleCatalog {
  listRules(): ValidationRuleDescriptor[] {
    return CANONICAL_LURE_VALIDATION_RULES;
  }

  validate(
    record: CanonicalLureImport,
    options?: CanonicalLureValidationOptions,
  ): CanonicalLureValidationResult {
    return validateCanonicalLureImport(record, options);
  }
}

export const canonicalLureValidator = new CanonicalLureValidator();

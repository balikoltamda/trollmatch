/**
 * Canonical import contract for LureAtlas manufacturer ingestion.
 *
 * Manufacturer-neutral DTO that every importer (Halco, Rapala, Yo-Zuri, Maria, Shimano…)
 * maps into before persistence. Aligns with LURE_DOMAIN_MODEL and 007_DATABASE_VISION
 * (LureAtlas Model/Variant, Knowledge Claims, External Identifier Registry, Media Asset).
 *
 * Interfaces only — no runtime implementation in this module.
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** Bilingual text; importers may supply one locale and leave translation to a later job. */
export interface CanonicalLocalizedText {
  en?: string;
  tr?: string;
  /** Fallback when locale is unknown or manufacturer uses a single language. */
  default?: string;
}

/** Numeric range with optional unit for mapper normalization (e.g. depth, speed). */
export interface CanonicalNumericRange {
  min?: number;
  max?: number;
  unit?: string;
}

/** Physical size at model or variant scope. */
export interface CanonicalSize {
  lengthMm?: number;
  lengthCm?: number;
  lengthIn?: number;
  /** Raw value when unit is non-standard; mapper resolves to catalog units. */
  value?: number;
  unit?: "mm" | "cm" | "in" | (string & {});
  label?: CanonicalLocalizedText;
}

/** Weight at model or variant scope. */
export interface CanonicalWeight {
  weightG?: number;
  weightOz?: number;
  value?: number;
  unit?: "g" | "oz" | (string & {});
  label?: CanonicalLocalizedText;
}

/** External commercial identifier for idempotent upsert (007 §5.6). */
export interface CanonicalExternalIdentifier {
  scheme:
    | "upc"
    | "ean"
    | "manufacturer_sku"
    | "retailer_sku"
    | "gtin"
    | (string & {});
  value: string;
  regionCode?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

/** Freeform or typed label for discovery, marketing, or taxonomy mapping. */
export type CanonicalTagKind =
  | "species"
  | "technique"
  | "marketing"
  | "feature"
  | "form_factor"
  | "search"
  | (string & {});

export interface CanonicalTag {
  kind: CanonicalTagKind;
  value: string;
  locale?: "tr" | "en" | "any";
}

/** Origin of imported data — broader than raw file format; used for provenance. */
export type CanonicalImportSourceType =
  | "manufacturer_catalog"
  | "press_kit"
  | "api_feed"
  | "retailer_feed"
  | "website_scrape"
  | "pdf_catalog"
  | "csv_export"
  | "json_export"
  | "xlsx_export"
  | "manual_entry"
  | (string & {});

/** Where this record was observed; required on every canonical import row. */
export interface CanonicalImportSource {
  url: string;
  type: CanonicalImportSourceType;
  documentTitle?: string;
  retrievedAt?: string;
  licenseClass?: string;
}

/** Batch- and row-level trace data; does not replace Provenance Attribution at persist time. */
export interface CanonicalImportMetadata {
  providerCode?: string;
  providerSchemaVersion?: string;
  batchKey?: string;
  idempotencyKey?: string;
  sourceRowNumber?: number;
  sourceRecordId?: string;
  rawRecordHash?: string;
  /** Opaque provider fields preserved for audit and mapper debugging. */
  extras?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Taxonomy-oriented attributes (mapper resolves to platform taxonomy terms)
// ---------------------------------------------------------------------------

/** Factory-rated diving behavior (007 §7.11 Diving Depth Profile). */
export interface CanonicalDivingDepth {
  minMeters?: number;
  maxMeters?: number;
  ratedDepthMeters?: number;
  range?: CanonicalNumericRange;
  lipType?: string;
  sinkRate?: CanonicalNumericRange;
  manufacturerLabel?: CanonicalLocalizedText;
}

/** Buoyancy class (007 §7.10). */
export interface CanonicalBuoyancy {
  /** Platform taxonomy slug when known, e.g. floating, suspending, sinking. */
  slug?: string;
  manufacturerTerm?: string;
  label?: CanonicalLocalizedText;
}

/** Swimming action vocabulary (007 §7.8). */
export interface CanonicalAction {
  slug?: string;
  manufacturerTerm?: string;
  label?: CanonicalLocalizedText;
}

/** Hard-bait body shape (007 §4.5 form factor family). */
export interface CanonicalBodyType {
  slug?: string;
  manufacturerTerm?: string;
  label?: CanonicalLocalizedText;
}

/** Factory finish / coating (UV, glow, holographic, etc.). */
export interface CanonicalCoatingType {
  slug?: string;
  manufacturerTerm?: string;
  label?: CanonicalLocalizedText;
}

/** Manufacturer-rated trolling speed envelope. */
export interface CanonicalTrollingSpeedRange {
  minKnots?: number;
  maxKnots?: number;
  manufacturerLabel?: CanonicalLocalizedText;
}

/** Explicit technique taxonomy slug links (maps to Technique facade). */
export interface CanonicalTechniqueRef {
  slug: string;
  label?: CanonicalLocalizedText;
}

/** Factory hooking specification (007 §8.8 Hook Configuration). */
export interface CanonicalHookConfiguration {
  hookCount?: number;
  hookType?: string;
  hookSize?: string;
  configuration?: string;
  notes?: CanonicalLocalizedText;
  /** True when spec applies to factory default variant setup. */
  factoryDefault?: boolean;
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export type CanonicalImageRole =
  | "hero"
  | "product"
  | "gallery"
  | "packaging"
  | "rigging_diagram"
  | "technical_diagram"
  | (string & {});

export interface CanonicalImage {
  url: string;
  role?: CanonicalImageRole;
  alt?: CanonicalLocalizedText;
  sortOrder?: number;
  colorCode?: string;
}

export type CanonicalVideoRole =
  | "product_demo"
  | "rigging"
  | "action"
  | (string & {});

export interface CanonicalVideo {
  url: string;
  role?: CanonicalVideoRole;
  title?: CanonicalLocalizedText;
  thumbnailUrl?: string;
  durationSeconds?: number;
  sortOrder?: number;
}

// ---------------------------------------------------------------------------
// Catalog hierarchy
// ---------------------------------------------------------------------------

/** Manufacturer organization (007 §8.3). */
export interface CanonicalManufacturer {
  slug: string;
  name: CanonicalLocalizedText;
  countryCode?: string;
  website?: string;
  logoUrl?: string;
  externalIdentifiers?: CanonicalExternalIdentifier[];
}

/** Product line / series grouping (007 §8.5). */
export interface CanonicalProductLine {
  slug: string;
  name: CanonicalLocalizedText;
  description?: CanonicalLocalizedText;
  externalIdentifiers?: CanonicalExternalIdentifier[];
}

/** Color with manufacturer code and aliases (F001 canonical product identity). */
export interface CanonicalColor {
  code: string;
  name: CanonicalLocalizedText;
  patternSlug?: string;
  aliases?: Array<{
    kind: string;
    value: string;
    locale?: string;
  }>;
}

/** LureAtlas Model — canonical design shared by all variants (007 §8.6). */
export interface CanonicalLureModel {
  slug: string;
  name: CanonicalLocalizedText;
  modelCode?: string;
  description?: CanonicalLocalizedText;
  formFactorSlug?: string;
  formFactorTerm?: string;
  bodyType?: CanonicalBodyType;
  sizes?: CanonicalSize[];
  weights?: CanonicalWeight[];
  divingDepth?: CanonicalDivingDepth;
  buoyancy?: CanonicalBuoyancy;
  coatingType?: CanonicalCoatingType;
  trollingSpeed?: CanonicalTrollingSpeedRange;
  techniques?: CanonicalTechniqueRef[];
  actions?: CanonicalAction[];
  hooks?: CanonicalHookConfiguration[];
  images?: CanonicalImage[];
  videos?: CanonicalVideo[];
  tags?: CanonicalTag[];
  externalIdentifiers?: CanonicalExternalIdentifier[];
}

/** LureAtlas Variant — SKU-level release (007 §8.7). */
export interface CanonicalLureVariant {
  slug: string;
  name: CanonicalLocalizedText;
  sku?: string;
  colors: CanonicalColor[];
  sizes?: CanonicalSize[];
  weights?: CanonicalWeight[];
  divingDepth?: CanonicalDivingDepth;
  buoyancy?: CanonicalBuoyancy;
  actions?: CanonicalAction[];
  hooks?: CanonicalHookConfiguration[];
  images?: CanonicalImage[];
  videos?: CanonicalVideo[];
  tags?: CanonicalTag[];
  externalIdentifiers?: CanonicalExternalIdentifier[];
}

// ---------------------------------------------------------------------------
// Root contract
// ---------------------------------------------------------------------------

/**
 * Canonical lure import record — target shape for every manufacturer mapper.
 *
 * Importers may emit one variant per record or multiple variants under one model;
 * validators normalize to platform publish rules before persistence.
 */
export interface CanonicalLureImport {
  /** Stable idempotency key within provider scope (SKU, model+color code, feed row id). */
  recordKey: string;

  manufacturer: CanonicalManufacturer;
  productLine: CanonicalProductLine;
  model: CanonicalLureModel;
  variants: CanonicalLureVariant[];

  /** Record-level tags when not scoped to model or variant. */
  tags?: CanonicalTag[];

  /** Provenance: where this row was sourced. */
  source: CanonicalImportSource;

  /** Batch and row trace metadata. */
  metadata: CanonicalImportMetadata;

  /** ISO-8601 timestamp when the importer produced this DTO. */
  importedAt: string;
}

/** Result envelope when a mapper emits zero or more canonical records from one source row. */
export interface CanonicalLureImportBatch {
  records: CanonicalLureImport[];
}

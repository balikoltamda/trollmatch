import type {
  ImportLifecycleState,
  ImportRecordKey,
  ImportSourceDocumentRef,
} from "../core/types";

/** Localized string pair aligned with catalog tr/en columns. */
export interface ImportLocalizedText {
  tr: string;
  en: string;
}

/** External identifier row for idempotent upsert (007 §5.6). */
export interface MappedExternalIdentifier {
  scheme: "upc" | "ean" | "manufacturer_sku" | "retailer_sku" | (string & {});
  value: string;
  regionCode?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

/** Color reference with manufacturer code aliases. */
export interface MappedColorRecord {
  code: string;
  name: ImportLocalizedText;
  aliases?: Array<{ kind: string; value: string; locale?: string }>;
}

/** Product line aggregate within a mapped bundle. */
export interface MappedProductLineRecord {
  slug: string;
  name: ImportLocalizedText;
  description?: ImportLocalizedText;
}

/** LureAtlas Model projection — not a Prisma row. */
export interface MappedLureModelRecord {
  slug: string;
  name: ImportLocalizedText;
  description?: ImportLocalizedText;
  formFactorSlug?: string;
  lifecycleState: ImportLifecycleState;
}

/** LureAtlas Variant projection with canonical color link. */
export interface MappedLureVariantRecord {
  slug: string;
  name: ImportLocalizedText;
  lengthMm?: number;
  weightG?: number;
  colorCode: string;
  externalIdentifiers?: MappedExternalIdentifier[];
  lifecycleState: ImportLifecycleState;
}

/** Atomic Knowledge Claim stub for manufacturer spec fields (007 §6.1). */
export interface MappedKnowledgeClaimRecord {
  predicate: string;
  value: string | number | boolean;
  unit?: string;
  locale?: "tr" | "en" | "any";
}

/** Media reference to fetch or attach in a later sprint (007 §10). */
export interface MappedMediaReference {
  uri: string;
  role: "hero" | "gallery" | "technical_diagram";
  alt?: ImportLocalizedText;
}

/**
 * One import row mapped to catalog write intents.
 * A single source row may produce model + variant + claims in one bundle.
 */
export interface MappedCatalogBundle {
  key: ImportRecordKey;
  productLine?: MappedProductLineRecord;
  model: MappedLureModelRecord;
  variant: MappedLureVariantRecord;
  color?: MappedColorRecord;
  claims?: MappedKnowledgeClaimRecord[];
  media?: MappedMediaReference[];
  sourceDocuments?: ImportSourceDocumentRef[];
  provenanceNote?: string;
}

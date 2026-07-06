import type {
  CanonicalColor,
  CanonicalLureImport,
  CanonicalTag,
} from "../../core/canonical-lure";

type DemoLocalized = { en?: string; tr?: string; default?: string };

type DemoRawProduct = {
  recordId?: string;
  recordKey?: string;
  source?: {
    type: string;
    url?: string;
    documentTitle?: string;
  };
  manufacturer: CanonicalLureImport["manufacturer"];
  productLine: CanonicalLureImport["productLine"];
  model: CanonicalLureImport["model"] & {
    size?: { lengthMm?: number; weightG?: number };
    weight?: { weightG?: number };
    tags?: CanonicalTag[];
  };
  variant?: {
    slug: string;
    name: DemoLocalized;
    sku?: string;
    color: CanonicalColor;
    size?: { lengthMm?: number };
    weight?: { weightG?: number };
    images?: CanonicalLureImport["variants"][number]["images"];
    externalIdentifiers?: CanonicalLureImport["variants"][number]["externalIdentifiers"];
  };
  variants?: CanonicalLureImport["variants"];
  tags?: CanonicalTag[];
  metadata?: CanonicalLureImport["metadata"];
  importedAt?: string;
};

function isCanonicalRecord(raw: DemoRawProduct): raw is CanonicalLureImport {
  return (
    Boolean(raw.recordKey) &&
    Array.isArray(raw.variants) &&
    raw.variants.length > 0 &&
    Boolean(raw.source?.url) &&
    Boolean(raw.importedAt)
  );
}

export function normalizeProductRecord(
  raw: DemoRawProduct,
  filePath: string,
  providerCode: string,
): CanonicalLureImport {
  if (isCanonicalRecord(raw)) {
    return raw;
  }

  const recordKey = raw.recordKey ?? raw.recordId;
  if (!recordKey || !raw.variant) {
    throw new Error(`Invalid product record in ${filePath}`);
  }

  const sourceUri = raw.source?.url ?? `file://${filePath.replace(/\\/g, "/")}`;

  return {
    recordKey,
    manufacturer: raw.manufacturer,
    productLine: raw.productLine,
    model: {
      ...raw.model,
      sizes: raw.model.sizes ?? (raw.model.size ? [raw.model.size] : undefined),
      weights:
        raw.model.weights ??
        (raw.model.weight ? [raw.model.weight] : undefined),
      tags: raw.model.tags ?? raw.tags,
    },
    variants: [
      {
        slug: raw.variant.slug,
        name: raw.variant.name,
        sku: raw.variant.sku,
        colors: [raw.variant.color],
        sizes: raw.variant.size ? [raw.variant.size] : undefined,
        weights: raw.variant.weight ? [raw.variant.weight] : undefined,
        images: raw.variant.images,
        externalIdentifiers: raw.variant.externalIdentifiers,
      },
    ],
    tags: raw.tags,
    source: {
      url: sourceUri,
      type: (raw.source?.type ?? "json_export") as CanonicalLureImport["source"]["type"],
      documentTitle: raw.source?.documentTitle,
      retrievedAt: new Date().toISOString(),
    },
    metadata: raw.metadata ?? {
      providerCode,
      providerSchemaVersion: "1.0.0",
      batchKey: `static-${providerCode}`,
      idempotencyKey: recordKey,
      sourceRecordId: recordKey,
    },
    importedAt: raw.importedAt ?? new Date().toISOString(),
  };
}

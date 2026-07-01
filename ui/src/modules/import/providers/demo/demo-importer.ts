import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { CanonicalLureImport } from "../../core/canonical-lure";
import type { ImportProviderMetadata } from "../../core/provider-metadata";
import type { ManufacturerImportProvider } from "../../core/import-provider";
import type {
  ImportContext,
  ImportIssue,
  ImportSourceFormat,
  ImportSourceInput,
  ImportValidationContext,
  RawImportRecord,
  ValidatedImportRecord,
} from "../../core/types";
import type {
  CatalogMapper,
  ImportMappingContext,
  MappingResult,
} from "../../mappers/catalog-mapper";
import type { MappedCatalogBundle } from "../../mappers/mapped-records";
import type { ParseResult } from "../../parsers/parse-result";
import type { SourceParser } from "../../parsers/source-parser";
import type {
  RecordValidator,
  ValidationResult,
} from "../../validators/record-validator";

const PROVIDER_CODE = "demo";
const SCHEMA_VERSION = "1.0.0";
const SAMPLE_FILE = "sample-lure.json";

type DemoLocalized = { en?: string; tr?: string; default?: string };

type DemoRawLure = {
  recordId: string;
  source: {
    type: string;
    documentTitle?: string;
  };
  manufacturer: {
    slug: string;
    name: DemoLocalized;
    countryCode?: string;
    website?: string;
  };
  productLine: {
    slug: string;
    name: DemoLocalized;
    description?: DemoLocalized;
  };
  model: {
    slug: string;
    name: DemoLocalized;
    modelCode?: string;
    description?: DemoLocalized;
    formFactorTerm?: string;
    size?: { lengthMm?: number; lengthCm?: number; lengthIn?: number };
    weight?: { weightG?: number; weightOz?: number };
    divingDepth?: {
      minMeters?: number;
      maxMeters?: number;
      lipType?: string;
      manufacturerLabel?: DemoLocalized;
    };
    buoyancy?: {
      slug?: string;
      manufacturerTerm?: string;
      label?: DemoLocalized;
    };
    actions?: Array<{
      slug?: string;
      manufacturerTerm?: string;
      label?: DemoLocalized;
    }>;
    hooks?: Array<{
      hookCount?: number;
      hookType?: string;
      hookSize?: string;
      factoryDefault?: boolean;
    }>;
    tags?: Array<{ kind: string; value: string; locale?: string }>;
    images?: Array<{ url: string; role?: string; alt?: DemoLocalized }>;
    videos?: Array<{ url: string; role?: string; title?: DemoLocalized }>;
    externalIdentifiers?: Array<{ scheme: string; value: string }>;
  };
  variant: {
    slug: string;
    name: DemoLocalized;
    sku?: string;
    color: {
      code: string;
      name: DemoLocalized;
      aliases?: Array<{ kind: string; value: string; locale?: string }>;
    };
    size?: { lengthMm?: number };
    weight?: { weightG?: number; weightOz?: number };
    externalIdentifiers?: Array<{ scheme: string; value: string }>;
    images?: Array<{ url: string; role?: string; colorCode?: string }>;
  };
};

export const demoImportMetadata: ImportProviderMetadata = {
  providerCode: PROVIDER_CODE,
  displayName: "Demo Static JSON Importer",
  manufacturerSlug: "halco",
  supportedSourceFormats: ["json"],
  schemaVersion: SCHEMA_VERSION,
};

class DemoSourceParser implements SourceParser<DemoRawLure | DemoRawLure[]> {
  readonly supportedFormats: ImportSourceFormat[] = ["json"];

  async parse(
    input: ImportSourceInput<DemoRawLure | DemoRawLure[]>,
    context: ImportContext,
  ): Promise<ParseResult> {
    const issues: ImportIssue[] = [];
    const rows = Array.isArray(input.payload) ? input.payload : [input.payload];
    const records: RawImportRecord[] = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      if (!row || typeof row !== "object") {
        issues.push({
          code: "DEMO_PARSE_INVALID_ROW",
          severity: "error",
          message: `Row ${index + 1} is not a valid object`,
        });
        continue;
      }

      if (!row.recordId) {
        issues.push({
          code: "DEMO_PARSE_MISSING_RECORD_ID",
          severity: "error",
          message: `Row ${index + 1} missing recordId`,
        });
        continue;
      }

      records.push({
        key: {
          providerCode: context.batch.providerCode,
          externalId: row.recordId,
        },
        sourceLine: index + 1,
        data: row,
      });
    }

    return { records, issues };
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateDemoRawLure(raw: DemoRawLure): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const required: Array<[string, unknown]> = [
    ["recordId", raw.recordId],
    ["manufacturer.slug", raw.manufacturer?.slug],
    ["productLine.slug", raw.productLine?.slug],
    ["model.slug", raw.model?.slug],
    ["variant.slug", raw.variant?.slug],
    ["variant.color.code", raw.variant?.color?.code],
    ["source.type", raw.source?.type],
  ];

  for (const [fieldPath, value] of required) {
    if (!isNonEmptyString(value)) {
      issues.push({
        code: "DEMO_VALIDATION_REQUIRED",
        severity: "error",
        message: `Missing or empty required field: ${fieldPath}`,
        fieldPath,
        recordKey: raw.recordId,
      });
    }
  }

  const hasName =
    isNonEmptyString(raw.manufacturer?.name?.en) ||
    isNonEmptyString(raw.manufacturer?.name?.tr) ||
    isNonEmptyString(raw.manufacturer?.name?.default);

  if (!hasName) {
    issues.push({
      code: "DEMO_VALIDATION_MANUFACTURER_NAME",
      severity: "error",
      message: "Manufacturer name requires at least one locale or default",
      fieldPath: "manufacturer.name",
      recordKey: raw.recordId,
    });
  }

  return issues;
}

class DemoRecordValidator implements RecordValidator<DemoRawLure> {
  async validate(
    records: RawImportRecord[],
    context: ImportValidationContext,
  ): Promise<ValidationResult> {
    void context;
    const validRecords: ValidatedImportRecord[] = [];
    const invalidRecords: RawImportRecord[] = [];
    const issues: ImportIssue[] = [];

    for (const record of records) {
      const raw = record.data as DemoRawLure;
      const rowIssues = validateDemoRawLure(raw);
      const errors = rowIssues.filter((i) => i.severity === "error");

      if (errors.length > 0) {
        invalidRecords.push(record);
        issues.push(...rowIssues);
      } else {
        validRecords.push({
          key: record.key,
          sourceLine: record.sourceLine,
          data: raw,
        });
      }
    }

    return { validRecords, invalidRecords, issues };
  }
}

export function validateCanonicalLureImport(
  dto: CanonicalLureImport,
): ImportIssue[] {
  const issues: ImportIssue[] = [];

  if (!isNonEmptyString(dto.recordKey)) {
    issues.push({
      code: "CANONICAL_MISSING_RECORD_KEY",
      severity: "error",
      message: "recordKey is required",
      fieldPath: "recordKey",
    });
  }

  if (!isNonEmptyString(dto.importedAt)) {
    issues.push({
      code: "CANONICAL_MISSING_IMPORTED_AT",
      severity: "error",
      message: "importedAt is required",
      fieldPath: "importedAt",
    });
  }

  if (!isNonEmptyString(dto.source?.url)) {
    issues.push({
      code: "CANONICAL_MISSING_SOURCE_URL",
      severity: "error",
      message: "source.url is required",
      fieldPath: "source.url",
    });
  }

  if (!isNonEmptyString(dto.source?.type)) {
    issues.push({
      code: "CANONICAL_MISSING_SOURCE_TYPE",
      severity: "error",
      message: "source.type is required",
      fieldPath: "source.type",
    });
  }

  if (!dto.variants?.length) {
    issues.push({
      code: "CANONICAL_MISSING_VARIANTS",
      severity: "error",
      message: "At least one variant is required",
      fieldPath: "variants",
    });
  }

  for (const variant of dto.variants ?? []) {
    if (!variant.colors?.length) {
      issues.push({
        code: "CANONICAL_VARIANT_MISSING_COLOR",
        severity: "error",
        message: `Variant ${variant.slug} requires at least one color`,
        fieldPath: "variants[].colors",
        recordKey: dto.recordKey,
      });
    }
  }

  return issues;
}

function mapDemoRawToCanonical(
  raw: DemoRawLure,
  context: ImportMappingContext,
  sourceUri: string,
): CanonicalLureImport {
  return {
    recordKey: raw.recordId,
    manufacturer: {
      slug: raw.manufacturer.slug,
      name: raw.manufacturer.name,
      countryCode: raw.manufacturer.countryCode,
      website: raw.manufacturer.website,
    },
    productLine: {
      slug: raw.productLine.slug,
      name: raw.productLine.name,
      description: raw.productLine.description,
    },
    model: {
      slug: raw.model.slug,
      name: raw.model.name,
      modelCode: raw.model.modelCode,
      description: raw.model.description,
      formFactorTerm: raw.model.formFactorTerm,
      sizes: raw.model.size ? [raw.model.size] : undefined,
      weights: raw.model.weight ? [raw.model.weight] : undefined,
      divingDepth: raw.model.divingDepth,
      buoyancy: raw.model.buoyancy,
      actions: raw.model.actions,
      hooks: raw.model.hooks,
      images: raw.model.images,
      videos: raw.model.videos,
      tags: raw.model.tags,
      externalIdentifiers: raw.model.externalIdentifiers,
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
    source: {
      url: sourceUri,
      type: raw.source.type as CanonicalLureImport["source"]["type"],
      documentTitle: raw.source.documentTitle,
      retrievedAt: context.batch.startedAt,
    },
    metadata: {
      providerCode: context.batch.providerCode,
      providerSchemaVersion: SCHEMA_VERSION,
      batchKey: context.batch.batchKey,
      idempotencyKey: context.batch.idempotencyKey,
      sourceRecordId: raw.recordId,
    },
    importedAt: new Date().toISOString(),
  };
}

function canonicalToMappedBundle(
  canonical: CanonicalLureImport,
): MappedCatalogBundle {
  const variant = canonical.variants[0];
  const color = variant?.colors[0];

  return {
    key: {
      providerCode: canonical.metadata.providerCode ?? PROVIDER_CODE,
      externalId: canonical.recordKey,
    },
    productLine: {
      slug: canonical.productLine.slug,
      name: {
        en: canonical.productLine.name.en ?? canonical.productLine.name.default ?? "",
        tr: canonical.productLine.name.tr ?? canonical.productLine.name.default ?? "",
      },
    },
    model: {
      slug: canonical.model.slug,
      name: {
        en: canonical.model.name.en ?? canonical.model.name.default ?? "",
        tr: canonical.model.name.tr ?? canonical.model.name.default ?? "",
      },
      lifecycleState: "draft",
    },
    variant: {
      slug: variant.slug,
      name: {
        en: variant.name.en ?? variant.name.default ?? "",
        tr: variant.name.tr ?? variant.name.default ?? "",
      },
      lengthMm: variant.sizes?.[0]?.lengthMm,
      weightG: variant.weights?.[0]?.weightG,
      colorCode: color?.code ?? "",
      externalIdentifiers: variant.externalIdentifiers,
      lifecycleState: "draft",
    },
    color: color
      ? {
          code: color.code,
          name: {
            en: color.name.en ?? color.name.default ?? "",
            tr: color.name.tr ?? color.name.default ?? "",
          },
        }
      : undefined,
    provenanceNote: canonical.source.documentTitle,
  };
}

class DemoCatalogMapper implements CatalogMapper {
  private lastSourceUri = "";

  setSourceUri(uri: string): void {
    this.lastSourceUri = uri;
  }

  async map(
    records: ValidatedImportRecord[],
    context: ImportMappingContext,
  ): Promise<MappingResult> {
    const bundles: MappedCatalogBundle[] = [];
    const issues: ImportIssue[] = [];
    const skippedRecords: ValidatedImportRecord[] = [];

    for (const record of records) {
      const raw = record.data as DemoRawLure;
      const canonical = mapDemoRawToCanonical(raw, context, this.lastSourceUri);
      const canonicalIssues = validateCanonicalLureImport(canonical);
      const errors = canonicalIssues.filter((i) => i.severity === "error");

      if (errors.length > 0) {
        skippedRecords.push(record);
        issues.push(...canonicalIssues);
        continue;
      }

      bundles.push(canonicalToMappedBundle(canonical));
    }

    return { bundles, skippedRecords, issues };
  }
}

export function mapDemoRecordsToCanonical(
  records: ValidatedImportRecord[],
  context: ImportMappingContext,
  sourceUri: string,
): { canonical: CanonicalLureImport[]; issues: ImportIssue[] } {
  const canonical: CanonicalLureImport[] = [];
  const issues: ImportIssue[] = [];

  for (const record of records) {
    const raw = record.data as DemoRawLure;
    const dto = mapDemoRawToCanonical(raw, context, sourceUri);
    const dtoIssues = validateCanonicalLureImport(dto);
    issues.push(...dtoIssues);

    if (!dtoIssues.some((i) => i.severity === "error")) {
      canonical.push(dto);
    }
  }

  return { canonical, issues };
}

class DemoImportProvider implements ManufacturerImportProvider {
  readonly metadata = demoImportMetadata;

  createParser(): SourceParser {
    return new DemoSourceParser();
  }

  createValidator(): RecordValidator {
    return new DemoRecordValidator();
  }

  createMapper(): CatalogMapper {
    return new DemoCatalogMapper();
  }
}

export const demoImportProvider = new DemoImportProvider();

export function resolveDemoSamplePath(): string {
  return join(dirname(fileURLToPath(import.meta.url)), SAMPLE_FILE);
}

export async function runDemoImport(
  samplePath = resolveDemoSamplePath(),
): Promise<CanonicalLureImport[]> {
  const fileContents = readFileSync(samplePath, "utf-8");
  const payload = JSON.parse(fileContents) as DemoRawLure;
  const sourceUri = `file://${samplePath.replace(/\\/g, "/")}`;

  const context: ImportContext = {
    batch: {
      batchKey: `demo-${Date.now()}`,
      idempotencyKey: `demo-static-${payload.recordId}`,
      providerCode: PROVIDER_CODE,
      sourceReference: sourceUri,
      startedAt: new Date().toISOString(),
    },
    locale: "en",
    dryRun: true,
  };

  const mappingContext: ImportMappingContext = {
    ...context,
    manufacturerSlug: demoImportMetadata.manufacturerSlug,
  };

  const provider = demoImportProvider;
  const parser = provider.createParser();
  const validator = provider.createValidator();
  const mapper = provider.createMapper() as DemoCatalogMapper;
  mapper.setSourceUri(sourceUri);

  const parseResult = await parser.parse(
    { format: "json", payload, sourceUri },
    context,
  );

  if (parseResult.issues.some((i) => i.severity === "error")) {
    console.error(JSON.stringify({ stage: "parse", issues: parseResult.issues }, null, 2));
    process.exit(1);
  }

  const validationResult = await validator.validate(parseResult.records, context);

  if (validationResult.validRecords.length === 0) {
    console.error(
      JSON.stringify({ stage: "validate", issues: validationResult.issues }, null, 2),
    );
    process.exit(1);
  }

  const { canonical, issues: canonicalIssues } = mapDemoRecordsToCanonical(
    validationResult.validRecords,
    mappingContext,
    sourceUri,
  );

  if (canonicalIssues.some((i) => i.severity === "error")) {
    console.error(
      JSON.stringify({ stage: "canonical_validate", issues: canonicalIssues }, null, 2),
    );
    process.exit(1);
  }

  await mapper.map(validationResult.validRecords, mappingContext);

  return canonical;
}

async function main(): Promise<void> {
  const canonical = await runDemoImport();
  console.log(JSON.stringify(canonical, null, 2));
}

const entryPath = process.argv[1]?.replace(/\\/g, "/");
const modulePath = fileURLToPath(import.meta.url).replace(/\\/g, "/");

if (entryPath?.endsWith("demo-importer.ts") && modulePath.endsWith("demo-importer.ts")) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}

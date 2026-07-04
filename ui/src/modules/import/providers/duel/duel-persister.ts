import {
  ColorAliasKind,
  ContentLifecycleState,
  ImageRole,
  ManufacturerProductStatus,
  Prisma,
  ProductAliasKind,
} from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";
import type {
  CanonicalColor,
  CanonicalDivingDepth,
  CanonicalImage,
  CanonicalLocalizedText,
  CanonicalLureImport,
  CanonicalLureVariant,
  CanonicalTrollingSpeedRange,
} from "../../core/canonical-lure";
import {
  ensureTechnique,
  findColorBySlug,
  findImageByUrl,
  findLureModel,
  findLureVariant,
  findManufacturerByCanonicalIdentity,
  findProductLine,
  type DbClient,
} from "../../persistence/lookups";
import {
  normalizeAlias,
  resolveLocalized,
  slugifyColorCode,
} from "../../persistence/normalize";
import {
  createEmptyImportSummary,
  mergeImportSummaries,
  type ImportSummary,
} from "../../persistence/types";
import { pickChangedFields } from "../../persistence/lifecycle-reconciler";
import { recordImportFieldChanges } from "../../persistence/import-field-diff";

export type UpsertDuelImportResult = {
  summary: ImportSummary;
  lureModelId: string;
  modelSlug: string;
  isNew: boolean;
  dataChanged: boolean;
};

const LURE_MODEL_COMPARE_KEYS = [
  "manufacturerId",
  "productLineId",
  "nameEn",
  "nameTr",
  "formFactorEn",
  "formFactorTr",
  "bodyTypeSlug",
  "bodyTypeEn",
  "bodyTypeTr",
  "buoyancySlug",
  "buoyancyEn",
  "buoyancyTr",
  "divingDepthMinM",
  "divingDepthMaxM",
  "trollingSpeedMinKn",
  "trollingSpeedMaxKn",
  "coatingTypeSlug",
  "coatingTypeEn",
  "coatingTypeTr",
  "actionSlug",
  "actionEn",
  "actionTr",
  "shortDescriptionEn",
  "shortDescriptionTr",
] as const;

function mapImageRole(role?: string): ImageRole {
  switch (role) {
    case "hero":
      return ImageRole.HERO;
    case "rigging_diagram":
      return ImageRole.RIGGING_DIAGRAM;
    case "technical_diagram":
      return ImageRole.TECHNICAL_DIAGRAM;
    default:
      return ImageRole.PRODUCT;
  }
}

async function ensureColor(
  tx: DbClient,
  manufacturerSlug: string,
  manufacturerId: string,
  color: CanonicalColor,
  summary: ImportSummary,
): Promise<string> {
  const slug = slugifyColorCode(manufacturerSlug, color.code);
  const existing = await findColorBySlug(tx, slug);

  if (existing) {
    summary.skipped.push(`Color: ${slug}`);
  } else {
    await tx.color.create({
      data: {
        slug,
        nameEn: resolveLocalized(color.name, "en") || color.code,
        nameTr: resolveLocalized(color.name, "tr") || color.code,
      },
    });
    summary.created.push(`Color: ${slug}`);
  }

  const colorRecord = (await findColorBySlug(tx, slug))!;

  for (const alias of color.aliases ?? [{ kind: "manufacturer_code", value: color.code }]) {
    const aliasNormalized = normalizeAlias(alias.value);
    const existingAlias = await tx.colorAlias.findFirst({
      where: {
        aliasNormalized,
        locale: alias.locale ?? "any",
        manufacturerScope: manufacturerId,
        deletedAt: null,
      },
    });

    if (existingAlias) {
      summary.skipped.push(`ColorAlias: ${alias.value}`);
    } else {
      await tx.colorAlias.create({
        data: {
          colorId: colorRecord.id,
          manufacturerId,
          manufacturerScope: manufacturerId,
          locale: alias.locale ?? "any",
          alias: alias.value,
          aliasNormalized,
          kind: ColorAliasKind.MANUFACTURER_CODE,
        },
      });
      summary.created.push(`ColorAlias: ${alias.value}`);
    }
  }

  return colorRecord.id;
}

async function ensureImages(
  tx: DbClient,
  lureModelId: string,
  images: CanonicalImage[] | undefined,
  lureVariantId: string | null,
  summary: ImportSummary,
  labelPrefix: string,
): Promise<void> {
  for (const [index, image] of (images ?? []).entries()) {
    const existing = await findImageByUrl(tx, lureModelId, image.url, lureVariantId);

    if (existing) {
      summary.skipped.push(`${labelPrefix} Image: ${image.url}`);
      continue;
    }

    await tx.image.create({
      data: {
        lureModelId,
        lureVariantId,
        url: image.url,
        altTextEn: image.alt ? resolveLocalized(image.alt, "en") : null,
        altTextTr: image.alt ? resolveLocalized(image.alt, "tr") : null,
        role: mapImageRole(image.role),
        sortOrder: image.sortOrder ?? index,
      },
    });
    summary.created.push(`${labelPrefix} Image: ${image.url}`);
  }
}

async function findLureModelByDuelPid(
  tx: DbClient,
  manufacturerId: string,
  pid: string,
) {
  const aliasNormalized = normalizeAlias(`duel:pid:${pid}`);
  const alias = await tx.productAlias.findFirst({
    where: {
      aliasNormalized,
      manufacturerScope: manufacturerId,
      deletedAt: null,
    },
    include: { lureModel: true },
  });

  return alias?.lureModel ?? null;
}

async function ensureProductAlias(
  tx: DbClient,
  lureModelId: string,
  manufacturerId: string,
  aliasValue: string,
  kind: ProductAliasKind,
  summary: ImportSummary,
): Promise<void> {
  const aliasNormalized = normalizeAlias(aliasValue);
  const existingAlias = await tx.productAlias.findFirst({
    where: {
      aliasNormalized,
      locale: "any",
      manufacturerScope: manufacturerId,
      deletedAt: null,
    },
  });

  if (existingAlias) {
    summary.skipped.push(`ProductAlias: ${aliasValue}`);
    return;
  }

  await tx.productAlias.create({
    data: {
      lureModelId,
      manufacturerId,
      manufacturerScope: manufacturerId,
      locale: "any",
      alias: aliasValue,
      aliasNormalized,
      kind,
    },
  });
  summary.created.push(`ProductAlias: ${aliasValue}`);
}

function lifecycleTouch(now: Date) {
  return {
    lastSeenAt: now,
    lastImportedAt: now,
    manufacturerStatus: ManufacturerProductStatus.ACTIVE,
    missingImportCount: 0,
  };
}

function resolveLocalizedAttribute(
  label: CanonicalLocalizedText | undefined,
  manufacturerTerm: string | undefined,
  locale: "en" | "tr",
): string | null {
  const localized = label ? resolveLocalized(label, locale) : "";
  if (localized) {
    return localized;
  }

  return manufacturerTerm?.trim() || null;
}

function resolveDepthMeters(depth: CanonicalDivingDepth | undefined): {
  minM: number | null;
  maxM: number | null;
} {
  if (!depth) {
    return { minM: null, maxM: null };
  }

  const min =
    depth.minMeters ??
    depth.range?.min ??
    (depth.ratedDepthMeters !== undefined ? depth.ratedDepthMeters : undefined);
  const max =
    depth.maxMeters ??
    depth.range?.max ??
    (depth.ratedDepthMeters !== undefined ? depth.ratedDepthMeters : undefined);

  if (min === undefined && max === undefined) {
    return { minM: null, maxM: null };
  }

  return {
    minM: min ?? max ?? null,
    maxM: max ?? min ?? null,
  };
}

function resolveTrollingSpeedKnots(speed: CanonicalTrollingSpeedRange | undefined): {
  minKn: number | null;
  maxKn: number | null;
} {
  if (!speed) {
    return { minKn: null, maxKn: null };
  }

  const min = speed.minKnots;
  const max = speed.maxKnots;

  if (min === undefined && max === undefined) {
    return { minKn: null, maxKn: null };
  }

  return {
    minKn: min ?? max ?? null,
    maxKn: max ?? min ?? null,
  };
}

function collectTechniqueSlugs(record: CanonicalLureImport): Array<{
  slug: string;
  label?: CanonicalLocalizedText;
}> {
  const bySlug = new Map<string, CanonicalLocalizedText | undefined>();

  for (const technique of record.model.techniques ?? []) {
    if (technique.slug.trim()) {
      bySlug.set(technique.slug.trim().toLowerCase(), technique.label);
    }
  }

  const tagSources = [
    ...(record.tags ?? []),
    ...(record.model.tags ?? []),
    ...record.variants.flatMap((variant) => variant.tags ?? []),
  ];

  for (const tag of tagSources) {
    if (tag.kind === "technique" && tag.value.trim()) {
      const slug = tag.value.trim().toLowerCase();
      if (!bySlug.has(slug)) {
        bySlug.set(slug, localizedFromTag(tag.value));
      }
    }
  }

  return [...bySlug.entries()].map(([slug, label]) => ({ slug, label }));
}

function localizedFromTag(value: string): CanonicalLocalizedText {
  const label = value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return { en: label, default: label };
}

async function ensureTechniqueLinks(
  tx: DbClient,
  lureModelId: string,
  record: CanonicalLureImport,
  summary: ImportSummary,
): Promise<void> {
  const techniques = collectTechniqueSlugs(record);

  for (const technique of techniques) {
    const techniqueId = await ensureTechnique(tx, technique.slug, technique.label);
    const existing = await tx.lureTechnique.findFirst({
      where: {
        lureModelId,
        techniqueId,
        deletedAt: null,
      },
    });

    if (existing) {
      summary.skipped.push(`LureTechnique: ${technique.slug}`);
      continue;
    }

    await tx.lureTechnique.create({
      data: {
        lureModelId,
        techniqueId,
      },
    });
    summary.created.push(`LureTechnique: ${technique.slug}`);
  }
}

async function upsertVariant(
  tx: DbClient,
  lureModelId: string,
  manufacturerSlug: string,
  manufacturerId: string,
  variantInput: CanonicalLureVariant,
  sortOrder: number,
  summary: ImportSummary,
): Promise<void> {
  const colorInput = variantInput.colors[0];
  if (!colorInput) {
    summary.errors.push(`Variant ${variantInput.slug}: missing color`);
    return;
  }

  const colorId = await ensureColor(
    tx,
    manufacturerSlug,
    manufacturerId,
    colorInput,
    summary,
  );

  const existingVariant = await findLureVariant(tx, lureModelId, variantInput.slug);
  const variantData = {
    colorId,
    labelEn: resolveLocalized(variantInput.name, "en"),
    labelTr: resolveLocalized(variantInput.name, "tr"),
    lengthMm: variantInput.sizes?.[0]?.lengthMm ?? null,
    weightG: variantInput.weights?.[0]?.weightG ?? null,
    sortOrder,
    isDefault: sortOrder === 0,
  };

  let lureVariantId: string;

  if (existingVariant) {
    const changedFields = pickChangedFields(existingVariant, variantData, [
      "colorId",
      "labelEn",
      "labelTr",
      "lengthMm",
      "weightG",
      "sortOrder",
      "isDefault",
    ]);

    if (Object.keys(changedFields).length > 0) {
      await tx.lureVariant.update({
        where: { id: existingVariant.id },
        data: changedFields,
      });
      summary.updated.push(`LureVariant: ${variantInput.slug}`);
    } else {
      summary.skipped.push(`LureVariant: ${variantInput.slug}`);
    }

    lureVariantId = existingVariant.id;
  } else {
    const created = await tx.lureVariant.create({
      data: {
        lureModelId,
        slug: variantInput.slug,
        ...variantData,
      },
    });
    lureVariantId = created.id;
    summary.created.push(`LureVariant: ${variantInput.slug}`);
  }

  await ensureImages(
    tx,
    lureModelId,
    variantInput.images,
    lureVariantId,
    summary,
    "Variant",
  );
}

async function upsertSingleRecord(
  tx: DbClient,
  record: CanonicalLureImport,
  importedAt: Date,
): Promise<UpsertDuelImportResult> {
  const summary = createEmptyImportSummary();
  const manufacturerInput = record.manufacturer;
  const productLineInput = record.productLine;
  const modelInput = record.model;
  const pid = record.metadata.sourceRecordId ?? record.recordKey.replace(/^duel:pid:/, "");

  if (!record.variants.length) {
    summary.errors.push(`Record ${record.recordKey}: no variants to persist`);
    return {
      summary,
      lureModelId: "",
      modelSlug: modelInput.slug,
      isNew: false,
      dataChanged: false,
    };
  }

  let manufacturer = await findManufacturerByCanonicalIdentity(
    tx,
    manufacturerInput.slug,
    manufacturerInput.name,
  );

  if (manufacturer) {
    await tx.manufacturer.update({
      where: { id: manufacturer.id },
      data: {
        nameEn: resolveLocalized(manufacturerInput.name, "en"),
        nameTr: resolveLocalized(manufacturerInput.name, "tr"),
        countryCode: manufacturerInput.countryCode ?? manufacturer.countryCode,
        website: manufacturerInput.website ?? manufacturer.website,
        logoUrl: manufacturerInput.logoUrl ?? manufacturer.logoUrl,
      },
    });
    summary.updated.push(`Manufacturer: ${manufacturer.slug}`);
  } else {
    manufacturer = await tx.manufacturer.create({
      data: {
        slug: manufacturerInput.slug,
        nameEn: resolveLocalized(manufacturerInput.name, "en"),
        nameTr: resolveLocalized(manufacturerInput.name, "tr"),
        countryCode: manufacturerInput.countryCode ?? null,
        website: manufacturerInput.website ?? null,
        logoUrl: manufacturerInput.logoUrl ?? null,
      },
    });
    summary.created.push(`Manufacturer: ${manufacturer.slug}`);
  }

  let productLine = await findProductLine(
    tx,
    manufacturer.id,
    productLineInput.slug,
  );

  if (productLine) {
    await tx.productLine.update({
      where: { id: productLine.id },
      data: {
        nameEn: resolveLocalized(productLineInput.name, "en"),
        nameTr: resolveLocalized(productLineInput.name, "tr"),
        descriptionEn: productLineInput.description
          ? resolveLocalized(productLineInput.description, "en")
          : productLine.descriptionEn,
        descriptionTr: productLineInput.description
          ? resolveLocalized(productLineInput.description, "tr")
          : productLine.descriptionTr,
      },
    });
    summary.updated.push(`ProductLine: ${productLine.slug}`);
  } else {
    productLine = await tx.productLine.create({
      data: {
        manufacturerId: manufacturer.id,
        slug: productLineInput.slug,
        nameEn: resolveLocalized(productLineInput.name, "en"),
        nameTr: resolveLocalized(productLineInput.name, "tr"),
        descriptionEn: productLineInput.description
          ? resolveLocalized(productLineInput.description, "en")
          : null,
        descriptionTr: productLineInput.description
          ? resolveLocalized(productLineInput.description, "tr")
          : null,
      },
    });
    summary.created.push(`ProductLine: ${productLine.slug}`);
  }

  let lureModel =
    (pid ? await findLureModelByDuelPid(tx, manufacturer.id, pid) : null) ??
    (await findLureModel(tx, modelInput.slug));

  const { minM, maxM } = resolveDepthMeters(modelInput.divingDepth);
  const { minKn, maxKn } = resolveTrollingSpeedKnots(modelInput.trollingSpeed);
  const primaryAction = modelInput.actions?.[0];

  const modelPayload = {
    manufacturerId: manufacturer.id,
    productLineId: productLine.id,
    nameEn: resolveLocalized(modelInput.name, "en"),
    nameTr: resolveLocalized(modelInput.name, "tr"),
    formFactorEn: modelInput.formFactorTerm ?? null,
    formFactorTr: modelInput.formFactorTerm ?? null,
    bodyTypeSlug: modelInput.bodyType?.slug ?? null,
    bodyTypeEn: resolveLocalizedAttribute(
      modelInput.bodyType?.label,
      modelInput.bodyType?.manufacturerTerm,
      "en",
    ),
    bodyTypeTr: resolveLocalizedAttribute(
      modelInput.bodyType?.label,
      modelInput.bodyType?.manufacturerTerm,
      "tr",
    ),
    buoyancySlug: modelInput.buoyancy?.slug ?? null,
    buoyancyEn: resolveLocalizedAttribute(
      modelInput.buoyancy?.label,
      modelInput.buoyancy?.manufacturerTerm,
      "en",
    ),
    buoyancyTr: resolveLocalizedAttribute(
      modelInput.buoyancy?.label,
      modelInput.buoyancy?.manufacturerTerm,
      "tr",
    ),
    divingDepthMinM: minM !== null ? new Prisma.Decimal(minM) : null,
    divingDepthMaxM: maxM !== null ? new Prisma.Decimal(maxM) : null,
    trollingSpeedMinKn: minKn !== null ? new Prisma.Decimal(minKn) : null,
    trollingSpeedMaxKn: maxKn !== null ? new Prisma.Decimal(maxKn) : null,
    coatingTypeSlug: modelInput.coatingType?.slug ?? null,
    coatingTypeEn: resolveLocalizedAttribute(
      modelInput.coatingType?.label,
      modelInput.coatingType?.manufacturerTerm,
      "en",
    ),
    coatingTypeTr: resolveLocalizedAttribute(
      modelInput.coatingType?.label,
      modelInput.coatingType?.manufacturerTerm,
      "tr",
    ),
    actionSlug: primaryAction?.slug ?? null,
    actionEn: resolveLocalizedAttribute(
      primaryAction?.label,
      primaryAction?.manufacturerTerm,
      "en",
    ),
    actionTr: resolveLocalizedAttribute(
      primaryAction?.label,
      primaryAction?.manufacturerTerm,
      "tr",
    ),
    shortDescriptionEn: modelInput.description
      ? resolveLocalized(modelInput.description, "en")
      : null,
    shortDescriptionTr: modelInput.description
      ? resolveLocalized(modelInput.description, "tr")
      : null,
    ...lifecycleTouch(importedAt),
  };

  let isNew = false;
  let dataChanged = false;

  if (lureModel) {
    const changedFields = pickChangedFields(lureModel, modelPayload, [
      ...LURE_MODEL_COMPARE_KEYS,
    ]);
    dataChanged = Object.keys(changedFields).length > 0;

    if (dataChanged) {
      await recordImportFieldChanges(
        tx,
        lureModel.id,
        null,
        lureModel as unknown as Record<string, unknown>,
        changedFields as Record<string, unknown>,
      );
    }

    await tx.lureModel.update({
      where: { id: lureModel.id },
      data: {
        ...(dataChanged ? changedFields : {}),
        ...lifecycleTouch(importedAt),
        firstSeenAt: lureModel.firstSeenAt ?? importedAt,
      },
    });

    if (dataChanged) {
      summary.updated.push(`LureModel: ${lureModel.slug}`);
    } else {
      summary.skipped.push(`LureModel: ${lureModel.slug}`);
    }

    lureModel = (await findLureModel(tx, lureModel.slug))!;
  } else {
    lureModel = await tx.lureModel.create({
      data: {
        slug: modelInput.slug,
        lifecycleState: ContentLifecycleState.PENDING_REVIEW,
        firstSeenAt: importedAt,
        ...modelPayload,
      },
    });
    summary.created.push(`LureModel: ${lureModel.slug}`);
    isNew = true;
    dataChanged = true;
  }

  if (pid) {
    await ensureProductAlias(
      tx,
      lureModel.id,
      manufacturer.id,
      `duel:pid:${pid}`,
      ProductAliasKind.SEARCH_TERM,
      summary,
    );
  }

  if (modelInput.modelCode) {
    await ensureProductAlias(
      tx,
      lureModel.id,
      manufacturer.id,
      modelInput.modelCode,
      ProductAliasKind.MODEL_CODE,
      summary,
    );
  }

  await ensureImages(tx, lureModel.id, modelInput.images, null, summary, "Model");

  for (const [index, variant] of record.variants.entries()) {
    await upsertVariant(
      tx,
      lureModel.id,
      manufacturer.slug,
      manufacturer.id,
      variant,
      index,
      summary,
    );
  }

  await ensureTechniqueLinks(tx, lureModel.id, record, summary);

  return {
    summary,
    lureModelId: lureModel.id,
    modelSlug: lureModel.slug,
    isNew,
    dataChanged,
  };
}

/** Upsert a canonical DUEL record with manufacturer lifecycle fields. Never deletes rows. */
export async function upsertDuelCanonicalImport(
  prisma: PrismaClient,
  record: CanonicalLureImport,
  importedAt: Date = new Date(),
): Promise<UpsertDuelImportResult> {
  return prisma.$transaction(async (tx) => upsertSingleRecord(tx, record, importedAt));
}

export async function upsertDuelCanonicalImports(
  prisma: PrismaClient,
  records: CanonicalLureImport[],
  importedAt: Date = new Date(),
): Promise<ImportSummary> {
  const aggregate = createEmptyImportSummary();

  for (const record of records) {
    try {
      const result = await upsertDuelCanonicalImport(prisma, record, importedAt);
      mergeImportSummaries(aggregate, result.summary);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown persistence error";
      aggregate.errors.push(`Record ${record.recordKey}: ${message}`);
    }
  }

  return aggregate;
}

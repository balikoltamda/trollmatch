import {
  ColorAliasKind,
  ContentLifecycleState,
  ImageRole,
  ManufacturerProductStatus,
  ProductAliasKind,
} from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";
import type {
  CanonicalColor,
  CanonicalImage,
  CanonicalLureImport,
  CanonicalLureVariant,
} from "../../core/canonical-lure";
import {
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
    await tx.lureVariant.update({
      where: { id: existingVariant.id },
      data: variantData,
    });
    lureVariantId = existingVariant.id;
    summary.updated.push(`LureVariant: ${variantInput.slug}`);
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
): Promise<ImportSummary> {
  const summary = createEmptyImportSummary();
  const manufacturerInput = record.manufacturer;
  const productLineInput = record.productLine;
  const modelInput = record.model;
  const pid = record.metadata.sourceRecordId ?? record.recordKey.replace(/^duel:pid:/, "");

  if (!record.variants.length) {
    summary.errors.push(`Record ${record.recordKey}: no variants to persist`);
    return summary;
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

  const modelPayload = {
    manufacturerId: manufacturer.id,
    productLineId: productLine.id,
    nameEn: resolveLocalized(modelInput.name, "en"),
    nameTr: resolveLocalized(modelInput.name, "tr"),
    formFactorEn: modelInput.formFactorTerm ?? null,
    formFactorTr: modelInput.formFactorTerm ?? null,
    shortDescriptionEn: modelInput.description
      ? resolveLocalized(modelInput.description, "en")
      : null,
    shortDescriptionTr: modelInput.description
      ? resolveLocalized(modelInput.description, "tr")
      : null,
    ...lifecycleTouch(importedAt),
  };

  if (lureModel) {
    await tx.lureModel.update({
      where: { id: lureModel.id },
      data: {
        ...modelPayload,
        firstSeenAt: lureModel.firstSeenAt ?? importedAt,
      },
    });
    summary.updated.push(`LureModel: ${lureModel.slug}`);
    lureModel = (await findLureModel(tx, lureModel.slug))!;
  } else {
    lureModel = await tx.lureModel.create({
      data: {
        slug: modelInput.slug,
        lifecycleState: ContentLifecycleState.DRAFT,
        firstSeenAt: importedAt,
        ...modelPayload,
      },
    });
    summary.created.push(`LureModel: ${lureModel.slug}`);
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

  return summary;
}

/** Upsert a canonical DUEL record with manufacturer lifecycle fields. Never deletes rows. */
export async function upsertDuelCanonicalImport(
  prisma: PrismaClient,
  record: CanonicalLureImport,
  importedAt: Date = new Date(),
): Promise<ImportSummary> {
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
      const summary = await upsertDuelCanonicalImport(prisma, record, importedAt);
      mergeImportSummaries(aggregate, summary);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown persistence error";
      aggregate.errors.push(`Record ${record.recordKey}: ${message}`);
    }
  }

  return aggregate;
}

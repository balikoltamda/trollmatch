import {
  ColorAliasKind,
  ContentLifecycleState,
  ProductAliasKind,
} from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";
import type {
  CanonicalColor,
  CanonicalLureImport,
} from "../core/canonical-lure";
import { ensureImportImages } from "@/modules/import/images/ensure-import-images";
import { prepareCanonicalImportImages } from "@/modules/import/images/persist-import-image";
import {
  findColorBySlug,
  findLureModel,
  findLureVariant,
  findManufacturerByCanonicalIdentity,
  findProductLine,
  type DbClient,
} from "./lookups";
import {
  normalizeAlias,
  resolveLocalized,
  slugifyColorCode,
} from "./normalize";
import {
  createEmptyImportSummary,
  mergeImportSummaries,
  type ImportSummary,
} from "./types";

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

async function persistSingleRecord(
  tx: DbClient,
  record: CanonicalLureImport,
): Promise<ImportSummary> {
  const summary = createEmptyImportSummary();
  const manufacturerInput = record.manufacturer;
  const productLineInput = record.productLine;
  const modelInput = record.model;
  const variantInput = record.variants[0];

  if (!variantInput) {
    summary.errors.push(`Record ${record.recordKey}: no variant to persist`);
    return summary;
  }

  const colorInput = variantInput.colors[0];
  if (!colorInput) {
    summary.errors.push(`Record ${record.recordKey}: variant missing color`);
    return summary;
  }

  let manufacturer = await findManufacturerByCanonicalIdentity(
    tx,
    manufacturerInput.slug,
    manufacturerInput.name,
  );

  if (manufacturer) {
    summary.skipped.push(`Manufacturer: ${manufacturer.slug}`);
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
    summary.skipped.push(`ProductLine: ${productLine.slug}`);
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

  const colorId = await ensureColor(
    tx,
    manufacturer.slug,
    manufacturer.id,
    colorInput,
    summary,
  );

  let lureModel = await findLureModel(tx, modelInput.slug);

  if (lureModel) {
    summary.skipped.push(`LureModel: ${lureModel.slug}`);
  } else {
    lureModel = await tx.lureModel.create({
      data: {
        manufacturerId: manufacturer.id,
        productLineId: productLine.id,
        slug: modelInput.slug,
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
        lifecycleState: ContentLifecycleState.PENDING_REVIEW,
      },
    });
    summary.created.push(`LureModel: ${lureModel.slug}`);
  }

  if (modelInput.modelCode) {
    const aliasNormalized = normalizeAlias(modelInput.modelCode);
    const existingAlias = await tx.productAlias.findFirst({
      where: {
        lureModelId: lureModel.id,
        aliasNormalized,
        locale: "any",
        manufacturerScope: manufacturer.id,
        deletedAt: null,
      },
    });

    if (existingAlias) {
      summary.skipped.push(`ProductAlias: ${modelInput.modelCode}`);
    } else {
      await tx.productAlias.create({
        data: {
          lureModelId: lureModel.id,
          manufacturerId: manufacturer.id,
          manufacturerScope: manufacturer.id,
          locale: "any",
          alias: modelInput.modelCode,
          aliasNormalized,
          kind: ProductAliasKind.MODEL_CODE,
        },
      });
      summary.created.push(`ProductAlias: ${modelInput.modelCode}`);
    }
  }

  await ensureImportImages(
    tx,
    lureModel.id,
    modelInput.images,
    null,
    summary,
    "Model",
  );

  let lureVariant = await findLureVariant(
    tx,
    lureModel.id,
    variantInput.slug,
  );

  if (lureVariant) {
    summary.skipped.push(`LureVariant: ${lureVariant.slug}`);
  } else {
    lureVariant = await tx.lureVariant.create({
      data: {
        lureModelId: lureModel.id,
        colorId,
        slug: variantInput.slug,
        labelEn: resolveLocalized(variantInput.name, "en"),
        labelTr: resolveLocalized(variantInput.name, "tr"),
        lengthMm: variantInput.sizes?.[0]?.lengthMm ?? null,
        weightG: variantInput.weights?.[0]?.weightG ?? null,
        isDefault: true,
        sortOrder: 0,
      },
    });
    summary.created.push(`LureVariant: ${lureVariant.slug}`);
  }

  await ensureImportImages(
    tx,
    lureModel.id,
    variantInput.images,
    lureVariant.id,
    summary,
    "Variant",
  );

  return summary;
}

export async function persistCanonicalImport(
  prisma: PrismaClient,
  record: CanonicalLureImport,
): Promise<ImportSummary> {
  const prepared = await prepareCanonicalImportImages(record);
  return prisma.$transaction(async (tx) => persistSingleRecord(tx, prepared));
}

export async function persistCanonicalImports(
  prisma: PrismaClient,
  records: CanonicalLureImport[],
): Promise<ImportSummary> {
  const aggregate = createEmptyImportSummary();

  for (const record of records) {
    try {
      const summary = await persistCanonicalImport(prisma, record);
      mergeImportSummaries(aggregate, summary);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown persistence error";
      aggregate.errors.push(`Record ${record.recordKey}: ${message}`);
    }
  }

  return aggregate;
}

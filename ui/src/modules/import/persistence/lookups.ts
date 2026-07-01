import type { PrismaClient } from "@/generated/prisma/client";
import type { CanonicalLocalizedText } from "../core/canonical-lure";
import { normalizeAlias, resolveLocalized } from "./normalize";

export type DbClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

export async function findManufacturerByCanonicalIdentity(
  tx: DbClient,
  slug: string,
  name: CanonicalLocalizedText,
) {
  const bySlug = await tx.manufacturer.findFirst({
    where: { slug, deletedAt: null },
  });
  if (bySlug) {
    return bySlug;
  }

  const nameEn = resolveLocalized(name, "en");
  const nameTr = resolveLocalized(name, "tr");
  const candidates = [nameEn, nameTr, name.default].filter(Boolean) as string[];

  if (candidates.length === 0) {
    return null;
  }

  const orConditions = candidates.flatMap((candidate) => {
    const normalized = normalizeAlias(candidate);
    return [
      { nameEn: { equals: candidate, mode: "insensitive" as const } },
      { nameTr: { equals: candidate, mode: "insensitive" as const } },
      { nameEn: { equals: normalized, mode: "insensitive" as const } },
      { nameTr: { equals: normalized, mode: "insensitive" as const } },
    ];
  });

  return tx.manufacturer.findFirst({
    where: {
      deletedAt: null,
      OR: orConditions,
    },
  });
}

export async function findProductLine(
  tx: DbClient,
  manufacturerId: string,
  slug: string,
) {
  return tx.productLine.findFirst({
    where: {
      manufacturerId,
      slug,
      deletedAt: null,
    },
  });
}

export async function findLureModel(tx: DbClient, slug: string) {
  return tx.lureModel.findFirst({
    where: { slug, deletedAt: null },
  });
}

export async function findLureVariant(
  tx: DbClient,
  lureModelId: string,
  slug: string,
) {
  return tx.lureVariant.findFirst({
    where: {
      lureModelId,
      slug,
      deletedAt: null,
    },
  });
}

export async function findColorBySlug(tx: DbClient, slug: string) {
  return tx.color.findFirst({
    where: { slug, deletedAt: null },
  });
}

export async function findImageByUrl(
  tx: DbClient,
  lureModelId: string,
  url: string,
  lureVariantId?: string | null,
) {
  return tx.image.findFirst({
    where: {
      lureModelId,
      url,
      lureVariantId: lureVariantId ?? null,
      deletedAt: null,
    },
  });
}

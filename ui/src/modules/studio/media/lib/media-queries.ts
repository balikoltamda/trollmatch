import { prisma } from "@/lib/prisma";
import type {
  MediaAssetKind,
  MediaDuplicateRef,
} from "@/modules/studio/media/types";

export type MediaAssetRef = {
  kind: MediaAssetKind;
  id: string;
};

export async function findMediaBySha256(
  sha256Hash: string,
  exclude?: MediaAssetRef,
): Promise<MediaDuplicateRef | null> {
  const [lure, species, manufacturer] = await Promise.all([
    prisma.image.findFirst({
      where: {
        sha256Hash,
        deletedAt: null,
        ...(exclude?.kind === "lure" ? { id: { not: exclude.id } } : {}),
      },
      select: {
        id: true,
        lureModel: { select: { nameEn: true } },
      },
    }),
    prisma.speciesImage.findFirst({
      where: {
        sha256Hash,
        deletedAt: null,
        ...(exclude?.kind === "species" ? { id: { not: exclude.id } } : {}),
      },
      select: {
        id: true,
        fishSpecies: { select: { nameEn: true } },
      },
    }),
    prisma.manufacturerImage.findFirst({
      where: {
        sha256Hash,
        deletedAt: null,
        ...(exclude?.kind === "manufacturer"
          ? { id: { not: exclude.id } }
          : {}),
      },
      select: {
        id: true,
        manufacturer: { select: { nameEn: true } },
      },
    }),
  ]);

  if (lure) {
    return {
      kind: "lure",
      id: lure.id,
      entityName: lure.lureModel.nameEn,
    };
  }
  if (species) {
    return {
      kind: "species",
      id: species.id,
      entityName: species.fishSpecies.nameEn,
    };
  }
  if (manufacturer) {
    return {
      kind: "manufacturer",
      id: manufacturer.id,
      entityName: manufacturer.manufacturer.nameEn,
    };
  }

  return null;
}

export async function lureHasEditorCover(lureModelId: string): Promise<boolean> {
  const hero = await prisma.image.findFirst({
    where: { lureModelId, role: "HERO", deletedAt: null },
    select: { id: true },
  });
  return hero !== null;
}

export async function speciesHasEditorHero(
  fishSpeciesId: string,
): Promise<boolean> {
  const hero = await prisma.speciesImage.findFirst({
    where: { fishSpeciesId, role: "HERO", deletedAt: null },
    select: { id: true },
  });
  return hero !== null;
}

function metadataFields(input: {
  altTextEn?: string;
  altTextTr?: string;
  creditEn?: string;
  creditTr?: string;
  photographerEn?: string;
  photographerTr?: string;
  copyrightEn?: string;
  copyrightTr?: string;
}) {
  return {
    altTextEn: emptyToNull(input.altTextEn),
    altTextTr: emptyToNull(input.altTextTr),
    creditEn: emptyToNull(input.creditEn),
    creditTr: emptyToNull(input.creditTr),
    photographerEn: emptyToNull(input.photographerEn),
    photographerTr: emptyToNull(input.photographerTr),
    copyrightEn: emptyToNull(input.copyrightEn),
    copyrightTr: emptyToNull(input.copyrightTr),
  };
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export { metadataFields, emptyToNull };

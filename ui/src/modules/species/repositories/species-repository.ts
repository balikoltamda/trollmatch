import type { ContentLifecycleState, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeSpeciesLabel } from "@/modules/taxonomy/lib/normalize-species-label";
import { PUBLIC_SPECIES_PROFILE_WHERE } from "@/modules/species/lib/public-visibility";
import type { SpeciesSaveInput } from "@/modules/species/lib/validation";

export type StudioSpeciesListRow = {
  id: string;
  slugEn: string;
  slugTr: string;
  scientificName: string;
  nameEn: string;
  nameTr: string;
  lifecycleState: ContentLifecycleState | null;
  regionCount: number;
  aliasCount: number;
  lureLinkCount: number;
  heroImageUrl: string | null;
  deletedAt: Date | null;
};

export type StudioSpeciesDetail = {
  id: string;
  slug: string;
  slugEn: string;
  slugTr: string;
  scientificName: string;
  nameEn: string;
  nameTr: string;
  editorialNotesEn: string | null;
  editorialNotesTr: string | null;
  deletedAt: Date | null;
  profile: {
    descriptionEn: string | null;
    descriptionTr: string | null;
    habitatEn: string | null;
    habitatTr: string | null;
    distributionEn: string | null;
    distributionTr: string | null;
    depthMinM: string | null;
    depthMaxM: string | null;
    spawningEn: string | null;
    spawningTr: string | null;
    maxLengthCm: string | null;
    maxWeightG: string | null;
    conservationEn: string | null;
    conservationTr: string | null;
    iucnStatus: string | null;
    lifecycleState: ContentLifecycleState;
  } | null;
  editorNote: {
    mediterraneanNotesEn: string | null;
    mediterraneanNotesTr: string | null;
    aegeanNotesEn: string | null;
    aegeanNotesTr: string | null;
    northernCyprusNotesEn: string | null;
    northernCyprusNotesTr: string | null;
    internalNotes: string | null;
  } | null;
  regionIds: string[];
  techniqueIds: string[];
  aliases: Array<{ id: string; alias: string; kind: string }>;
  confusions: Array<{
    id: string;
    confusedWithSpeciesId: string;
    confusedWithNameEn: string;
    confusedWithScientific: string;
    misappliedNameEn: string | null;
    misappliedNameTr: string | null;
    reasonEn: string;
    reasonTr: string;
  }>;
  images: Array<{
    id: string;
    url: string;
    role: "HERO" | "GALLERY";
    sortOrder: number;
    altTextEn: string | null;
    altTextTr: string | null;
    creditEn: string | null;
    creditTr: string | null;
    photographerEn: string | null;
    photographerTr: string | null;
    copyrightEn: string | null;
    copyrightTr: string | null;
  }>;
};

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function decimalInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? trimmed : null;
}

export type ListStudioSpeciesOptions = {
  q?: string;
  lifecycle?: ContentLifecycleState;
  includeArchived?: boolean;
  regionId?: string;
  sort?: "nameEn" | "nameTr" | "scientific" | "lifecycle" | "updated";
  page?: number;
  pageSize?: number;
};

export async function listStudioSpecies(
  options: ListStudioSpeciesOptions = {},
): Promise<{ rows: StudioSpeciesListRow[]; total: number; pageSize: number }> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 50;
  const q = options.q?.trim() ?? "";

  const where: Prisma.FishSpeciesWhereInput = {};

  if (!options.includeArchived) {
    where.deletedAt = null;
  } else {
    where.deletedAt = { not: null };
  }

  if (options.lifecycle) {
    where.profile = { lifecycleState: options.lifecycle };
  }

  if (options.regionId) {
    where.regionLinks = { some: { regionId: options.regionId } };
  }

  if (q) {
    const normalized = normalizeSpeciesLabel(q);
    where.OR = [
      { nameEn: { contains: q, mode: "insensitive" } },
      { nameTr: { contains: q, mode: "insensitive" } },
      { scientificName: { contains: q, mode: "insensitive" } },
      { slugEn: { contains: q, mode: "insensitive" } },
      { slugTr: { contains: q, mode: "insensitive" } },
      { aliases: { some: { aliasNormalized: { contains: normalized } } } },
    ];
  }

  const orderBy: Prisma.FishSpeciesOrderByWithRelationInput =
    options.sort === "nameTr"
      ? { nameTr: "asc" }
      : options.sort === "scientific"
        ? { scientificName: "asc" }
        : options.sort === "lifecycle"
          ? { profile: { lifecycleState: "asc" } }
          : options.sort === "updated"
            ? { updatedAt: "desc" }
            : { nameEn: "asc" };

  const [total, rows] = await Promise.all([
    prisma.fishSpecies.count({ where }),
    prisma.fishSpecies.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        profile: { select: { lifecycleState: true } },
        _count: {
          select: {
            aliases: { where: { deletedAt: null } },
            lureLinks: { where: { deletedAt: null } },
            regionLinks: true,
          },
        },
        images: {
          where: { deletedAt: null, role: "HERO" },
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { url: true },
        },
      },
    }),
  ]);

  return {
    total,
    pageSize,
    rows: rows.map((row) => ({
      id: row.id,
      slugEn: row.slugEn,
      slugTr: row.slugTr,
      scientificName: row.scientificName,
      nameEn: row.nameEn,
      nameTr: row.nameTr,
      lifecycleState: row.profile?.lifecycleState ?? null,
      regionCount: row._count.regionLinks,
      aliasCount: row._count.aliases,
      lureLinkCount: row._count.lureLinks,
      heroImageUrl: row.images[0]?.url ?? null,
      deletedAt: row.deletedAt,
    })),
  };
}

export async function getStudioSpeciesBySlugEn(
  slugEn: string,
): Promise<StudioSpeciesDetail | null> {
  const species = await prisma.fishSpecies.findFirst({
    where: { slugEn },
    include: {
      profile: true,
      editorNote: true,
      regionLinks: { select: { regionId: true } },
      techniqueLinks: {
        where: { deletedAt: null },
        select: { techniqueId: true },
      },
      aliases: {
        where: { deletedAt: null },
        orderBy: { alias: "asc" },
      },
      confusions: {
        include: {
          confusedWithSpecies: {
            select: { id: true, nameEn: true, scientificName: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      images: {
        where: { deletedAt: null },
        orderBy: [{ role: "asc" }, { sortOrder: "asc" }],
      },
    },
  });

  if (!species) return null;

  return {
    id: species.id,
    slug: species.slug,
    slugEn: species.slugEn,
    slugTr: species.slugTr,
    scientificName: species.scientificName,
    nameEn: species.nameEn,
    nameTr: species.nameTr,
    editorialNotesEn: species.editorialNotesEn,
    editorialNotesTr: species.editorialNotesTr,
    deletedAt: species.deletedAt,
    profile: species.profile
      ? {
          descriptionEn: species.profile.descriptionEn,
          descriptionTr: species.profile.descriptionTr,
          habitatEn: species.profile.habitatEn,
          habitatTr: species.profile.habitatTr,
          distributionEn: species.profile.distributionEn,
          distributionTr: species.profile.distributionTr,
          depthMinM: species.profile.depthMinM?.toString() ?? null,
          depthMaxM: species.profile.depthMaxM?.toString() ?? null,
          spawningEn: species.profile.spawningEn,
          spawningTr: species.profile.spawningTr,
          maxLengthCm: species.profile.maxLengthCm?.toString() ?? null,
          maxWeightG: species.profile.maxWeightG?.toString() ?? null,
          conservationEn: species.profile.conservationEn,
          conservationTr: species.profile.conservationTr,
          iucnStatus: species.profile.iucnStatus,
          lifecycleState: species.profile.lifecycleState,
        }
      : null,
    editorNote: species.editorNote,
    regionIds: species.regionLinks.map((link) => link.regionId),
    techniqueIds: species.techniqueLinks.map((link) => link.techniqueId),
    aliases: species.aliases.map((alias) => ({
      id: alias.id,
      alias: alias.alias,
      kind: alias.kind,
    })),
    confusions: species.confusions.map((confusion) => ({
      id: confusion.id,
      confusedWithSpeciesId: confusion.confusedWithSpeciesId,
      confusedWithNameEn: confusion.confusedWithSpecies.nameEn,
      confusedWithScientific: confusion.confusedWithSpecies.scientificName,
      misappliedNameEn: confusion.misappliedNameEn,
      misappliedNameTr: confusion.misappliedNameTr,
      reasonEn: confusion.reasonEn,
      reasonTr: confusion.reasonTr,
    })),
    images: species.images.map((image) => ({
      id: image.id,
      url: image.url,
      role: image.role,
      sortOrder: image.sortOrder,
      altTextEn: image.altTextEn,
      altTextTr: image.altTextTr,
      creditEn: image.creditEn,
      creditTr: image.creditTr,
      photographerEn: image.photographerEn,
      photographerTr: image.photographerTr,
      copyrightEn: image.copyrightEn,
      copyrightTr: image.copyrightTr,
    })),
  };
}

export async function listSpeciesOptionsForStudio(): Promise<
  Array<{ id: string; nameEn: string; scientificName: string }>
> {
  return prisma.fishSpecies.findMany({
    where: { deletedAt: null },
    orderBy: { nameEn: "asc" },
    select: { id: true, nameEn: true, scientificName: true },
  });
}

export async function upsertSpeciesFromStudioInput(
  speciesId: string | null,
  data: SpeciesSaveInput,
): Promise<{ id: string; slugEn: string }> {
  const profileData = {
    descriptionEn: emptyToNull(data.profile.descriptionEn),
    descriptionTr: emptyToNull(data.profile.descriptionTr),
    habitatEn: emptyToNull(data.profile.habitatEn),
    habitatTr: emptyToNull(data.profile.habitatTr),
    distributionEn: emptyToNull(data.profile.distributionEn),
    distributionTr: emptyToNull(data.profile.distributionTr),
    depthMinM: decimalInput(data.profile.depthMinM),
    depthMaxM: decimalInput(data.profile.depthMaxM),
    spawningEn: emptyToNull(data.profile.spawningEn),
    spawningTr: emptyToNull(data.profile.spawningTr),
    maxLengthCm: decimalInput(data.profile.maxLengthCm),
    maxWeightG: decimalInput(data.profile.maxWeightG),
    conservationEn: emptyToNull(data.profile.conservationEn),
    conservationTr: emptyToNull(data.profile.conservationTr),
    iucnStatus: data.profile.iucnStatus ?? null,
    lifecycleState: data.profile.lifecycleState,
  };

  const editorNoteData = {
    mediterraneanNotesEn: emptyToNull(data.editorNote.mediterraneanNotesEn),
    mediterraneanNotesTr: emptyToNull(data.editorNote.mediterraneanNotesTr),
    aegeanNotesEn: emptyToNull(data.editorNote.aegeanNotesEn),
    aegeanNotesTr: emptyToNull(data.editorNote.aegeanNotesTr),
    northernCyprusNotesEn: emptyToNull(data.editorNote.northernCyprusNotesEn),
    northernCyprusNotesTr: emptyToNull(data.editorNote.northernCyprusNotesTr),
    internalNotes: emptyToNull(data.editorNote.internalNotes),
  };

  return prisma.$transaction(async (tx) => {
    const core = {
      slug: data.slugEn.trim(),
      slugEn: data.slugEn.trim(),
      slugTr: data.slugTr.trim(),
      scientificName: data.scientificName.trim(),
      nameEn: data.nameEn.trim(),
      nameTr: data.nameTr.trim(),
      editorialNotesEn: emptyToNull(data.editorialNotesEn),
      editorialNotesTr: emptyToNull(data.editorialNotesTr),
    };

    const species = speciesId
      ? await tx.fishSpecies.update({ where: { id: speciesId }, data: core })
      : await tx.fishSpecies.create({ data: core });

    await tx.speciesProfile.upsert({
      where: { fishSpeciesId: species.id },
      create: { fishSpeciesId: species.id, ...profileData },
      update: profileData,
    });

    await tx.speciesEditorNote.upsert({
      where: { fishSpeciesId: species.id },
      create: { fishSpeciesId: species.id, ...editorNoteData },
      update: editorNoteData,
    });

    await tx.fishSpeciesRegion.deleteMany({ where: { fishSpeciesId: species.id } });
    if (data.regionIds.length > 0) {
      await tx.fishSpeciesRegion.createMany({
        data: data.regionIds.map((regionId) => ({
          fishSpeciesId: species.id,
          regionId,
        })),
        skipDuplicates: true,
      });
    }

    await tx.speciesTechnique.deleteMany({ where: { fishSpeciesId: species.id } });
    if (data.techniqueIds.length > 0) {
      await tx.speciesTechnique.createMany({
        data: data.techniqueIds.map((techniqueId) => ({
          fishSpeciesId: species.id,
          techniqueId,
        })),
        skipDuplicates: true,
      });
    }

    await tx.speciesAlias.updateMany({
      where: { fishSpeciesId: species.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (data.aliases.length > 0) {
      await tx.speciesAlias.createMany({
        data: data.aliases.map((alias) => ({
          fishSpeciesId: species.id,
          alias: alias.alias.trim(),
          aliasNormalized: normalizeSpeciesLabel(alias.alias),
          kind: alias.kind,
          locale: "any",
        })),
      });
    }

    return { id: species.id, slugEn: species.slugEn };
  });
}

export async function setSpeciesProfileLifecycle(
  speciesId: string,
  lifecycleState: ContentLifecycleState,
): Promise<string> {
  const profile = await prisma.speciesProfile.upsert({
    where: { fishSpeciesId: speciesId },
    create: { fishSpeciesId: speciesId, lifecycleState },
    update: { lifecycleState },
    select: { fishSpecies: { select: { slugEn: true } } },
  });
  return profile.fishSpecies.slugEn;
}

export async function archiveSpeciesRecord(speciesId: string): Promise<string> {
  const species = await prisma.fishSpecies.update({
    where: { id: speciesId },
    data: { deletedAt: new Date() },
    select: { slugEn: true },
  });

  await prisma.speciesProfile.updateMany({
    where: { fishSpeciesId: speciesId },
    data: { lifecycleState: "ARCHIVED" },
  });

  return species.slugEn;
}

export async function restoreSpeciesRecord(speciesId: string): Promise<string> {
  const existing = await prisma.fishSpecies.findFirst({
    where: { id: speciesId },
    include: { profile: { select: { lifecycleState: true } } },
  });
  if (!existing) throw new Error("Species not found");

  const restoreLifecycle =
    existing.profile?.lifecycleState === "ARCHIVED"
      ? "PENDING_REVIEW"
      : (existing.profile?.lifecycleState ?? "DRAFT");

  await prisma.fishSpecies.update({
    where: { id: speciesId },
    data: { deletedAt: null },
  });

  await prisma.speciesProfile.upsert({
    where: { fishSpeciesId: speciesId },
    create: { fishSpeciesId: speciesId, lifecycleState: restoreLifecycle },
    update: { lifecycleState: restoreLifecycle },
  });

  return existing.slugEn;
}

export async function saveSpeciesConfusions(
  speciesId: string,
  confusions: Array<{
    confusedWithSpeciesId: string;
    misappliedNameEn: string;
    misappliedNameTr: string;
    reasonEn: string;
    reasonTr: string;
  }>,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.speciesConfusion.deleteMany({ where: { fishSpeciesId: speciesId } });
    if (confusions.length === 0) return;
    await tx.speciesConfusion.createMany({
      data: confusions.map((confusion) => ({
        fishSpeciesId: speciesId,
        confusedWithSpeciesId: confusion.confusedWithSpeciesId,
        misappliedNameEn: emptyToNull(confusion.misappliedNameEn),
        misappliedNameTr: emptyToNull(confusion.misappliedNameTr),
        reasonEn: confusion.reasonEn.trim(),
        reasonTr: confusion.reasonTr.trim(),
      })),
    });
  });
}

export const PUBLIC_SPECIES_LIST_WHERE: Prisma.FishSpeciesWhereInput = {
  deletedAt: null,
  profile: PUBLIC_SPECIES_PROFILE_WHERE,
};

import { prisma } from "@/lib/prisma";

export type TechnologyEncyclopediaEntry = {
  id: string;
  slug: string;
  nameEn: string;
  descriptionEn: string | null;
  descriptionTr: string | null;
  patentNote: string | null;
  imageUrl: string | null;
  manufacturer: {
    id: string;
    slug: string;
    nameEn: string;
  };
  images: { id: string; url: string; altTextEn: string | null }[];
  products: {
    id: string;
    slug: string;
    nameEn: string;
  }[];
  relatedTechnologies: {
    id: string;
    slug: string;
    nameEn: string;
  }[];
};

export async function getTechnologyEncyclopediaEntry(
  technologyId: string,
): Promise<TechnologyEncyclopediaEntry | null> {
  const tech = await prisma.manufacturerTechnology.findUnique({
    where: { id: technologyId },
    include: {
      manufacturer: { select: { id: true, slug: true, nameEn: true } },
      images: { orderBy: { sortOrder: "asc" } },
      lureLinks: {
        include: {
          lureModel: {
            select: { id: true, slug: true, nameEn: true, deletedAt: true },
          },
        },
        take: 24,
      },
    },
  });

  if (!tech) return null;

  const related = await prisma.manufacturerTechnology.findMany({
    where: {
      manufacturerId: tech.manufacturerId,
      id: { not: tech.id },
    },
    orderBy: { nameEn: "asc" },
    take: 8,
    select: { id: true, slug: true, nameEn: true },
  });

  return {
    id: tech.id,
    slug: tech.slug,
    nameEn: tech.nameEn,
    descriptionEn: tech.descriptionEn,
    descriptionTr: tech.descriptionTr,
    patentNote: tech.patentNote,
    imageUrl: tech.imageUrl,
    manufacturer: tech.manufacturer,
    images: tech.images.map((img) => ({
      id: img.id,
      url: img.url,
      altTextEn: img.altTextEn,
    })),
    products: tech.lureLinks
      .map((link) => link.lureModel)
      .filter((model) => model.deletedAt === null)
      .map((model) => ({
        id: model.id,
        slug: model.slug,
        nameEn: model.nameEn,
      })),
    relatedTechnologies: related,
  };
}

export async function listManufacturerTechnologies(manufacturerId: string) {
  return prisma.manufacturerTechnology.findMany({
    where: { manufacturerId },
    orderBy: { nameEn: "asc" },
    select: {
      id: true,
      slug: true,
      nameEn: true,
      descriptionEn: true,
      _count: { select: { lureLinks: true } },
    },
  });
}

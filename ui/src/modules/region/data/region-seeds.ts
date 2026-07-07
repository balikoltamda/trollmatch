import type { Prisma } from "@/generated/prisma/client";

export type RegionSeed = {
  id: string;
  slug: string;
  code: string;
  nameEn: string;
  nameTr: string;
  descriptionEn: string;
  descriptionTr: string;
  displayOrder: number;
};

/** Canonical fishing regions — country/major water body scope only (no cities, no GPS). */
export const REGION_SEEDS: RegionSeed[] = [
  {
    id: "f1000001-0000-4000-8000-000000000001",
    slug: "black-sea",
    code: "BLACK_SEA",
    nameEn: "Black Sea",
    nameTr: "Karadeniz",
    descriptionEn:
      "Turkish and northern Anatolian Black Sea coast — pelagics, bonito runs, and shore fishing.",
    descriptionTr:
      "Türkiye ve kuzey Anadolu Karadeniz kıyıları — palamut avları, kıyı ve tekne balıkçılığı.",
    displayOrder: 1,
  },
  {
    id: "f1000002-0000-4000-8000-000000000002",
    slug: "sea-of-marmara",
    code: "MARMARA",
    nameEn: "Sea of Marmara",
    nameTr: "Marmara Denizi",
    descriptionEn:
      "Istanbul Strait, Marmara, and Dardanelles approaches — mixed salinity and strong tidal fishing.",
    descriptionTr:
      "İstanbul Boğazı, Marmara ve Çanakkale geçişleri — karışık tuzluluk ve gelgitli av alanları.",
    displayOrder: 2,
  },
  {
    id: "f1000003-0000-4000-8000-000000000003",
    slug: "aegean-sea",
    code: "AEGEAN",
    nameEn: "Aegean Sea",
    nameTr: "Ege Denizi",
    descriptionEn:
      "Western and southern Turkish Aegean — islands, reefs, and seasonal pelagic runs.",
    descriptionTr:
      "Türkiye'nin batı ve güney Ege kıyıları — adalar, kayalıklar ve mevsimlik palagik avlar.",
    displayOrder: 3,
  },
  {
    id: "f1000004-0000-4000-8000-000000000004",
    slug: "turkish-mediterranean-coast",
    code: "TURKISH_MEDITERRANEAN",
    nameEn: "Turkish Mediterranean Coast",
    nameTr: "Türkiye Akdeniz kıyıları",
    descriptionEn:
      "Antalya to Hatay Mediterranean coast — offshore trolling, reef species, and winter leerfish.",
    descriptionTr:
      "Antalya'dan Hatay'a Akdeniz kıyıları — açık deniz trolling, kaya balıkçılığı ve kış sarıkanat avları.",
    displayOrder: 4,
  },
  {
    id: "f1000005-0000-4000-8000-000000000005",
    slug: "northern-cyprus-waters",
    code: "NORTHERN_CYPRUS",
    nameEn: "Northern Cyprus Waters",
    nameTr: "Kuzey Kıbrıs suları",
    descriptionEn:
      "Northern Cyprus coast and offshore — seasonal pelagics and shore fishing around the island.",
    descriptionTr:
      "Kuzey Kıbrıs kıyı ve açık deniz avları — adanın çevresinde mevsimlik palagik ve kıyı balıkçılığı.",
    displayOrder: 5,
  },
];

export function regionSeedToCreate(seed: RegionSeed): Prisma.RegionCreateInput {
  return {
    id: seed.id,
    slug: seed.slug,
    code: seed.code,
    nameEn: seed.nameEn,
    nameTr: seed.nameTr,
    descriptionEn: seed.descriptionEn,
    descriptionTr: seed.descriptionTr,
    displayOrder: seed.displayOrder,
    isActive: true,
  };
}

export function regionSeedToUpdate(seed: RegionSeed): Prisma.RegionUpdateInput {
  return {
    code: seed.code,
    nameEn: seed.nameEn,
    nameTr: seed.nameTr,
    descriptionEn: seed.descriptionEn,
    descriptionTr: seed.descriptionTr,
    displayOrder: seed.displayOrder,
  };
}

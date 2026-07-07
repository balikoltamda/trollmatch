import { prisma } from "@/lib/prisma";
import {
  REGION_SEEDS,
  regionSeedToCreate,
  regionSeedToUpdate,
} from "@/modules/region/data/region-seeds";

export async function ensureRegionSeeds(): Promise<number> {
  let touched = 0;

  for (const seed of REGION_SEEDS) {
    const existing = await prisma.region.findUnique({
      where: { slug: seed.slug },
      select: { id: true },
    });

    if (existing) {
      await prisma.region.update({
        where: { slug: seed.slug },
        data: regionSeedToUpdate(seed),
      });
    } else {
      await prisma.region.create({ data: regionSeedToCreate(seed) });
    }

    touched += 1;
  }

  return touched;
}

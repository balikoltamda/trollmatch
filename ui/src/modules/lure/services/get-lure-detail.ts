import { prismaLureRepository } from "@/modules/lure/repositories/prisma-lure-repository";
import type { LureRepository } from "@/modules/lure/repositories/lure-repository";
import type {
  LureDetail,
  LureDetailParams,
} from "@/modules/lure/types/lure-detail";

export {
  getActiveVariant,
  localize,
  formatPatternCount,
} from "@/modules/lure/lib/lure-display";

const defaultRepository: LureRepository = prismaLureRepository;

export async function getLureDetail(
  params: LureDetailParams,
  repository: LureRepository = defaultRepository,
): Promise<LureDetail | null> {
  return repository.getBySlug(params);
}

export async function getLureSlugs(
  repository: LureRepository = defaultRepository,
): Promise<string[]> {
  return repository.getAllSlugs();
}

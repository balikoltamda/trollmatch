import { prismaLureRepository } from "@/modules/lure/repositories/prisma-lure-repository";
import type { LureRepository } from "@/modules/lure/repositories/lure-repository";
import type {
  LureDetail,
  LureDetailParams,
} from "@/modules/lure/types/lure-detail";

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

export function getActiveVariant(
  lure: LureDetail,
  variantId?: string,
): LureDetail["variants"][number] {
  const match = lure.variants.find((v) => v.id === variantId);
  if (match) return match;
  return (
    lure.variants.find((v) => v.id === lure.defaultVariantId) ??
    lure.variants[0]
  );
}

export function localize<T extends Record<string, string>>(
  value: T,
  locale: keyof T,
): string {
  return value[locale] ?? value.en ?? Object.values(value)[0] ?? "";
}

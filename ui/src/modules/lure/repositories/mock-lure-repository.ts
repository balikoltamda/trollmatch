import {
  MOCK_LURES,
  MOCK_LURE_SLUGS,
} from "@/modules/lure/data/mock-lures";
import type { LureRepository } from "@/modules/lure/repositories/lure-repository";
import type {
  LureDetail,
  LureDetailParams,
} from "@/modules/lure/types/lure-detail";

function resolveVariant(
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

export const mockLureRepository: LureRepository = {
  async getBySlug({ slug, variantId }: LureDetailParams) {
    const lure = MOCK_LURES[slug];
    if (!lure) return null;

    const variant = resolveVariant(lure, variantId);

    return {
      ...lure,
      specifications: {
        ...lure.specifications,
        lengthMm: variant.lengthMm,
        weightG: variant.weightG,
      },
    };
  },

  async getAllSlugs() {
    return MOCK_LURE_SLUGS;
  },
};

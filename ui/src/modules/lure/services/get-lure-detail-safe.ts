import type { DataFetchResult } from "@/lib/data-result";
import { prismaLureRepository } from "@/modules/lure/repositories/prisma-lure-repository";
import type {
  LureDetail,
  LureDetailParams,
} from "@/modules/lure/types/lure-detail";

export async function getLureDetailResult(
  params: LureDetailParams,
): Promise<DataFetchResult<LureDetail>> {
  return prismaLureRepository.getBySlugResult(params);
}

export { getActiveVariant } from "@/modules/lure/services/get-lure-detail";

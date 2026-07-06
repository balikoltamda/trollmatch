import type {
  LureDetail,
  LureDetailParams,
} from "@/modules/lure/types/lure-detail";

export type LureRepository = {
  getBySlug(params: LureDetailParams): Promise<LureDetail | null>;
  getBySlugResult(params: LureDetailParams): Promise<
    import("@/lib/data-result").DataFetchResult<LureDetail>
  >;
  getAllSlugs(): Promise<string[]>;
};

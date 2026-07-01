import type {
  LureDetail,
  LureDetailParams,
} from "@/modules/lure/types/lure-detail";

export type LureRepository = {
  getBySlug(params: LureDetailParams): Promise<LureDetail | null>;
  getAllSlugs(): Promise<string[]>;
};

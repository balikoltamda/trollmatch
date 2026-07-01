import type {
  LureDetail,
  LureDetailParams,
} from "@/features/lures/types/lure-detail";

export type LureRepository = {
  getBySlug(params: LureDetailParams): Promise<LureDetail | null>;
  getAllSlugs(): Promise<string[]>;
};

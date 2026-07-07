export type {
  RegionEditForm,
  RegionListItem,
  RegionRecord,
  RegionSearchParams,
  SaveRegionInput,
} from "@/modules/region/types";

export {
  saveRegion,
  setRegionActive,
  moveRegion,
} from "@/modules/region/actions/region-actions";

export { ensureRegionSeeds } from "@/modules/region/data/seed-regions";
export { REGION_SEEDS } from "@/modules/region/data/region-seeds";

export {
  countRegions,
  getRegionBySlug,
  listRegions,
} from "@/modules/region/repositories/region-repository";

export { regionEditSchema } from "@/modules/region/lib/validation";

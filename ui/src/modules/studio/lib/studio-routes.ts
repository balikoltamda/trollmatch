/** Canonical Studio routes — do not hardcode "/studio/..." in components. */
export const STUDIO_SOURCE_ARCHIVE_PATH = "/studio/source-archive" as const;
export const STUDIO_SOURCE_ARCHIVE_LEGACY_PATH = "/studio/knowledge" as const;

export const STUDIO_SPECIES_PATH = "/studio/species" as const;
export const studioSpeciesDetailPath = (slugEn: string) =>
  `${STUDIO_SPECIES_PATH}/${slugEn}` as const;
export const STUDIO_SPECIES_NEW_PATH = `${STUDIO_SPECIES_PATH}/new` as const;

export const STUDIO_REGIONS_PATH = "/studio/regions" as const;
export const studioRegionDetailPath = (slug: string) =>
  `${STUDIO_REGIONS_PATH}/${slug}` as const;

export const STUDIO_PRODUCTS_PATH = "/studio/products" as const;
export const studioProductDetailPath = (id: string) =>
  `${STUDIO_PRODUCTS_PATH}/${id}` as const;

export const STUDIO_TECHNIQUES_PATH = "/studio/techniques" as const;
export const STUDIO_TECHNIQUES_NEW_PATH = `${STUDIO_TECHNIQUES_PATH}/new` as const;
export const STUDIO_MEDIA_PATH = "/studio/media" as const;
export const STUDIO_MANUFACTURERS_PATH = "/studio/manufacturers" as const;
export const STUDIO_IMPORT_PATH = "/studio/import" as const;
export const STUDIO_COMMUNITY_REPORTS_PATH = "/studio/community/reports" as const;
export const STUDIO_INTELLIGENCE_PATH = "/studio/intelligence" as const;
export const STUDIO_WORK_QUEUE_PATH = "/studio/work-queue" as const;

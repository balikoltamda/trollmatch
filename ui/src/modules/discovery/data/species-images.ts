/** Static species photography keyed by fish_species.slug — no DB column required. */
export const SPECIES_IMAGE_BY_SLUG: Record<string, string> = {
  bluefish: "/species/bluefish.jpg",
  "european-seabass": "/species/european-seabass.jpg",
  bonito: "/species/bonito.jpg",
  "gilthead-seabream": "/species/gilthead-seabream.jpg",
};

export function getSpeciesImageSrc(slug: string): string | null {
  return SPECIES_IMAGE_BY_SLUG[slug] ?? null;
}

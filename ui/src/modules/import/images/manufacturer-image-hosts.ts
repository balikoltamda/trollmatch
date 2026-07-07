/** Hostnames allowed for next/image remote optimization (manufacturer CDNs + site). */
export const MANUFACTURER_IMAGE_HOSTS = [
  "www.duel.co.jp",
  "duel.co.jp",
  "www.halco.com.au",
  "halco.com.au",
  "www.maria.co.jp",
  "maria.co.jp",
  "guide.balikoltamda.net",
  "dev.balikoltamda.net",
] as const;

export type ManufacturerImageHost = (typeof MANUFACTURER_IMAGE_HOSTS)[number];

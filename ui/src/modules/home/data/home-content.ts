export type HomeSpecies = {
  id: string;
  name: { en: string; tr: string };
  habitat: { en: string; tr: string };
  lureCount: number;
};

export type HomeCollection = {
  id: string;
  title: { en: string; tr: string };
  description: { en: string; tr: string };
  lureCount: number;
  accent: "ocean" | "turquoise" | "navy";
};

export type HomeManufacturer = {
  id: string;
  name: string;
  country: string;
  productCount: number;
  status: "active" | "importing";
};

export type HomeLure = {
  slug: string;
  manufacturer: { en: string; tr: string };
  modelName: { en: string; tr: string };
  formFactor: { en: string; tr: string };
  imageSrc: string;
  verified: boolean;
};

export type HomeStatistic = {
  id: string;
  label: { en: string; tr: string };
  value: string;
  hint: { en: string; tr: string };
  accent: "ocean" | "turquoise" | "coral" | "navy";
};

export const HOME_SPECIES: HomeSpecies[] = [
  {
    id: "yellowfin-tuna",
    name: { en: "Yellowfin tuna", tr: "Sarıkanat ton balığı" },
    habitat: { en: "Pelagic · offshore", tr: "Pelagik · açık deniz" },
    lureCount: 128,
  },
  {
    id: "striped-bass",
    name: { en: "Striped bass", tr: "Çizgili levrek" },
    habitat: { en: "Inshore · surf", tr: "Kıyı · sörf" },
    lureCount: 94,
  },
  {
    id: "bluefish",
    name: { en: "Bluefish", tr: "Lüfer" },
    habitat: { en: "Coastal · current", tr: "Kıyı · akıntı" },
    lureCount: 76,
  },
  {
    id: "wahoo",
    name: { en: "Wahoo", tr: "Wahoo" },
    habitat: { en: "Tropical · high speed", tr: "Tropikal · yüksek hız" },
    lureCount: 52,
  },
];

export const HOME_COLLECTIONS: HomeCollection[] = [
  {
    id: "offshore-trolling",
    title: { en: "Offshore trolling", tr: "Açık deniz trolling" },
    description: {
      en: "Deep-diving hard baits for pelagic predators.",
      tr: "Pelagik avcılar için derin dalar sert yemler.",
    },
    lureCount: 214,
    accent: "ocean",
  },
  {
    id: "shore-jigging",
    title: { en: "Shore jigging", tr: "Kıyı jigging" },
    description: {
      en: "Metal and minnow profiles for active coastlines.",
      tr: "Aktif kıyı hatları için metal ve minnow profilleri.",
    },
    lureCount: 167,
    accent: "turquoise",
  },
  {
    id: "topwater",
    title: { en: "Topwater arsenal", tr: "Yüzey yem koleksiyonu" },
    description: {
      en: "Poppers and stickbaits for surface strikes.",
      tr: "Yüzey saldırıları için popper ve stickbait.",
    },
    lureCount: 143,
    accent: "navy",
  },
];

export const HOME_MANUFACTURERS: HomeManufacturer[] = [
  { id: "duel", name: "DUEL", country: "JP", productCount: 420, status: "active" },
  { id: "halco", name: "Halco", country: "AU", productCount: 186, status: "active" },
  { id: "shimano", name: "Shimano", country: "JP", productCount: 0, status: "importing" },
  { id: "yozuri", name: "Yo-Zuri", country: "JP", productCount: 0, status: "importing" },
  { id: "maria", name: "Maria", country: "JP", productCount: 0, status: "importing" },
  { id: "daiwa", name: "Daiwa", country: "JP", productCount: 0, status: "importing" },
];

export const HOME_LURES: HomeLure[] = [
  {
    slug: "laser-pro-190-dd",
    manufacturer: { en: "Halco", tr: "Halco" },
    modelName: { en: "Laser Pro 190 DD", tr: "Laser Pro 190 DD" },
    formFactor: {
      en: "Deep-diving minnow · offshore trolling",
      tr: "Derin dalar minnow · offshore trolling",
    },
    imageSrc: "/lures/halco-laser-pro-190-dd.svg",
    verified: true,
  },
  {
    slug: "duel-hardcore-minnow",
    manufacturer: { en: "DUEL", tr: "DUEL" },
    modelName: { en: "Hardcore Minnow 120F", tr: "Hardcore Minnow 120F" },
    formFactor: {
      en: "Floating minnow · casting",
      tr: "Yüzen minnow · casting",
    },
    imageSrc: "/lures/placeholder.svg",
    verified: false,
  },
  {
    slug: "duel-surface-pencil",
    manufacturer: { en: "DUEL", tr: "DUEL" },
    modelName: { en: "Surface Pencil 140", tr: "Surface Pencil 140" },
    formFactor: {
      en: "Stickbait · topwater",
      tr: "Stickbait · topwater",
    },
    imageSrc: "/lures/placeholder.svg",
    verified: false,
  },
  {
    slug: "duel-deep-diver",
    manufacturer: { en: "DUEL", tr: "DUEL" },
    modelName: { en: "Deep Diver 160", tr: "Deep Diver 160" },
    formFactor: {
      en: "Crankbait · trolling",
      tr: "Crankbait · trolling",
    },
    imageSrc: "/lures/placeholder.svg",
    verified: false,
  },
];

export const HOME_STATISTICS: HomeStatistic[] = [
  {
    id: "lures",
    label: { en: "Catalogued lures", tr: "Kataloglanan yemler" },
    value: "1,240+",
    hint: {
      en: "Manufacturer-verified models across active importers.",
      tr: "Aktif içe aktarıcılar genelinde üretici doğrulamalı modeller.",
    },
    accent: "ocean",
  },
  {
    id: "manufacturers",
    label: { en: "Manufacturers", tr: "Üreticiler" },
    value: "7",
    hint: {
      en: "Global hard-bait brands in the import registry.",
      tr: "İçe aktarma kayıt defterindeki global sert yem markaları.",
    },
    accent: "turquoise",
  },
  {
    id: "species",
    label: { en: "Target species", tr: "Hedef türler" },
    value: "180+",
    hint: {
      en: "Curated compatibility links from factory and field data.",
      tr: "Fabrika ve saha verisinden küratörlü uyumluluk bağlantıları.",
    },
    accent: "navy",
  },
  {
    id: "imports",
    label: { en: "Weekly imports", tr: "Haftalık içe aktarma" },
    value: "12",
    hint: {
      en: "Incremental catalog syncs with full audit reports.",
      tr: "Tam denetim raporlarıyla artımlı katalog senkronları.",
    },
    accent: "coral",
  },
];

export function pickLocalized<T extends { en: string; tr: string }>(
  value: T,
  locale: "en" | "tr",
): string {
  return locale === "tr" ? value.tr : value.en;
}

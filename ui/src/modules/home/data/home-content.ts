/** Default regional lens for homepage curation until global scale. */
export const DEFAULT_HOME_REGION = {
  id: "eastern-mediterranean",
  label: { en: "Aegean & Eastern Mediterranean", tr: "Ege & Doğu Akdeniz" },
  scope: {
    en: "Turkey · Northern Cyprus · Aegean Sea",
    tr: "Türkiye · Kıbrıs · Ege",
  },
} as const;

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
    id: "bluefish",
    name: { en: "Bluefish", tr: "Lüfer" },
    habitat: {
      en: "Bosphorus · Marmara · strait runs",
      tr: "Boğaz · Marmara · göç zamanı",
    },
    lureCount: 86,
  },
  {
    id: "european-seabass",
    name: { en: "European seabass", tr: "Levrek" },
    habitat: {
      en: "Aegean bays · rocky shore",
      tr: "Ege koyları · kayalık",
    },
    lureCount: 112,
  },
  {
    id: "bonito",
    name: { en: "Atlantic bonito", tr: "Palamut" },
    habitat: {
      en: "Autumn migration · offshore trolling",
      tr: "Sonbahar göçü · açık trolling",
    },
    lureCount: 74,
  },
  {
    id: "gilthead-seabream",
    name: { en: "Gilthead seabream", tr: "Çipura" },
    habitat: {
      en: "Eastern Mediterranean · inshore",
      tr: "Doğu Akdeniz · kıyı",
    },
    lureCount: 68,
  },
];

export const HOME_COLLECTIONS: HomeCollection[] = [
  {
    id: "bosphorus-bluefish",
    title: { en: "Strait bluefish run", tr: "Boğaz lüferi" },
    description: {
      en: "Metals and slim minnows for Bosphorus and Marmara current lines.",
      tr: "Boğaz ve Marmara akıntısına metal ve ince minnow — lüfer için.",
    },
    lureCount: 94,
    accent: "ocean",
  },
  {
    id: "aegean-shore",
    title: { en: "Aegean shore casting", tr: "Ege kıyısı spin" },
    description: {
      en: "Jigs, spoons, and minnows for levrek and çipura from the rocks.",
      tr: "Kayalıktan levrek, çipura — jig, kaşık, minnow.",
    },
    lureCount: 128,
    accent: "turquoise",
  },
  {
    id: "med-topwater-trolling",
    title: { en: "Topwater & trolling", tr: "Yüzey ve trolling" },
    description: {
      en: "Stickbaits and diving minnows for palamut and offshore passes.",
      tr: "Palamut ve açık geçişler — stickbait, dalar minnow.",
    },
    lureCount: 103,
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
      en: "Deep-diving minnow · palamut trolling",
      tr: "Derin dalar · palamut trolling",
    },
    imageSrc: "/lures/halco-laser-pro-190-dd.svg",
    verified: true,
  },
  {
    slug: "duel-hardcore-minnow",
    manufacturer: { en: "DUEL", tr: "DUEL" },
    modelName: { en: "Hardcore Minnow 120F", tr: "Hardcore Minnow 120F" },
    formFactor: {
      en: "Floating minnow · lüfer & levrek casting",
      tr: "Yüzen minnow · lüfer, levrek spin",
    },
    imageSrc: "/lures/placeholder.svg",
    verified: false,
  },
  {
    slug: "duel-surface-pencil",
    manufacturer: { en: "DUEL", tr: "DUEL" },
    modelName: { en: "Surface Pencil 140", tr: "Surface Pencil 140" },
    formFactor: {
      en: "Stickbait · palamut & lüfer topwater",
      tr: "Stickbait · palamut, lüfer yüzey",
    },
    imageSrc: "/lures/placeholder.svg",
    verified: false,
  },
  {
    slug: "duel-deep-diver",
    manufacturer: { en: "DUEL", tr: "DUEL" },
    modelName: { en: "Deep Diver 160", tr: "Deep Diver 160" },
    formFactor: {
      en: "Crankbait · Aegean shore trolling",
      tr: "Crankbait · Ege kıyısı trolling",
    },
    imageSrc: "/lures/placeholder.svg",
    verified: false,
  },
];

export const HOME_STATISTICS: HomeStatistic[] = [
  {
    id: "lures",
    label: { en: "Lures in the guide", tr: "Kayıtlı yemler" },
    value: "1,240+",
    hint: {
      en: "Box specs we've logged from manufacturers.",
      tr: "Üreticilerin kutusunda yazan bilgiler.",
    },
    accent: "ocean",
  },
  {
    id: "manufacturers",
    label: { en: "Brands", tr: "Markalar" },
    value: "7",
    hint: {
      en: "Hard-bait makers — box specs on file, more being added.",
      tr: "Kutu bilgilerini tuttuğumuz sert yem markaları — yenileri ekleniyor.",
    },
    accent: "turquoise",
  },
  {
    id: "species",
    label: { en: "Target species", tr: "Avlanan türler" },
    value: "180+",
    hint: {
      en: "Species linked to lures — from box labels and angler reports.",
      tr: "Yemlere bağlı türler — kutu etiketleri ve balıkçı bildirimleri.",
    },
    accent: "navy",
  },
  {
    id: "imports",
    label: { en: "Weekly updates", tr: "Haftalık yenilik" },
    value: "12",
    hint: {
      en: "New box listings added from manufacturer pages.",
      tr: "Üretici sitelerinden eklenen yeni kutu listeleri.",
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

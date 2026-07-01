import type { AppLocale } from "@/i18n/routing";

type LocalizedLabel = Record<AppLocale, string>;

export type AddLureManufacturer = {
  id: string;
  label: LocalizedLabel;
};

export type AddLureModel = {
  id: string;
  manufacturerId: string;
  label: LocalizedLabel;
};

export type AddLureVariant = {
  id: string;
  modelId: string;
  label: LocalizedLabel;
};

export type AddLureColor = {
  id: string;
  variantId: string;
  code: string;
  label: LocalizedLabel;
};

export const ADD_LURE_MANUFACTURERS: AddLureManufacturer[] = [
  { id: "halco", label: { tr: "Halco", en: "Halco" } },
  { id: "rapala", label: { tr: "Rapala", en: "Rapala" } },
  { id: "yo-zuri", label: { tr: "Yo-Zuri", en: "Yo-Zuri" } },
  { id: "nomad-design", label: { tr: "Nomad Design", en: "Nomad Design" } },
];

export const ADD_LURE_MODELS: AddLureModel[] = [
  {
    id: "laser-pro-190-dd",
    manufacturerId: "halco",
    label: { tr: "Laser Pro 190 DD", en: "Laser Pro 190 DD" },
  },
  {
    id: "max-rap",
    manufacturerId: "rapala",
    label: { tr: "Max Rap", en: "Max Rap" },
  },
  {
    id: "x-rap-magnum",
    manufacturerId: "rapala",
    label: { tr: "X-Rap Magnum", en: "X-Rap Magnum" },
  },
  {
    id: "3d-inshore-minnow",
    manufacturerId: "yo-zuri",
    label: { tr: "3D Inshore Minnow", en: "3D Inshore Minnow" },
  },
  {
    id: "madmacs-200",
    manufacturerId: "nomad-design",
    label: { tr: "Madmacs 200", en: "Madmacs 200" },
  },
];

export const ADD_LURE_VARIANTS: AddLureVariant[] = [
  {
    id: "h70-redhead",
    modelId: "laser-pro-190-dd",
    label: { tr: "190 mm · H70 Redhead", en: "190 mm · H70 Redhead" },
  },
  {
    id: "h81-green-mackerel",
    modelId: "laser-pro-190-dd",
    label: {
      tr: "190 mm · H81 Green Mackerel",
      en: "190 mm · H81 Green Mackerel",
    },
  },
  {
    id: "silver-18cm",
    modelId: "max-rap",
    label: { tr: "18 cm · Silver", en: "18 cm · Silver" },
  },
  {
    id: "xr30-silver",
    modelId: "x-rap-magnum",
    label: { tr: "30 cm · Silver", en: "30 cm · Silver" },
  },
  {
    id: "125mm-ayu",
    modelId: "3d-inshore-minnow",
    label: { tr: "125 mm · Ayu", en: "125 mm · Ayu" },
  },
  {
    id: "200-skipper",
    modelId: "madmacs-200",
    label: { tr: "200 mm · Skipper", en: "200 mm · Skipper" },
  },
];

export const ADD_LURE_COLORS: AddLureColor[] = [
  {
    id: "h70-redhead",
    variantId: "h70-redhead",
    code: "H70",
    label: { tr: "H70 Redhead", en: "H70 Redhead" },
  },
  {
    id: "h81-green-mackerel",
    variantId: "h81-green-mackerel",
    code: "H81",
    label: { tr: "H81 Green Mackerel", en: "H81 Green Mackerel" },
  },
  {
    id: "silver",
    variantId: "silver-18cm",
    code: "SLV",
    label: { tr: "Silver", en: "Silver" },
  },
  {
    id: "silver-xr",
    variantId: "xr30-silver",
    code: "SLV",
    label: { tr: "Silver", en: "Silver" },
  },
  {
    id: "ayu",
    variantId: "125mm-ayu",
    code: "AYU",
    label: { tr: "Ayu", en: "Ayu" },
  },
  {
    id: "skipper",
    variantId: "200-skipper",
    code: "SKP",
    label: { tr: "Skipper", en: "Skipper" },
  },
];

export function localizeOption(
  label: LocalizedLabel,
  locale: AppLocale,
): string {
  return label[locale];
}

import type { CanonicalLureImport, CanonicalLocalizedText } from "@/modules/import/core/canonical-lure";
import {
  formatBuoyancyProse,
  formatActionProse,
  localizeSpecLabel,
} from "@/modules/terminology/data/lure-specs";
import { resolveLocalized } from "@/modules/import/persistence/normalize";

function primaryVariantSize(record: CanonicalLureImport): { lengthMm?: number; weightG?: number } {
  const variant = record.variants[0];
  const size = variant?.sizes?.[0];
  const weight = variant?.weights?.[0];
  return {
    lengthMm: size?.lengthMm ?? (size?.lengthCm ? Math.round(size.lengthCm * 10) : undefined),
    weightG: weight?.weightG,
  };
}

function isTopwater(record: CanonicalLureImport): boolean {
  const extras = record.metadata.extras ?? {};
  if (extras.topwaterInferred || extras.surface) return true;
  const depth = record.model.divingDepth;
  const minM = depth?.minMeters ?? depth?.range?.min;
  const maxM = depth?.maxMeters ?? depth?.range?.max;
  return minM === 0 && maxM === 0;
}

function resolveActionTerm(record: CanonicalLureImport): string | undefined {
  const actionLabel = record.model.actions?.[0]?.label;
  const fromLabel = actionLabel ? resolveLocalized(actionLabel, "en") : "";
  return fromLabel || record.model.actions?.[0]?.manufacturerTerm || undefined;
}

/**
 * Generate editorial short descriptions from structured specs — not literal translation.
 * Technology names stay in manufacturer language; explanations are localized elsewhere.
 */
export function generateEditorialProse(record: CanonicalLureImport): CanonicalLocalizedText {
  const { lengthMm, weightG } = primaryVariantSize(record);
  const topwater = isTopwater(record);
  const buoySlug = record.model.buoyancy?.slug;
  const buoyLabel = record.model.buoyancy?.label;
  const buoyEn =
    (buoyLabel ? resolveLocalized(buoyLabel, "en") : "") ||
    record.model.buoyancy?.manufacturerTerm ||
    (topwater ? "Floating" : undefined);
  const actionEn = resolveActionTerm(record);

  const nameEn = resolveLocalized(record.model.name, "en");
  const nameTr = resolveLocalized(record.model.name, "tr") || nameEn;

  let en = "";
  let tr = "";

  if (lengthMm && weightG && buoyEn) {
    const buoyTr = formatBuoyancyProse(buoySlug, buoyEn);
    if (topwater && actionEn) {
      en = `A ${lengthMm} mm, ${weightG} g ${buoyEn.toLowerCase()} surface lure designed for ${actionEn} retrieves.`;
      tr = `${lengthMm} mm boyunda ve ${weightG} gram ağırlığındaki bu su üstü (${buoyTr}) sahte, ${formatActionProse(actionEn)} aksiyonunda yüksek performans gösterecek şekilde geliştirilmiştir.`;
    } else if (topwater) {
      en = `A ${lengthMm} mm, ${weightG} g ${buoyEn.toLowerCase()} surface lure for topwater fishing.`;
      tr = `${lengthMm} mm boyunda ve ${weightG} gram ağırlığındaki bu su üstü (${buoyTr}) sahte, yüzeysel avlar için geliştirilmiştir.`;
    } else if (actionEn) {
      en = `A ${lengthMm} mm, ${weightG} g ${buoyEn.toLowerCase()} lure designed for ${actionEn} action.`;
      tr = `${lengthMm} mm boyunda ve ${weightG} gram ağırlığındaki bu ${buoyTr} sahte, ${formatActionProse(actionEn)} aksiyonunda kullanım için tasarlanmıştır.`;
    } else {
      en = `A ${lengthMm} mm, ${weightG} g ${buoyEn.toLowerCase()} hard bait from the ${nameEn} series.`;
      tr = `${lengthMm} mm boyunda ve ${weightG} gram ağırlığındaki ${nameTr} serisi ${buoyTr} sahtedir.`;
    }
  } else if (lengthMm && buoyEn) {
    en = `A ${lengthMm} mm ${buoyEn.toLowerCase()} lure${actionEn ? ` with ${actionEn} action` : ""}.`;
    tr = `${lengthMm} mm boyunda ${formatBuoyancyProse(buoySlug, buoyEn)} sahte${actionEn ? ` — ${formatActionProse(actionEn)} aksiyon` : ""}.`;
  } else if (nameEn) {
    en = `${nameEn}${buoyEn ? ` — ${buoyEn}` : ""}${actionEn ? `, ${actionEn} action` : ""}.`;
    tr = `${nameTr}${buoyEn ? ` — ${formatBuoyancyProse(buoySlug, buoyEn)}` : ""}${actionEn ? `, ${localizeSpecLabel("action").tr}: ${formatActionProse(actionEn)}` : ""}.`;
  }

  return {
    en: en.trim(),
    tr: tr.trim(),
  };
}

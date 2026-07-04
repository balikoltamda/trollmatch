import { getTranslations } from "next-intl/server";
import { LureSection } from "@/modules/lure/components/ui/lure-section";
import { localize } from "@/modules/lure/services/get-lure-detail";
import type { LureDetail } from "@/modules/lure/types/lure-detail";
import type { AppLocale } from "@/i18n/routing";

type LureSpecificationsProps = {
  lure: LureDetail;
  locale: AppLocale;
};

type SpecRowProps = {
  label: string;
  value: string;
  source: string;
};

function hasLocalized(
  value: { en: string; tr: string } | undefined,
  locale: AppLocale,
): boolean {
  return Boolean(value && localize(value, locale).trim());
}

function hasDivingDepth(
  depth: { min: number; max: number } | undefined,
): boolean {
  return Boolean(depth && (depth.min > 0 || depth.max > 0));
}

function SpecRow({ label, value, source }: SpecRowProps) {
  return (
    <div className="border-border flex flex-col gap-0.5 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="flex flex-col items-start gap-0.5 sm:items-end">
        <span className="text-foreground font-medium">{value}</span>
        <span className="text-muted-foreground text-xs">{source}</span>
      </dd>
    </div>
  );
}

export async function LureSpecifications({
  lure,
  locale,
}: LureSpecificationsProps) {
  const t = await getTranslations("LureDetail");
  const { specifications: specs } = lure;
  const sourceLabel = t("manufacturerSource");

  const lengthDisplay =
    locale === "tr"
      ? `${specs.lengthMm} mm`
      : `${specs.lengthMm} mm (${(specs.lengthMm / 25.4).toFixed(1)} in)`;

  const weightDisplay =
    locale === "tr"
      ? `${specs.weightG} g`
      : `${specs.weightG} g (${(specs.weightG / 28.3495).toFixed(1)} oz)`;

  const rows: SpecRowProps[] = [
    { label: t("specs.length"), value: lengthDisplay, source: sourceLabel },
    { label: t("specs.weight"), value: weightDisplay, source: sourceLabel },
  ];

  if (hasDivingDepth(specs.divingDepthM)) {
    rows.push({
      label: t("specs.divingDepth"),
      value: `~${specs.divingDepthM!.min}–${specs.divingDepthM!.max} m`,
      source: sourceLabel,
    });
  }

  if (hasLocalized(specs.buoyancy, locale)) {
    rows.push({
      label: t("specs.buoyancy"),
      value: localize(specs.buoyancy!, locale),
      source: sourceLabel,
    });
  }

  if (hasLocalized(specs.action, locale)) {
    rows.push({
      label: t("specs.action"),
      value: localize(specs.action!, locale),
      source: sourceLabel,
    });
  }

  if (hasLocalized(specs.bodyType, locale)) {
    rows.push({
      label: t("specs.bodyType"),
      value: localize(specs.bodyType!, locale),
      source: sourceLabel,
    });
  }

  if (hasLocalized(specs.coatingType, locale)) {
    rows.push({
      label: t("specs.coatingType"),
      value: localize(specs.coatingType!, locale),
      source: sourceLabel,
    });
  }

  return (
    <LureSection
      id="specifications"
      title={t("sections.specifications")}
      description={t("sections.specificationsDescription")}
    >
      <dl>
        {rows.map((row) => (
          <SpecRow
            key={row.label}
            label={row.label}
            value={row.value}
            source={row.source}
          />
        ))}
      </dl>
    </LureSection>
  );
}

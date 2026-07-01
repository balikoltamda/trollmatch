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

  const depthDisplay = `~${specs.divingDepthM.min}–${specs.divingDepthM.max} m`;

  return (
    <LureSection
      id="specifications"
      title={t("sections.specifications")}
      description={t("sections.specificationsDescription")}
    >
      <dl>
        <SpecRow label={t("specs.length")} value={lengthDisplay} source={sourceLabel} />
        <SpecRow label={t("specs.weight")} value={weightDisplay} source={sourceLabel} />
        <SpecRow label={t("specs.divingDepth")} value={depthDisplay} source={sourceLabel} />
        <SpecRow
          label={t("specs.buoyancy")}
          value={localize(specs.buoyancy, locale)}
          source={sourceLabel}
        />
        <SpecRow
          label={t("specs.action")}
          value={localize(specs.action, locale)}
          source={sourceLabel}
        />
      </dl>
    </LureSection>
  );
}

import { getTranslations } from "next-intl/server";
import { LureSection } from "@/features/lures/components/ui/lure-section";
import { localize } from "@/features/lures/services/get-lure-detail";
import type { TrollingInfo } from "@/features/lures/types/lure-detail";
import type { AppLocale } from "@/i18n/routing";

type LureTrollingInfoProps = {
  trolling: TrollingInfo;
  locale: AppLocale;
};

export async function LureTrollingInfo({
  trolling,
  locale,
}: LureTrollingInfoProps) {
  const t = await getTranslations("LureDetail");

  return (
    <LureSection
      id="trolling"
      title={t("sections.trolling")}
      description={t("sections.trollingDescription")}
    >
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-muted-foreground text-sm">{t("trolling.speed")}</dt>
          <dd className="text-foreground font-medium">
            {trolling.speedKnots.min}–{trolling.speedKnots.max}{" "}
            {t("trolling.speedUnit")}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground text-sm">{t("trolling.leader")}</dt>
          <dd className="text-foreground text-sm">
            {localize(trolling.leader, locale)}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground text-sm">{t("trolling.mainLine")}</dt>
          <dd className="text-foreground text-sm">
            {localize(trolling.mainLine, locale)}
          </dd>
        </div>
      </dl>
      <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
        {localize(trolling.notes, locale)}
      </p>
      <p className="text-muted-foreground mt-2 text-xs">{t("manufacturerSource")}</p>
    </LureSection>
  );
}

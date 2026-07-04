import { getTranslations } from "next-intl/server";
import { LureSection } from "@/modules/lure/components/ui/lure-section";
import { localize } from "@/modules/lure/services/get-lure-detail";
import {
  formatTrollingSpeedRange,
  hasTrollingSpeed,
} from "@/modules/lure/utils/trolling-speed";
import type { TrollingInfo } from "@/modules/lure/types/lure-detail";
import type { AppLocale } from "@/i18n/routing";

type LureTrollingInfoProps = {
  trolling: TrollingInfo;
  locale: AppLocale;
};

function hasLocalized(
  value: { en: string; tr: string } | undefined,
  locale: AppLocale,
): boolean {
  return Boolean(value && localize(value, locale).trim());
}

export async function LureTrollingInfo({
  trolling,
  locale,
}: LureTrollingInfoProps) {
  const t = await getTranslations("LureDetail");
  const showSpeed = hasTrollingSpeed(trolling.speedKnots);
  const showLeader = hasLocalized(trolling.leader, locale);
  const showMainLine = hasLocalized(trolling.mainLine, locale);
  const showNotes = hasLocalized(trolling.notes, locale);

  if (!showSpeed && !showLeader && !showMainLine && !showNotes) {
    return null;
  }

  return (
    <LureSection
      id="trolling"
      title={t("sections.trolling")}
      description={t("sections.trollingDescription")}
    >
      <dl className="grid gap-4 sm:grid-cols-2">
        {showSpeed && trolling.speedKnots ? (
          <div className="space-y-1">
            <dt className="text-muted-foreground text-sm">{t("trolling.speed")}</dt>
            <dd className="text-foreground font-medium">
              {formatTrollingSpeedRange(
                trolling.speedKnots.min,
                trolling.speedKnots.max,
              )}
            </dd>
          </div>
        ) : null}
        {showLeader ? (
          <div className="space-y-1">
            <dt className="text-muted-foreground text-sm">{t("trolling.leader")}</dt>
            <dd className="text-foreground text-sm">
              {localize(trolling.leader!, locale)}
            </dd>
          </div>
        ) : null}
        {showMainLine ? (
          <div className="space-y-1">
            <dt className="text-muted-foreground text-sm">{t("trolling.mainLine")}</dt>
            <dd className="text-foreground text-sm">
              {localize(trolling.mainLine!, locale)}
            </dd>
          </div>
        ) : null}
      </dl>
      {showNotes ? (
        <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
          {localize(trolling.notes!, locale)}
        </p>
      ) : null}
      <p className="text-muted-foreground mt-2 text-xs">{t("manufacturerSource")}</p>
    </LureSection>
  );
}

import { getTranslations } from "next-intl/server";
import { LureSection } from "@/modules/lure/components/ui/lure-section";
import { localize } from "@/modules/lure/services/get-lure-detail";
import type { CommunityStatistics } from "@/modules/lure/types/lure-detail";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type LureCommunityStatisticsProps = {
  statistics: CommunityStatistics;
  locale: AppLocale;
  embedded?: boolean;
};

export async function LureCommunityStatistics({
  statistics,
  locale,
  embedded = false,
}: LureCommunityStatisticsProps) {
  const t = await getTranslations("LureDetail");

  const bandLabels: Record<CommunityStatistics["effectivenessBand"], string> = {
    low: t("community.bandLow"),
    moderate: t("community.bandModerate"),
    high: t("community.bandHigh"),
    insufficient_data: t("community.bandInsufficient"),
  };

  const bandStyles: Record<CommunityStatistics["effectivenessBand"], string> = {
    low: "bg-muted text-muted-foreground",
    moderate: "bg-secondary text-secondary-foreground",
    high: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    insufficient_data: "bg-muted text-muted-foreground",
  };

  const content = (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border-border rounded-lg border p-4 text-center">
          <p className="text-foreground text-2xl font-semibold tabular-nums">
            {statistics.usageAssertionCount}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {t("community.assertions")}
          </p>
        </div>
        <div className="border-border rounded-lg border p-4 text-center">
          <p className="text-foreground text-2xl font-semibold tabular-nums">
            {statistics.verifiedCatchReportCount}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {t("community.catchReports")}
          </p>
        </div>
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-lg p-4 text-center",
            bandStyles[statistics.effectivenessBand],
          )}
        >
          <p className="text-sm font-semibold">
            {bandLabels[statistics.effectivenessBand]}
          </p>
          <p className="mt-1 text-xs opacity-80">{t("community.effectiveness")}</p>
        </div>
      </div>

      {statistics.topRegions.length > 0 ? (
        <div className="mt-4">
          <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
            {t("community.topRegions")}
          </p>
          <ul className="flex flex-wrap gap-2">
            {statistics.topRegions.map((region) => (
              <li
                key={localize(region, locale)}
                className="border-border bg-muted/50 text-foreground rounded-md border px-2.5 py-1 text-xs"
              >
                {localize(region, locale)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-muted-foreground mt-4 text-xs">{t("community.source")}</p>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <LureSection
      id="community"
      title={t("sections.community")}
      description={t("sections.communityDescription")}
      sourceType="community"
    >
      {content}
    </LureSection>
  );
}

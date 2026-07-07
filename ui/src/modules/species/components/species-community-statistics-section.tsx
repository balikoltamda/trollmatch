import { getTranslations } from "next-intl/server";
import { InformationSourceBadge } from "@/modules/editorial/components/information-source-badge";
import { LureCommunityStatistics } from "@/modules/lure/components/sections/lure-community-statistics";
import type { CommunityStatistics } from "@/modules/lure/types/lure-detail";
import type { AppLocale } from "@/i18n/routing";

type SpeciesCommunityStatisticsSectionProps = {
  locale: AppLocale;
  statistics: CommunityStatistics;
};

export async function SpeciesCommunityStatisticsSection({
  locale,
  statistics,
}: SpeciesCommunityStatisticsSectionProps) {
  const t = await getTranslations("SpeciesCompass");

  if (statistics.verifiedCatchReportCount === 0) {
    return null;
  }

  return (
    <section id="species-community-stats">
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <div className="space-y-2">
          <h2 className="text-foreground text-xl font-semibold tracking-tight">
            {t("communityStatsTitle")}
          </h2>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            {t("communityStatsDescription")}
          </p>
        </div>
        <InformationSourceBadge source="community" />
      </header>
      <LureCommunityStatistics statistics={statistics} locale={locale} embedded />
    </section>
  );
}

import { LureHero } from "@/modules/lure/components/sections/lure-hero";
import { LureTrustSummary } from "@/modules/lure/components/sections/lure-trust-summary";
import { LureSpecifications } from "@/modules/lure/components/sections/lure-specifications";
import { LureRecommendedSpecies } from "@/modules/lure/components/sections/lure-recommended-species";
import { LureRecommendedTechniques } from "@/modules/lure/components/sections/lure-recommended-techniques";
import { LureTrollingInfo } from "@/modules/lure/components/sections/lure-trolling-info";
import { LureCommunityStatistics } from "@/modules/lure/components/sections/lure-community-statistics";
import { LureCatchReportsSection } from "@/modules/catch-report/components/lure-catch-reports-section";
import { RelatedKnowledgeSection } from "@/modules/knowledge-pipeline/components/related-knowledge-section";
import { LureAiInsights } from "@/modules/lure/components/sections/lure-ai-insights";
import { LureRelatedLures } from "@/modules/lure/components/sections/lure-related-lures";
import { LureSponsoredLinks } from "@/modules/lure/components/sections/lure-sponsored-links";
import { LureChangeHistory } from "@/modules/lure/components/sections/lure-change-history";
import { getActiveVariant } from "@/modules/lure/services/get-lure-detail";
import type { LureDetail } from "@/modules/lure/types/lure-detail";
import type { AppLocale } from "@/i18n/routing";

type LureDetailViewProps = {
  lure: LureDetail;
  locale: AppLocale;
  variantId?: string;
};

export async function LureDetailView({
  lure,
  locale,
  variantId,
}: LureDetailViewProps) {
  const activeVariant = getActiveVariant(lure, variantId);

  return (
    <article className="flex flex-col gap-6 sm:gap-8">
      <LureHero lure={lure} activeVariant={activeVariant} locale={locale} />
      <LureTrustSummary trust={lure.trust} locale={locale} />
      <LureSpecifications lure={lure} locale={locale} />
      <LureRecommendedSpecies species={lure.recommendedSpecies} locale={locale} />
      <LureRecommendedTechniques
        techniques={lure.recommendedTechniques}
        locale={locale}
      />
      {lure.trolling ? (
        <LureTrollingInfo trolling={lure.trolling} locale={locale} />
      ) : null}
      <LureCommunityStatistics
        statistics={lure.communityStatistics}
        locale={locale}
      />
      <LureCatchReportsSection
        lureSlug={lure.slug}
        locale={locale}
        variantSlug={activeVariant.id}
      />
      <RelatedKnowledgeSection lureSlug={lure.slug} locale={locale} />
      <LureAiInsights insights={lure.aiInsights} locale={locale} />
      <LureRelatedLures related={lure.relatedLures} locale={locale} />
      <LureSponsoredLinks links={lure.sponsoredLinks} locale={locale} />
      <LureChangeHistory history={lure.changeHistory} locale={locale} />
    </article>
  );
}

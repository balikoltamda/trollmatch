import { LureHero } from "@/modules/lure/components/sections/lure-hero";
import { LureTrustSummary } from "@/modules/lure/components/sections/lure-trust-summary";
import { LureEditorialNotesSection } from "@/modules/lure/components/sections/lure-editorial-notes-section";
import { LureSpecifications } from "@/modules/lure/components/sections/lure-specifications";
import { LureRecommendedSpecies } from "@/modules/lure/components/sections/lure-recommended-species";
import { LureRecommendedTechniques } from "@/modules/lure/components/sections/lure-recommended-techniques";
import { LureTrollingInfo } from "@/modules/lure/components/sections/lure-trolling-info";
import { LureCommunityStatistics } from "@/modules/lure/components/sections/lure-community-statistics";
import { LureRegionalNotesSection } from "@/modules/lure/components/sections/lure-regional-notes-section";
import { LureCatchReportsSection } from "@/modules/catch-report/components/lure-catch-reports-section";
import { RelatedKnowledgeSection } from "@/modules/knowledge-pipeline/components/related-knowledge-section";
import { SafeSection } from "@/modules/stability/components/safe-section";
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
    <article className="section-stack max-w-5xl">
      <LureHero lure={lure} activeVariant={activeVariant} locale={locale} />
      <LureTrustSummary
        trust={lure.trust}
        verificationStatus={lure.verificationStatus}
        locale={locale}
      />
      <LureSpecifications lure={lure} locale={locale} />
      {lure.editorialNote ? (
        <LureEditorialNotesSection note={lure.editorialNote} locale={locale} />
      ) : null}
      {lure.regionalNotes ? (
        <LureRegionalNotesSection notes={lure.regionalNotes} locale={locale} />
      ) : null}
      <LureRecommendedSpecies species={lure.recommendedSpecies} locale={locale} />
      <LureRecommendedTechniques
        techniques={lure.recommendedTechniques}
        locale={locale}
      />
      {lure.trolling ? (
        <LureTrollingInfo trolling={lure.trolling} locale={locale} />
      ) : null}
      {lure.communityStatistics.verifiedCatchReportCount > 0 ? (
        <LureCommunityStatistics
          statistics={lure.communityStatistics}
          locale={locale}
        />
      ) : null}
      <SafeSection
        page="/[locale]/lures/[slug]"
        section="catch-reports"
        slug={lure.slug}
      >
        <LureCatchReportsSection
          lureSlug={lure.slug}
          locale={locale}
          variantSlug={activeVariant.id}
        />
      </SafeSection>
      <SafeSection
        page="/[locale]/lures/[slug]"
        section="related-knowledge"
        slug={lure.slug}
      >
        <RelatedKnowledgeSection lureSlug={lure.slug} locale={locale} />
      </SafeSection>
      <LureAiInsights insights={lure.aiInsights} locale={locale} />
      <LureRelatedLures related={lure.relatedLures} locale={locale} />
      <LureSponsoredLinks links={lure.sponsoredLinks} locale={locale} />
      <LureChangeHistory history={lure.changeHistory} locale={locale} />
    </article>
  );
}

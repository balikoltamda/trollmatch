import { Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LureSection } from "@/modules/lure/components/ui/lure-section";
import { localize } from "@/modules/lure/services/get-lure-detail";
import type { AiInsight } from "@/modules/lure/types/lure-detail";
import type { AppLocale } from "@/i18n/routing";

type LureAiInsightsProps = {
  insights: AiInsight;
  locale: AppLocale;
};

export async function LureAiInsights({ insights, locale }: LureAiInsightsProps) {
  const t = await getTranslations("LureDetail");

  return (
    <LureSection
      id="ai-insights"
      title={t("sections.summary")}
      description={t("sections.summaryDescription")}
    >
      <div className="border-border bg-muted/30 space-y-4 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-muted-foreground size-4" aria-hidden />
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {t("ai.assistedLabel")}
          </span>
        </div>
        <p className="text-foreground text-sm leading-relaxed sm:text-base">
          {localize(insights.summary, locale)}
        </p>
        <div>
          <p className="text-muted-foreground mb-2 text-xs font-medium">
            {t("ai.citations")}
          </p>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-xs">
            {insights.citations.map((citation) => (
              <li key={localize(citation, locale)}>
                {localize(citation, locale)}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-muted-foreground text-xs">
          {t("ai.corpusDate")}: {insights.corpusDate}
        </p>
      </div>
    </LureSection>
  );
}

import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { LureSection } from "@/modules/lure/components/ui/lure-section";
import type { PublicTrustSummary } from "@/modules/trust/types";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type LureTrustSummaryProps = {
  trust: PublicTrustSummary;
  locale: AppLocale;
};

export async function LureTrustSummary({ trust }: LureTrustSummaryProps) {
  const t = await getTranslations("LureDetail.trust");

  const scoreTone =
    trust.score >= 80
      ? "text-ocean"
      : trust.score >= 55
        ? "text-amber-600 dark:text-amber-400"
        : "text-coral";

  return (
    <LureSection
      id="trust"
      title={t("title")}
      description={t("description")}
    >
      <div className="border-border bg-card rounded-xl border p-5">
        <p className={cn("text-3xl font-semibold tabular-nums", scoreTone)}>
          {trust.score}%
        </p>
        <p className="text-muted-foreground mt-2 text-sm">{trust.answer}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {trust.published ? (
            <Badge variant="ocean">{t("editorialVerified")}</Badge>
          ) : (
            <Badge variant="muted">{t("notPublished")}</Badge>
          )}
          {trust.editorConfidence ? (
            <Badge variant="muted">
              {t("editorConfidence")}: {trust.editorConfidence}
            </Badge>
          ) : null}
        </div>

        {trust.communityConsensus ? (
          <div className="bg-muted/30 mt-4 rounded-lg px-4 py-3">
            <p className="text-xs font-medium tracking-wide uppercase">
              {t("communityConsensus")}
            </p>
            <p className="mt-1 text-sm">{trust.communityConsensus.summary}</p>
          </div>
        ) : null}

        {trust.evidence.length > 0 ? (
          <div className="mt-4">
            <p className="text-muted-foreground text-xs font-medium uppercase">
              {t("evidence")}
            </p>
            <ul className="text-muted-foreground mt-1 list-inside list-disc text-sm">
              {trust.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {trust.provenance.length > 0 ? (
          <div className="mt-4">
            <p className="text-muted-foreground text-xs font-medium uppercase">
              {t("provenance")}
            </p>
            <ul className="mt-1 space-y-1 text-sm">
              {trust.provenance.map((item) => (
                <li key={`${item.label}-${item.value}`}>
                  <span className="text-muted-foreground">{item.label}: </span>
                  {item.value}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </LureSection>
  );
}

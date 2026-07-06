import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { TrustIndicators } from "@/modules/editorial/components/trust-indicators";
import { LureSection } from "@/modules/lure/components/ui/lure-section";
import type { PublicTrustSummary } from "@/modules/trust/types";
import type { VerificationStatus } from "@/modules/lure/types/lure-detail";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type LureTrustSummaryProps = {
  trust: PublicTrustSummary;
  verificationStatus: VerificationStatus;
  locale: AppLocale;
};

export async function LureTrustSummary({
  trust,
  verificationStatus,
  locale,
}: LureTrustSummaryProps) {
  const t = await getTranslations("LureDetail.trust");
  const verificationT = await getTranslations("LureDetail.verification");

  const verificationLabels: Record<VerificationStatus, string> = {
    unverified: verificationT("unverified"),
    partially_verified: verificationT("partiallyVerified"),
    manufacturer_verified: verificationT("manufacturerVerified"),
    moderator_verified: verificationT("moderatorVerified"),
    expert_endorsed: verificationT("expertEndorsed"),
  };

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
      <div className="space-y-6">
        <div className="border-border/50 bg-muted/20 rounded-xl border p-5">
          <p className={cn("text-3xl font-semibold tabular-nums", scoreTone)}>
            {trust.score}%
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {trust.answer}
          </p>
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
        </div>

        <TrustIndicators
          trust={trust}
          verificationStatus={verificationStatus}
          verificationLabel={verificationLabels[verificationStatus]}
          locale={locale}
        />

        {trust.communityConsensus ? (
          <div className="border-border/50 bg-muted/20 rounded-xl border px-4 py-3">
            <p className="label-caps text-muted-foreground">
              {t("communityConsensus")}
            </p>
            <p className="text-foreground mt-2 text-sm leading-relaxed">
              {trust.communityConsensus.summary}
            </p>
          </div>
        ) : null}

        {trust.evidence.length > 0 ? (
          <div>
            <p className="label-caps text-muted-foreground">{t("evidence")}</p>
            <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1 text-sm">
              {trust.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {trust.provenance.length > 0 ? (
          <div>
            <p className="label-caps text-muted-foreground">{t("provenance")}</p>
            <ul className="mt-2 space-y-1 text-sm">
              {trust.provenance.map((item) => (
                <li key={`${item.label}-${item.value}`}>
                  <span className="text-muted-foreground">{item.label}: </span>
                  <span className="text-foreground">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </LureSection>
  );
}

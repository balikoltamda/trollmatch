import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import type { VerificationStatus } from "@/modules/lure/types/lure-detail";
import type { PublicTrustSummary } from "@/modules/trust/types";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type TrustIndicatorsProps = {
  trust: PublicTrustSummary;
  verificationStatus: VerificationStatus;
  verificationLabel: string;
  locale: AppLocale;
  compact?: boolean;
};

export async function TrustIndicators({
  trust,
  verificationStatus,
  verificationLabel,
  locale,
  compact = false,
}: TrustIndicatorsProps) {
  const t = await getTranslations("Editorial.trust");

  const statusTone =
    verificationStatus === "moderator_verified" ||
    verificationStatus === "expert_endorsed"
      ? "ocean"
      : verificationStatus === "manufacturer_verified"
        ? "turquoise"
        : "muted";

  const lastVerified = trust.lastVerifiedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        new Date(trust.lastVerifiedAt),
      )
    : t("notYet");

  const editorialLabel = trust.editorialReviewPublished
    ? t("editorialPublished")
    : t("editorialPending");

  const items = [
    {
      label: t("lastVerification"),
      value: lastVerified,
    },
    {
      label: t("verificationStatus"),
      value: verificationLabel,
      badge: statusTone,
    },
    {
      label: t("editorialReview"),
      value: editorialLabel,
      badge: trust.editorialReviewPublished ? "ocean" : "muted",
    },
    {
      label: t("sourceCount"),
      value: String(trust.sourceCount),
    },
  ] as const;

  return (
    <div
      className={cn(
        "grid gap-3",
        compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4",
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="border-border/50 bg-muted/20 rounded-xl border px-4 py-3"
        >
          <p className="label-caps text-muted-foreground">{item.label}</p>
          {"badge" in item && item.badge ? (
            <Badge variant={item.badge} className="mt-2">
              {item.value}
            </Badge>
          ) : (
            <p className="text-foreground mt-2 text-sm font-medium tabular-nums">
              {item.value}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

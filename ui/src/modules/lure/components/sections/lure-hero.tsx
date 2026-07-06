import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { VerificationBadge } from "@/modules/lure/components/ui/verification-badge";
import { VariantSelector } from "@/modules/lure/components/ui/variant-selector";
import { localize } from "@/modules/lure/services/get-lure-detail";
import type { LureDetail } from "@/modules/lure/types/lure-detail";
import type { AppLocale } from "@/i18n/routing";
import type { LureVariant } from "@/modules/lure/types/lure-detail";

type LureHeroProps = {
  lure: LureDetail;
  activeVariant: LureVariant;
  locale: AppLocale;
};

export async function LureHero({ lure, activeVariant, locale }: LureHeroProps) {
  const t = await getTranslations("LureDetail");

  const verificationLabels: Record<LureDetail["verificationStatus"], string> = {
    unverified: t("verification.unverified"),
    partially_verified: t("verification.partiallyVerified"),
    manufacturer_verified: t("verification.manufacturerVerified"),
    moderator_verified: t("verification.moderatorVerified"),
    expert_endorsed: t("verification.expertEndorsed"),
  };

  return (
    <header className="space-y-8">
      <nav aria-label={t("breadcrumbLabel")}>
        <ol className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              {t("breadcrumbHome")}
            </Link>
          </li>
          <li aria-hidden className="text-border">
            /
          </li>
          <li>
            <Link
              href="/lures"
              className="hover:text-foreground transition-colors"
            >
              {t("breadcrumbLures")}
            </Link>
          </li>
          <li aria-hidden className="text-border">
            /
          </li>
          <li className="text-foreground font-medium">
            {localize(lure.modelName, locale)}
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14 lg:items-start">
        <div className="border-border/50 bg-card overflow-hidden rounded-2xl border shadow-[0_1px_2px_oklch(0.28_0.04_255/0.04),0_12px_40px_oklch(0.28_0.04_255/0.04)]">
          <div className="bg-surface-muted/60 relative aspect-[5/4]">
            <Image
              src={activeVariant.imageSrc}
              alt={localize(activeVariant.label, locale)}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-contain p-10 sm:p-12"
            />
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:pt-2">
          <div className="space-y-3">
            <p className="label-caps">{localize(lure.manufacturer, locale)}</p>
            <h1 className="text-foreground tracking-tight">
              {localize(lure.modelName, locale)}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {localize(lure.formFactor, locale)} ·{" "}
              {localize(lure.productLine, locale)}
            </p>
          </div>

          <p className="text-foreground/85 max-w-xl text-base leading-relaxed">
            {localize(lure.shortDescription, locale)}
          </p>

          <VerificationBadge
            status={lure.verificationStatus}
            label={verificationLabels[lure.verificationStatus]}
            lastVerifiedLabel={t("verification.lastVerified")}
            lastVerifiedAt={lure.lastVerifiedAt}
          />

          <VariantSelector
            slug={lure.slug}
            variants={lure.variants}
            activeVariantId={activeVariant.id}
            locale={locale}
            label={t("variantLabel")}
          />
        </div>
      </div>
    </header>
  );
}

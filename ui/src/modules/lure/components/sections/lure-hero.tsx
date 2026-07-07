import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { VerificationBadge } from "@/modules/lure/components/ui/verification-badge";
import { LureProductMedia } from "@/modules/lure/components/ui/lure-product-media";
import { formatPatternCount, localize } from "@/modules/lure/lib/lure-display";
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

  const patternLabels = {
    patternCount: formatPatternCount(lure.variants.length, locale),
    scrollPrev: t("pattern.scrollPrev"),
    scrollNext: t("pattern.scrollNext"),
    patternName: t("pattern.name"),
    colorCode: t("pattern.colorCode"),
    length: t("pattern.length"),
    weight: t("pattern.weight"),
    buoyancy: t("pattern.buoyancy"),
    selectorLabel: t("pattern.selectorLabel"),
    galleryLabel: t("pattern.galleryLabel"),
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
        <LureProductMedia
          slug={lure.slug}
          variants={lure.variants}
          activeVariant={activeVariant}
          locale={locale}
          buoyancy={lure.specifications.buoyancy}
          labels={patternLabels}
        />

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
        </div>
      </div>
    </header>
  );
}

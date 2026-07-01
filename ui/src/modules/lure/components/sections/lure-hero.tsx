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
    <header className="space-y-4">
      <nav aria-label={t("breadcrumbLabel")}>
        <ol className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs sm:text-sm">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              {t("breadcrumbHome")}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <span>{t("breadcrumbLures")}</span>
          </li>
          <li aria-hidden>/</li>
          <li>
            <span className="text-foreground">
              {localize(lure.manufacturer, locale)}
            </span>
          </li>
          <li aria-hidden>/</li>
          <li>
            <span className="text-foreground font-medium">
              {localize(lure.modelName, locale)}
            </span>
          </li>
        </ol>
      </nav>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-xl">
          <Image
            src={activeVariant.imageSrc}
            alt={localize(activeVariant.label, locale)}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-6"
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm font-medium">
              {localize(lure.manufacturer, locale)}
            </p>
            <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
              {localize(lure.modelName, locale)}
            </h1>
            <p className="text-muted-foreground text-sm">
              {localize(lure.formFactor, locale)} ·{" "}
              {localize(lure.productLine, locale)}
            </p>
          </div>

          <p className="text-foreground/90 text-sm leading-relaxed sm:text-base">
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

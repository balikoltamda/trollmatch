import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LureSection } from "@/features/lures/components/ui/lure-section";
import { Button } from "@/components/ui/button";
import { localize } from "@/features/lures/services/get-lure-detail";
import type { SponsoredLink } from "@/features/lures/types/lure-detail";
import type { AppLocale } from "@/i18n/routing";

type LureSponsoredLinksProps = {
  links: SponsoredLink[];
  locale: AppLocale;
};

export async function LureSponsoredLinks({
  links,
  locale,
}: LureSponsoredLinksProps) {
  const t = await getTranslations("LureDetail");

  return (
    <LureSection
      id="retailers"
      title={t("sections.sponsored")}
      description={t("sections.sponsoredDescription")}
    >
      <p className="text-muted-foreground mb-4 text-xs">{t("sponsored.disclaimer")}</p>
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li
            key={localize(link.retailer, locale)}
            className="border-border flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-foreground text-sm font-medium">
                {localize(link.retailer, locale)}
              </p>
              <p className="text-muted-foreground text-xs">
                {localize(link.disclosure, locale)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled
              aria-disabled
              className="w-full sm:w-auto"
            >
              {t("sponsored.findRetailers")}
              <ExternalLink aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
    </LureSection>
  );
}

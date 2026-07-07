import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SpeciesCard } from "@/components/cards/species-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { DiscoverySearchForm } from "@/modules/discovery/components/discovery-search-form";
import type { SpeciesCardData } from "@/modules/discovery/types";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

type SpeciesIndexViewProps = {
  locale: AppLocale;
  species: SpeciesCardData[];
};

export async function SpeciesIndexView({
  locale,
  species,
}: SpeciesIndexViewProps) {
  const t = await getTranslations("Species");

  return (
    <Section spacing="default">
      <Container>
        <header className="page-header">
          <div className="space-y-3">
            <h1>{t("title")}</h1>
            <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">
              {t("description")}
            </p>
          </div>
          <DiscoverySearchForm
            placeholder={t("searchPlaceholder")}
            ariaLabel={t("searchAria")}
            size="lg"
          />
        </header>

        {species.length === 0 ? (
          <EmptyState title={t("empty")} compact />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {species.map((item) => (
              <SpeciesCard
                key={item.slugEn}
                slug={item.slug}
                name={pickLocalized(item.name, locale)}
                scientificName={item.scientificName}
                regions={item.regions}
                regionLabels={item.regions
                  .map((region) => pickLocalized({ en: region.en, tr: region.tr }, locale))
                  .join(" · ")}
                lureCount={item.lureCount}
                lureCountLabel={t("lureCount", { count: item.lureCount })}
                heroImageUrl={item.heroImageUrl}
              />
            ))}
          </div>
        )}

        <p className="text-muted-foreground mt-14 text-sm">
          {t("footerHint")}{" "}
          <Link href="/lures" className="text-ocean font-medium hover:underline">
            {t("browseLures")}
          </Link>
        </p>
      </Container>
    </Section>
  );
}

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SpeciesCard } from "@/components/cards/species-card";
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
        <div className="mb-10 flex flex-col gap-6 sm:mb-12">
          <div className="space-y-3">
            <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("title")}
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
              {t("description")}
            </p>
          </div>
          <div className="max-w-xl">
            <DiscoverySearchForm
              placeholder={t("searchPlaceholder")}
              ariaLabel={t("searchAria")}
              size="lg"
            />
          </div>
        </div>

        {species.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {species.map((item) => (
              <SpeciesCard
                key={item.slug}
                slug={item.slug}
                name={pickLocalized(item.name, locale)}
                habitat={pickLocalized(item.subtitle, locale)}
                lureCount={item.lureCount}
                lureCountLabel={t("lureCount", { count: item.lureCount })}
              />
            ))}
          </div>
        )}

        <p className="text-muted-foreground mt-10 text-sm">
          {t("footerHint")}{" "}
          <Link href="/lures" className="text-ocean font-medium hover:underline">
            {t("browseLures")}
          </Link>
        </p>
      </Container>
    </Section>
  );
}

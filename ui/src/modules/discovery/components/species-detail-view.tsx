import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LureCard } from "@/components/cards/lure-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SpeciesTopLuresSection } from "@/modules/catch-report/components/species-top-lures-section";
import { RelatedKnowledgeSection } from "@/modules/knowledge-pipeline/components/related-knowledge-section";
import { SpeciesTaxonomySection } from "@/modules/taxonomy/components/species-taxonomy-section";
import { SafeSection } from "@/modules/stability/components/safe-section";
import type { SpeciesDetailData } from "@/modules/discovery/types";
import type { SpeciesTaxonomyProfile } from "@/modules/taxonomy/types";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

type SpeciesDetailViewProps = {
  locale: AppLocale;
  species: SpeciesDetailData;
  taxonomy?: SpeciesTaxonomyProfile | null;
};

export async function SpeciesDetailView({
  locale,
  species,
  taxonomy,
}: SpeciesDetailViewProps) {
  const t = await getTranslations("Species");
  const name = pickLocalized(species.name, locale);

  return (
    <Section spacing="default">
      <Container>
        <nav
          className="text-muted-foreground mb-10 text-sm"
          aria-label={t("breadcrumbLabel")}
        >
          <ol className="flex flex-wrap items-center gap-2">
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
                href="/species"
                className="hover:text-foreground transition-colors"
              >
                {t("breadcrumbSpecies")}
              </Link>
            </li>
            <li aria-hidden className="text-border">
              /
            </li>
            <li className="text-foreground font-medium">{name}</li>
          </ol>
        </nav>

        <header className="page-header max-w-3xl">
          <h1>{name}</h1>
          <p className="text-muted-foreground text-lg italic">
            {species.scientificName}
          </p>
          <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">
            {t("detailDescription", { count: species.lureCount })}
          </p>
          <Link
            href={`/search?species=${encodeURIComponent(species.slug)}`}
            className="text-ocean inline-block text-sm font-medium hover:underline"
          >
            {t("viewAllLures")}
          </Link>
        </header>

        <div className="section-stack">
          {taxonomy ? (
            <SpeciesTaxonomySection locale={locale} taxonomy={taxonomy} />
          ) : null}

          <SafeSection
            page="/[locale]/species/[slug]"
            section="top-lures-reports"
            slug={species.slug}
          >
            <SpeciesTopLuresSection
              locale={locale}
              groups={species.topLuresByTechnique}
            />
          </SafeSection>

          <SafeSection
            page="/[locale]/species/[slug]"
            section="related-knowledge"
            slug={species.slug}
          >
            <RelatedKnowledgeSection speciesSlug={species.slug} locale={locale} />
          </SafeSection>

          <section>
            <header className="mb-8 max-w-2xl space-y-2">
              <h2>{t("catalogLuresTitle")}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
                {t("catalogLuresDescription")}
              </p>
            </header>

            {species.lures.length === 0 ? (
              <EmptyState title={t("noLuresYet")} compact>
                <Link
                  href="/add-lure"
                  className="text-ocean text-sm font-medium hover:underline"
                >
                  {t("contributeLure")}
                </Link>
              </EmptyState>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {species.lures.map((lure) => (
                  <LureCard
                    key={lure.slug}
                    slug={lure.slug}
                    manufacturer={pickLocalized(lure.manufacturer, locale)}
                    modelName={pickLocalized(lure.modelName, locale)}
                    formFactor={pickLocalized(lure.formFactor, locale)}
                    imageSrc={lure.imageSrc}
                    verified={lure.verified}
                    verifiedLabel={t("verified")}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </Container>
    </Section>
  );
}

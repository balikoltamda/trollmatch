import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { LureCard } from "@/components/cards/lure-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SpeciesTopLuresSection } from "@/modules/catch-report/components/species-top-lures-section";
import { RelatedKnowledgeSection } from "@/modules/knowledge-pipeline/components/related-knowledge-section";
import { SpeciesTaxonomySection } from "@/modules/taxonomy/components/species-taxonomy-section";
import { SpeciesProfileSection } from "@/modules/species/components/species-profile-section";
import { SpeciesClassificationSection } from "@/modules/species/components/species-classification-section";
import { SpeciesGallerySection } from "@/modules/species/components/species-gallery-section";
import { SpeciesRegionalNotesSection } from "@/modules/species/components/species-regional-notes-section";
import { SpeciesTechniquesSection } from "@/modules/species/components/species-techniques-section";
import { SpeciesCatchReportsSection } from "@/modules/species/components/species-catch-reports-section";
import { SpeciesCommunityStatisticsSection } from "@/modules/species/components/species-community-statistics-section";
import { SafeSection } from "@/modules/stability/components/safe-section";
import type { SpeciesDetailData } from "@/modules/discovery/types";
import type { SpeciesCompassData } from "@/modules/species/types";
import type { SpeciesTaxonomyProfile } from "@/modules/taxonomy/types";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";
import {
  formatSpeciesMaxSize,
} from "@/modules/species/components/species-structured-data";

type SpeciesDetailViewProps = {
  locale: AppLocale;
  species: SpeciesDetailData;
  taxonomy?: SpeciesTaxonomyProfile | null;
  compass?: SpeciesCompassData | null;
};

export async function SpeciesDetailView({
  locale,
  species,
  taxonomy,
  compass,
}: SpeciesDetailViewProps) {
  const t = await getTranslations("Species");
  const name = pickLocalized(species.name, locale);
  const heroImage = compass?.heroImageUrl ?? null;
  const habitat = pickLocalized(species.habitat, locale);
  const maxSize = formatSpeciesMaxSize(species, locale, {
    length: t("header.maxLength"),
    weight: t("header.maxWeight"),
    separator: t("header.sizeSeparator"),
  });

  return (
    <Section spacing="default">
      <Container>
        <nav
          className="text-muted-foreground mb-8 text-sm"
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

        {heroImage ? (
          <div className="relative mb-10 aspect-[21/9] overflow-hidden rounded-2xl sm:aspect-[2.4/1]">
            <Image
              src={heroImage}
              alt={name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 80vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
              <p className="text-white/80 text-sm italic">{species.scientificName}</p>
              <h1 className="text-white mt-2 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                {name}
              </h1>
            </div>
          </div>
        ) : null}

        <header className="page-header max-w-3xl">
          {!heroImage ? (
            <>
              <h1>{name}</h1>
              <p className="text-muted-foreground text-lg italic">
                {species.scientificName}
              </p>
            </>
          ) : null}
          <dl className="text-muted-foreground mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {species.regions.length > 0 ? (
              <div>
                <dt className="text-foreground font-medium">{t("header.distribution")}</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {species.regions.map((region) => (
                    <Badge key={region.code} variant="muted">
                      {pickLocalized({ en: region.en, tr: region.tr }, locale)}
                    </Badge>
                  ))}
                </dd>
              </div>
            ) : null}
            {habitat ? (
              <div>
                <dt className="text-foreground font-medium">{t("header.habitat")}</dt>
                <dd className="mt-1 leading-relaxed">{habitat}</dd>
              </div>
            ) : null}
            {maxSize ? (
              <div>
                <dt className="text-foreground font-medium">{t("header.maxSize")}</dt>
                <dd className="mt-1">{maxSize}</dd>
              </div>
            ) : null}
          </dl>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed sm:text-lg">
            {t("detailDescription", { count: species.lureCount })}
          </p>
          <Link
            href={`/search?species=${encodeURIComponent(species.slug)}`}
            className="text-ocean inline-block text-sm font-medium hover:underline"
          >
            {t("viewAllLures")}
          </Link>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t("editorialAttribution")}
          </p>
        </header>

        <div className="section-stack">
          {compass?.profile ? (
            <SpeciesProfileSection locale={locale} profile={compass.profile} />
          ) : null}

          {compass?.classification ? (
            <SpeciesClassificationSection
              classification={compass.classification}
            />
          ) : null}

          {taxonomy ? (
            <SpeciesTaxonomySection locale={locale} taxonomy={taxonomy} />
          ) : null}

          {compass?.regionalNotes ? (
            <SpeciesRegionalNotesSection
              locale={locale}
              notes={compass.regionalNotes}
            />
          ) : null}

          {compass?.techniques && compass.techniques.length > 0 ? (
            <SpeciesTechniquesSection
              locale={locale}
              techniques={compass.techniques}
            />
          ) : null}

          {compass?.communityStatistics ? (
            <SpeciesCommunityStatisticsSection
              locale={locale}
              statistics={compass.communityStatistics}
            />
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

          {compass?.catchReports && compass.catchReports.length > 0 ? (
            <SafeSection
              page="/[locale]/species/[slug]"
              section="catch-reports"
              slug={species.slug}
            >
              <SpeciesCatchReportsSection
                locale={locale}
                reports={compass.catchReports}
              />
            </SafeSection>
          ) : null}

          {compass?.gallery && compass.gallery.length > 0 ? (
            <SpeciesGallerySection locale={locale} gallery={compass.gallery} />
          ) : null}

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

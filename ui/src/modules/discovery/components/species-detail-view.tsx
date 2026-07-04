import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LureCard } from "@/components/cards/lure-card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import type { SpeciesDetailData } from "@/modules/discovery/types";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

type SpeciesDetailViewProps = {
  locale: AppLocale;
  species: SpeciesDetailData;
};

export async function SpeciesDetailView({
  locale,
  species,
}: SpeciesDetailViewProps) {
  const t = await getTranslations("Species");
  const name = pickLocalized(species.name, locale);

  return (
    <Section spacing="default">
      <Container>
        <nav className="text-muted-foreground mb-8 text-sm" aria-label={t("breadcrumbLabel")}>
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                {t("breadcrumbHome")}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/species" className="hover:text-foreground transition-colors">
                {t("breadcrumbSpecies")}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-foreground font-medium">{name}</li>
          </ol>
        </nav>

        <div className="mb-10 space-y-4">
          <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            {name}
          </h1>
          <p className="text-muted-foreground text-base italic">
            {species.scientificName}
          </p>
          <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
            {t("detailDescription", { count: species.lureCount })}
          </p>
          <Link
            href={`/search?species=${encodeURIComponent(species.slug)}`}
            className="text-ocean inline-block text-sm font-medium hover:underline"
          >
            {t("viewAllLures")}
          </Link>
        </div>

        {species.lures.length === 0 ? (
          <div className="border-border bg-surface-muted/40 rounded-xl border px-6 py-12 text-center">
            <p className="text-muted-foreground text-sm">{t("noLuresYet")}</p>
            <Link
              href="/add-lure"
              className="text-ocean mt-4 inline-block text-sm font-medium hover:underline"
            >
              {t("contributeLure")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      </Container>
    </Section>
  );
}

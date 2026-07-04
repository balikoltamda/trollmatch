import {
  Factory,
  Fish,
  Layers,
  RefreshCw,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LureCard } from "@/components/cards/lure-card";
import { ManufacturerCard } from "@/components/cards/manufacturer-card";
import { SpeciesCard } from "@/components/cards/species-card";
import { StatisticCard } from "@/components/cards/statistic-card";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import type { AppLocale } from "@/i18n/routing";
import { HeroSearch } from "@/modules/home/components/hero-search";
import {
  HOME_COLLECTIONS,
  HOME_LURES,
  HOME_MANUFACTURERS,
  HOME_SPECIES,
  HOME_STATISTICS,
  pickLocalized,
} from "@/modules/home/data/home-content";

const STAT_ICONS = {
  lures: Layers,
  manufacturers: Factory,
  species: Fish,
  imports: RefreshCw,
} as const;

type HomeViewProps = {
  locale: AppLocale;
};

export async function HomeView({ locale }: HomeViewProps) {
  const t = await getTranslations("Home");

  return (
    <div className="-mx-4 sm:-mx-6">
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, color-mix(in oklch, var(--turquoise), transparent 75%), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, color-mix(in oklch, var(--ocean), transparent 85%), transparent)",
          }}
        />
        <Container className="relative py-20 sm:py-28 lg:py-32">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
            <p className="text-ocean text-sm font-medium tracking-[0.2em] uppercase">
              {t("hero.eyebrow")}
            </p>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {t("hero.regionScope")}
            </p>
            <h1 className="text-foreground text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.08]">
              {t("hero.title")}
              <span className="text-gradient-ocean block sm:inline sm:pl-3">
                {t("hero.titleAccent")}
              </span>
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base leading-relaxed sm:text-lg">
              {t("hero.description")}
            </p>
            <div className="w-full max-w-xl">
              <HeroSearch
                placeholder={t("hero.searchPlaceholder")}
                ariaLabel={t("hero.searchAria")}
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/add-lure"
                className={buttonVariants({ size: "lg" })}
              >
                {t("hero.ctaPrimary")}
              </Link>
              <Link
                href="/lures/laser-pro-190-dd"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                {t("hero.ctaSecondary")}
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Section spacing="default">
        <Container>
          <div className="mb-10 flex flex-col gap-3 sm:mb-12">
            <h2 className="text-foreground text-2xl font-semibold sm:text-3xl">
              {t("species.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl text-base">
              {t("species.description")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOME_SPECIES.map((species) => (
              <SpeciesCard
                key={species.id}
                name={pickLocalized(species.name, locale)}
                habitat={pickLocalized(species.habitat, locale)}
                lureCount={species.lureCount}
              />
            ))}
          </div>
        </Container>
      </Section>

      <Section spacing="default" className="bg-surface-muted/50">
        <Container>
          <div className="mb-10 flex flex-col gap-3 sm:mb-12">
            <h2 className="text-foreground text-2xl font-semibold sm:text-3xl">
              {t("collections.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl text-base">
              {t("collections.description")}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {HOME_COLLECTIONS.map((collection) => (
              <Card key={collection.id} interactive className="h-full">
                <CardContent className="flex h-full flex-col gap-4 p-6">
                  <div
                    className={
                      collection.accent === "ocean"
                        ? "bg-ocean/8 text-ocean w-fit rounded-full px-3 py-1 text-xs font-medium"
                        : collection.accent === "turquoise"
                          ? "bg-turquoise/12 text-[color-mix(in_oklch,var(--turquoise),var(--navy)_35%)] w-fit rounded-full px-3 py-1 text-xs font-medium"
                          : "bg-navy/6 text-navy w-fit rounded-full px-3 py-1 text-xs font-medium"
                    }
                  >
                    {collection.lureCount} {t("collections.lureCount")}
                  </div>
                  <div className="mt-auto space-y-2">
                    <h3 className="text-foreground text-xl font-semibold">
                      {pickLocalized(collection.title, locale)}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {pickLocalized(collection.description, locale)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section spacing="default">
        <Container>
          <div className="mb-10 flex flex-col gap-3 sm:mb-12">
            <h2 className="text-foreground text-2xl font-semibold sm:text-3xl">
              {t("manufacturers.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl text-base">
              {t("manufacturers.description")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HOME_MANUFACTURERS.map((manufacturer) => (
              <ManufacturerCard
                key={manufacturer.id}
                name={manufacturer.name}
                country={manufacturer.country}
                status={manufacturer.status}
                statusLabel={
                  manufacturer.status === "importing"
                    ? t("manufacturers.importing")
                    : manufacturer.country
                }
                productLabel={t("manufacturers.models", {
                  count: manufacturer.productCount,
                })}
              />
            ))}
          </div>
        </Container>
      </Section>

      <Section spacing="default" className="bg-surface-muted/50">
        <Container>
          <div className="mb-10 flex flex-col gap-3 sm:mb-12">
            <h2 className="text-foreground text-2xl font-semibold sm:text-3xl">
              {t("latest.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl text-base">
              {t("latest.description")}
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOME_LURES.map((lure) => (
              <LureCard
                key={lure.slug}
                slug={lure.slug}
                manufacturer={pickLocalized(lure.manufacturer, locale)}
                modelName={pickLocalized(lure.modelName, locale)}
                formFactor={pickLocalized(lure.formFactor, locale)}
                imageSrc={lure.imageSrc}
                verified={lure.verified}
                verifiedLabel={t("latest.verified")}
              />
            ))}
          </div>
        </Container>
      </Section>

      <Section spacing="loose">
        <Container>
          <div className="mb-10 flex flex-col gap-3 sm:mb-12">
            <h2 className="text-foreground text-2xl font-semibold sm:text-3xl">
              {t("statistics.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl text-base">
              {t("statistics.description")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOME_STATISTICS.map((stat) => {
              const Icon = STAT_ICONS[stat.id as keyof typeof STAT_ICONS];
              return (
                <StatisticCard
                  key={stat.id}
                  label={pickLocalized(stat.label, locale)}
                  value={stat.value}
                  hint={pickLocalized(stat.hint, locale)}
                  icon={Icon}
                  accent={stat.accent}
                />
              );
            })}
          </div>
        </Container>
      </Section>
    </div>
  );
}

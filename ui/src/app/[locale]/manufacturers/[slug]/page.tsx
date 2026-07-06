import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppMain } from "@/components/layout/app-shell";
import { LureCard } from "@/components/cards/lure-card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getPublicManufacturerResult } from "@/modules/discovery/data/public-manufacturer";
import { UnavailablePage } from "@/modules/stability/components/unavailable-page";
import { routing, type AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

export const dynamic = "force-dynamic";

type ManufacturerPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: ManufacturerPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const result = await getPublicManufacturerResult(slug);
  if (result.status !== "ok") return {};

  const name = pickLocalized(result.data.name, locale as AppLocale);
  return { title: name };
}

export default async function ManufacturerDetailPage({
  params,
}: ManufacturerPageProps) {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations("Stability");
  const tDiscovery = await getTranslations("Discovery");

  const result = await getPublicManufacturerResult(slug);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status === "unavailable") {
    return (
      <AppMain>
        <UnavailablePage
          title={t("unavailable.title")}
          description={t("unavailable.description")}
          homeLabel={t("notFound.home")}
          retryLabel={t("error.retry")}
          retryHref={`/manufacturers/${slug}`}
        />
      </AppMain>
    );
  }

  const manufacturer = result.data;
  const name = pickLocalized(manufacturer.name, locale as AppLocale);

  return (
    <AppMain>
      <Section spacing="default">
        <Container>
          <div className="mb-10 space-y-3">
            <h1 className="text-foreground text-3xl font-semibold tracking-tight">
              {name}
            </h1>
            {manufacturer.website ? (
              <a
                href={manufacturer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ocean text-sm font-medium hover:underline"
              >
                {manufacturer.website}
              </a>
            ) : null}
            <p className="text-muted-foreground text-sm">
              {t("manufacturer.lureCount", { count: manufacturer.lureCount })}
            </p>
          </div>

          {manufacturer.lures.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("manufacturer.noLures")}
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {manufacturer.lures.map((lure) => (
                <LureCard
                  key={lure.slug}
                  slug={lure.slug}
                  manufacturer={pickLocalized(lure.manufacturer, locale as AppLocale)}
                  modelName={pickLocalized(lure.modelName, locale as AppLocale)}
                  formFactor={pickLocalized(lure.formFactor, locale as AppLocale)}
                  imageSrc={lure.imageSrc}
                  verified={lure.verified}
                  verifiedLabel={tDiscovery("verified")}
                />
              ))}
            </div>
          )}
        </Container>
      </Section>
    </AppMain>
  );
}

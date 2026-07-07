import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppMain } from "@/components/layout/app-shell";
import { getSpeciesDetailResult } from "@/modules/discovery/data/species";
import { SpeciesDetailView } from "@/modules/discovery/components/species-detail-view";
import {
  ensureTaxonomyReferenceSeeds,
  getSpeciesTaxonomyProfile,
} from "@/modules/taxonomy";
import { getSpeciesCompassData } from "@/modules/species";
import {
  speciesAlternateLanguages,
  speciesCanonicalPath,
} from "@/modules/species/lib/seo";
import { UnavailablePage } from "@/modules/stability/components/unavailable-page";
import { routing, type AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";
import { SpeciesStructuredData } from "@/modules/species/components/species-structured-data";

export const dynamic = "force-dynamic";

type SpeciesDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: SpeciesDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const result = await getSpeciesDetailResult(slug, locale as AppLocale);
  if (result.status !== "ok") {
    return {};
  }

  const name = pickLocalized(result.data.name, locale as AppLocale);
  const descriptionText = pickLocalized(result.data.description, locale as AppLocale);
  const t = await getTranslations({ locale, namespace: "Species" });
  const description =
    descriptionText ||
    t("meta.detailDescription", {
      name,
      count: result.data.lureCount,
    });
  const canonical = speciesCanonicalPath(result.data, locale as AppLocale);
  const compass = await getSpeciesCompassData(result.data.slugEn, locale as AppLocale);

  return {
    title: t("meta.detailTitle", { name }),
    description,
    alternates: {
      canonical,
      languages: speciesAlternateLanguages(result.data),
    },
    openGraph: {
      title: t("meta.detailTitle", { name }),
      description,
      type: "article",
      locale,
      siteName: "Balık Oltamda Guide",
      ...(compass?.heroImageUrl
        ? {
            images: [
              {
                url: compass.heroImageUrl,
                alt: name,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: compass?.heroImageUrl ? "summary_large_image" : "summary",
      title: t("meta.detailTitle", { name }),
      description,
    },
  };
}

export default async function SpeciesDetailPage({
  params,
}: SpeciesDetailPageProps) {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  await ensureTaxonomyReferenceSeeds();

  const result = await getSpeciesDetailResult(slug, locale as AppLocale);

  if (result.status === "not_found") {
    notFound();
  }

  const t = await getTranslations("Stability");

  if (result.status === "unavailable") {
    return (
      <AppMain>
        <UnavailablePage
          title={t("unavailable.title")}
          description={t("unavailable.description")}
          homeLabel={t("notFound.home")}
          retryLabel={t("error.retry")}
          retryHref={`/species/${slug}`}
        />
      </AppMain>
    );
  }

  const [taxonomy, compass] = await Promise.all([
    getSpeciesTaxonomyProfile(result.data.slugEn),
    getSpeciesCompassData(result.data.slugEn, locale as AppLocale),
  ]);

  return (
    <AppMain>
      <SpeciesStructuredData
        locale={locale as AppLocale}
        species={result.data}
        heroImageUrl={compass?.heroImageUrl ?? null}
      />
      <SpeciesDetailView
        locale={locale as AppLocale}
        species={result.data}
        taxonomy={taxonomy}
        compass={compass}
      />
    </AppMain>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppMain } from "@/components/layout/app-shell";
import { LureDetailView } from "@/modules/lure/components/lure-detail-view";
import {
  getLureSlugs,
  localize,
} from "@/modules/lure/services/get-lure-detail";
import { getLureDetailResult } from "@/modules/lure/services/get-lure-detail-safe";
import { UnavailablePage } from "@/modules/stability/components/unavailable-page";
import { routing, type AppLocale } from "@/i18n/routing";

type LureDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ variant?: string }>;
};

export async function generateStaticParams() {
  const slugs = await getLureSlugs();

  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const result = await getLureDetailResult({
    slug,
    locale: locale as AppLocale,
  });

  if (result.status !== "ok") {
    return {};
  }

  const lure = result.data;
  const title = localize(lure.modelName, locale as AppLocale);
  const description = localize(lure.shortDescription, locale as AppLocale);
  const manufacturer = localize(lure.manufacturer, locale as AppLocale);

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/lures/${slug}`,
      languages: Object.fromEntries(
        routing.locales.map((loc) => [loc, `/${loc}/lures/${slug}`]),
      ),
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale,
      siteName: "Balık Oltamda Guide",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${manufacturer}`,
      description,
    },
  };
}

export default async function LureDetailPage({
  params,
  searchParams,
}: LureDetailPageProps) {
  const { locale, slug } = await params;
  const { variant } = await searchParams;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const result = await getLureDetailResult({
    slug,
    locale: locale as AppLocale,
    variantId: variant,
  });

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
          retryHref={`/lures/${slug}`}
        />
      </AppMain>
    );
  }

  const lure = result.data;
  const tDetail = await getTranslations("LureDetail");

  return (
    <AppMain>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: localize(lure.modelName, locale as AppLocale),
            description: localize(lure.shortDescription, locale as AppLocale),
            brand: {
              "@type": "Brand",
              name: localize(lure.manufacturer, locale as AppLocale),
            },
            category: localize(lure.formFactor, locale as AppLocale),
          }),
        }}
      />
      <LureDetailView
        lure={lure}
        locale={locale as AppLocale}
        variantId={variant}
      />
      <p className="text-muted-foreground sr-only">{tDetail("pageLandmark")}</p>
    </AppMain>
  );
}

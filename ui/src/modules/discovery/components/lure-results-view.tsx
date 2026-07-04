import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LureCard } from "@/components/cards/lure-card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { DiscoverySearchForm } from "@/modules/discovery/components/discovery-search-form";
import type { PublicLureListResult } from "@/modules/discovery/types";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

type LureResultsViewProps = {
  locale: AppLocale;
  result: PublicLureListResult;
  title: string;
  description: string;
  showSearch?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  verifiedLabel: string;
  resultsLabel: string;
  pageLabel: string;
  previousLabel: string;
  nextLabel: string;
  basePath: "/search" | "/lures";
};

function buildPageHref(
  basePath: "/search" | "/lures",
  page: number,
  query: string | null,
  speciesSlug: string | null,
): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (speciesSlug) params.set("species", speciesSlug);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export async function LureResultsView({
  locale,
  result,
  title,
  description,
  showSearch = true,
  emptyTitle,
  emptyDescription,
  verifiedLabel,
  resultsLabel,
  pageLabel,
  previousLabel,
  nextLabel,
  basePath,
}: LureResultsViewProps) {
  const t = await getTranslations("Discovery");
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <Section spacing="default">
      <Container>
        <div className="mb-10 flex flex-col gap-6 sm:mb-12">
          <div className="space-y-3">
            <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
              {title}
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
              {description}
            </p>
          </div>
          {showSearch ? (
            <div className="max-w-xl">
              <DiscoverySearchForm
                defaultQuery={result.query ?? ""}
                placeholder={t("searchPlaceholder")}
                ariaLabel={t("searchAria")}
                size="lg"
              />
            </div>
          ) : null}
          {result.query || result.speciesSlug ? (
            <p className="text-muted-foreground text-sm">
              {resultsLabel}
            </p>
          ) : null}
        </div>

        {result.rows.length === 0 ? (
          <div className="border-border bg-surface-muted/40 rounded-xl border px-6 py-12 text-center">
            <h2 className="text-foreground text-lg font-semibold">{emptyTitle}</h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-relaxed">
              {emptyDescription}
            </p>
            <Link
              href="/species"
              className="text-ocean mt-6 inline-block text-sm font-medium hover:underline"
            >
              {t("browseSpecies")}
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {result.rows.map((lure) => (
                <LureCard
                  key={lure.slug}
                  slug={lure.slug}
                  manufacturer={pickLocalized(lure.manufacturer, locale)}
                  modelName={pickLocalized(lure.modelName, locale)}
                  formFactor={pickLocalized(lure.formFactor, locale)}
                  imageSrc={lure.imageSrc}
                  verified={lure.verified}
                  verifiedLabel={verifiedLabel}
                />
              ))}
            </div>

            {totalPages > 1 ? (
              <nav
                className="border-border mt-10 flex items-center justify-between gap-4 border-t pt-6"
                aria-label={pageLabel}
              >
                {result.page > 1 ? (
                  <Link
                    href={buildPageHref(
                      basePath,
                      result.page - 1,
                      result.query,
                      result.speciesSlug,
                    )}
                    className="text-ocean text-sm font-medium hover:underline"
                  >
                    {previousLabel}
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-muted-foreground text-sm">
                  {result.page} / {totalPages}
                </span>
                {result.page < totalPages ? (
                  <Link
                    href={buildPageHref(
                      basePath,
                      result.page + 1,
                      result.query,
                      result.speciesSlug,
                    )}
                    className="text-ocean text-sm font-medium hover:underline"
                  >
                    {nextLabel}
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            ) : null}
          </>
        )}
      </Container>
    </Section>
  );
}

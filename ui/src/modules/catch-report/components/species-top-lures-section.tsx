import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LureCard } from "@/components/cards/lure-card";
import type { SpeciesTopLureFromReports } from "@/modules/catch-report/types";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

type SpeciesTopLuresSectionProps = {
  locale: AppLocale;
  lures: SpeciesTopLureFromReports[];
};

export async function SpeciesTopLuresSection({
  locale,
  lures,
}: SpeciesTopLuresSectionProps) {
  const t = await getTranslations("CatchReport");

  if (lures.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="mb-6 space-y-2">
        <h2 className="text-foreground text-2xl font-semibold">
          {t("speciesSection.title")}
        </h2>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          {t("speciesSection.description")}
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {lures.map((lure) => (
          <div key={lure.slug} className="space-y-2">
            <LureCard
              slug={lure.slug}
              manufacturer={pickLocalized(lure.manufacturer, locale)}
              modelName={pickLocalized(lure.modelName, locale)}
              formFactor={pickLocalized(lure.formFactor, locale)}
              imageSrc={lure.imageSrc}
              verified
              verifiedLabel={t("verified")}
            />
            <p className="text-muted-foreground px-1 text-xs">
              {t("speciesSection.stats", {
                reports: lure.reportCount,
                catches: lure.totalCatches,
              })}
            </p>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground mt-4 text-xs">
        {t("speciesSection.source")}{" "}
        <Link href="/add-lure" className="text-ocean font-medium hover:underline">
          {t("speciesSection.contribute")}
        </Link>
      </p>
    </section>
  );
}

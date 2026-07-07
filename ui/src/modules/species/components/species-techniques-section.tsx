import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { InformationSourceBadge } from "@/modules/editorial/components/information-source-badge";
import type { SpeciesTechniqueView } from "@/modules/species/types";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

type SpeciesTechniquesSectionProps = {
  locale: AppLocale;
  techniques: SpeciesTechniqueView[];
};

export async function SpeciesTechniquesSection({
  locale,
  techniques,
}: SpeciesTechniquesSectionProps) {
  const t = await getTranslations("SpeciesCompass");
  const catchT = await getTranslations("CatchReport");

  if (techniques.length === 0) return null;

  const hasCommunityEvidence = techniques.some(
    (technique) => (technique.reportCount ?? 0) > 0,
  );

  return (
    <section id="species-techniques">
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          {t("techniquesTitle")}
        </h2>
        <InformationSourceBadge
          source={hasCommunityEvidence ? "community" : "editorial"}
        />
      </header>
      <ul className="flex flex-wrap gap-2">
        {techniques.map((technique) => (
          <li key={technique.slug}>
            <Link
              href={`/search?technique=${encodeURIComponent(technique.slug)}`}
              className="border-border/60 bg-muted/30 hover:bg-muted/50 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
            >
              <span>{pickLocalized(technique.name, locale)}</span>
              {(technique.reportCount ?? 0) > 0 ? (
                <span className="text-muted-foreground text-xs tabular-nums">
                  {catchT("speciesSection.stats", {
                    reports: technique.reportCount!,
                    catches: technique.totalCatches ?? technique.reportCount!,
                  })}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

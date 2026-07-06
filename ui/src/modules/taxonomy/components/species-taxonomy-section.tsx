import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { SpeciesTaxonomyProfile } from "@/modules/taxonomy/types";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

type SpeciesTaxonomySectionProps = {
  locale: AppLocale;
  taxonomy: SpeciesTaxonomyProfile;
};

export async function SpeciesTaxonomySection({
  locale,
  taxonomy,
}: SpeciesTaxonomySectionProps) {
  const t = await getTranslations("Taxonomy");
  const notes =
    locale === "tr"
      ? taxonomy.editorialNotes.tr
      : taxonomy.editorialNotes.en;

  const hasAliases = taxonomy.aliases.length > 0;
  const hasRegional = taxonomy.regionalNames.length > 0;
  const hasConfusions = taxonomy.confusions.length > 0;

  if (!notes && !hasAliases && !hasRegional && !hasConfusions) {
    return null;
  }

  return (
    <section
      id="species-taxonomy"
      className="border-border/50 bg-card surface-elevated rounded-2xl border p-6 sm:p-8"
    >
      <h2 className="text-foreground mb-5 text-xl font-semibold tracking-tight">
        {t("sectionTitle")}
      </h2>

      {notes ? (
        <p className="text-muted-foreground mb-6 text-base leading-relaxed">
          {notes}
        </p>
      ) : null}

      {hasAliases ? (
        <div className="mb-6">
          <h3 className="label-caps">{t("aliases")}</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {taxonomy.aliases.map((a) => a.alias).join(" · ")}
          </p>
        </div>
      ) : null}

      {hasRegional ? (
        <div className="mb-6">
          <h3 className="label-caps">{t("regional")}</h3>
          <ul className="text-muted-foreground mt-2 space-y-2 text-sm">
            {taxonomy.regionalNames.map((r) => (
              <li key={`${r.countryScope}-${r.name}`}>
                {r.name}{" "}
                <span className="text-xs">({r.countryScope})</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasConfusions ? (
        <div>
          <h3 className="label-caps">{t("confusedWith")}</h3>
          <ul className="mt-4 space-y-3">
            {taxonomy.confusions.map((c) => (
              <li
                key={c.confusedWithSlug}
                className="border-border/50 rounded-xl border px-4 py-3"
              >
                <Link
                  href={`/species/${c.confusedWithSlug}`}
                  className="text-ocean text-sm font-medium hover:underline"
                >
                  {pickLocalized(c.confusedWithName, locale)}{" "}
                  <span className="text-muted-foreground font-normal italic">
                    ({c.confusedWithScientific})
                  </span>
                </Link>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  {pickLocalized(c.reason, locale)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

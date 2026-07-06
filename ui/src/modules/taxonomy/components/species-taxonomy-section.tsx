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
      className="border-border bg-card mb-10 rounded-xl border p-4 sm:p-6"
    >
      <h2 className="text-foreground mb-4 text-lg font-semibold">
        {t("sectionTitle")}
      </h2>

      {notes ? (
        <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
          {notes}
        </p>
      ) : null}

      {hasAliases ? (
        <div className="mb-4">
          <h3 className="text-foreground text-sm font-medium">{t("aliases")}</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            {taxonomy.aliases.map((a) => a.alias).join(" · ")}
          </p>
        </div>
      ) : null}

      {hasRegional ? (
        <div className="mb-4">
          <h3 className="text-foreground text-sm font-medium">{t("regional")}</h3>
          <ul className="text-muted-foreground mt-1 space-y-1 text-sm">
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
          <h3 className="text-foreground text-sm font-medium">
            {t("confusedWith")}
          </h3>
          <ul className="mt-2 space-y-3">
            {taxonomy.confusions.map((c) => (
              <li
                key={c.confusedWithSlug}
                className="border-border rounded-lg border px-3 py-2"
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

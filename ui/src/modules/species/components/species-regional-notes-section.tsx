import { getTranslations } from "next-intl/server";
import { AuthorAttribution } from "@/modules/editorial/components/author-attribution";
import { InformationSourceBadge } from "@/modules/editorial/components/information-source-badge";
import { BALIK_OLTAMDA_EDITORIAL_SLUG } from "@/modules/editorial/data/authors";
import type { SpeciesRegionalNotesView } from "@/modules/species/types";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

type SpeciesRegionalNotesSectionProps = {
  locale: AppLocale;
  notes: SpeciesRegionalNotesView;
};

export async function SpeciesRegionalNotesSection({
  locale,
  notes,
}: SpeciesRegionalNotesSectionProps) {
  const t = await getTranslations("SpeciesCompass");

  const sections = [
    { key: "mediterranean", label: t("mediterraneanNotes"), value: notes.mediterranean },
    { key: "aegean", label: t("aegeanNotes"), value: notes.aegean },
    {
      key: "northernCyprus",
      label: t("northernCyprusNotes"),
      value: notes.northernCyprus,
    },
  ].filter((section) => section.value !== null);

  if (sections.length === 0) return null;

  return (
    <section
      id="species-regional-notes"
      className="border-border/50 bg-card rounded-2xl border p-6 sm:p-8"
    >
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          {t("regionalNotesTitle")}
        </h2>
        <InformationSourceBadge source="editorial" />
      </header>
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.key}>
            <h3 className="label-caps">{section.label}</h3>
            <p className="text-foreground mt-2 text-sm leading-relaxed">
              {pickLocalized(section.value!, locale)}
            </p>
          </div>
        ))}
      </div>
      <AuthorAttribution
        authorSlug={BALIK_OLTAMDA_EDITORIAL_SLUG}
        locale={locale}
        className="mt-4"
      />
    </section>
  );
}

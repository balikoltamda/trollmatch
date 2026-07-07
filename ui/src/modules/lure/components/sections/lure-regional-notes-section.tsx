import { getTranslations } from "next-intl/server";
import { AuthorAttribution } from "@/modules/editorial/components/author-attribution";
import { BALIK_OLTAMDA_EDITORIAL_SLUG } from "@/modules/editorial/data/authors";
import { LureSection } from "@/modules/lure/components/ui/lure-section";
import { localize } from "@/modules/lure/services/get-lure-detail";
import type { LureRegionalNotesView } from "@/modules/lure/types/lure-detail";
import type { AppLocale } from "@/i18n/routing";

type LureRegionalNotesSectionProps = {
  locale: AppLocale;
  notes: LureRegionalNotesView;
};

export async function LureRegionalNotesSection({
  locale,
  notes,
}: LureRegionalNotesSectionProps) {
  const t = await getTranslations("LureDetail.regional");

  const sections = [
    { key: "mediterranean", label: t("mediterranean"), value: notes.mediterranean },
    { key: "aegean", label: t("aegean"), value: notes.aegean },
    {
      key: "northernCyprus",
      label: t("northernCyprus"),
      value: notes.northernCyprus,
    },
  ].filter((section) => section.value !== null);

  if (sections.length === 0) return null;

  return (
    <LureSection
      id="regional-notes"
      title={t("title")}
      description={t("description")}
      sourceType="editorial"
    >
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.key}>
            <h3 className="label-caps">{section.label}</h3>
            <p className="text-foreground mt-2 text-sm leading-relaxed">
              {localize(section.value!, locale)}
            </p>
          </div>
        ))}
      </div>
      <AuthorAttribution
        authorSlug={BALIK_OLTAMDA_EDITORIAL_SLUG}
        locale={locale}
        className="mt-4"
      />
    </LureSection>
  );
}

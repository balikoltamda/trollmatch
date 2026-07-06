import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { AuthorAttribution } from "@/modules/editorial/components/author-attribution";
import { LureSection } from "@/modules/lure/components/ui/lure-section";
import { localize } from "@/modules/lure/services/get-lure-detail";
import type { EditorialNotePreview } from "@/modules/editorial/types";
import type { AppLocale } from "@/i18n/routing";

type LureEditorialNotesSectionProps = {
  note: EditorialNotePreview;
  locale: AppLocale;
};

export async function LureEditorialNotesSection({
  note,
  locale,
}: LureEditorialNotesSectionProps) {
  const t = await getTranslations("LureDetail.editorial");
  const summary = localize(note.summary, locale).trim();

  if (!summary) {
    return null;
  }

  return (
    <LureSection
      id="editorial-notes"
      title={t("title")}
      description={t("description")}
      sourceType="editorial"
    >
      <div className="space-y-4">
        <p className="text-foreground text-base leading-relaxed">{summary}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="ocean">{t("confidence", { level: note.confidence })}</Badge>
        </div>
        <AuthorAttribution
          authorSlug={note.authorSlug}
          locale={locale}
          reviewedAt={note.updatedAt}
        />
      </div>
    </LureSection>
  );
}

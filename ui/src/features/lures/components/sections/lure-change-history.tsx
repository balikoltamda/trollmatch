import { getTranslations } from "next-intl/server";
import { LureSection } from "@/features/lures/components/ui/lure-section";
import { localize } from "@/features/lures/services/get-lure-detail";
import type { ChangeHistoryEntry } from "@/features/lures/types/lure-detail";
import type { AppLocale } from "@/i18n/routing";

type LureChangeHistoryProps = {
  history: ChangeHistoryEntry[];
  locale: AppLocale;
};

export async function LureChangeHistory({
  history,
  locale,
}: LureChangeHistoryProps) {
  const t = await getTranslations("LureDetail");

  return (
    <LureSection
      id="history"
      title={t("sections.history")}
      description={t("sections.historyDescription")}
    >
      <ol className="border-border relative border-l pl-4">
        {history.map((entry) => (
          <li key={`${entry.date}-${localize(entry.description, locale)}`} className="mb-4 last:mb-0">
            <span
              className="bg-primary absolute -left-1.5 mt-1.5 size-2.5 rounded-full"
              aria-hidden
            />
            <time
              dateTime={entry.date}
              className="text-muted-foreground text-xs font-medium"
            >
              {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                new Date(entry.date),
              )}
            </time>
            <p className="text-foreground mt-0.5 text-sm">
              {localize(entry.description, locale)}
            </p>
            <p className="text-muted-foreground text-xs">
              {localize(entry.actor, locale)}
            </p>
          </li>
        ))}
      </ol>
    </LureSection>
  );
}

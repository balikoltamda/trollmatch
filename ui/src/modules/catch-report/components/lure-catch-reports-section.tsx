import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { LureSection } from "@/modules/lure/components/ui/lure-section";
import { CatchReportQuickForm } from "@/modules/catch-report/components/catch-report-quick-form";
import {
  getCatchReportFormContext,
  listApprovedCatchReportsForLure,
} from "@/modules/catch-report";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

const REGION_LABELS: Record<string, { en: string; tr: string }> = {
  aegean: { en: "Aegean", tr: "Ege" },
  bosphorus: { en: "Bosphorus & Marmara", tr: "Boğaz & Marmara" },
  mediterranean: { en: "Mediterranean", tr: "Akdeniz" },
  "northern-cyprus": { en: "Northern Cyprus", tr: "Kıbrıs" },
};

type LureCatchReportsSectionProps = {
  lureSlug: string;
  locale: AppLocale;
  variantSlug?: string;
};

export async function LureCatchReportsSection({
  lureSlug,
  locale,
  variantSlug,
}: LureCatchReportsSectionProps) {
  const t = await getTranslations("CatchReport");
  const [reports, formContext] = await Promise.all([
    listApprovedCatchReportsForLure(lureSlug, 8),
    getCatchReportFormContext(lureSlug),
  ]);

  return (
    <LureSection
      id="catch-reports"
      title={t("lureSection.title")}
      description={t("lureSection.description")}
    >
      {reports.length > 0 ? (
        <ul className="mb-6 space-y-3">
          {reports.map((report) => (
            <li
              key={report.id}
              className="border-border rounded-lg border px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/species/${report.fishSpeciesSlug}`}
                  className="text-foreground hover:text-ocean text-sm font-medium"
                >
                  {pickLocalized(report.fishSpeciesName, locale)}
                </Link>
                <Badge variant="turquoise">{t("verified")}</Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                {pickLocalized(
                  REGION_LABELS[report.region] ?? {
                    en: report.region,
                    tr: report.region,
                  },
                  locale,
                )}{" "}
                · {report.month}/{report.year} ·{" "}
                {report.boatOrShore === "BOAT" ? t("boat") : t("shore")} ·{" "}
                {t("catchCount", { count: report.catchCount })}
              </p>
              {report.notes ? (
                <p className="text-foreground mt-2 text-sm leading-relaxed">
                  {report.notes}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground mb-6 text-sm">{t("lureSection.empty")}</p>
      )}

      {formContext ? (
        <div className="border-border bg-surface-muted/40 rounded-xl border p-4 sm:p-5">
          <CatchReportQuickForm
            context={formContext}
            locale={locale}
            defaultVariantSlug={variantSlug}
            labels={{
              title: t("form.title"),
              species: t("form.species"),
              variant: t("form.variant"),
              region: t("form.region"),
              when: t("form.when"),
              boat: t("form.boat"),
              shore: t("form.shore"),
              catchCount: t("form.catchCount"),
              notes: t("form.notes"),
              notesPlaceholder: t("form.notesPlaceholder"),
              submit: t("form.submit"),
              submitting: t("form.submitting"),
              success: t("form.success"),
              errorGeneric: t("form.error"),
            }}
          />
        </div>
      ) : null}
    </LureSection>
  );
}

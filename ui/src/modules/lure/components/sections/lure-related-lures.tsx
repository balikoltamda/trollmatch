import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LureSection } from "@/modules/lure/components/ui/lure-section";
import { localize } from "@/modules/lure/services/get-lure-detail";
import type { RelatedLure } from "@/modules/lure/types/lure-detail";
import type { AppLocale } from "@/i18n/routing";

type LureRelatedLuresProps = {
  related: RelatedLure[];
  locale: AppLocale;
};

export async function LureRelatedLures({ related, locale }: LureRelatedLuresProps) {
  const t = await getTranslations("LureDetail");

  if (related.length === 0) return null;

  return (
    <LureSection
      id="related"
      title={t("sections.related")}
      description={t("sections.relatedDescription")}
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/lures/${item.slug}`}
              className="border-border hover:bg-muted/50 focus-visible:ring-ring flex gap-3 rounded-lg border p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-md">
                <Image
                  src={item.imageSrc}
                  alt={localize(item.modelName, locale)}
                  fill
                  sizes="64px"
                  className="object-contain p-1"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground truncate text-xs">
                  {localize(item.manufacturer, locale)}
                </p>
                <p className="text-foreground truncate text-sm font-medium">
                  {localize(item.modelName, locale)}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {localize(item.formFactor, locale)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </LureSection>
  );
}

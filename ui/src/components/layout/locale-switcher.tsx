"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("Layout");
  const pathname = usePathname();
  const locale = useLocale();

  return (
    <div
      className="border-border/80 bg-surface-muted/60 flex items-center gap-0.5 rounded-xl border p-1"
      role="group"
      aria-label={locale === "tr" ? "Dil seçimi" : "Language selection"}
    >
      {routing.locales.map((targetLocale) => (
        <Link
          key={targetLocale}
          href={pathname}
          locale={targetLocale}
          hrefLang={targetLocale}
          aria-current={locale === targetLocale ? "page" : undefined}
          className={cn(
            buttonVariants({
              variant: locale === targetLocale ? "default" : "ghost",
              size: "sm",
            }),
          )}
        >
          {targetLocale === "tr" ? t("localeTr") : t("localeEn")}
        </Link>
      ))}
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export async function SiteHeader() {
  const t = await getTranslations("Layout");

  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <Link
            href="/"
            className="focus-visible:ring-ring block rounded-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <p className="text-foreground truncate text-base font-semibold tracking-tight sm:text-lg">
              {t("siteName")}
            </p>
            <p className="text-muted-foreground truncate text-xs sm:text-sm">
              {t("moduleName")} · {t("tagline")}
            </p>
          </Link>
        </div>
        <LocaleSwitcher />
      </div>
    </header>
  );
}

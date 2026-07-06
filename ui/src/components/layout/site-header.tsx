import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HeaderSearch } from "@/components/layout/header-search";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Container } from "@/components/ui/container";

const navLinkClass =
  "text-muted-foreground hover:text-foreground rounded-xl px-3.5 py-2 text-sm font-medium transition-colors duration-200";

export async function SiteHeader() {
  const t = await getTranslations("Layout");

  return (
    <header className="border-border/50 bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-50 border-b backdrop-blur-xl">
      <Container size="wide">
        <div className="flex h-[4.25rem] items-center gap-5 lg:gap-10">
          <Link
            href="/"
            className="focus-visible:ring-ring flex shrink-0 items-center gap-3 rounded-xl focus-visible:ring-2 focus-visible:outline-none"
          >
            <span
              className="bg-navy text-off-white flex size-10 items-center justify-center rounded-2xl text-sm font-bold tracking-tight"
              aria-hidden
            >
              TM
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="text-foreground block text-sm font-semibold tracking-tight">
                {t("brandName")}
              </span>
              <span className="text-muted-foreground block text-xs leading-snug">
                {t("brandTagline")}
              </span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-0.5 md:flex"
            aria-label={t("navLabel")}
          >
            <Link href="/" className={navLinkClass}>
              {t("navHome")}
            </Link>
            <Link href="/species" className={navLinkClass}>
              {t("navSpecies")}
            </Link>
            <Link href="/lures" className={navLinkClass}>
              {t("navLures")}
            </Link>
            <Link href="/add-lure" className={navLinkClass}>
              {t("navContribute")}
            </Link>
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-3">
            <div className="hidden w-full max-w-xs lg:block">
              <HeaderSearch
                placeholder={t("searchPlaceholder")}
                ariaLabel={t("searchAria")}
              />
            </div>
            <LocaleSwitcher />
          </div>
        </div>
      </Container>
    </header>
  );
}

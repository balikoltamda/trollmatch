import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("Layout");

  return (
    <footer className="border-border mt-auto border-t">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <p className="text-muted-foreground text-center text-xs sm:text-sm">
          {t("footer")}
        </p>
      </div>
    </footer>
  );
}

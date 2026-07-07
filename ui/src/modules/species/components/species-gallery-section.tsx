import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { SpeciesImageView } from "@/modules/species/types";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

type SpeciesGallerySectionProps = {
  locale: AppLocale;
  gallery: SpeciesImageView[];
};

export async function SpeciesGallerySection({
  locale,
  gallery,
}: SpeciesGallerySectionProps) {
  const t = await getTranslations("SpeciesCompass");

  if (gallery.length === 0) return null;

  return (
    <section id="species-gallery">
      <header className="mb-5 space-y-2">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          {t("galleryTitle")}
        </h2>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {gallery.map((image) => (
          <div
            key={image.url}
            className="border-border/50 relative aspect-[4/3] overflow-hidden rounded-xl border"
          >
            <Image
              src={image.url}
              alt={pickLocalized(image.alt, locale)}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

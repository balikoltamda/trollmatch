import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { BookOpen, ShieldCheck } from "lucide-react";

const BALIK_OLTAMDA_URL = "https://balikoltamda.net";

export async function HomeTrustStrip() {
  const t = await getTranslations("Home.trust");

  return (
    <div className="border-border/40 flex flex-col items-center gap-6 border-t pt-10">
      <a
        href={BALIK_OLTAMDA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group focus-visible:ring-ring inline-flex items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:outline-none"
        aria-label={t("developerAria")}
      >
        <Image
          src="/brand/balik-oltamda-logo.png"
          alt=""
          width={32}
          height={32}
          className="size-8 rounded object-contain opacity-80 transition-opacity group-hover:opacity-100"
        />
        <span className="text-muted-foreground text-sm">
          {t("developedBy")}{" "}
          <span className="text-foreground font-medium">Balık Oltamda</span>
        </span>
      </a>

      <ul className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
        <li className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
          {t("editorialReview")}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <BookOpen className="size-3.5 shrink-0" aria-hidden />
          {t("verifiedSources")}
        </li>
      </ul>
    </div>
  );
}

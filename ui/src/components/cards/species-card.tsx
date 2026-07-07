import Image from "next/image";
import { Fish } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SpeciesRegionLabel } from "@/modules/discovery/types";

type SpeciesCardProps = {
  slug?: string;
  name: string;
  scientificName: string;
  regions?: SpeciesRegionLabel[];
  regionLabels?: string;
  lureCount: number;
  lureCountLabel?: string;
  heroImageUrl?: string | null;
  className?: string;
};

export function SpeciesCard({
  slug,
  name,
  scientificName,
  regions = [],
  regionLabels,
  lureCount,
  lureCountLabel,
  heroImageUrl = null,
  className,
}: SpeciesCardProps) {
  const countLabel = lureCountLabel ?? String(lureCount);
  const imageSrc = heroImageUrl;
  const distribution =
    regionLabels ??
    (regions.length > 0 ? regions.map((region) => region.en).join(" · ") : scientificName);

  const card = (
    <Card interactive className={cn("h-full overflow-hidden", className)}>
      {imageSrc ? (
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={imageSrc}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          <Badge variant="turquoise" className="absolute top-4 right-4">
            {countLabel}
          </Badge>
        </div>
      ) : (
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="bg-ocean/6 text-ocean flex size-11 items-center justify-center rounded-2xl">
              <Fish className="size-5" aria-hidden />
            </div>
            <Badge variant="turquoise">{countLabel}</Badge>
          </div>
        </CardHeader>
      )}
      <CardContent className={cn(imageSrc ? "pt-5" : "pt-0")}>
        <h3 className="text-foreground text-lg font-semibold tracking-tight">
          {name}
        </h3>
        <p className="text-muted-foreground mt-1 text-sm italic">{scientificName}</p>
        {regions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(regionLabels
              ? regionLabels.split(" · ")
              : regions.map((region) => region.en)
            ).map((label) => (
              <Badge key={label} variant="muted" className="text-xs">
                {label}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {distribution}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (slug) {
    return (
      <Link href={`/species/${slug}`} className="group block">
        {card}
      </Link>
    );
  }

  return card;
}

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type LureCardProps = {
  slug: string;
  manufacturer: string;
  modelName: string;
  formFactor: string;
  imageSrc: string;
  verified?: boolean;
  verifiedLabel?: string;
  className?: string;
};

export function LureCard({
  slug,
  manufacturer,
  modelName,
  formFactor,
  imageSrc,
  verified = false,
  verifiedLabel = "Verified",
  className,
}: LureCardProps) {
  return (
    <Link href={`/lures/${slug}`} className={cn("group block", className)}>
      <Card interactive className="h-full overflow-hidden">
        <CardHeader className="p-0">
          <div className="bg-surface-muted/80 relative aspect-[5/4] overflow-hidden">
            <Image
              src={imageSrc}
              alt={modelName}
              fill
              className="object-contain p-8 transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-6">
          <p className="label-caps">{manufacturer}</p>
          <h3 className="text-foreground text-[1.0625rem] font-semibold leading-snug tracking-tight">
            {modelName}
          </h3>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
            {formFactor}
          </p>
        </CardContent>
        {verified ? (
          <CardFooter className="pt-0">
            <Badge variant="turquoise">{verifiedLabel}</Badge>
          </CardFooter>
        ) : null}
      </Card>
    </Link>
  );
}

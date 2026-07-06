import { Link } from "@/i18n/navigation";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ManufacturerCardProps = {
  slug?: string;
  name: string;
  country: string;
  status?: "active" | "importing";
  statusLabel?: string;
  productLabel: string;
  className?: string;
};

export function ManufacturerCard({
  slug,
  name,
  country,
  status = "active",
  statusLabel,
  productLabel,
  className,
}: ManufacturerCardProps) {
  const badgeText = statusLabel ?? (status === "importing" ? "Importing" : country);

  const card = (
    <Card interactive className={cn("h-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="bg-navy/5 text-navy flex size-11 items-center justify-center rounded-2xl">
            <Building2 className="size-5" aria-hidden />
          </div>
          {status === "importing" ? (
            <Badge variant="coral">{badgeText}</Badge>
          ) : (
            <Badge variant="ocean">{badgeText}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <h3 className="text-foreground text-lg font-semibold tracking-tight">
          {name}
        </h3>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {productLabel}
        </p>
      </CardContent>
    </Card>
  );

  if (slug) {
    return (
      <Link href={`/manufacturers/${slug}`} className="group block">
        {card}
      </Link>
    );
  }

  return card;
}

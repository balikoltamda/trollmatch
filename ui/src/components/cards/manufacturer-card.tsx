import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ManufacturerCardProps = {
  name: string;
  country: string;
  status?: "active" | "importing";
  statusLabel?: string;
  productLabel: string;
  className?: string;
};

export function ManufacturerCard({
  name,
  country,
  status = "active",
  statusLabel,
  productLabel,
  className,
}: ManufacturerCardProps) {
  const badgeText = statusLabel ?? (status === "importing" ? "Importing" : country);

  return (
    <Card interactive className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="bg-navy/6 text-navy flex size-10 items-center justify-center rounded-xl">
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
        <h3 className="text-foreground text-lg font-semibold">{name}</h3>
        <p className="text-muted-foreground mt-1 text-sm">{productLabel}</p>
      </CardContent>
    </Card>
  );
}

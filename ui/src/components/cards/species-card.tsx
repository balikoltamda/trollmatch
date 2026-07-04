import { Fish } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SpeciesCardProps = {
  name: string;
  habitat: string;
  lureCount: number;
  className?: string;
};

export function SpeciesCard({
  name,
  habitat,
  lureCount,
  className,
}: SpeciesCardProps) {
  return (
    <Card interactive className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="bg-ocean/8 text-ocean flex size-10 items-center justify-center rounded-xl">
            <Fish className="size-5" aria-hidden />
          </div>
          <Badge variant="turquoise">{lureCount}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <h3 className="text-foreground text-lg font-semibold">{name}</h3>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          {habitat}
        </p>
      </CardContent>
    </Card>
  );
}

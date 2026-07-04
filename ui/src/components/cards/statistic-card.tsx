import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatisticCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent?: "ocean" | "turquoise" | "coral" | "navy";
  className?: string;
};

const accentClasses: Record<NonNullable<StatisticCardProps["accent"]>, string> = {
  ocean: "bg-ocean/8 text-ocean",
  turquoise: "bg-turquoise/12 text-[color-mix(in_oklch,var(--turquoise),var(--navy)_35%)]",
  coral: "bg-coral/10 text-[color-mix(in_oklch,var(--coral),var(--navy)_30%)]",
  navy: "bg-navy/6 text-navy",
};

export function StatisticCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "ocean",
  className,
}: StatisticCardProps) {
  return (
    <Card className={cn("surface-elevated", className)}>
      <CardContent className="flex flex-col gap-4 p-6">
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-xl",
            accentClasses[accent],
          )}
        >
          <Icon className="size-5" aria-hidden />
        </div>
        <div>
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <p className="text-foreground mt-1 text-3xl font-semibold tracking-tight">
            {value}
          </p>
          {hint ? (
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
              {hint}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

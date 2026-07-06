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
  ocean: "bg-ocean/6 text-ocean",
  turquoise: "bg-turquoise/10 text-[color-mix(in_oklch,var(--turquoise),var(--navy)_35%)]",
  coral: "bg-coral/8 text-[color-mix(in_oklch,var(--coral),var(--navy)_30%)]",
  navy: "bg-navy/5 text-navy",
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
    <Card className={cn("h-full", className)}>
      <CardContent className="flex flex-col gap-5 p-7 sm:p-8">
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-2xl",
            accentClasses[accent],
          )}
        >
          <Icon className="size-5" aria-hidden />
        </div>
        <div>
          <p className="label-caps">{label}</p>
          <p className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {value}
          </p>
          {hint ? (
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              {hint}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

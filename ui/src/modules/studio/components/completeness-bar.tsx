import { cn } from "@/lib/utils";

type CompletenessBarProps = {
  score: number;
  missing?: string[];
  compact?: boolean;
  className?: string;
};

export function CompletenessBar({
  score,
  missing = [],
  compact = false,
  className,
}: CompletenessBarProps) {
  const tone =
    score >= 90 ? "bg-ocean" : score >= 60 ? "bg-amber-500" : "bg-destructive";

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-2">
        <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
          <div
            className={cn("h-full rounded-full transition-all", tone)}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
        <span className="text-muted-foreground text-xs tabular-nums">{score}%</span>
      </div>
      {!compact && missing.length > 0 ? (
        <p className="text-muted-foreground text-xs">
          Missing: {missing.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

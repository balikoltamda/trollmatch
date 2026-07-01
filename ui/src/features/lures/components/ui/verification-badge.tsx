import { BadgeCheck, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/features/lures/types/lure-detail";

type VerificationBadgeProps = {
  status: VerificationStatus;
  label: string;
  lastVerifiedLabel?: string;
  lastVerifiedAt?: string;
  className?: string;
};

const statusConfig: Record<
  VerificationStatus,
  { icon: typeof BadgeCheck; className: string }
> = {
  unverified: {
    icon: ShieldCheck,
    className: "bg-muted text-muted-foreground",
  },
  partially_verified: {
    icon: ShieldCheck,
    className: "bg-secondary text-secondary-foreground",
  },
  manufacturer_verified: {
    icon: BadgeCheck,
    className: "bg-primary/10 text-primary",
  },
  moderator_verified: {
    icon: UserCheck,
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  expert_endorsed: {
    icon: Sparkles,
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
};

export function VerificationBadge({
  status,
  label,
  lastVerifiedLabel,
  lastVerifiedAt,
  className,
}: VerificationBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex flex-col gap-1 rounded-lg px-3 py-2 text-sm",
        config.className,
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5 font-medium">
        <Icon className="size-4 shrink-0" aria-hidden />
        {label}
      </span>
      {lastVerifiedAt && lastVerifiedLabel ? (
        <span className="text-xs opacity-80">
          {lastVerifiedLabel}:{" "}
          {new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
          }).format(new Date(lastVerifiedAt))}
        </span>
      ) : null}
    </div>
  );
}

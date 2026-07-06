import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = ComponentProps<"span"> & {
  variant?: "default" | "ocean" | "turquoise" | "coral" | "muted";
};

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-primary text-primary-foreground",
  ocean: "bg-ocean/10 text-ocean",
  turquoise: "bg-turquoise/15 text-[color-mix(in_oklch,var(--turquoise),var(--navy)_40%)]",
  coral: "bg-coral/12 text-[color-mix(in_oklch,var(--coral),var(--navy)_35%)]",
  muted: "bg-muted text-muted-foreground",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.6875rem] font-medium tracking-wide",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

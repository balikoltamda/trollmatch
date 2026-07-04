import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ChipProps = ComponentProps<"button"> & {
  selected?: boolean;
};

export function Chip({
  className,
  selected = false,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
        selected
          ? "border-ocean bg-ocean/8 text-ocean"
          : "border-border bg-card text-muted-foreground hover:border-ocean/40 hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

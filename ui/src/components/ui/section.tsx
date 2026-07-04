import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type SectionProps = ComponentProps<"section"> & {
  spacing?: "default" | "tight" | "loose";
};

const spacingClasses = {
  tight: "py-10 sm:py-12",
  default: "py-14 sm:py-20",
  loose: "py-20 sm:py-28",
};

export function Section({
  className,
  spacing = "default",
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(spacingClasses[spacing], className)}
      {...props}
    />
  );
}

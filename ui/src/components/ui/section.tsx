import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type SectionProps = ComponentProps<"section"> & {
  spacing?: "default" | "tight" | "loose";
};

const spacingClasses = {
  tight: "py-12 sm:py-16",
  default: "py-16 sm:py-24 lg:py-28",
  loose: "py-24 sm:py-32 lg:py-36",
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

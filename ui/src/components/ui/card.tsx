import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type CardProps = ComponentProps<"div"> & {
  interactive?: boolean;
};

export function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground rounded-2xl border border-border/60",
        interactive && "surface-elevated hover:-translate-y-px",
        !interactive && "shadow-[0_1px_2px_oklch(0.28_0.04_255/0.03)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-2 p-6 sm:p-7", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("px-6 pb-6 sm:px-7 sm:pb-7", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center border-t border-border/50 px-6 py-4 sm:px-7",
        className,
      )}
      {...props}
    />
  );
}

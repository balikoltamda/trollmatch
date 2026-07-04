import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type PageTitleProps = ComponentProps<"div"> & {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function PageTitle({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  ...props
}: PageTitleProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className,
      )}
      {...props}
    >
      {eyebrow ? (
        <p className="text-ocean text-sm font-medium tracking-wide uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
        {title}
      </h1>
      {description ? (
        <p className="text-muted-foreground max-w-2xl text-base leading-relaxed sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

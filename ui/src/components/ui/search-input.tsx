"use client";

import { Search } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type SearchInputProps = Omit<ComponentProps<"input">, "type"> & {
  onSearch?: (value: string) => void;
};

export function SearchInput({
  className,
  onSearch,
  onKeyDown,
  ...props
}: SearchInputProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search
        className="text-muted-foreground/70 pointer-events-none absolute top-1/2 left-4 size-[1.125rem] -translate-y-1/2"
        aria-hidden
      />
      <Input
        type="search"
        className="h-12 pl-11 text-base"
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.key === "Enter" && onSearch) {
            onSearch((event.target as HTMLInputElement).value);
          }
        }}
        {...props}
      />
    </div>
  );
}

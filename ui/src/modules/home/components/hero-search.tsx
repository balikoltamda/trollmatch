"use client";

import { useRouter } from "@/i18n/navigation";
import { SearchInput } from "@/components/ui/search-input";

type HeroSearchProps = {
  placeholder: string;
  ariaLabel: string;
};

export function HeroSearch({ placeholder, ariaLabel }: HeroSearchProps) {
  const router = useRouter();

  return (
    <SearchInput
      placeholder={placeholder}
      aria-label={ariaLabel}
      onSearch={(query) => {
        const trimmed = query.trim();
        if (trimmed) {
          router.push(`/lures/${encodeURIComponent(trimmed.toLowerCase())}`);
        }
      }}
    />
  );
}

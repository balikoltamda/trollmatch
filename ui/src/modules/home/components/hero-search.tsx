"use client";

import { DiscoverySearchForm } from "@/modules/discovery/components/discovery-search-form";

type HeroSearchProps = {
  placeholder: string;
  ariaLabel: string;
};

export function HeroSearch({ placeholder, ariaLabel }: HeroSearchProps) {
  return (
    <DiscoverySearchForm
      placeholder={placeholder}
      ariaLabel={ariaLabel}
      size="lg"
    />
  );
}

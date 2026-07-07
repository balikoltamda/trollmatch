"use client";

import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { StudioInput, StudioSelect } from "@/modules/studio/components/studio-ui";
import { STUDIO_SPECIES_PATH } from "@/modules/studio/lib/studio-routes";
import {
  EDITORIAL_STATUS_OPTIONS,
  editorialStatusLabel,
} from "@/modules/studio/lib/editorial";

type SpeciesSearchFormProps = {
  initialQuery: string;
  initialLifecycle: string;
  initialSort: string;
  includeArchived: boolean;
  regions: Array<{ id: string; nameEn: string }>;
  initialRegionId: string;
};

export function SpeciesSearchForm({
  initialQuery,
  initialLifecycle,
  initialSort,
  includeArchived,
  regions,
  initialRegionId,
}: SpeciesSearchFormProps) {
  const router = useRouter();

  return (
    <form
      className="mb-6 grid gap-3 md:grid-cols-6"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const params = new URLSearchParams();
        for (const [key, value] of data.entries()) {
          if (typeof value === "string" && value.trim()) {
            params.set(key, value.trim());
          }
        }
        const archivedInput = form.elements.namedItem("archived");
        if (
          archivedInput instanceof HTMLInputElement &&
          archivedInput.checked
        ) {
          params.set("archived", "1");
        }
        router.push(`${STUDIO_SPECIES_PATH}?${params.toString()}`);
      }}
    >
      <StudioInput
        name="q"
        placeholder="Search names, scientific, slugs, aliases…"
        defaultValue={initialQuery}
        className="md:col-span-2"
      />
      <StudioSelect name="lifecycle" defaultValue={initialLifecycle}>
        <option value="">All lifecycle</option>
        {EDITORIAL_STATUS_OPTIONS.map((state) => (
          <option key={state} value={state}>
            {editorialStatusLabel(state)}
          </option>
        ))}
      </StudioSelect>
      <StudioSelect name="region" defaultValue={initialRegionId}>
        <option value="">All regions</option>
        {regions.map((region) => (
          <option key={region.id} value={region.id}>
            {region.nameEn}
          </option>
        ))}
      </StudioSelect>
      <StudioSelect name="sort" defaultValue={initialSort || "nameEn"}>
        <option value="nameEn">Sort: English name</option>
        <option value="nameTr">Sort: Turkish name</option>
        <option value="scientific">Sort: Scientific</option>
        <option value="lifecycle">Sort: Lifecycle</option>
        <option value="updated">Sort: Recently updated</option>
      </StudioSelect>
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="archived"
            defaultChecked={includeArchived}
          />
          Archived only
        </label>
        <button type="submit" className={buttonVariants({ size: "sm" })}>
          Search
        </button>
        <button
          type="button"
          className={buttonVariants({ size: "sm", variant: "outline" })}
          onClick={() => router.push(STUDIO_SPECIES_PATH)}
        >
          Reset
        </button>
      </div>
    </form>
  );
}

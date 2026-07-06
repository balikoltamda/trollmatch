import Link from "next/link";
import type { ContentLifecycleState } from "@/generated/prisma/client";
import { buttonVariants } from "@/components/ui/button";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import { StudioInput, StudioSelect } from "@/modules/studio/components/studio-ui";
import { ProductsTable } from "@/modules/studio/components/products-table";
import {
  LIFECYCLE_OPTIONS,
  listBodyTypeOptions,
  listManufacturerOptions,
  listProducts,
  listSpeciesFilterOptions,
  listTechniqueFilterOptions,
} from "@/modules/studio/data/products";
import {
  listSpeciesOptions,
  listTechniqueOptions,
} from "@/modules/studio/data/product-detail";
import { editorialStatusLabel } from "@/modules/studio/lib/editorial";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    manufacturer?: string;
    bodyType?: string;
    lifecycle?: string;
    needsReview?: string;
    hasEditorNote?: string;
    technique?: string;
    species?: string;
    page?: string;
  }>;
};

export default async function StudioProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10) || 1;

  const [
    { rows, total, pageSize },
    manufacturers,
    bodyTypes,
    techniques,
    species,
    speciesForBulk,
    techniquesForBulk,
  ] = await Promise.all([
    listProducts({
      q: params.q,
      manufacturer: params.manufacturer,
      bodyType: params.bodyType,
      lifecycle: params.lifecycle as ContentLifecycleState | undefined,
      needsReview: params.needsReview === "1",
      hasEditorNote: params.hasEditorNote === "1",
      technique: params.technique,
      species: params.species,
      page,
    }),
    listManufacturerOptions(),
    listBodyTypeOptions(),
    listTechniqueFilterOptions(),
    listSpeciesFilterOptions(),
    listSpeciesOptions(),
    listTechniqueOptions(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <StudioPageHeader
        title="Products"
        description="Trust scores reflect manufacturer source, catch reports, and editorial review — open a product to see why."
      />
      <StudioPageBody>
        <form className="mb-6 grid gap-3 md:grid-cols-6" method="get">
          <StudioInput
            name="q"
            placeholder="Search model, code, slug, fish, technique…"
            defaultValue={params.q}
            className="md:col-span-2"
          />
          <StudioSelect name="manufacturer" defaultValue={params.manufacturer ?? ""}>
            <option value="">All manufacturers</option>
            {manufacturers.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.nameEn}
              </option>
            ))}
          </StudioSelect>
          <StudioSelect name="technique" defaultValue={params.technique ?? ""}>
            <option value="">All techniques</option>
            {techniques.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.nameEn}
              </option>
            ))}
          </StudioSelect>
          <StudioSelect name="species" defaultValue={params.species ?? ""}>
            <option value="">All species</option>
            {species.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.nameEn}
              </option>
            ))}
          </StudioSelect>
          <StudioSelect name="lifecycle" defaultValue={params.lifecycle ?? ""}>
            <option value="">All states</option>
            {LIFECYCLE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {editorialStatusLabel(s)}
              </option>
            ))}
          </StudioSelect>
          <StudioSelect name="bodyType" defaultValue={params.bodyType ?? ""}>
            <option value="">All body types</option>
            {bodyTypes.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.label}
              </option>
            ))}
          </StudioSelect>
          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="needsReview"
                value="1"
                defaultChecked={params.needsReview === "1"}
              />
              Needs review
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="hasEditorNote"
                value="1"
                defaultChecked={params.hasEditorNote === "1"}
              />
              Has editor note
            </label>
            <button type="submit" className={buttonVariants({ size: "sm" })}>
              Search
            </button>
          </div>
        </form>

        <p className="text-muted-foreground mb-3 text-sm">
          {total} products · page {page} of {totalPages}
        </p>

        <ProductsTable
          rows={rows}
          speciesOptions={speciesForBulk}
          techniqueOptions={techniquesForBulk}
        />

        {totalPages > 1 ? (
          <div className="mt-4 flex gap-2">
            {page > 1 ? (
              <Link
                href={`/studio/products?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
                className={buttonVariants({ size: "sm", variant: "outline" })}
              >
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={`/studio/products?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
                className={buttonVariants({ size: "sm", variant: "outline" })}
              >
                Next
              </Link>
            ) : null}
          </div>
        ) : null}
      </StudioPageBody>
    </>
  );
}

import Link from "next/link";
import type { ContentLifecycleState } from "@/generated/prisma/client";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import {
  StudioInput,
  StudioSelect,
  StudioTable,
  StudioTd,
  StudioTh,
} from "@/modules/studio/components/studio-ui";
import {
  LIFECYCLE_OPTIONS,
  listBodyTypeOptions,
  listManufacturerOptions,
  listProducts,
} from "@/modules/studio/data/products";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    manufacturer?: string;
    bodyType?: string;
    lifecycle?: string;
    needsReview?: string;
    hasEditorNote?: string;
    page?: string;
  }>;
};

export default async function StudioProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10) || 1;

  const [{ rows, total, pageSize }, manufacturers, bodyTypes] =
    await Promise.all([
      listProducts({
        q: params.q,
        manufacturer: params.manufacturer,
        bodyType: params.bodyType,
        lifecycle: params.lifecycle as ContentLifecycleState | undefined,
        needsReview: params.needsReview === "1",
        hasEditorNote: params.hasEditorNote === "1",
        page,
      }),
      listManufacturerOptions(),
      listBodyTypeOptions(),
    ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <StudioPageHeader
        title="Products"
        description="Server-side catalog table — filter, search, open the editor."
      />
      <StudioPageBody>
        <form className="mb-6 grid gap-3 md:grid-cols-6" method="get">
          <StudioInput
            name="q"
            placeholder="Search name or slug…"
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
          <StudioSelect name="bodyType" defaultValue={params.bodyType ?? ""}>
            <option value="">All body types</option>
            {bodyTypes.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.label}
              </option>
            ))}
          </StudioSelect>
          <StudioSelect name="lifecycle" defaultValue={params.lifecycle ?? ""}>
            <option value="">All states</option>
            {LIFECYCLE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
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
              Filter
            </button>
          </div>
        </form>

        <p className="text-muted-foreground mb-3 text-sm">
          {total} products · page {page} of {totalPages}
        </p>

        <StudioTable>
          <thead>
            <tr>
              <StudioTh>Product</StudioTh>
              <StudioTh>Manufacturer</StudioTh>
              <StudioTh>Body</StudioTh>
              <StudioTh>State</StudioTh>
              <StudioTh>Feed</StudioTh>
              <StudioTh>Notes</StudioTh>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <StudioTd colSpan={6} className="text-muted-foreground">
                  No products match these filters.
                </StudioTd>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30">
                  <StudioTd>
                    <Link
                      href={`/studio/products/${row.id}`}
                      className="hover:text-ocean font-medium"
                    >
                      {row.nameEn}
                    </Link>
                    <p className="text-muted-foreground text-xs">{row.slug}</p>
                  </StudioTd>
                  <StudioTd>{row.manufacturerName}</StudioTd>
                  <StudioTd>{row.bodyTypeEn ?? "—"}</StudioTd>
                  <StudioTd>
                    <Badge variant="muted">{row.lifecycleState}</Badge>
                  </StudioTd>
                  <StudioTd>
                    <Badge variant="ocean">{row.manufacturerStatus}</Badge>
                  </StudioTd>
                  <StudioTd>{row.hasEditorNote ? "Yes" : "—"}</StudioTd>
                </tr>
              ))
            )}
          </tbody>
        </StudioTable>

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

import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import {
  StudioTable,
  StudioTd,
  StudioTh,
} from "@/modules/studio/components/studio-ui";
import { RegionRowActions } from "@/modules/region/components/region-row-actions";
import { RegionSearchForm } from "@/modules/region/components/region-search-form";
import { ensureRegionSeeds } from "@/modules/region/data/seed-regions";
import { listRegions } from "@/modules/region/repositories/region-repository";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string; inactive?: string }>;
};

export default async function StudioRegionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const activeOnly = params.inactive === "0";

  await ensureRegionSeeds();

  const regions = await listRegions({ q, includeInactive: !activeOnly });

  return (
    <>
      <StudioPageHeader
        title="Regions"
        description="Fishing knowledge geography — major water bodies only. No cities, no GPS."
      />
      <StudioPageBody>
        <Suspense fallback={null}>
          <RegionSearchForm initialQuery={q} activeOnly={activeOnly} />
        </Suspense>

        <StudioTable>
          <thead>
            <tr>
              <StudioTh>Order</StudioTh>
              <StudioTh>Name</StudioTh>
              <StudioTh>Slug</StudioTh>
              <StudioTh>Code</StudioTh>
              <StudioTh>Status</StudioTh>
              <StudioTh />
            </tr>
          </thead>
          <tbody>
            {regions.length === 0 ? (
              <tr>
                <StudioTd colSpan={6} className="text-muted-foreground">
                  No regions match your search.
                </StudioTd>
              </tr>
            ) : (
              regions.map((region, index) => (
                <tr key={region.id}>
                  <StudioTd>{region.displayOrder}</StudioTd>
                  <StudioTd>
                    <Link
                      href={`/studio/regions/${region.slug}`}
                      className="text-ocean hover:underline"
                    >
                      {region.nameEn}
                    </Link>
                    <p className="text-muted-foreground text-xs">{region.nameTr}</p>
                  </StudioTd>
                  <StudioTd>{region.slug}</StudioTd>
                  <StudioTd>{region.code}</StudioTd>
                  <StudioTd>
                    <Badge variant={region.isActive ? "ocean" : "muted"}>
                      {region.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </StudioTd>
                  <StudioTd>
                    <RegionRowActions
                      slug={region.slug}
                      isActive={region.isActive}
                      canMoveUp={index > 0}
                      canMoveDown={index < regions.length - 1}
                    />
                  </StudioTd>
                </tr>
              ))
            )}
          </tbody>
        </StudioTable>
      </StudioPageBody>
    </>
  );
}

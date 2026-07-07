import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import type { ContentLifecycleState } from "@/generated/prisma/client";
import { buttonVariants } from "@/components/ui/button";
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
import { EditorialStatusBadge } from "@/modules/studio/components/editorial-status-badge";
import { SpeciesSearchForm } from "@/modules/species/components/species-search-form";
import {
  STUDIO_SPECIES_NEW_PATH,
  studioSpeciesDetailPath,
} from "@/modules/studio/lib/studio-routes";
import { listStudioSpecies } from "@/modules/species/repositories/species-repository";
import { ensureRegionSeeds } from "@/modules/region/data/seed-regions";
import { listRegions } from "@/modules/region/repositories/region-repository";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    lifecycle?: string;
    sort?: string;
    archived?: string;
    region?: string;
    page?: string;
  }>;
};

export default async function StudioSpeciesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10) || 1;
  const includeArchived = params.archived === "1";

  await ensureRegionSeeds();

  const [result, regions] = await Promise.all([
    listStudioSpecies({
      q: params.q,
      lifecycle: params.lifecycle as ContentLifecycleState | undefined,
      includeArchived,
      regionId: params.region,
      sort: (params.sort as "nameEn" | "nameTr" | "scientific" | "lifecycle" | "updated") ?? "nameEn",
      page,
    }),
    listRegions({ includeInactive: true }),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <>
      <StudioPageHeader
        title="Fish species"
        description="Mediterranean fish encyclopedia — preferred names, distribution, aliases, and editorial lifecycle."
        actions={
          <Link
            href={STUDIO_SPECIES_NEW_PATH}
            className={buttonVariants({ size: "sm" })}
          >
            New species
          </Link>
        }
      />
      <StudioPageBody>
        <Suspense fallback={null}>
          <SpeciesSearchForm
            initialQuery={params.q ?? ""}
            initialLifecycle={params.lifecycle ?? ""}
            initialSort={params.sort ?? "nameEn"}
            includeArchived={includeArchived}
            regions={regions.map((r) => ({ id: r.id, nameEn: r.nameEn }))}
            initialRegionId={params.region ?? ""}
          />
        </Suspense>

        <StudioTable>
          <thead>
            <tr>
              <StudioTh>Photo</StudioTh>
              <StudioTh>Preferred names</StudioTh>
              <StudioTh>Scientific</StudioTh>
              <StudioTh>Lifecycle</StudioTh>
              <StudioTh>Regions</StudioTh>
              <StudioTh>Aliases</StudioTh>
              <StudioTh>Lures</StudioTh>
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 ? (
              <tr>
                <StudioTd colSpan={7} className="text-muted-foreground">
                  No species match your filters.
                </StudioTd>
              </tr>
            ) : (
              result.rows.map((row) => (
                <tr key={row.id}>
                  <StudioTd>
                    {row.heroImageUrl ? (
                      <div className="relative size-12 overflow-hidden rounded-md">
                        <Image
                          src={row.heroImageUrl}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </StudioTd>
                  <StudioTd>
                    <Link
                      href={studioSpeciesDetailPath(row.slugEn)}
                      className="text-ocean hover:underline"
                    >
                      {row.nameTr}
                    </Link>
                    <p className="text-muted-foreground text-xs">{row.nameEn}</p>
                    {row.deletedAt ? (
                      <Badge variant="muted" className="mt-1">
                        Archived
                      </Badge>
                    ) : null}
                  </StudioTd>
                  <StudioTd className="italic">{row.scientificName}</StudioTd>
                  <StudioTd>
                    {row.lifecycleState ? (
                      <EditorialStatusBadge state={row.lifecycleState} />
                    ) : (
                      <Badge variant="muted">No profile</Badge>
                    )}
                  </StudioTd>
                  <StudioTd>{row.regionCount}</StudioTd>
                  <StudioTd>{row.aliasCount}</StudioTd>
                  <StudioTd>{row.lureLinkCount}</StudioTd>
                </tr>
              ))
            )}
          </tbody>
        </StudioTable>

        {totalPages > 1 ? (
          <p className="text-muted-foreground mt-4 text-sm">
            Page {page} of {totalPages} ({result.total} species)
          </p>
        ) : null}
      </StudioPageBody>
    </>
  );
}

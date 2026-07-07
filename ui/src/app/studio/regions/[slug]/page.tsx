import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import { RegionEditFormPanel } from "@/modules/region/components/region-edit-form";
import { ensureEntityAiReview, loadAiReviewSession } from "@/modules/studio/ai-review/actions/ai-review-actions";
import { EntityAiReviewMini } from "@/modules/studio/ai-review/components/entity-ai-review-mini";
import { EntityInsightsPanel } from "@/modules/studio/ai-review/components/entity-insights-panel";
import { ensureRegionSeeds } from "@/modules/region/data/seed-regions";
import { getRegionBySlug } from "@/modules/region/repositories/region-repository";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function StudioRegionDetailPage({ params }: PageProps) {
  const { slug } = await params;

  await ensureRegionSeeds();

  const region = await getRegionBySlug(slug);
  if (!region) notFound();

  await ensureEntityAiReview("REGION", region.id);
  const aiSession = await loadAiReviewSession("REGION", region.id);

  return (
    <>
      <StudioPageHeader
        title={region.nameEn}
        description={region.descriptionEn ?? "Regional fishing context for editorial and catch reports."}
        actions={
          <Link
            href="/studio/regions"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            All regions
          </Link>
        }
      />
      <StudioPageBody>
        <EntityInsightsPanel entityType="REGION" entityId={region.id} entityLabel={region.nameEn} />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant={region.isActive ? "ocean" : "muted"}>
            {region.isActive ? "Active" : "Inactive"}
          </Badge>
          <span className="text-muted-foreground text-sm">
            Display order {region.displayOrder}
          </span>
        </div>

        <RegionEditFormPanel
          slug={region.slug}
          code={region.code}
          initial={{
            nameEn: region.nameEn,
            nameTr: region.nameTr,
            descriptionEn: region.descriptionEn ?? "",
            descriptionTr: region.descriptionTr ?? "",
            displayOrder: region.displayOrder,
            isActive: region.isActive,
          }}
        />

        <EntityAiReviewMini
          entityType="REGION"
          entityId={region.id}
          session={aiSession}
          label="Region name or code (re-analyze)"
        />
      </StudioPageBody>
    </>
  );
}

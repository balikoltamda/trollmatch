import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import { ProductEditor } from "@/modules/studio/components/product-editor";
import {
  ensureEntityAiReview,
  loadAiReviewSession,
} from "@/modules/studio/ai-review/actions/ai-review-actions";
import { EntityAiReviewMini } from "@/modules/studio/ai-review/components/entity-ai-review-mini";
import { EntityInsightsPanel } from "@/modules/studio/ai-review/components/entity-insights-panel";
import {
  getProductEditorData,
  listSpeciesOptions,
  listTechniqueOptions,
} from "@/modules/studio/data/product-detail";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudioProductEditorPage({ params }: PageProps) {
  const { id } = await params;

  const [product, techniqueOptions, speciesOptions] = await Promise.all([
    getProductEditorData(id),
    listTechniqueOptions(),
    listSpeciesOptions(),
  ]);

  if (!product) notFound();

  await ensureEntityAiReview("LURE", product.id);
  const aiSession = await loadAiReviewSession("LURE", product.id);

  return (
    <>
      <StudioPageHeader
        title={product.nameEn}
        description="Verify suggestions first — manual override only when needed."
        actions={
          <Link
            href="/studio"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            Attention inbox
          </Link>
        }
      />
      <StudioPageBody>
        <EntityAiReviewMini
          entityType="LURE"
          entityId={product.id}
          session={aiSession}
          label="Lure model name (re-analyze validation)"
        />
        <EntityInsightsPanel entityType="LURE" entityId={product.id} entityLabel={product.nameEn} />
        <ProductEditor
          product={product}
          techniqueOptions={techniqueOptions}
          speciesOptions={speciesOptions}
        />
      </StudioPageBody>
    </>
  );
}

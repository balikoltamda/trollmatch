import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import { SpeciesEditorPanel } from "@/modules/species/components/species-editor-panel";
import { loadAiReviewSession, ensureEntityAiReview } from "@/modules/studio/ai-review/actions/ai-review-actions";
import {
  STUDIO_SPECIES_PATH,
} from "@/modules/studio/lib/studio-routes";
import {
  getStudioSpeciesBySlugEn,
  listSpeciesOptionsForStudio,
} from "@/modules/species/repositories/species-repository";
import { ensureRegionSeeds } from "@/modules/region/data/seed-regions";
import { listRegions } from "@/modules/region/repositories/region-repository";
import { listTechniqueOptions } from "@/modules/studio/data/product-detail";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function StudioSpeciesDetailPage({ params }: PageProps) {
  const { slug } = await params;

  await ensureRegionSeeds();

  const species = await getStudioSpeciesBySlugEn(slug);
  if (!species) notFound();

  await ensureEntityAiReview("SPECIES", species.id);

  const [regions, techniques, speciesOptions, aiSession] = await Promise.all([
    listRegions({ includeInactive: true }),
    listTechniqueOptions(),
    listSpeciesOptionsForStudio(),
    loadAiReviewSession("SPECIES", species.id),
  ]);

  const regionCodeToId = Object.fromEntries(
    regions.map((r) => [r.code, r.id]),
  );

  return (
    <>
      <StudioPageHeader
        title={species.nameTr}
        description={`${species.nameEn} · ${species.scientificName}`}
        actions={
          <Link
            href={STUDIO_SPECIES_PATH}
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            All species
          </Link>
        }
      />
      <StudioPageBody>
        <SpeciesEditorPanel
          species={species}
          aiSession={aiSession}
          regionCodeToId={regionCodeToId}
          regions={regions.map((r) => ({
            id: r.id,
            nameEn: r.nameEn,
            code: r.code,
          }))}
          techniques={techniques.map((t) => ({ id: t.id, nameEn: t.nameEn }))}
          speciesOptions={speciesOptions}
        />
      </StudioPageBody>
    </>
  );
}

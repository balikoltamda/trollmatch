import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import { SpeciesEditorPanel } from "@/modules/species/components/species-editor-panel";
import { loadAiReviewSession } from "@/modules/studio/ai-review/actions/ai-review-actions";
import { STUDIO_SPECIES_PATH } from "@/modules/studio/lib/studio-routes";
import { listSpeciesOptionsForStudio } from "@/modules/species/repositories/species-repository";
import { ensureRegionSeeds } from "@/modules/region/data/seed-regions";
import { listRegions } from "@/modules/region/repositories/region-repository";
import { listTechniqueOptions } from "@/modules/studio/data/product-detail";

export const dynamic = "force-dynamic";

export default async function StudioSpeciesNewPage() {
  await ensureRegionSeeds();

  const [regions, techniques, speciesOptions, aiSession] = await Promise.all([
    listRegions({ includeInactive: true }),
    listTechniqueOptions(),
    listSpeciesOptionsForStudio(),
    loadAiReviewSession("SPECIES", null),
  ]);

  const regionCodeToId = Object.fromEntries(
    regions.map((r) => [r.code, r.id]),
  );

  return (
    <>
      <StudioPageHeader
        title="New species"
        description="Create a fish species entry for the Mediterranean encyclopedia."
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
          species={null}
          isNew
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

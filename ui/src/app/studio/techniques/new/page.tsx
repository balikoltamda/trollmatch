import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import { TechniqueAiReviewSection } from "@/modules/studio/ai-review/components/technique-ai-review-section";
import { loadAiReviewSession } from "@/modules/studio/ai-review/actions/ai-review-actions";

export const dynamic = "force-dynamic";

export default async function StudioTechniqueNewPage() {
  const aiSession = await loadAiReviewSession("TECHNIQUE", null);

  return (
    <>
      <StudioPageHeader
        title="New technique"
        description="AI-assisted technique creation — verify every suggestion before save."
        actions={
          <Link
            href="/studio/techniques"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            All techniques
          </Link>
        }
      />
      <StudioPageBody>
        <TechniqueAiReviewSection session={aiSession} />
        <p className="text-muted-foreground mt-8 text-sm">
          Full technique save workflow ships next — use AI review to validate names and duplicates first.
        </p>
      </StudioPageBody>
    </>
  );
}

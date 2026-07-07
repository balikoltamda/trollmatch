import Link from "next/link";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import { CatchReportsReviewPanel } from "@/modules/catch-report/components/catch-reports-review-panel";
import {
  countPendingCatchReports,
  listCatchReportsForReview,
} from "@/modules/catch-report/data/list-reports";
import {
  ensureEntityAiReview,
  loadAiReviewSession,
} from "@/modules/studio/ai-review/actions/ai-review-actions";
import type { AiReviewSessionView } from "@/modules/studio/ai-review/types";

export const dynamic = "force-dynamic";

export default async function StudioCatchReportsPage() {
  const [reports, pendingCount] = await Promise.all([
    listCatchReportsForReview(50),
    countPendingCatchReports(),
  ]);

  const pendingReports = reports.filter((r) => r.verificationStatus === "PENDING");
  await Promise.all(
    pendingReports.map((r) => ensureEntityAiReview("CATCH_REPORT", r.id)),
  );

  const sessionEntries = await Promise.all(
    pendingReports.map(async (r) => [
      r.id,
      await loadAiReviewSession("CATCH_REPORT", r.id),
    ] as const),
  );
  const aiSessions = Object.fromEntries(sessionEntries) as Record<
    string,
    AiReviewSessionView | null
  >;

  return (
    <>
      <StudioPageHeader
        title="Catch reports"
        description={`Real fishing experiences from anglers — approve before they appear on lure and fish pages. ${pendingCount} pending.`}
      />
      <StudioPageBody>
        <p className="text-muted-foreground mb-4 text-sm">
          <Link href="/studio/community" className="text-ocean hover:underline">
            Community suggestions
          </Link>
          {" · "}
          Catch reports are separate from catalog suggestions — they are field
          experiences, not product edits.
        </p>
        <CatchReportsReviewPanel reports={reports} aiSessions={aiSessions} />
      </StudioPageBody>
    </>
  );
}

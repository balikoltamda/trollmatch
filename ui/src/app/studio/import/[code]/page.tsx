import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import {
  StudioTable,
  StudioTd,
  StudioTh,
} from "@/modules/studio/components/studio-ui";
import { getImportHistory } from "@/modules/studio/data/import-center";
import { manufacturerRegistry } from "@/modules/import/registry/registered-manufacturers";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ code: string }>;
};

export default async function StudioImportHistoryPage({ params }: PageProps) {
  const { code } = await params;
  const entry = manufacturerRegistry.list().find((m) => m.code === code);
  if (!entry) notFound();

  const history = await getImportHistory(code);

  return (
    <>
      <StudioPageHeader
        title={`${entry.displayName} import history`}
        description="Past import batches and report paths."
        actions={
          <Link
            href="/studio/import"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            Back to Import Center
          </Link>
        }
      />
      <StudioPageBody>
        <StudioTable>
          <thead>
            <tr>
              <StudioTh>Started</StudioTh>
              <StudioTh>Status</StudioTh>
              <StudioTh>New</StudioTh>
              <StudioTh>Updated</StudioTh>
              <StudioTh>Missing</StudioTh>
              <StudioTh>Duration</StudioTh>
              <StudioTh>Report</StudioTh>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <StudioTd colSpan={7} className="text-muted-foreground">
                  No import batches recorded yet.
                </StudioTd>
              </tr>
            ) : (
              history.map((batch) => (
                <tr key={batch.id}>
                  <StudioTd>{batch.startedAt.toLocaleString()}</StudioTd>
                  <StudioTd>{batch.status}</StudioTd>
                  <StudioTd>{batch.createdCount}</StudioTd>
                  <StudioTd>{batch.updatedCount}</StudioTd>
                  <StudioTd>{batch.missingCount}</StudioTd>
                  <StudioTd>
                    {batch.durationMs
                      ? `${(batch.durationMs / 1000).toFixed(1)}s`
                      : "—"}
                  </StudioTd>
                  <StudioTd>
                    <Link
                      href={`/studio/import/batch/${batch.id}`}
                      className="text-ocean text-sm hover:underline"
                    >
                      Open report
                    </Link>
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

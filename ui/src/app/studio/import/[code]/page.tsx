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
import { ImportBatchStatusPoller } from "@/modules/studio/components/import-batch-status-poller";
import { manufacturerRegistry } from "@/modules/import/registry/registered-manufacturers";
import { resolveImporterSlug } from "@/modules/import/registry/manufacturer-slugs";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ code: string }>;
};

function batchStatusClass(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "bg-ocean/10 text-ocean";
    case "RUNNING":
      return "bg-turquoise/15 text-[color-mix(in_oklch,var(--turquoise),var(--navy)_40%)]";
    case "QUEUED":
      return "bg-muted text-muted-foreground";
    case "FAILED":
      return "bg-coral/12 text-[color-mix(in_oklch,var(--coral),var(--navy)_35%)]";
    case "CANCELLED":
      return "bg-muted/60 text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default async function StudioImportHistoryPage({ params }: PageProps) {
  const { code } = await params;
  const entry = manufacturerRegistry.list().find((m) => m.code === code);
  if (!entry) notFound();

  const history = await getImportHistory(code);
  const manufacturerSlug = resolveImporterSlug(code);

  return (
    <>
      <ImportBatchStatusPoller statuses={history.map((batch) => batch.status)} />
      <StudioPageHeader
        title={`${entry.displayName} import history`}
        description="Every import batch — open the report, errors, or affected products."
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
              <StudioTh>Imported</StudioTh>
              <StudioTh>Updated</StudioTh>
              <StudioTh>Skipped</StudioTh>
              <StudioTh>Errors</StudioTh>
              <StudioTh>Duration</StudioTh>
              <StudioTh>Actions</StudioTh>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <StudioTd colSpan={8} className="text-muted-foreground">
                  No import batches recorded yet. Run Import now from Import Center.
                </StudioTd>
              </tr>
            ) : (
              history.map((batch) => (
                <tr key={batch.id} className="hover:bg-muted/30">
                  <StudioTd>{batch.startedAt.toLocaleString()}</StudioTd>
                  <StudioTd>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        batchStatusClass(batch.status),
                      )}
                    >
                      {batch.status}
                    </span>
                  </StudioTd>
                  <StudioTd>
                    {batch.status === "QUEUED" || batch.status === "RUNNING"
                      ? "…"
                      : batch.createdCount}
                  </StudioTd>
                  <StudioTd>
                    {batch.status === "QUEUED" || batch.status === "RUNNING"
                      ? "…"
                      : batch.updatedCount}
                  </StudioTd>
                  <StudioTd>
                    {batch.status === "QUEUED" || batch.status === "RUNNING"
                      ? "…"
                      : batch.skippedCount}
                  </StudioTd>
                  <StudioTd>
                    {batch.status === "QUEUED" || batch.status === "RUNNING"
                      ? "…"
                      : batch.errorCount}
                  </StudioTd>
                  <StudioTd>
                    {batch.durationMs
                      ? `${(batch.durationMs / 1000).toFixed(1)}s`
                      : "—"}
                  </StudioTd>
                  <StudioTd>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/studio/import/batch/${batch.id}`}
                        className="text-ocean text-sm hover:underline"
                      >
                        Report
                      </Link>
                      {batch.errorCount > 0 ? (
                        <Link
                          href={`/studio/import/batch/${batch.id}#errors`}
                          className="text-coral text-sm hover:underline"
                        >
                          Errors
                        </Link>
                      ) : null}
                      <Link
                        href={`/studio/products?manufacturer=${encodeURIComponent(manufacturerSlug)}`}
                        className="text-muted-foreground text-sm hover:underline"
                      >
                        Products
                      </Link>
                    </div>
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

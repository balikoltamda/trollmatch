import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import { StudioStatCard } from "@/modules/studio/components/studio-ui";
import { ImportBatchRetryButton } from "@/modules/studio/components/import-batch-retry-button";
import { getImportBatchReport } from "@/modules/studio/data/import-batch-report";
import { ImportBatchStatusPoller } from "@/modules/studio/components/import-batch-status-poller";
import { resolveImporterSlug } from "@/modules/import/registry/manufacturer-slugs";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
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

export default async function StudioImportBatchReportPage({
  params,
}: PageProps) {
  const { id } = await params;
  const report = await getImportBatchReport(id);
  if (!report) notFound();

  const manufacturerSlug = resolveImporterSlug(report.manufacturerCode);
  const errorSection = report.sections.find((s) => s.title === "Errors");

  return (
    <>
      <ImportBatchStatusPoller statuses={[report.status]} />
      <StudioPageHeader
        title={`${report.displayName} import report`}
        description={`${report.startedAt.toLocaleString()} · ${report.status}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/studio/products?manufacturer=${encodeURIComponent(manufacturerSlug)}`}
              className={buttonVariants({ size: "sm" })}
            >
              Open products
            </Link>
            {errorSection && errorSection.items.length > 0 ? (
              <Link
                href="#errors"
                className={buttonVariants({ size: "sm", variant: "outline" })}
              >
                Open errors
              </Link>
            ) : null}
            {report.status === "FAILED" ? (
              <ImportBatchRetryButton manufacturerCode={report.manufacturerCode} />
            ) : null}
            <Link
              href="/studio/import"
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              Import Center
            </Link>
          </div>
        }
      />
      <StudioPageBody>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "inline-flex rounded-full px-3 py-1 text-xs font-medium",
              batchStatusClass(report.status),
            )}
          >
            {report.status}
          </span>
          {report.durationMs ? (
            <span className="text-muted-foreground text-sm">
              Duration: {(report.durationMs / 1000).toFixed(1)}s
            </span>
          ) : null}
          {report.completedAt ? (
            <span className="text-muted-foreground text-sm">
              Completed: {report.completedAt.toLocaleString()}
            </span>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StudioStatCard label="Processed" value={report.productsProcessed} />
          <StudioStatCard label="Imported" value={report.createdCount} />
          <StudioStatCard label="Updated" value={report.updatedCount} />
          <StudioStatCard label="Skipped" value={report.skippedCount} />
          <StudioStatCard label="Errors" value={report.errorCount} />
          <StudioStatCard label="Warnings" value={report.warningCount} />
          <StudioStatCard label="Missing" value={report.missingCount} />
          <StudioStatCard label="Removed" value={report.removedCount} />
        </div>

        <div className="mt-8 space-y-8">
          {report.sections.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No detailed report sections stored for this batch.
            </p>
          ) : (
            report.sections.map((section) => (
              <section
                key={section.title}
                id={section.title === "Errors" ? "errors" : undefined}
              >
                <h2 className="mb-3 text-sm font-semibold">
                  {section.title} ({section.items.length})
                </h2>
                <ul className="border-border/60 max-h-80 overflow-y-auto rounded-xl border">
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className="border-border/40 border-b px-4 py-2 text-sm last:border-b-0"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </StudioPageBody>
    </>
  );
}

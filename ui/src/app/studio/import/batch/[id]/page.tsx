import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import { StudioStatCard } from "@/modules/studio/components/studio-ui";
import { getImportBatchReport } from "@/modules/studio/data/import-batch-report";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudioImportBatchReportPage({
  params,
}: PageProps) {
  const { id } = await params;
  const report = await getImportBatchReport(id);
  if (!report) notFound();

  return (
    <>
      <StudioPageHeader
        title={`${report.displayName} import report`}
        description={`${report.startedAt.toLocaleString()} · ${report.status}`}
        actions={
          <Link
            href="/studio/import"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            Import Center
          </Link>
        }
      />
      <StudioPageBody>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StudioStatCard label="Processed" value={report.productsProcessed} />
          <StudioStatCard label="Created" value={report.createdCount} />
          <StudioStatCard label="Updated" value={report.updatedCount} />
          <StudioStatCard label="Errors" value={report.errorCount} />
          <StudioStatCard label="Warnings" value={report.warningCount} />
          <StudioStatCard label="Skipped" value={report.skippedCount} />
          <StudioStatCard label="Missing" value={report.missingCount} />
          <StudioStatCard label="Removed" value={report.removedCount} />
        </div>

        {report.durationMs ? (
          <p className="text-muted-foreground mt-4 text-sm">
            Duration: {(report.durationMs / 1000).toFixed(1)}s
          </p>
        ) : null}

        <div className="mt-8 space-y-8">
          {report.sections.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No detailed report sections stored for this batch.
            </p>
          ) : (
            report.sections.map((section) => (
              <section key={section.title}>
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

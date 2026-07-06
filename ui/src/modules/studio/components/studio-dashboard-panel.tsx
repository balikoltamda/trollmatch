import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  StudioStatCard,
  StudioTable,
  StudioTd,
  StudioTh,
} from "@/modules/studio/components/studio-ui";
import {
  getDashboardStats,
  getLatestImports,
} from "@/modules/studio/data/dashboard";
import { resolveImporterSlug } from "@/modules/import/registry/manufacturer-slugs";
import { cn } from "@/lib/utils";

function batchStatusClass(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "bg-ocean/10 text-ocean";
    case "RUNNING":
      return "bg-turquoise/15 text-[color-mix(in_oklch,var(--turquoise),var(--navy)_40%)]";
    case "FAILED":
      return "bg-coral/12 text-[color-mix(in_oklch,var(--coral),var(--navy)_35%)]";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export async function StudioDashboardPanel() {
  const [stats, imports] = await Promise.all([
    getDashboardStats(),
    getLatestImports(8),
  ]);

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StudioStatCard label="Lure models" value={stats.lureModels} />
        <StudioStatCard label="Published" value={stats.published} />
        <StudioStatCard label="Pending review" value={stats.pendingReview} />
        <StudioStatCard label="Product images" value={stats.images} />
        <StudioStatCard label="Manufacturers" value={stats.manufacturers} />
        <StudioStatCard label="Fish species" value={stats.fishSpecies} />
        <StudioStatCard label="Review queue" value={stats.reviewQueue} />
        <StudioStatCard
          label="Import diffs pending"
          value={stats.pendingImportDiffs}
        />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-foreground text-sm font-semibold">
            Recent imports
          </h2>
          <Link
            href="/studio/import"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            Import Center
          </Link>
        </div>
        <StudioTable>
          <thead>
            <tr>
              <StudioTh>Manufacturer</StudioTh>
              <StudioTh>Started</StudioTh>
              <StudioTh>Status</StudioTh>
              <StudioTh>Imported</StudioTh>
              <StudioTh>Updated</StudioTh>
              <StudioTh>Errors</StudioTh>
              <StudioTh>Duration</StudioTh>
              <StudioTh>Actions</StudioTh>
            </tr>
          </thead>
          <tbody>
            {imports.length === 0 ? (
              <tr>
                <StudioTd colSpan={8} className="text-muted-foreground">
                  No import batches yet. Run an import from Import Center.
                </StudioTd>
              </tr>
            ) : (
              imports.map((batch) => (
                <tr key={batch.id} className="hover:bg-muted/30">
                  <StudioTd className="font-medium">{batch.displayName}</StudioTd>
                  <StudioTd className="text-muted-foreground text-xs">
                    {batch.startedAt.toLocaleString()}
                  </StudioTd>
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
                  <StudioTd>{batch.createdCount}</StudioTd>
                  <StudioTd>{batch.updatedCount}</StudioTd>
                  <StudioTd>{batch.errorCount}</StudioTd>
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
                        href={`/studio/products?manufacturer=${encodeURIComponent(resolveImporterSlug(batch.manufacturerCode))}`}
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
      </section>
    </div>
  );
}

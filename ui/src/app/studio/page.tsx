import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { CompletenessBar } from "@/modules/studio/components/completeness-bar";
import { EditorialStatusBadge } from "@/modules/studio/components/editorial-status-badge";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import {
  StudioStatCard,
  StudioTable,
  StudioTd,
  StudioTh,
} from "@/modules/studio/components/studio-ui";
import {
  getDashboardStats,
  getLatestEditedProducts,
  getLatestImports,
  getRecentImporterActivity,
} from "@/modules/studio/data/dashboard";
import { listReviewQueue } from "@/modules/studio/data/review-queue";

export const dynamic = "force-dynamic";

export default async function StudioDashboardPage() {
  const [stats, latestImports, latestProducts, activity, reviewQueue] =
    await Promise.all([
      getDashboardStats(),
      getLatestImports(),
      getLatestEditedProducts(),
      getRecentImporterActivity(),
      listReviewQueue(10),
    ]);

  return (
    <>
      <StudioPageHeader
        title="Dashboard"
        description="Live catalog overview — box specs from imports, editorial work in progress."
      />
      <StudioPageBody>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StudioStatCard label="Lure models" value={stats.lureModels} />
          <StudioStatCard label="Needs review" value={stats.pendingReview} />
          <StudioStatCard label="Ready" value={stats.readyToPublish} />
          <StudioStatCard label="Published" value={stats.published} />
          <StudioStatCard label="Review queue" value={stats.reviewQueue} />
          <StudioStatCard
            label="Pending import diffs"
            value={stats.pendingImportDiffs}
          />
          <StudioStatCard label="Manufacturers" value={stats.manufacturers} />
          <StudioStatCard label="Images" value={stats.images} />
        </div>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Review queue</h2>
            <Link
              href="/studio/review"
              className={buttonVariants({ size: "sm", variant: "ghost" })}
            >
              Full queue
            </Link>
          </div>
          <StudioTable>
            <thead>
              <tr>
                <StudioTh>Product</StudioTh>
                <StudioTh>Completeness</StudioTh>
                <StudioTh>Missing</StudioTh>
                <StudioTh>Status</StudioTh>
              </tr>
            </thead>
            <tbody>
              {reviewQueue.length === 0 ? (
                <tr>
                  <StudioTd colSpan={4} className="text-muted-foreground">
                    Queue is clear.
                  </StudioTd>
                </tr>
              ) : (
                reviewQueue.map((row) => (
                  <tr key={row.id}>
                    <StudioTd>
                      <Link
                        href={`/studio/products/${row.id}`}
                        className="hover:text-ocean font-medium"
                      >
                        {row.nameEn}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        {row.manufacturerName}
                      </p>
                    </StudioTd>
                    <StudioTd className="min-w-36">
                      <CompletenessBar
                        score={row.completeness.score}
                        compact
                      />
                    </StudioTd>
                    <StudioTd className="text-muted-foreground text-xs">
                      {row.completeness.missing.join(", ")}
                    </StudioTd>
                    <StudioTd>
                      <EditorialStatusBadge state={row.lifecycleState} />
                    </StudioTd>
                  </tr>
                ))
              )}
            </tbody>
          </StudioTable>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-2">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Latest imports</h2>
              <Link
                href="/studio/import"
                className={buttonVariants({ size: "sm", variant: "ghost" })}
              >
                Import Center
              </Link>
            </div>
            <StudioTable>
              <thead>
                <tr>
                  <StudioTh>Manufacturer</StudioTh>
                  <StudioTh>Status</StudioTh>
                  <StudioTh>New</StudioTh>
                  <StudioTh>Report</StudioTh>
                </tr>
              </thead>
              <tbody>
                {latestImports.length === 0 ? (
                  <tr>
                    <StudioTd colSpan={4} className="text-muted-foreground">
                      No imports recorded yet.
                    </StudioTd>
                  </tr>
                ) : (
                  latestImports.map((batch) => (
                    <tr key={batch.id}>
                      <StudioTd>{batch.displayName}</StudioTd>
                      <StudioTd>{batch.status}</StudioTd>
                      <StudioTd>{batch.createdCount}</StudioTd>
                      <StudioTd>
                        <Link
                          href={`/studio/import/batch/${batch.id}`}
                          className="text-ocean text-sm hover:underline"
                        >
                          Open
                        </Link>
                      </StudioTd>
                    </tr>
                  ))
                )}
              </tbody>
            </StudioTable>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Recently edited products</h2>
              <Link
                href="/studio/products"
                className={buttonVariants({ size: "sm", variant: "ghost" })}
              >
                All products
              </Link>
            </div>
            <StudioTable>
              <thead>
                <tr>
                  <StudioTh>Product</StudioTh>
                  <StudioTh>Completeness</StudioTh>
                  <StudioTh>State</StudioTh>
                </tr>
              </thead>
              <tbody>
                {latestProducts.length === 0 ? (
                  <tr>
                    <StudioTd colSpan={3} className="text-muted-foreground">
                      No products in catalog yet.
                    </StudioTd>
                  </tr>
                ) : (
                  latestProducts.map((product) => (
                    <tr key={product.id}>
                      <StudioTd>
                        <Link
                          href={`/studio/products/${product.id}`}
                          className="hover:text-ocean font-medium"
                        >
                          {product.nameEn}
                        </Link>
                        <p className="text-muted-foreground text-xs">
                          {product.manufacturerName}
                        </p>
                      </StudioTd>
                      <StudioTd className="min-w-32">
                        <CompletenessBar
                          score={product.completenessScore}
                          compact
                        />
                      </StudioTd>
                      <StudioTd>
                        <EditorialStatusBadge state={product.lifecycleState} />
                      </StudioTd>
                    </tr>
                  ))
                )}
              </tbody>
            </StudioTable>
          </section>
        </div>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold">Recent importer activity</h2>
          <ul className="space-y-2">
            {activity.length === 0 ? (
              <li className="text-muted-foreground text-sm">No activity yet.</li>
            ) : (
              activity.map((entry) => (
                <li
                  key={entry.id}
                  className="border-border/60 rounded-lg border px-4 py-3 text-sm"
                >
                  <p>{entry.summary}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {entry.actor} · {entry.createdAt.toLocaleString()}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      </StudioPageBody>
    </>
  );
}

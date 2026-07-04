import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
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

export const dynamic = "force-dynamic";

export default async function StudioDashboardPage() {
  const [stats, latestImports, latestProducts, activity] = await Promise.all([
    getDashboardStats(),
    getLatestImports(),
    getLatestEditedProducts(),
    getRecentImporterActivity(),
  ]);

  return (
    <>
      <StudioPageHeader
        title="Dashboard"
        description="Live catalog overview — box specs from imports, editorial work in progress."
      />
      <StudioPageBody>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StudioStatCard label="Lure models" value={stats.lureModels} />
          <StudioStatCard label="Manufacturers" value={stats.manufacturers} />
          <StudioStatCard label="Fish species" value={stats.fishSpecies} />
          <StudioStatCard label="Images" value={stats.images} />
          <StudioStatCard
            label="Pending review"
            value={stats.pendingReview}
            hint="Awaiting editor pass"
          />
        </div>

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
                  <StudioTh>Updated</StudioTh>
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
                      <StudioTd>{batch.updatedCount}</StudioTd>
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
                  <StudioTh>State</StudioTh>
                  <StudioTh>Updated</StudioTh>
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
                      <StudioTd>{product.lifecycleState}</StudioTd>
                      <StudioTd className="text-muted-foreground text-xs">
                        {product.updatedAt.toLocaleDateString()}
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

import Link from "next/link";
import { notFound } from "next/navigation";
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
import { getManufacturerDetail } from "@/modules/studio/data/manufacturer-detail";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function StudioManufacturerDetailPage({
  params,
}: PageProps) {
  const { slug } = await params;
  const detail = await getManufacturerDetail(slug);
  if (!detail) notFound();

  return (
    <>
      <StudioPageHeader
        title={detail.nameEn}
        description={`Manufacturer hub — import stats and product breakdown.`}
        actions={
          <Link
            href="/studio/manufacturers"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            All manufacturers
          </Link>
        }
      />
      <StudioPageBody>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StudioStatCard label="Products" value={detail.productCount} />
          <StudioStatCard label="Needs review" value={detail.needsReview} />
          <StudioStatCard label="Published" value={detail.published} />
          <StudioStatCard label="Missing from feed" value={detail.missing} />
          <StudioStatCard
            label="Last import errors"
            value={detail.lastImport?.errorCount ?? 0}
          />
        </div>

        {detail.lastImport ? (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold">Last import</h2>
            <p className="text-muted-foreground text-sm">
              {detail.lastImport.startedAt.toLocaleString()} ·{" "}
              {detail.lastImport.status} · {detail.lastImport.createdCount} new,{" "}
              {detail.lastImport.updatedCount} updated
              {detail.lastImport.reportPath ? (
                <>
                  {" "}
                  ·{" "}
                  <Link
                    href={`/studio/import/batch/${detail.lastImport.id}`}
                    className="text-ocean hover:underline"
                  >
                    View report
                  </Link>
                </>
              ) : null}
            </p>
          </section>
        ) : (
          <p className="text-muted-foreground mt-8 text-sm">
            No imports recorded for this manufacturer yet.
          </p>
        )}

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Import history</h2>
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
                <StudioTh>Started</StudioTh>
                <StudioTh>Status</StudioTh>
                <StudioTh>New</StudioTh>
                <StudioTh>Updated</StudioTh>
                <StudioTh>Missing</StudioTh>
                <StudioTh>Errors</StudioTh>
                <StudioTh>Report</StudioTh>
              </tr>
            </thead>
            <tbody>
              {detail.importHistory.length === 0 ? (
                <tr>
                  <StudioTd colSpan={7} className="text-muted-foreground">
                    No batches yet.
                  </StudioTd>
                </tr>
              ) : (
                detail.importHistory.map((batch) => (
                  <tr key={batch.id}>
                    <StudioTd>{batch.startedAt.toLocaleString()}</StudioTd>
                    <StudioTd>{batch.status}</StudioTd>
                    <StudioTd>{batch.createdCount}</StudioTd>
                    <StudioTd>{batch.updatedCount}</StudioTd>
                    <StudioTd>{batch.missingCount}</StudioTd>
                    <StudioTd>{batch.errorCount}</StudioTd>
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
        </section>
      </StudioPageBody>
    </>
  );
}

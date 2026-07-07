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
import { ManufacturerEditForm } from "@/modules/studio/components/manufacturer-edit-form";
import { ensureEntityAiReview, loadAiReviewSession } from "@/modules/studio/ai-review/actions/ai-review-actions";
import { EntityInsightsPanel } from "@/modules/studio/ai-review/components/entity-insights-panel";
import { getManufacturerDetail } from "@/modules/studio/data/manufacturer-detail";
import { listManufacturerTechnologies } from "@/modules/studio/data/technology-encyclopedia";

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

  await ensureEntityAiReview("MANUFACTURER", detail.id);

  const aiSession = await loadAiReviewSession("MANUFACTURER", detail.id);
  const technologies = await listManufacturerTechnologies(detail.id);

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
        <EntityInsightsPanel
          entityType="MANUFACTURER"
          entityId={detail.id}
          entityLabel={detail.nameEn}
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

        <ManufacturerEditForm
          slug={detail.slug}
          aiSession={aiSession}
          initial={{
            id: detail.id,
            nameEn: detail.nameEn,
            nameTr: detail.nameTr,
            countryCode: detail.countryCode,
            website: detail.website,
            logoUrl: detail.logoUrl,
          }}
        />

        {technologies.length > 0 ? (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold">Technology encyclopedia</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {technologies.map((tech) => (
                <li key={tech.id}>
                  <Link
                    href={`/studio/technologies/${tech.id}`}
                    className="border-border/60 hover:bg-muted/30 block rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{tech.nameEn}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {tech._count.lureLinks} product(s)
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </StudioPageBody>
    </>
  );
}

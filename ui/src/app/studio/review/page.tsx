import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { CompletenessBar } from "@/modules/studio/components/completeness-bar";
import { EditorialStatusBadge } from "@/modules/studio/components/editorial-status-badge";
import {
  StudioPageBody,
  StudioPageHeader,
} from "@/modules/studio/components/studio-page";
import {
  StudioTable,
  StudioTd,
  StudioTh,
} from "@/modules/studio/components/studio-ui";
import { listReviewQueue } from "@/modules/studio/data/review-queue";

export const dynamic = "force-dynamic";

export default async function StudioReviewPage() {
  const rows = await listReviewQueue(100);

  return (
    <>
      <StudioPageHeader
        title="Review Queue"
        description="Products missing editorial data — sorted by completeness, lowest first."
      />
      <StudioPageBody>
        <p className="text-muted-foreground mb-4 text-sm">
          {rows.length} products need attention. Fill Turkish names, images,
          fishing attributes, species, and editor notes before publishing.
        </p>

        <StudioTable>
          <thead>
            <tr>
              <StudioTh>Product</StudioTh>
              <StudioTh>Manufacturer</StudioTh>
              <StudioTh>Completeness</StudioTh>
              <StudioTh>Missing</StudioTh>
              <StudioTh>Status</StudioTh>
              <StudioTh />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <StudioTd colSpan={6} className="text-muted-foreground">
                  Nothing in the queue — all draft products are 100% complete.
                </StudioTd>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30">
                  <StudioTd>
                    <p className="font-medium">{row.nameEn}</p>
                    <p className="text-muted-foreground text-xs">{row.slug}</p>
                  </StudioTd>
                  <StudioTd>{row.manufacturerName}</StudioTd>
                  <StudioTd className="min-w-44">
                    <CompletenessBar
                      score={row.completeness.score}
                      compact
                    />
                  </StudioTd>
                  <StudioTd className="text-muted-foreground text-xs">
                    {row.completeness.missing.join(", ") || "—"}
                  </StudioTd>
                  <StudioTd>
                    <EditorialStatusBadge state={row.lifecycleState} />
                  </StudioTd>
                  <StudioTd>
                    <Link
                      href={`/studio/products/${row.id}`}
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                    >
                      Edit
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

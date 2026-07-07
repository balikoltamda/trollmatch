"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  archiveProduct,
  markProductReady,
  publishProduct,
  rejectProduct,
  restoreProduct,
  deleteProduct,
  saveCanonicalProduct,
  saveEditorNotes,
  unpublishProduct,
} from "@/modules/studio/actions/product-actions";
import { CompletenessBar } from "@/modules/studio/components/completeness-bar";
import { EditorialStatusBadge } from "@/modules/studio/components/editorial-status-badge";
import { ImageReviewPanel } from "@/modules/studio/components/image-review-panel";
import { ImportDiffPanel } from "@/modules/studio/components/import-diff-panel";
import { ManufacturerSyncPanel } from "@/modules/studio/components/manufacturer-sync-panel";
import { ProductToolbar } from "@/modules/studio/components/product-toolbar";
import { SOURCE_LABELS } from "@/modules/studio/lib/suggestion-labels";
import { TrustSummary } from "@/modules/trust/components/trust-summary";
import { VerificationPanel } from "@/modules/studio/components/verification-panel";
import type { VerificationSuggestion } from "@/modules/studio/components/verification-panel";
import {
  StudioField,
  StudioInput,
  StudioSelect,
  StudioTextarea,
} from "@/modules/studio/components/studio-ui";
import { EDITORIAL_STATUS_OPTIONS } from "@/modules/studio/lib/editorial";
import type { ProductEditorData } from "@/modules/studio/types";
import { cn } from "@/lib/utils";

const TABS = [
  "Trust",
  "Verify",
  "General",
  "Manufacturer",
  "Manual override",
  "Images",
  "History",
] as const;

type Tab = (typeof TABS)[number];

type ProductEditorProps = {
  product: ProductEditorData;
  techniqueOptions: { id: string; slug: string; nameEn: string }[];
  speciesOptions: { id: string; slug: string; nameEn: string }[];
};

export function ProductEditor({
  product,
  techniqueOptions,
  speciesOptions,
}: ProductEditorProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Trust");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const restorableLifecycle =
    product.lifecycleState === "ARCHIVED" ||
    product.lifecycleState === "REJECTED" ||
    product.lifecycleState === "DEPRECATED";

  function runAction(
    action: () => Promise<{ ok: boolean; error?: string }>,
    success: string,
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setMessage(result.error ?? "Action failed");
        return;
      }
      setMessage(success);
      router.refresh();
    });
  }

  const [canonical, setCanonical] = useState({
    nameEn: product.nameEn,
    nameTr: product.nameTr,
    slug: product.slug,
    lifecycleState: product.lifecycleState,
    bodyTypeEn: product.bodyTypeEn ?? "",
    bodyTypeTr: product.bodyTypeTr ?? "",
    coatingTypeEn: product.coatingTypeEn ?? "",
    coatingTypeTr: product.coatingTypeTr ?? "",
    buoyancyEn: product.buoyancyEn ?? "",
    buoyancyTr: product.buoyancyTr ?? "",
    actionEn: product.actionEn ?? "",
    actionTr: product.actionTr ?? "",
    divingDepthMinM: product.divingDepthMinM ?? "",
    divingDepthMaxM: product.divingDepthMaxM ?? "",
    trollingSpeedMinKn: product.trollingSpeedMinKn ?? "",
    trollingSpeedMaxKn: product.trollingSpeedMaxKn ?? "",
    techniqueIds: product.techniques.map((t) => t.id),
    speciesIds: product.species
      .filter((s) => s.associationKind === "MODERATOR_CURATED")
      .map((s) => s.id),
  });

  const [notes, setNotes] = useState(product.editorNote!);

  function saveCanonical() {
    runAction(
      () => saveCanonicalProduct(product.id, canonical),
      "Canonical data saved.",
    );
  }

  function saveNotes() {
    runAction(() => saveEditorNotes(product.id, notes), "Editor notes saved.");
  }

  function handlePublish() {
    runAction(() => publishProduct(product.id), "Product published.");
  }

  function handleUnpublish() {
    runAction(() => unpublishProduct(product.id), "Product unpublished.");
  }

  function handleMarkReady() {
    runAction(() => markProductReady(product.id), "Marked as Ready.");
  }

  function handleReject() {
    runAction(() => rejectProduct(product.id), "Product rejected.");
  }

  function handleArchive() {
    runAction(() => archiveProduct(product.id), "Product archived.");
  }

  function handleRestore() {
    runAction(() => restoreProduct(product.id), "Product restored.");
  }

  function handleDelete() {
    if (
      !window.confirm(
        "Soft-delete this product? It will be hidden from Studio lists.",
      )
    ) {
      return;
    }
    runAction(() => deleteProduct(product.id), "Product deleted.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold">{product.nameEn}</h2>
          <p className="text-muted-foreground text-sm">
            {product.manufacturer.nameEn} · {product.slug}
          </p>
        </div>
        <Badge variant="ocean">{product.manufacturerStatus}</Badge>
        <EditorialStatusBadge state={product.lifecycleState} />
        <CompletenessBar
          score={product.completeness.score}
          missing={product.completeness.missing}
          className="min-w-48"
        />
        {product.changesAvailable > 0 ? (
          <Badge variant="coral">{product.changesAvailable} changes</Badge>
        ) : null}
        {product.lifecycleState !== "PUBLISHED" ? (
          <button
            type="button"
            disabled={pending}
            className={buttonVariants({ size: "sm" })}
            onClick={handlePublish}
          >
            Publish
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            className={buttonVariants({ size: "sm", variant: "outline" })}
            onClick={handleUnpublish}
          >
            Unpublish
          </button>
        )}
        {product.lifecycleState === "PENDING_REVIEW" ? (
          <button
            type="button"
            disabled={pending}
            className={buttonVariants({ size: "sm", variant: "secondary" })}
            onClick={handleMarkReady}
          >
            Mark Ready
          </button>
        ) : null}
        {product.lifecycleState !== "REJECTED" ? (
          <button
            type="button"
            disabled={pending}
            className={buttonVariants({ size: "sm", variant: "outline" })}
            onClick={handleReject}
          >
            Reject
          </button>
        ) : null}
        {product.lifecycleState !== "ARCHIVED" ? (
          <button
            type="button"
            disabled={pending}
            className={buttonVariants({ size: "sm", variant: "outline" })}
            onClick={handleArchive}
          >
            Archive
          </button>
        ) : null}
        {restorableLifecycle ? (
          <button
            type="button"
            disabled={pending}
            className={buttonVariants({ size: "sm", variant: "secondary" })}
            onClick={handleRestore}
          >
            Restore
          </button>
        ) : null}
        <button
          type="button"
          disabled={pending}
          className={buttonVariants({ size: "sm", variant: "ghost" })}
          onClick={handleDelete}
        >
          Delete
        </button>
        <Link
          href={`/en/lures/${product.slug}`}
          className={buttonVariants({ size: "sm", variant: "outline" })}
          target="_blank"
        >
          Preview public page
        </Link>
      </div>

      <ProductToolbar
        productId={product.id}
        slug={product.slug}
        lifecycleState={product.lifecycleState}
        canRefreshManufacturer={product.canRefreshManufacturer}
        pending={pending}
        onMessage={setMessage}
      />

      <div className="border-border/70 flex flex-wrap gap-1 border-b pb-px">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn(
              "rounded-t-lg px-3 py-2 text-sm transition-colors",
              tab === item
                ? "bg-card text-foreground border-border/70 border border-b-transparent font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {message ? (
        <p className="text-muted-foreground rounded-lg bg-muted/50 px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}

      {tab === "Trust" && product.trustProfile ? (
        <TrustSummary profile={product.trustProfile} />
      ) : tab === "Trust" ? (
        <p className="text-muted-foreground text-sm">
          Trust profile unavailable for this product.
        </p>
      ) : null}

      {tab === "Verify" && (
        <>
          <VerificationPanel
            lureModelId={product.id}
            productName={product.nameEn}
            suggestions={
              product.pendingSuggestions.map(
                (s) =>
                  ({
                    ...s,
                    source: s.source in SOURCE_LABELS ? s.source : "AI_ENRICHMENT",
                  }) as VerificationSuggestion,
              )
            }
          />
          <p className="text-muted-foreground mt-4 text-xs leading-relaxed">
            Lure AI suggestions use the catalog verification flow (accept/reject is audited).
            Species, techniques, manufacturers, and knowledge sources use the shared Studio AI Review panel.
          </p>
          {product.pendingImportDiffs.length > 0 ? (
            <section className="mt-8 space-y-3">
              <h3 className="text-sm font-semibold">Pending import changes</h3>
              <ImportDiffPanel
                lureModelId={product.id}
                diffs={product.pendingImportDiffs}
              />
            </section>
          ) : null}
        </>
      )}

      {tab === "General" && (
        <div className="grid gap-4 md:grid-cols-2">
          <ReadOnlyField label="Slug" value={product.slug} />
          <ReadOnlyField label="Lifecycle" value={product.lifecycleState} />
          <ReadOnlyField label="Manufacturer" value={product.manufacturer.nameEn} />
          <ReadOnlyField label="Product line" value={product.productLine.nameEn} />
          <ReadOnlyField
            label="Last imported"
            value={product.lastImportedAt?.toISOString() ?? "—"}
          />
          <ReadOnlyField
            label="Feed status"
            value={product.manufacturerStatus}
          />
        </div>
      )}

      {tab === "Manufacturer" && (
        <ManufacturerSyncPanel
          lureModelId={product.id}
          manufacturerSourceUrl={product.manufacturerSourceUrl}
          canRefreshManufacturer={product.canRefreshManufacturer}
          lastImportedAt={product.lastImportedAt}
          lastEditorialReviewAt={product.lastEditorialReviewAt}
          changesAvailable={product.changesAvailable}
          pendingImportDiffs={product.pendingImportDiffs}
          digitalTwin={product.digitalTwin}
          formFactorEn={product.formFactorEn}
          formFactorTr={product.formFactorTr}
          shortDescriptionEn={product.shortDescriptionEn}
          shortDescriptionTr={product.shortDescriptionTr}
          firstSeenAt={product.firstSeenAt}
          lastSeenAt={product.lastSeenAt}
          missingImportCount={product.missingImportCount}
          aliases={product.aliases}
        />
      )}

      {tab === "Manual override" && (
        <div className="space-y-8">
          <p className="text-muted-foreground text-sm">
            Manual entry is the exception — use only when suggestions cannot
            cover a correction.
          </p>
          <section>
            <h3 className="mb-4 text-sm font-semibold">Canonical fields</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <StudioField label="Name (EN)">
              <StudioInput
                value={canonical.nameEn}
                onChange={(e) =>
                  setCanonical((c) => ({ ...c, nameEn: e.target.value }))
                }
              />
            </StudioField>
            <StudioField label="Name (TR)">
              <StudioInput
                value={canonical.nameTr}
                onChange={(e) =>
                  setCanonical((c) => ({ ...c, nameTr: e.target.value }))
                }
              />
            </StudioField>
            <StudioField label="Slug">
              <StudioInput
                value={canonical.slug}
                onChange={(e) =>
                  setCanonical((c) => ({ ...c, slug: e.target.value }))
                }
              />
            </StudioField>
            <StudioField label="Lifecycle">
              <StudioSelect
                value={canonical.lifecycleState}
                onChange={(e) =>
                  setCanonical((c) => ({
                    ...c,
                    lifecycleState: e.target.value as typeof c.lifecycleState,
                  }))
                }
              >
                {EDITORIAL_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </StudioSelect>
            </StudioField>
            <StudioField label="Body type (EN)">
              <StudioInput
                value={canonical.bodyTypeEn}
                onChange={(e) =>
                  setCanonical((c) => ({ ...c, bodyTypeEn: e.target.value }))
                }
              />
            </StudioField>
            <StudioField label="Body type (TR)">
              <StudioInput
                value={canonical.bodyTypeTr}
                onChange={(e) =>
                  setCanonical((c) => ({ ...c, bodyTypeTr: e.target.value }))
                }
              />
            </StudioField>
            <StudioField label="Coating (EN)">
              <StudioInput
                value={canonical.coatingTypeEn}
                onChange={(e) =>
                  setCanonical((c) => ({ ...c, coatingTypeEn: e.target.value }))
                }
              />
            </StudioField>
            <StudioField label="Buoyancy (EN)">
              <StudioInput
                value={canonical.buoyancyEn}
                onChange={(e) =>
                  setCanonical((c) => ({ ...c, buoyancyEn: e.target.value }))
                }
              />
            </StudioField>
            <StudioField label="Action (EN)">
              <StudioInput
                value={canonical.actionEn}
                onChange={(e) =>
                  setCanonical((c) => ({ ...c, actionEn: e.target.value }))
                }
              />
            </StudioField>
            <StudioField label="Dive min (m)">
              <StudioInput
                value={canonical.divingDepthMinM}
                onChange={(e) =>
                  setCanonical((c) => ({
                    ...c,
                    divingDepthMinM: e.target.value,
                  }))
                }
              />
            </StudioField>
            <StudioField label="Dive max (m)">
              <StudioInput
                value={canonical.divingDepthMaxM}
                onChange={(e) =>
                  setCanonical((c) => ({
                    ...c,
                    divingDepthMaxM: e.target.value,
                  }))
                }
              />
            </StudioField>
            <StudioField label="Trolling min (kn)">
              <StudioInput
                value={canonical.trollingSpeedMinKn}
                onChange={(e) =>
                  setCanonical((c) => ({
                    ...c,
                    trollingSpeedMinKn: e.target.value,
                  }))
                }
              />
            </StudioField>
            <StudioField label="Trolling max (kn)">
              <StudioInput
                value={canonical.trollingSpeedMaxKn}
                onChange={(e) =>
                  setCanonical((c) => ({
                    ...c,
                    trollingSpeedMaxKn: e.target.value,
                  }))
                }
              />
            </StudioField>
          </div>
          <StudioField label="Techniques (editor curated)">
            <select
              multiple
              className="border-input bg-background min-h-28 w-full rounded-lg border px-3 py-2 text-sm"
              value={canonical.techniqueIds}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map(
                  (o) => o.value,
                );
                setCanonical((c) => ({ ...c, techniqueIds: selected }));
              }}
            >
              {techniqueOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nameEn}
                </option>
              ))}
            </select>
          </StudioField>
          <StudioField label="Species (moderator curated)">
            <select
              multiple
              className="border-input bg-background min-h-28 w-full rounded-lg border px-3 py-2 text-sm"
              value={canonical.speciesIds}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map(
                  (o) => o.value,
                );
                setCanonical((c) => ({ ...c, speciesIds: selected }));
              }}
            >
              {speciesOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameEn}
                </option>
              ))}
            </select>
          </StudioField>
          <button
            type="button"
            disabled={pending}
            className={buttonVariants()}
            onClick={saveCanonical}
          >
            Save canonical data
          </button>
          </section>

          <section>
            <h3 className="mb-4 text-sm font-semibold">Editor notes</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Balık Oltamda editorial layer — never overwritten by imports.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <StudioField label="Short recommendation (EN)">
              <StudioTextarea
                rows={3}
                value={notes.shortRecommendationEn}
                onChange={(e) =>
                  setNotes((n) => ({
                    ...n,
                    shortRecommendationEn: e.target.value,
                  }))
                }
              />
            </StudioField>
            <StudioField label="Short recommendation (TR)">
              <StudioTextarea
                rows={3}
                value={notes.shortRecommendationTr}
                onChange={(e) =>
                  setNotes((n) => ({
                    ...n,
                    shortRecommendationTr: e.target.value,
                  }))
                }
              />
            </StudioField>
            <StudioField label="Long recommendation (EN)">
              <StudioTextarea
                rows={4}
                value={notes.longRecommendationEn}
                onChange={(e) =>
                  setNotes((n) => ({
                    ...n,
                    longRecommendationEn: e.target.value,
                  }))
                }
              />
            </StudioField>
            <StudioField label="Long recommendation (TR)">
              <StudioTextarea
                rows={4}
                value={notes.longRecommendationTr}
                onChange={(e) =>
                  setNotes((n) => ({
                    ...n,
                    longRecommendationTr: e.target.value,
                  }))
                }
              />
            </StudioField>
            <StudioField label="Current recommendation (EN)">
              <StudioTextarea
                rows={3}
                value={notes.currentRecommendationEn}
                onChange={(e) =>
                  setNotes((n) => ({
                    ...n,
                    currentRecommendationEn: e.target.value,
                  }))
                }
              />
            </StudioField>
            <StudioField label="Current recommendation (TR)">
              <StudioTextarea
                rows={3}
                value={notes.currentRecommendationTr}
                onChange={(e) =>
                  setNotes((n) => ({
                    ...n,
                    currentRecommendationTr: e.target.value,
                  }))
                }
              />
            </StudioField>
            <StudioField label="Mediterranean notes (EN)">
              <StudioTextarea
                rows={3}
                value={notes.mediterraneanNotesEn}
                onChange={(e) =>
                  setNotes((n) => ({
                    ...n,
                    mediterraneanNotesEn: e.target.value,
                  }))
                }
              />
            </StudioField>
            <StudioField label="Aegean notes (EN)">
              <StudioTextarea
                rows={3}
                value={notes.aegeanNotesEn}
                onChange={(e) =>
                  setNotes((n) => ({ ...n, aegeanNotesEn: e.target.value }))
                }
              />
            </StudioField>
            <StudioField label="Northern Cyprus notes (EN)">
              <StudioTextarea
                rows={3}
                value={notes.northernCyprusNotesEn}
                onChange={(e) =>
                  setNotes((n) => ({
                    ...n,
                    northernCyprusNotesEn: e.target.value,
                  }))
                }
              />
            </StudioField>
            <StudioField label="Season (EN)">
              <StudioTextarea
                rows={2}
                value={notes.seasonalityEn}
                onChange={(e) =>
                  setNotes((n) => ({ ...n, seasonalityEn: e.target.value }))
                }
              />
            </StudioField>
            <StudioField label="Weather (EN)">
              <StudioTextarea
                rows={2}
                value={notes.weatherEn}
                onChange={(e) =>
                  setNotes((n) => ({ ...n, weatherEn: e.target.value }))
                }
              />
            </StudioField>
            <StudioField label="Water clarity (EN)">
              <StudioTextarea
                rows={2}
                value={notes.waterClarityEn}
                onChange={(e) =>
                  setNotes((n) => ({ ...n, waterClarityEn: e.target.value }))
                }
              />
            </StudioField>
            <StudioField label="Retrieve speed (EN)">
              <StudioTextarea
                rows={2}
                value={notes.retrieveSpeedEn}
                onChange={(e) =>
                  setNotes((n) => ({ ...n, retrieveSpeedEn: e.target.value }))
                }
              />
            </StudioField>
            <StudioField label="Best target species (EN)">
              <StudioInput
                value={notes.bestTargetSpeciesEn}
                onChange={(e) =>
                  setNotes((n) => ({
                    ...n,
                    bestTargetSpeciesEn: e.target.value,
                  }))
                }
              />
            </StudioField>
            <StudioField label="Recommended retrieve (EN)">
              <StudioTextarea
                rows={2}
                value={notes.recommendedRetrieveEn}
                onChange={(e) =>
                  setNotes((n) => ({
                    ...n,
                    recommendedRetrieveEn: e.target.value,
                  }))
                }
              />
            </StudioField>
            <StudioField label="Warnings (EN)">
              <StudioTextarea
                rows={2}
                value={notes.warningsEn}
                onChange={(e) =>
                  setNotes((n) => ({ ...n, warningsEn: e.target.value }))
                }
              />
            </StudioField>
            <StudioField label="Best colors (EN)">
              <StudioInput
                value={notes.bestColorsEn}
                onChange={(e) =>
                  setNotes((n) => ({ ...n, bestColorsEn: e.target.value }))
                }
              />
            </StudioField>
            <StudioField label="Personal observations (EN)">
              <StudioTextarea
                rows={3}
                value={notes.personalObservationsEn}
                onChange={(e) =>
                  setNotes((n) => ({
                    ...n,
                    personalObservationsEn: e.target.value,
                  }))
                }
              />
            </StudioField>
            <StudioField label="Confidence">
              <StudioSelect
                value={notes.confidence}
                onChange={(e) =>
                  setNotes((n) => ({
                    ...n,
                    confidence: e.target.value as typeof n.confidence,
                  }))
                }
              >
                {["LOW", "MEDIUM", "HIGH"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </StudioSelect>
            </StudioField>
          </div>
          <StudioField label="Internal notes (never public)">
            <StudioTextarea
              rows={4}
              value={notes.internalNotes}
              onChange={(e) =>
                setNotes((n) => ({ ...n, internalNotes: e.target.value }))
              }
            />
          </StudioField>
          <button
            type="button"
            disabled={pending}
            className={buttonVariants()}
            onClick={saveNotes}
          >
            Save editor notes
          </button>
          </section>
        </div>
      )}

      {tab === "Images" && (
        <ImageReviewPanel lureModelId={product.id} images={product.images} />
      )}

      {tab === "History" && (
        <ul className="space-y-3">
          {product.auditEntries.length === 0 ? (
            <li className="text-muted-foreground text-sm">No history yet.</li>
          ) : (
            product.auditEntries.map((entry) => (
              <li
                key={entry.id}
                className="border-border/60 rounded-lg border px-4 py-3 text-sm"
              >
                <p className="font-medium">{entry.summary}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {entry.action} · {entry.actor} ·{" "}
                  {entry.createdAt.toLocaleString()}
                </p>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="border-border/50 bg-muted/20 rounded-lg border px-3 py-2.5">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="mt-1 text-sm">{value ?? "—"}</p>
    </div>
  );
}

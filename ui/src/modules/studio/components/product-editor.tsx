"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  markProductReady,
  publishProduct,
  saveCanonicalProduct,
  saveEditorNotes,
  unpublishProduct,
} from "@/modules/studio/actions/product-actions";
import { CompletenessBar } from "@/modules/studio/components/completeness-bar";
import { EditorialStatusBadge } from "@/modules/studio/components/editorial-status-badge";
import { ImageReviewPanel } from "@/modules/studio/components/image-review-panel";
import { ImportDiffPanel } from "@/modules/studio/components/import-diff-panel";
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
  "General",
  "Manufacturer",
  "Canonical",
  "Editor Notes",
  "Import Changes",
  "Images",
  "Community",
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
  const [tab, setTab] = useState<Tab>("General");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
    startTransition(async () => {
      const result = await saveCanonicalProduct(product.id, canonical);
      setMessage(result.ok ? "Canonical data saved." : result.error);
    });
  }

  function saveNotes() {
    startTransition(async () => {
      const result = await saveEditorNotes(product.id, notes);
      setMessage(result.ok ? "Editor notes saved." : result.error);
    });
  }

  function handlePublish() {
    startTransition(async () => {
      const result = await publishProduct(product.id);
      setMessage(result.ok ? "Product published." : result.error);
    });
  }

  function handleUnpublish() {
    startTransition(async () => {
      const result = await unpublishProduct(product.id);
      setMessage(result.ok ? "Product unpublished." : result.error);
    });
  }

  function handleMarkReady() {
    startTransition(async () => {
      const result = await markProductReady(product.id);
      setMessage(result.ok ? "Marked as Ready." : result.error);
    });
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
        <Link
          href={`/en/lures/${product.slug}`}
          className={buttonVariants({ size: "sm", variant: "outline" })}
          target="_blank"
        >
          Preview public page
        </Link>
      </div>

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
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Importer-owned fields — read only. Imports never touch editor notes.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <ReadOnlyField label="Form factor (EN)" value={product.formFactorEn} />
            <ReadOnlyField label="Form factor (TR)" value={product.formFactorTr} />
            <ReadOnlyField label="Short description (EN)" value={product.shortDescriptionEn} />
            <ReadOnlyField label="Short description (TR)" value={product.shortDescriptionTr} />
            <ReadOnlyField label="First seen" value={product.firstSeenAt?.toISOString()} />
            <ReadOnlyField label="Last seen" value={product.lastSeenAt?.toISOString()} />
            <ReadOnlyField
              label="Missing import count"
              value={String(product.missingImportCount)}
            />
          </div>
          {product.aliases.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium">Aliases</p>
              <ul className="text-muted-foreground space-y-1 text-sm">
                {product.aliases.map((a) => (
                  <li key={`${a.kind}-${a.alias}`}>
                    {a.alias} <span className="text-xs">({a.kind})</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      {tab === "Canonical" && (
        <div className="space-y-6">
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
        </div>
      )}

      {tab === "Editor Notes" && (
        <div className="space-y-6">
          <p className="text-muted-foreground text-sm">
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
        </div>
      )}

      {tab === "Import Changes" && (
        <ImportDiffPanel
          lureModelId={product.id}
          diffs={product.pendingImportDiffs}
        />
      )}

      {tab === "Images" && (
        <ImageReviewPanel lureModelId={product.id} images={product.images} />
      )}

      {tab === "Community" && (
        <p className="text-muted-foreground text-sm">
          Community reports are read-only in this sprint. Moderation tools come
          later.
        </p>
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

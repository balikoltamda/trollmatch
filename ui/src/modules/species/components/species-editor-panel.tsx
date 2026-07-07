"use client";

import type { Dispatch, SetStateAction } from "react";
import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditorialStatusBadge } from "@/modules/studio/components/editorial-status-badge";
import {
  StudioField,
  StudioInput,
  StudioSelect,
  StudioTextarea,
} from "@/modules/studio/components/studio-ui";
import { EDITORIAL_STATUS_OPTIONS } from "@/modules/studio/lib/editorial";
import {
  STUDIO_SPECIES_PATH,
  STUDIO_MEDIA_PATH,
} from "@/modules/studio/lib/studio-routes";
import {
  archiveSpecies,
  createSpecies,
  markSpeciesReady,
  publishSpecies,
  rejectSpecies,
  restoreSpecies,
  saveSpecies,
  saveSpeciesConfusionsAction,
  unpublishSpecies,
} from "@/modules/species/actions/species-actions";
import {
  deleteMediaAsset,
  setMediaHero,
  uploadSpeciesMedia,
} from "@/modules/studio/media/actions/media-actions";
import type { StudioSpeciesDetail } from "@/modules/species/repositories/species-repository";
import type { ContentLifecycleState } from "@/generated/prisma/client";
import { SpeciesAiReviewSection } from "@/modules/species/components/species-ai-review-section";
import { EntityInsightsPanel } from "@/modules/studio/ai-review/components/entity-insights-panel";
import type { AiReviewSessionView } from "@/modules/studio/ai-review/types";

type RegionOption = { id: string; nameEn: string; code: string };
type TechniqueOption = { id: string; nameEn: string };
type SpeciesOption = { id: string; nameEn: string; scientificName: string };

type SpeciesEditorPanelProps = {
  species: StudioSpeciesDetail | null;
  regions: RegionOption[];
  techniques: TechniqueOption[];
  speciesOptions: SpeciesOption[];
  isNew?: boolean;
  aiSession?: AiReviewSessionView | null;
  regionCodeToId?: Record<string, string>;
};

type AliasRow = { alias: string; kind: "SEARCH_TERM" | "REGIONAL_NAME" | "MISSPELLING" | "SYNONYM" };
type ConfusionRow = {
  confusedWithSpeciesId: string;
  misappliedNameEn: string;
  misappliedNameTr: string;
  reasonEn: string;
  reasonTr: string;
};

function defaultProfile(lifecycle: ContentLifecycleState = "DRAFT") {
  return {
    descriptionEn: "",
    descriptionTr: "",
    habitatEn: "",
    habitatTr: "",
    distributionEn: "",
    distributionTr: "",
    depthMinM: "",
    depthMaxM: "",
    spawningEn: "",
    spawningTr: "",
    maxLengthCm: "",
    maxWeightG: "",
    conservationEn: "",
    conservationTr: "",
    iucnStatus: "" as string,
    lifecycleState: lifecycle,
  };
}

export function SpeciesEditorPanel({
  species,
  regions,
  techniques,
  speciesOptions,
  isNew = false,
  aiSession = null,
  regionCodeToId = {},
}: SpeciesEditorPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const [core, setCore] = useState({
    scientificName: species?.scientificName ?? "",
    nameEn: species?.nameEn ?? "",
    nameTr: species?.nameTr ?? "",
    slugEn: species?.slugEn ?? "",
    slugTr: species?.slugTr ?? "",
    editorialNotesEn: species?.editorialNotesEn ?? "",
    editorialNotesTr: species?.editorialNotesTr ?? "",
  });

  const [profile, setProfile] = useState(() => {
    if (!species?.profile) return defaultProfile();
    const p = species.profile;
    return {
      descriptionEn: p.descriptionEn ?? "",
      descriptionTr: p.descriptionTr ?? "",
      habitatEn: p.habitatEn ?? "",
      habitatTr: p.habitatTr ?? "",
      distributionEn: p.distributionEn ?? "",
      distributionTr: p.distributionTr ?? "",
      depthMinM: p.depthMinM ?? "",
      depthMaxM: p.depthMaxM ?? "",
      spawningEn: p.spawningEn ?? "",
      spawningTr: p.spawningTr ?? "",
      maxLengthCm: p.maxLengthCm ?? "",
      maxWeightG: p.maxWeightG ?? "",
      conservationEn: p.conservationEn ?? "",
      conservationTr: p.conservationTr ?? "",
      iucnStatus: p.iucnStatus ?? "",
      lifecycleState: p.lifecycleState,
    };
  });

  const [editorNote, setEditorNote] = useState({
    mediterraneanNotesEn: species?.editorNote?.mediterraneanNotesEn ?? "",
    mediterraneanNotesTr: species?.editorNote?.mediterraneanNotesTr ?? "",
    aegeanNotesEn: species?.editorNote?.aegeanNotesEn ?? "",
    aegeanNotesTr: species?.editorNote?.aegeanNotesTr ?? "",
    northernCyprusNotesEn: species?.editorNote?.northernCyprusNotesEn ?? "",
    northernCyprusNotesTr: species?.editorNote?.northernCyprusNotesTr ?? "",
    internalNotes: species?.editorNote?.internalNotes ?? "",
  });

  const [regionIds, setRegionIds] = useState<string[]>(species?.regionIds ?? []);
  const [techniqueIds, setTechniqueIds] = useState<string[]>(
    species?.techniqueIds ?? [],
  );
  const [aliases, setAliases] = useState<AliasRow[]>(
    species?.aliases.map((row) => ({
      alias: row.alias,
      kind: row.kind as AliasRow["kind"],
    })) ?? [],
  );
  const [confusions, setConfusions] = useState<ConfusionRow[]>(
    species?.confusions.map((row) => ({
      confusedWithSpeciesId: row.confusedWithSpeciesId,
      misappliedNameEn: row.misappliedNameEn ?? "",
      misappliedNameTr: row.misappliedNameTr ?? "",
      reasonEn: row.reasonEn,
      reasonTr: row.reasonTr,
    })) ?? [],
  );

  const payload = () => ({
    ...core,
    profile: {
      ...profile,
      iucnStatus: profile.iucnStatus || null,
    },
    editorNote,
    regionIds,
    techniqueIds,
    aliases,
  });

  function runAction(
    action: () => Promise<{ ok: boolean; error?: string; slugEn?: string }>,
    success: string,
    redirectSlug?: boolean,
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setMessage(result.error ?? "Action failed");
        return;
      }
      setMessage(success);
      if (redirectSlug && result.slugEn) {
        router.push(`${STUDIO_SPECIES_PATH}/${result.slugEn}`);
      } else {
        router.refresh();
      }
    });
  }

  function saveAll() {
    if (isNew) {
      runAction(
        () => createSpecies(payload()),
        "Species created.",
        true,
      );
      return;
    }
    if (!species) return;
    runAction(() => saveSpecies(species.id, payload()), "Species saved.");
  }

  function saveConfusionsOnly() {
    if (!species) return;
    runAction(
      () => saveSpeciesConfusionsAction(species.id, confusions),
      "Confusions saved.",
    );
  }

  function toggleRegion(id: string) {
    setRegionIds((current) =>
      current.includes(id) ? current.filter((r) => r !== id) : [...current, id],
    );
  }

  function toggleTechnique(id: string) {
    setTechniqueIds((current) =>
      current.includes(id) ? current.filter((t) => t !== id) : [...current, id],
    );
  }

  const lifecycle = profile.lifecycleState;
  const archived = Boolean(species?.deletedAt);
  const showAiReview = isNew || Boolean(aiSession);

  return (
    <div className="space-y-8">
      {!isNew && species ? (
        <EntityInsightsPanel
          entityType="SPECIES"
          entityId={species.id}
          entityLabel={`${species.nameTr} · ${species.scientificName}`}
        />
      ) : null}
      {showAiReview && regionCodeToId ? (
        <SpeciesAiReviewSection
          session={aiSession ?? null}
          entityId={species?.id}
          regionCodeToId={regionCodeToId}
          setCore={setCore as Dispatch<SetStateAction<Record<string, string>>>}
          setProfile={setProfile as Dispatch<SetStateAction<Record<string, string>>>}
          setEditorNote={setEditorNote as Dispatch<SetStateAction<Record<string, string>>>}
          setAliases={setAliases as Dispatch<SetStateAction<Array<{ alias: string; kind: string }>>>}
          setConfusions={setConfusions as Dispatch<SetStateAction<Array<Record<string, string>>>>}
          setRegionIds={setRegionIds}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {!isNew && species ? (
          <>
            <EditorialStatusBadge state={lifecycle} />
            {archived ? <Badge variant="muted">Archived</Badge> : null}
            {!archived ? (
              <>
                {lifecycle !== "PUBLISHED" ? (
                  <button
                    type="button"
                    disabled={pending}
                    className={buttonVariants({ size: "sm" })}
                    onClick={() =>
                      runAction(() => publishSpecies(species.id), "Published.")
                    }
                  >
                    Publish
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    className={buttonVariants({ size: "sm", variant: "outline" })}
                    onClick={() =>
                      runAction(() => unpublishSpecies(species.id), "Unpublished.")
                    }
                  >
                    Unpublish
                  </button>
                )}
                {lifecycle === "DRAFT" || lifecycle === "PENDING_REVIEW" ? (
                  <button
                    type="button"
                    disabled={pending}
                    className={buttonVariants({ size: "sm", variant: "outline" })}
                    onClick={() =>
                      runAction(() => markSpeciesReady(species.id), "Marked ready.")
                    }
                  >
                    Mark ready
                  </button>
                ) : null}
                {lifecycle === "PENDING_REVIEW" ? (
                  <button
                    type="button"
                    disabled={pending}
                    className={buttonVariants({ size: "sm", variant: "outline" })}
                    onClick={() =>
                      runAction(() => rejectSpecies(species.id), "Rejected.")
                    }
                  >
                    Reject
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={pending}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                  onClick={() =>
                    runAction(() => archiveSpecies(species.id), "Archived.")
                  }
                >
                  Archive
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={pending}
                className={buttonVariants({ size: "sm" })}
                onClick={() =>
                  runAction(() => restoreSpecies(species.id), "Restored.")
                }
              >
                Restore
              </button>
            )}
          </>
        ) : null}
        <button
          type="button"
          disabled={pending}
          className={buttonVariants({ size: "sm" })}
          onClick={saveAll}
        >
          {isNew ? "Create species" : "Save"}
        </button>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Names & slugs</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <StudioField label="Preferred name (TR)">
            <StudioInput
              value={core.nameTr}
              onChange={(e) => setCore({ ...core, nameTr: e.target.value })}
            />
          </StudioField>
          <StudioField label="Preferred name (EN)">
            <StudioInput
              value={core.nameEn}
              onChange={(e) => setCore({ ...core, nameEn: e.target.value })}
            />
          </StudioField>
          <StudioField label="Scientific name">
            <StudioInput
              value={core.scientificName}
              onChange={(e) =>
                setCore({ ...core, scientificName: e.target.value })
              }
              className="italic"
            />
          </StudioField>
          <StudioField label="Lifecycle">
            <StudioSelect
              value={profile.lifecycleState}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  lifecycleState: e.target.value as ContentLifecycleState,
                })
              }
            >
              {EDITORIAL_STATUS_OPTIONS.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </StudioSelect>
          </StudioField>
          <StudioField label="Slug (TR)">
            <StudioInput
              value={core.slugTr}
              onChange={(e) => setCore({ ...core, slugTr: e.target.value })}
            />
          </StudioField>
          <StudioField label="Slug (EN)">
            <StudioInput
              value={core.slugEn}
              onChange={(e) => setCore({ ...core, slugEn: e.target.value })}
            />
          </StudioField>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Profile</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <StudioField label="Description (TR)">
            <StudioTextarea
              rows={4}
              value={profile.descriptionTr}
              onChange={(e) =>
                setProfile({ ...profile, descriptionTr: e.target.value })
              }
            />
          </StudioField>
          <StudioField label="Description (EN)">
            <StudioTextarea
              rows={4}
              value={profile.descriptionEn}
              onChange={(e) =>
                setProfile({ ...profile, descriptionEn: e.target.value })
              }
            />
          </StudioField>
          <StudioField label="Habitat (TR)">
            <StudioTextarea
              rows={3}
              value={profile.habitatTr}
              onChange={(e) =>
                setProfile({ ...profile, habitatTr: e.target.value })
              }
            />
          </StudioField>
          <StudioField label="Habitat (EN)">
            <StudioTextarea
              rows={3}
              value={profile.habitatEn}
              onChange={(e) =>
                setProfile({ ...profile, habitatEn: e.target.value })
              }
            />
          </StudioField>
          <StudioField label="Max length (cm)">
            <StudioInput
              value={profile.maxLengthCm}
              onChange={(e) =>
                setProfile({ ...profile, maxLengthCm: e.target.value })
              }
            />
          </StudioField>
          <StudioField label="Max weight (g)">
            <StudioInput
              value={profile.maxWeightG}
              onChange={(e) =>
                setProfile({ ...profile, maxWeightG: e.target.value })
              }
            />
          </StudioField>
          <StudioField label="Depth min (m)">
            <StudioInput
              value={profile.depthMinM}
              onChange={(e) =>
                setProfile({ ...profile, depthMinM: e.target.value })
              }
            />
          </StudioField>
          <StudioField label="Depth max (m)">
            <StudioInput
              value={profile.depthMaxM}
              onChange={(e) =>
                setProfile({ ...profile, depthMaxM: e.target.value })
              }
            />
          </StudioField>
          <StudioField label="IUCN status">
            <StudioSelect
              value={profile.iucnStatus}
              onChange={(e) =>
                setProfile({ ...profile, iucnStatus: e.target.value })
              }
            >
              <option value="">—</option>
              {["EX", "EW", "CR", "EN", "VU", "NT", "LC", "DD", "NE"].map(
                (code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ),
              )}
            </StudioSelect>
          </StudioField>
          <div className="md:col-span-2">
            <StudioField label="Conservation notes (TR)">
              <StudioTextarea
                rows={3}
                value={profile.conservationTr}
                onChange={(e) =>
                  setProfile({ ...profile, conservationTr: e.target.value })
                }
              />
            </StudioField>
          </div>
          <div className="md:col-span-2">
            <StudioField label="Conservation notes (EN)">
              <StudioTextarea
                rows={3}
                value={profile.conservationEn}
                onChange={(e) =>
                  setProfile({ ...profile, conservationEn: e.target.value })
                }
              />
            </StudioField>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Distribution regions</h2>
        <div className="flex flex-wrap gap-2">
          {regions.map((region) => (
            <label
              key={region.id}
              className="border-border flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={regionIds.includes(region.id)}
                onChange={() => toggleRegion(region.id)}
              />
              <span>{region.nameEn}</span>
              <span className="text-muted-foreground text-xs">({region.code})</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Techniques</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {techniques.map((technique) => (
            <label
              key={technique.id}
              className="border-border flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={techniqueIds.includes(technique.id)}
                onChange={() => toggleTechnique(technique.id)}
              />
              {technique.nameEn}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Regional editor notes</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <StudioField label="Mediterranean (TR)">
            <StudioTextarea
              rows={3}
              value={editorNote.mediterraneanNotesTr}
              onChange={(e) =>
                setEditorNote({
                  ...editorNote,
                  mediterraneanNotesTr: e.target.value,
                })
              }
            />
          </StudioField>
          <StudioField label="Mediterranean (EN)">
            <StudioTextarea
              rows={3}
              value={editorNote.mediterraneanNotesEn}
              onChange={(e) =>
                setEditorNote({
                  ...editorNote,
                  mediterraneanNotesEn: e.target.value,
                })
              }
            />
          </StudioField>
          <StudioField label="Aegean (TR)">
            <StudioTextarea
              rows={3}
              value={editorNote.aegeanNotesTr}
              onChange={(e) =>
                setEditorNote({ ...editorNote, aegeanNotesTr: e.target.value })
              }
            />
          </StudioField>
          <StudioField label="Aegean (EN)">
            <StudioTextarea
              rows={3}
              value={editorNote.aegeanNotesEn}
              onChange={(e) =>
                setEditorNote({ ...editorNote, aegeanNotesEn: e.target.value })
              }
            />
          </StudioField>
          <StudioField label="Northern Cyprus (TR)">
            <StudioTextarea
              rows={3}
              value={editorNote.northernCyprusNotesTr}
              onChange={(e) =>
                setEditorNote({
                  ...editorNote,
                  northernCyprusNotesTr: e.target.value,
                })
              }
            />
          </StudioField>
          <StudioField label="Northern Cyprus (EN)">
            <StudioTextarea
              rows={3}
              value={editorNote.northernCyprusNotesEn}
              onChange={(e) =>
                setEditorNote({
                  ...editorNote,
                  northernCyprusNotesEn: e.target.value,
                })
              }
            />
          </StudioField>
          <div className="md:col-span-2">
            <StudioField label="Internal editor notes">
              <StudioTextarea
                rows={3}
                value={editorNote.internalNotes}
                onChange={(e) =>
                  setEditorNote({ ...editorNote, internalNotes: e.target.value })
                }
              />
            </StudioField>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold">Search aliases</h2>
          <button
            type="button"
            className={buttonVariants({ size: "sm", variant: "outline" })}
            onClick={() =>
              setAliases([...aliases, { alias: "", kind: "SEARCH_TERM" }])
            }
          >
            Add alias
          </button>
        </div>
        <div className="space-y-2">
          {aliases.map((row, index) => (
            <div key={index} className="flex flex-wrap gap-2">
              <StudioInput
                value={row.alias}
                placeholder="Alias"
                onChange={(e) => {
                  const next = [...aliases];
                  next[index] = { ...row, alias: e.target.value };
                  setAliases(next);
                }}
                className="min-w-[200px] flex-1"
              />
              <StudioSelect
                value={row.kind}
                onChange={(e) => {
                  const next = [...aliases];
                  next[index] = {
                    ...row,
                    kind: e.target.value as AliasRow["kind"],
                  };
                  setAliases(next);
                }}
              >
                <option value="SEARCH_TERM">Search term</option>
                <option value="SYNONYM">Synonym</option>
                <option value="REGIONAL_NAME">Regional name</option>
                <option value="MISSPELLING">Misspelling</option>
              </StudioSelect>
              <button
                type="button"
                className={buttonVariants({ size: "sm", variant: "outline" })}
                onClick={() => setAliases(aliases.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      {!isNew && species ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-sm font-semibold">Species confusions</h2>
            <button
              type="button"
              className={buttonVariants({ size: "sm", variant: "outline" })}
              onClick={saveConfusionsOnly}
              disabled={pending}
            >
              Save confusions
            </button>
          </div>
          <div className="space-y-3">
            {confusions.map((row, index) => (
              <div
                key={index}
                className="border-border space-y-2 rounded-lg border p-4"
              >
                <StudioSelect
                  value={row.confusedWithSpeciesId}
                  onChange={(e) => {
                    const next = [...confusions];
                    next[index] = {
                      ...row,
                      confusedWithSpeciesId: e.target.value,
                    };
                    setConfusions(next);
                  }}
                >
                  <option value="">Select species</option>
                  {speciesOptions
                    .filter((option) => option.id !== species.id)
                    .map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.nameEn} ({option.scientificName})
                      </option>
                    ))}
                </StudioSelect>
                <div className="grid gap-2 md:grid-cols-2">
                  <StudioInput
                    placeholder="Misapplied name (EN)"
                    value={row.misappliedNameEn}
                    onChange={(e) => {
                      const next = [...confusions];
                      next[index] = { ...row, misappliedNameEn: e.target.value };
                      setConfusions(next);
                    }}
                  />
                  <StudioInput
                    placeholder="Misapplied name (TR)"
                    value={row.misappliedNameTr}
                    onChange={(e) => {
                      const next = [...confusions];
                      next[index] = { ...row, misappliedNameTr: e.target.value };
                      setConfusions(next);
                    }}
                  />
                </div>
                <StudioTextarea
                  placeholder="Reason (EN)"
                  rows={2}
                  value={row.reasonEn}
                  onChange={(e) => {
                    const next = [...confusions];
                    next[index] = { ...row, reasonEn: e.target.value };
                    setConfusions(next);
                  }}
                />
                <StudioTextarea
                  placeholder="Reason (TR)"
                  rows={2}
                  value={row.reasonTr}
                  onChange={(e) => {
                    const next = [...confusions];
                    next[index] = { ...row, reasonTr: e.target.value };
                    setConfusions(next);
                  }}
                />
                <button
                  type="button"
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                  onClick={() =>
                    setConfusions(confusions.filter((_, i) => i !== index))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={buttonVariants({ size: "sm", variant: "outline" })}
            onClick={() =>
              setConfusions([
                ...confusions,
                {
                  confusedWithSpeciesId: "",
                  misappliedNameEn: "",
                  misappliedNameTr: "",
                  reasonEn: "",
                  reasonTr: "",
                },
              ])
            }
          >
            Add confusion pair
          </button>
        </section>
      ) : null}

      {!isNew && species ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-sm font-semibold">Images</h2>
            <Link
              href={STUDIO_MEDIA_PATH}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              Media library
            </Link>
          </div>
          <SpeciesImageManager speciesId={species.id} images={species.images} />
        </section>
      ) : null}
    </div>
  );
}

function SpeciesImageManager({
  speciesId,
  images,
}: {
  speciesId: string;
  images: StudioSpeciesDetail["images"];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function upload(formData: FormData) {
    startTransition(async () => {
      await uploadSpeciesMedia(speciesId, formData);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <form
        action={(formData) => upload(formData)}
        className="flex flex-wrap items-end gap-3"
      >
        <StudioField label="Upload image">
          <input type="file" name="file" accept="image/*" required />
        </StudioField>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="setAsHero" value="1" />
          Set as hero
        </label>
        <button
          type="submit"
          disabled={pending}
          className={buttonVariants({ size: "sm" })}
        >
          Upload
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image) => (
          <div
            key={image.id}
            className="border-border overflow-hidden rounded-lg border"
          >
            <div className="relative aspect-[4/3]">
              <Image src={image.url} alt="" fill className="object-cover" />
            </div>
            <div className="space-y-2 p-3">
              <Badge variant={image.role === "HERO" ? "ocean" : "muted"}>
                {image.role}
              </Badge>
              <div className="flex flex-wrap gap-2">
                {image.role !== "HERO" ? (
                  <button
                    type="button"
                    disabled={pending}
                    className={buttonVariants({ size: "sm", variant: "outline" })}
                    onClick={() =>
                      startTransition(async () => {
                        await setMediaHero("species", image.id);
                        router.refresh();
                      })
                    }
                  >
                    Set hero
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={pending}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteMediaAsset("species", image.id);
                      router.refresh();
                    })
                  }
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  deleteMediaAsset,
  replaceMediaAsset,
  setMediaHero,
  updateMediaMetadata,
  uploadMediaByEntitySlug,
} from "@/modules/studio/media/actions/media-actions";
import type {
  MediaAssetKind,
  MediaLibraryRow,
} from "@/modules/studio/media/types";
import {
  StudioField,
  StudioInput,
  StudioSelect,
  StudioTable,
  StudioTd,
  StudioTh,
  StudioTextarea,
} from "@/modules/studio/components/studio-ui";

type MediaLibraryPanelProps = {
  rows: MediaLibraryRow[];
  counts: { lure: number; species: number; manufacturer: number; total: number };
};

const KIND_LABEL: Record<MediaAssetKind, string> = {
  lure: "Lure",
  species: "Species",
  manufacturer: "Manufacturer",
};

const STORAGE_STATUS_LABEL: Record<
  MediaLibraryRow["storageStatus"],
  { label: string; variant: "ocean" | "muted" | "coral" }
> = {
  remote: { label: "Remote", variant: "muted" },
  downloaded: { label: "Downloaded", variant: "ocean" },
  optimized: { label: "Optimized", variant: "ocean" },
  missing: { label: "Missing", variant: "coral" },
  broken: { label: "Broken", variant: "coral" },
};

function StorageStatusBadge({ status }: { status: MediaLibraryRow["storageStatus"] }) {
  const config = STORAGE_STATUS_LABEL[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function roleLabel(kind: MediaAssetKind, role: string): string {
  if (role === "HERO") return kind === "species" ? "Hero" : "Cover";
  if (role === "LOGO") return "Logo";
  return role;
}

function entityHref(row: MediaLibraryRow): string {
  if (row.kind === "lure") return `/studio/products/${row.entityId}`;
  if (row.kind === "species") return `/species/${row.entitySlug}`;
  return `/studio/manufacturers/${row.entitySlug}`;
}

export function MediaLibraryPanel({ rows, counts }: MediaLibraryPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<MediaAssetKind | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<MediaLibraryRow | null>(
    null,
  );

  const [upload, setUpload] = useState({
    kind: "lure" as MediaAssetKind,
    entitySlug: "",
    remoteUrl: "",
    setAsHero: false,
    altTextEn: "",
    altTextTr: "",
    creditEn: "",
    creditTr: "",
    copyrightEn: "",
    copyrightTr: "",
  });

  const [editForm, setEditForm] = useState({
    altTextEn: "",
    altTextTr: "",
    creditEn: "",
    creditTr: "",
    copyrightEn: "",
    copyrightTr: "",
  });

  const filteredRows = useMemo(
    () =>
      filter === "all" ? rows : rows.filter((row) => row.kind === filter),
    [rows, filter],
  );

  const editingRow = rows.find((row) => row.id === editingId) ?? null;

  function run(
    action: () => Promise<{ ok: boolean; error?: string; duplicateWarning?: string }>,
    success: string,
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setMessage(result.error ?? "Action failed");
        return;
      }
      setMessage(
        result.duplicateWarning ? `${success} ${result.duplicateWarning}` : success,
      );
      router.refresh();
    });
  }

  function buildMetadataFormData(extra: Record<string, string | File | boolean> = {}) {
    const formData = new FormData();
    formData.set("altTextEn", upload.altTextEn);
    formData.set("altTextTr", upload.altTextTr);
    formData.set("creditEn", upload.creditEn);
    formData.set("creditTr", upload.creditTr);
    formData.set("copyrightEn", upload.copyrightEn);
    formData.set("copyrightTr", upload.copyrightTr);
    for (const [key, value] of Object.entries(extra)) {
      if (value instanceof File) {
        formData.set(key, value);
      } else {
        formData.set(key, String(value));
      }
    }
    return formData;
  }

  function handleUpload(file?: File | null) {
    const formData = buildMetadataFormData({
      remoteUrl: upload.remoteUrl,
      setAsHero: upload.setAsHero,
    });
    if (file) formData.set("file", file);

    run(
      () => uploadMediaByEntitySlug(upload.kind, upload.entitySlug, formData),
      "Media uploaded.",
    );
  }

  function openEdit(row: MediaLibraryRow) {
    setEditingId(row.id);
    setEditForm({
      altTextEn: row.altTextEn ?? "",
      altTextTr: row.altTextTr ?? "",
      creditEn: row.creditEn ?? "",
      creditTr: row.creditTr ?? "",
      copyrightEn: row.copyrightEn ?? "",
      copyrightTr: row.copyrightTr ?? "",
    });
  }

  function saveEdit(row: MediaLibraryRow) {
    run(
      () => updateMediaMetadata(row.kind, row.id, editForm),
      "Metadata saved.",
    );
    setEditingId(null);
  }

  function triggerReplace(row: MediaLibraryRow) {
    setReplaceTarget(row);
    replaceInputRef.current?.click();
  }

  function handleReplaceFile(file: File | null) {
    if (!file || !replaceTarget) return;
    const formData = new FormData();
    formData.set("file", file);
    formData.set("altTextEn", replaceTarget.altTextEn ?? "");
    formData.set("altTextTr", replaceTarget.altTextTr ?? "");
    formData.set("creditEn", replaceTarget.creditEn ?? "");
    formData.set("creditTr", replaceTarget.creditTr ?? "");
    formData.set("copyrightEn", replaceTarget.copyrightEn ?? "");
    formData.set("copyrightTr", replaceTarget.copyrightTr ?? "");

    run(
      () => replaceMediaAsset(replaceTarget.kind, replaceTarget.id, formData),
      "Image replaced.",
    );
    setReplaceTarget(null);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="border-border/70 rounded-xl border px-4 py-3">
          <p className="text-muted-foreground text-xs">Total assets</p>
          <p className="text-2xl font-semibold">{counts.total}</p>
        </div>
        <div className="border-border/70 rounded-xl border px-4 py-3">
          <p className="text-muted-foreground text-xs">Lure images</p>
          <p className="text-2xl font-semibold">{counts.lure}</p>
        </div>
        <div className="border-border/70 rounded-xl border px-4 py-3">
          <p className="text-muted-foreground text-xs">Species images</p>
          <p className="text-2xl font-semibold">{counts.species}</p>
        </div>
        <div className="border-border/70 rounded-xl border px-4 py-3">
          <p className="text-muted-foreground text-xs">Manufacturer logos</p>
          <p className="text-2xl font-semibold">{counts.manufacturer}</p>
        </div>
      </div>

      <section className="border-border/70 space-y-4 rounded-xl border px-4 py-4">
        <h2 className="text-sm font-semibold">Upload</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <StudioField label="Asset type">
            <StudioSelect
              value={upload.kind}
              onChange={(e) =>
                setUpload({
                  ...upload,
                  kind: e.target.value as MediaAssetKind,
                  setAsHero: e.target.value === "manufacturer" ? false : upload.setAsHero,
                })
              }
            >
              <option value="lure">Lure product</option>
              <option value="species">Fish species</option>
              <option value="manufacturer">Manufacturer logo</option>
            </StudioSelect>
          </StudioField>
          <StudioField label="Entity slug">
            <StudioInput
              value={upload.entitySlug}
              onChange={(e) =>
                setUpload({ ...upload, entitySlug: e.target.value })
              }
              placeholder="e.g. duel-aile-maestro"
            />
          </StudioField>
          <StudioField label="Remote URL (optional)">
            <StudioInput
              value={upload.remoteUrl}
              onChange={(e) =>
                setUpload({ ...upload, remoteUrl: e.target.value })
              }
              placeholder="https://…"
            />
          </StudioField>
          <StudioField label="Alt text (EN)">
            <StudioInput
              value={upload.altTextEn}
              onChange={(e) =>
                setUpload({ ...upload, altTextEn: e.target.value })
              }
            />
          </StudioField>
          <StudioField label="Alt text (TR)">
            <StudioInput
              value={upload.altTextTr}
              onChange={(e) =>
                setUpload({ ...upload, altTextTr: e.target.value })
              }
            />
          </StudioField>
          <StudioField label="Credit (EN)">
            <StudioInput
              value={upload.creditEn}
              onChange={(e) =>
                setUpload({ ...upload, creditEn: e.target.value })
              }
            />
          </StudioField>
          <StudioField label="Credit (TR)">
            <StudioInput
              value={upload.creditTr}
              onChange={(e) =>
                setUpload({ ...upload, creditTr: e.target.value })
              }
            />
          </StudioField>
          <StudioField label="Copyright (EN)">
            <StudioInput
              value={upload.copyrightEn}
              onChange={(e) =>
                setUpload({ ...upload, copyrightEn: e.target.value })
              }
            />
          </StudioField>
          <StudioField label="Copyright (TR)">
            <StudioInput
              value={upload.copyrightTr}
              onChange={(e) =>
                setUpload({ ...upload, copyrightTr: e.target.value })
              }
            />
          </StudioField>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              disabled={pending}
              onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
            />
          </label>
          <button
            type="button"
            disabled={pending || !upload.entitySlug.trim()}
            className={buttonVariants({ size: "sm" })}
            onClick={() => handleUpload()}
          >
            Upload from URL
          </button>
          {upload.kind !== "manufacturer" ? (
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={upload.setAsHero}
                onChange={(e) =>
                  setUpload({ ...upload, setAsHero: e.target.checked })
                }
              />
              Set as {upload.kind === "species" ? "hero" : "cover"} on upload
            </label>
          ) : null}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {(["all", "lure", "species", "manufacturer"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={buttonVariants({
              size: "sm",
              variant: filter === value ? "default" : "outline",
            })}
            onClick={() => setFilter(value)}
          >
            {value === "all" ? "All" : KIND_LABEL[value]}
          </button>
        ))}
      </div>

      {message ? (
        <p className="text-muted-foreground text-sm">{message}</p>
      ) : null}

      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          handleReplaceFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      <StudioTable>
        <thead>
          <tr>
            <StudioTh>Preview</StudioTh>
            <StudioTh>Entity</StudioTh>
            <StudioTh>Type</StudioTh>
            <StudioTh>Role</StudioTh>
            <StudioTh>SHA-256</StudioTh>
            <StudioTh>Attribution</StudioTh>
            <StudioTh className="text-right">Actions</StudioTh>
          </tr>
        </thead>
        <tbody>
          {filteredRows.length === 0 ? (
            <tr>
              <StudioTd colSpan={7} className="text-muted-foreground">
                No media assets yet.
              </StudioTd>
            </tr>
          ) : (
            filteredRows.map((row) => (
              <tr key={`${row.kind}-${row.id}`}>
                <StudioTd>
                  <div className="relative size-14 overflow-hidden rounded-lg border">
                    {row.url.startsWith("/") ? (
                      <Image
                        src={row.url}
                        alt={row.altTextEn ?? row.entityName}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.url}
                        alt={row.altTextEn ?? row.entityName}
                        className="size-full object-cover"
                      />
                    )}
                  </div>
                </StudioTd>
                <StudioTd>
                  <Link href={entityHref(row)} className="hover:text-ocean font-medium">
                    {row.entityName}
                  </Link>
                  <p className="text-muted-foreground text-xs">{row.entitySlug}</p>
                  <p className="text-muted-foreground mt-1 max-w-xs truncate text-xs">
                    {row.url}
                  </p>
                  {row.sourceUrl ? (
                    <p className="text-muted-foreground mt-1 max-w-xs truncate text-xs">
                      Source: {row.sourceUrl}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1">
                    <StorageStatusBadge status={row.storageStatus} />
                    {row.referenceCount > 1 ? (
                      <Badge variant="muted">Refs: {row.referenceCount}</Badge>
                    ) : null}
                  </div>
                  {row.duplicateOf ? (
                    <Badge variant="coral" className="mt-2">
                      Duplicate of {row.duplicateOf.entityName}
                    </Badge>
                  ) : null}
                </StudioTd>
                <StudioTd>{KIND_LABEL[row.kind]}</StudioTd>
                <StudioTd>{roleLabel(row.kind, row.role)}</StudioTd>
                <StudioTd className="font-mono text-xs">
                  {row.sha256Hash ? `${row.sha256Hash.slice(0, 12)}…` : "—"}
                </StudioTd>
                <StudioTd className="max-w-xs text-xs">
                  <p>{row.altTextEn ?? "—"}</p>
                  {row.creditEn ? (
                    <p className="text-muted-foreground mt-1">Credit: {row.creditEn}</p>
                  ) : null}
                  {row.copyrightEn ? (
                    <p className="text-muted-foreground mt-1">
                      © {row.copyrightEn}
                    </p>
                  ) : null}
                </StudioTd>
                <StudioTd>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex flex-wrap justify-end gap-1">
                      {row.kind !== "manufacturer" &&
                      row.role !== "HERO" &&
                      row.role !== "LOGO" ? (
                        <button
                          type="button"
                          disabled={pending}
                          className={buttonVariants({ size: "sm", variant: "outline" })}
                          onClick={() =>
                            run(
                              () => setMediaHero(row.kind, row.id),
                              "Hero updated.",
                            )
                          }
                        >
                          Set {row.kind === "species" ? "hero" : "cover"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={pending}
                        className={buttonVariants({ size: "sm", variant: "outline" })}
                        onClick={() => openEdit(row)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        className={buttonVariants({ size: "sm", variant: "outline" })}
                        onClick={() => triggerReplace(row)}
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        className={buttonVariants({ size: "sm", variant: "ghost" })}
                        onClick={() => {
                          if (!window.confirm("Remove this media asset?")) return;
                          run(
                            () => deleteMediaAsset(row.kind, row.id),
                            "Media deleted.",
                          );
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </StudioTd>
              </tr>
            ))
          )}
        </tbody>
      </StudioTable>

      {editingRow ? (
        <section className="border-border/70 space-y-3 rounded-xl border px-4 py-4">
          <h3 className="text-sm font-semibold">
            Edit metadata — {editingRow.entityName}
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <StudioField label="Alt text (EN)">
              <StudioTextarea
                value={editForm.altTextEn}
                onChange={(e) =>
                  setEditForm({ ...editForm, altTextEn: e.target.value })
                }
              />
            </StudioField>
            <StudioField label="Alt text (TR)">
              <StudioTextarea
                value={editForm.altTextTr}
                onChange={(e) =>
                  setEditForm({ ...editForm, altTextTr: e.target.value })
                }
              />
            </StudioField>
            <StudioField label="Credit (EN)">
              <StudioInput
                value={editForm.creditEn}
                onChange={(e) =>
                  setEditForm({ ...editForm, creditEn: e.target.value })
                }
              />
            </StudioField>
            <StudioField label="Credit (TR)">
              <StudioInput
                value={editForm.creditTr}
                onChange={(e) =>
                  setEditForm({ ...editForm, creditTr: e.target.value })
                }
              />
            </StudioField>
            <StudioField label="Copyright (EN)">
              <StudioInput
                value={editForm.copyrightEn}
                onChange={(e) =>
                  setEditForm({ ...editForm, copyrightEn: e.target.value })
                }
              />
            </StudioField>
            <StudioField label="Copyright (TR)">
              <StudioInput
                value={editForm.copyrightTr}
                onChange={(e) =>
                  setEditForm({ ...editForm, copyrightTr: e.target.value })
                }
              />
            </StudioField>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              className={buttonVariants({ size: "sm" })}
              onClick={() => saveEdit(editingRow)}
            >
              Save metadata
            </button>
            <button
              type="button"
              className={buttonVariants({ size: "sm", variant: "ghost" })}
              onClick={() => setEditingId(null)}
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

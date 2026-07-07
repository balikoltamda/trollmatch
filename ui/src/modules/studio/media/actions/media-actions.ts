"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  auditActor,
  isUnauthorizedResult,
  requireEditorOrUnauthorized,
} from "@/modules/studio/auth/permissions";
import { recordCatalogAudit } from "@/modules/studio/data/audit";
import {
  isAllowedImageContentType,
  MAX_MEDIA_BYTES,
} from "@/modules/studio/media/lib/image-bytes";
import {
  findMediaBySha256,
  lureHasEditorCover,
  metadataFields,
  speciesHasEditorHero,
} from "@/modules/studio/media/lib/media-queries";
import {
  fetchRemoteImageBytes,
  storeMediaBytes,
  storeMediaFromUrl,
} from "@/modules/studio/media/lib/media-storage";
import type {
  MediaAssetKind,
  MediaMetadataInput,
} from "@/modules/studio/media/types";

type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateMediaPaths() {
  revalidatePath("/studio/media");
  revalidatePath("/studio/products");
  revalidatePath("/studio/manufacturers");
}

async function requireEditor() {
  return requireEditorOrUnauthorized();
}

async function readUploadBytes(
  formData: FormData,
): Promise<{ bytes: Buffer; contentType: string } | { error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Select an image file to upload" };
  }
  if (file.size > MAX_MEDIA_BYTES) {
    return { error: "Image must be 10 MB or smaller" };
  }
  const contentType = file.type || "application/octet-stream";
  if (!isAllowedImageContentType(contentType)) {
    return { error: "Unsupported image type — use JPEG, PNG, WebP, GIF, or SVG" };
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  return { bytes, contentType };
}

function parseMetadata(formData: FormData): MediaMetadataInput {
  return {
    altTextEn: String(formData.get("altTextEn") ?? ""),
    altTextTr: String(formData.get("altTextTr") ?? ""),
    creditEn: String(formData.get("creditEn") ?? ""),
    creditTr: String(formData.get("creditTr") ?? ""),
    photographerEn: String(formData.get("photographerEn") ?? ""),
    photographerTr: String(formData.get("photographerTr") ?? ""),
    copyrightEn: String(formData.get("copyrightEn") ?? ""),
    copyrightTr: String(formData.get("copyrightTr") ?? ""),
  };
}

async function resolveStoredMedia(formData: FormData) {
  const remoteUrl = String(formData.get("remoteUrl") ?? "").trim();
  const file = formData.get("file");

  if (file instanceof File && file.size > 0) {
    const read = await readUploadBytes(formData);
    if ("error" in read) return read;
    const stored = await storeMediaBytes({
      bytes: read.bytes,
      contentType: read.contentType,
      sourceUrl: remoteUrl || null,
    });
    return { stored };
  }

  if (remoteUrl) {
    try {
      const stored = await storeMediaFromUrl(remoteUrl);
      return { stored };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Could not fetch image URL",
      };
    }
  }

  return { error: "Provide an image file or URL" };
}

async function auditLureMedia(
  auth: Awaited<ReturnType<typeof requireEditor>>,
  lureModelId: string,
  imageId: string,
  summary: string,
  metadata?: Prisma.InputJsonValue,
) {
  if (isUnauthorizedResult(auth)) return;
  await recordCatalogAudit({
    lureModelId,
    entityType: "image",
    entityId: imageId,
    action: "EDITOR_CANONICAL",
    actor: auditActor(auth),
    summary,
    metadata,
  });
}

async function auditGenericMedia(
  auth: Awaited<ReturnType<typeof requireEditor>>,
  entityType: string,
  entityId: string,
  summary: string,
  metadata?: Prisma.InputJsonValue,
) {
  if (isUnauthorizedResult(auth)) return;
  await recordCatalogAudit({
    entityType,
    entityId,
    action: "EDITOR_CANONICAL",
    actor: auditActor(auth),
    summary,
    metadata,
  });
}

export async function uploadLureMedia(
  lureModelId: string,
  formData: FormData,
): Promise<ActionResult & { duplicateWarning?: string }> {
  const auth = await requireEditor();
  if (isUnauthorizedResult(auth)) return auth;

  const storedResult = await resolveStoredMedia(formData);
  if ("error" in storedResult) return { ok: false, error: storedResult.error };

  const { stored } = storedResult;
  const meta = metadataFields(parseMetadata(formData));
  const setAsHero = formData.get("setAsHero") === "true";

  try {
    const duplicate = await findMediaBySha256(stored.sha256Hash);
    const maxSort = await prisma.image.aggregate({
      where: { lureModelId, deletedAt: null },
      _max: { sortOrder: true },
    });

    let role: "HERO" | "PRODUCT" = "PRODUCT";
    if (setAsHero) {
      role = "HERO";
    }

    const image = await prisma.$transaction(async (tx) => {
      if (setAsHero) {
        await tx.image.updateMany({
          where: { lureModelId, role: "HERO", deletedAt: null },
          data: { role: "PRODUCT" },
        });
      }

      return tx.image.create({
        data: {
          lureModelId,
          url: stored.publicUrl,
          sourceUrl: stored.sourceUrl,
          sha256Hash: stored.sha256Hash,
          mediaAssetId: stored.mediaAssetId ?? null,
          role,
          sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
          ...meta,
        },
      });
    });

    await auditLureMedia(auth, lureModelId, image.id, "Uploaded lure media", {
      sha256Hash: stored.sha256Hash,
      role,
    });

    revalidateMediaPaths();
    revalidatePath(`/studio/products/${lureModelId}`);

    return {
      ok: true,
      duplicateWarning: duplicate
        ? `Duplicate detected — same file used on ${duplicate.entityName}`
        : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export async function uploadSpeciesMedia(
  fishSpeciesId: string,
  formData: FormData,
): Promise<ActionResult & { duplicateWarning?: string }> {
  const auth = await requireEditor();
  if (isUnauthorizedResult(auth)) return auth;

  const storedResult = await resolveStoredMedia(formData);
  if ("error" in storedResult) return { ok: false, error: storedResult.error };

  const { stored } = storedResult;
  const meta = metadataFields(parseMetadata(formData));
  const setAsHero = formData.get("setAsHero") === "true";

  try {
    const duplicate = await findMediaBySha256(stored.sha256Hash);
    const maxSort = await prisma.speciesImage.aggregate({
      where: { fishSpeciesId, deletedAt: null },
      _max: { sortOrder: true },
    });

    const image = await prisma.$transaction(async (tx) => {
      if (setAsHero) {
        await tx.speciesImage.updateMany({
          where: { fishSpeciesId, role: "HERO", deletedAt: null },
          data: { role: "GALLERY" },
        });
      }

      return tx.speciesImage.create({
        data: {
          fishSpeciesId,
          url: stored.publicUrl,
          sourceUrl: stored.sourceUrl,
          sha256Hash: stored.sha256Hash,
          mediaAssetId: stored.mediaAssetId ?? null,
          role: setAsHero ? "HERO" : "GALLERY",
          sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
          ...meta,
        },
      });
    });

    await auditGenericMedia(
      auth,
      "species_image",
      image.id,
      "Uploaded species media",
      { fishSpeciesId, sha256Hash: stored.sha256Hash },
    );

    revalidateMediaPaths();
    return {
      ok: true,
      duplicateWarning: duplicate
        ? `Duplicate detected — same file used on ${duplicate.entityName}`
        : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export async function uploadManufacturerMedia(
  manufacturerId: string,
  formData: FormData,
): Promise<ActionResult & { duplicateWarning?: string }> {
  const auth = await requireEditor();
  if (isUnauthorizedResult(auth)) return auth;

  const storedResult = await resolveStoredMedia(formData);
  if ("error" in storedResult) return { ok: false, error: storedResult.error };

  const { stored } = storedResult;
  const meta = metadataFields(parseMetadata(formData));

  try {
    const duplicate = await findMediaBySha256(stored.sha256Hash);

    const image = await prisma.$transaction(async (tx) => {
      await tx.manufacturerImage.updateMany({
        where: { manufacturerId, role: "LOGO", deletedAt: null },
        data: { deletedAt: new Date() },
      });

      const created = await tx.manufacturerImage.create({
        data: {
          manufacturerId,
          url: stored.publicUrl,
          sourceUrl: stored.sourceUrl,
          sha256Hash: stored.sha256Hash,
          mediaAssetId: stored.mediaAssetId ?? null,
          role: "LOGO",
          sortOrder: 0,
          ...meta,
        },
      });

      await tx.manufacturer.update({
        where: { id: manufacturerId },
        data: { logoUrl: stored.publicUrl },
      });

      return created;
    });

    await auditGenericMedia(
      auth,
      "manufacturer_image",
      image.id,
      "Uploaded manufacturer logo",
      { manufacturerId, sha256Hash: stored.sha256Hash },
    );

    revalidateMediaPaths();
    revalidatePath("/studio/manufacturers");

    return {
      ok: true,
      duplicateWarning: duplicate
        ? `Duplicate detected — same file used on ${duplicate.entityName}`
        : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export async function uploadMediaByEntitySlug(
  kind: MediaAssetKind,
  entitySlug: string,
  formData: FormData,
): Promise<ActionResult & { duplicateWarning?: string }> {
  const slug = entitySlug.trim();
  if (!slug) return { ok: false, error: "Entity slug is required" };

  if (kind === "lure") {
    const lure = await prisma.lureModel.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
    if (!lure) return { ok: false, error: "Lure product not found" };
    return uploadLureMedia(lure.id, formData);
  }

  if (kind === "species") {
    const species = await prisma.fishSpecies.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
    if (!species) return { ok: false, error: "Fish species not found" };
    return uploadSpeciesMedia(species.id, formData);
  }

  const manufacturer = await prisma.manufacturer.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true },
  });
  if (!manufacturer) return { ok: false, error: "Manufacturer not found" };
  return uploadManufacturerMedia(manufacturer.id, formData);
}

export async function deleteMediaAsset(
  kind: MediaAssetKind,
  imageId: string,
): Promise<ActionResult> {
  const auth = await requireEditor();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    if (kind === "lure") {
      const image = await prisma.image.findFirst({
        where: { id: imageId, deletedAt: null },
      });
      if (!image) return { ok: false, error: "Image not found" };
      await prisma.image.update({
        where: { id: imageId },
        data: { deletedAt: new Date() },
      });
      await auditLureMedia(auth, image.lureModelId, imageId, "Deleted lure media");
      revalidatePath(`/studio/products/${image.lureModelId}`);
    } else if (kind === "species") {
      const image = await prisma.speciesImage.findFirst({
        where: { id: imageId, deletedAt: null },
      });
      if (!image) return { ok: false, error: "Image not found" };
      await prisma.speciesImage.update({
        where: { id: imageId },
        data: { deletedAt: new Date() },
      });
      await auditGenericMedia(auth, "species_image", imageId, "Deleted species media");
    } else {
      const image = await prisma.manufacturerImage.findFirst({
        where: { id: imageId, deletedAt: null },
      });
      if (!image) return { ok: false, error: "Image not found" };
      await prisma.manufacturerImage.update({
        where: { id: imageId },
        data: { deletedAt: new Date() },
      });
      await auditGenericMedia(
        auth,
        "manufacturer_image",
        imageId,
        "Deleted manufacturer media",
      );
    }

    revalidateMediaPaths();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

export async function replaceMediaAsset(
  kind: MediaAssetKind,
  imageId: string,
  formData: FormData,
): Promise<ActionResult & { duplicateWarning?: string }> {
  const auth = await requireEditor();
  if (isUnauthorizedResult(auth)) return auth;

  const storedResult = await resolveStoredMedia(formData);
  if ("error" in storedResult) return { ok: false, error: storedResult.error };

  const { stored } = storedResult;
  const meta = metadataFields(parseMetadata(formData));

  try {
    const duplicate = await findMediaBySha256(stored.sha256Hash, {
      kind,
      id: imageId,
    });

    if (kind === "lure") {
      const image = await prisma.image.findFirst({
        where: { id: imageId, deletedAt: null },
      });
      if (!image) return { ok: false, error: "Image not found" };

      await prisma.image.update({
        where: { id: imageId },
        data: {
          url: stored.publicUrl,
          sourceUrl: stored.sourceUrl,
          sha256Hash: stored.sha256Hash,
          ...meta,
        },
      });
      await auditLureMedia(auth, image.lureModelId, imageId, "Replaced lure media");
      revalidatePath(`/studio/products/${image.lureModelId}`);
    } else if (kind === "species") {
      const image = await prisma.speciesImage.findFirst({
        where: { id: imageId, deletedAt: null },
      });
      if (!image) return { ok: false, error: "Image not found" };

      await prisma.speciesImage.update({
        where: { id: imageId },
        data: {
          url: stored.publicUrl,
          sourceUrl: stored.sourceUrl,
          sha256Hash: stored.sha256Hash,
          ...meta,
        },
      });
      await auditGenericMedia(auth, "species_image", imageId, "Replaced species media");
    } else {
      const image = await prisma.manufacturerImage.findFirst({
        where: { id: imageId, deletedAt: null },
      });
      if (!image) return { ok: false, error: "Image not found" };

      await prisma.$transaction(async (tx) => {
        await tx.manufacturerImage.update({
          where: { id: imageId },
          data: {
            url: stored.publicUrl,
            sourceUrl: stored.sourceUrl,
            sha256Hash: stored.sha256Hash,
            ...meta,
          },
        });
        await tx.manufacturer.update({
          where: { id: image.manufacturerId },
          data: { logoUrl: stored.publicUrl },
        });
      });
      await auditGenericMedia(
        auth,
        "manufacturer_image",
        imageId,
        "Replaced manufacturer logo",
      );
    }

    revalidateMediaPaths();
    return {
      ok: true,
      duplicateWarning: duplicate
        ? `Duplicate detected — same file used on ${duplicate.entityName}`
        : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Replace failed",
    };
  }
}

export async function setMediaHero(
  kind: MediaAssetKind,
  imageId: string,
): Promise<ActionResult> {
  const auth = await requireEditor();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    if (kind === "lure") {
      const image = await prisma.image.findFirst({
        where: { id: imageId, deletedAt: null },
      });
      if (!image) return { ok: false, error: "Image not found" };

      await prisma.$transaction(async (tx) => {
        await tx.image.updateMany({
          where: { lureModelId: image.lureModelId, role: "HERO", deletedAt: null },
          data: { role: "PRODUCT" },
        });
        await tx.image.update({
          where: { id: imageId },
          data: { role: "HERO", sortOrder: 0 },
        });
      });

      await auditLureMedia(auth, image.lureModelId, imageId, "Set lure cover image");
      revalidatePath(`/studio/products/${image.lureModelId}`);
    } else if (kind === "species") {
      const image = await prisma.speciesImage.findFirst({
        where: { id: imageId, deletedAt: null },
      });
      if (!image) return { ok: false, error: "Image not found" };

      await prisma.$transaction(async (tx) => {
        await tx.speciesImage.updateMany({
          where: {
            fishSpeciesId: image.fishSpeciesId,
            role: "HERO",
            deletedAt: null,
          },
          data: { role: "GALLERY" },
        });
        await tx.speciesImage.update({
          where: { id: imageId },
          data: { role: "HERO", sortOrder: 0 },
        });
      });

      await auditGenericMedia(auth, "species_image", imageId, "Set species hero image");
    } else {
      return { ok: false, error: "Manufacturer logos are replaced as a single asset" };
    }

    revalidateMediaPaths();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Hero update failed",
    };
  }
}

export async function updateMediaMetadata(
  kind: MediaAssetKind,
  imageId: string,
  metadata: MediaMetadataInput,
): Promise<ActionResult> {
  const auth = await requireEditor();
  if (isUnauthorizedResult(auth)) return auth;

  const meta = metadataFields(metadata);

  try {
    if (kind === "lure") {
      const existing = await prisma.image.findFirst({
        where: { id: imageId, deletedAt: null },
      });
      if (!existing) return { ok: false, error: "Image not found" };

      await prisma.image.update({
        where: { id: imageId },
        data: meta,
      });
      await auditLureMedia(
        auth,
        existing.lureModelId,
        imageId,
        "Updated lure media metadata",
      );
      revalidatePath(`/studio/products/${existing.lureModelId}`);
    } else if (kind === "species") {
      const existing = await prisma.speciesImage.findFirst({
        where: { id: imageId, deletedAt: null },
      });
      if (!existing) return { ok: false, error: "Image not found" };

      await prisma.speciesImage.update({
        where: { id: imageId },
        data: meta,
      });
      await auditGenericMedia(
        auth,
        "species_image",
        imageId,
        "Updated species media metadata",
      );
    } else {
      const existing = await prisma.manufacturerImage.findFirst({
        where: { id: imageId, deletedAt: null },
      });
      if (!existing) return { ok: false, error: "Image not found" };

      await prisma.manufacturerImage.update({
        where: { id: imageId },
        data: meta,
      });
      await auditGenericMedia(
        auth,
        "manufacturer_image",
        imageId,
        "Updated manufacturer media metadata",
      );
    }

    revalidateMediaPaths();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Save failed",
    };
  }
}

export async function computeSha256ForRemoteUrl(
  url: string,
): Promise<{ ok: true; sha256Hash: string } | { ok: false; error: string }> {
  const auth = await requireEditor();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const { bytes, contentType } = await fetchRemoteImageBytes(url.trim());
    if (!isAllowedImageContentType(contentType)) {
      return { ok: false, error: "URL does not point to a supported image type" };
    }
    const stored = await storeMediaBytes({
      bytes,
      contentType,
      sourceUrl: url.trim(),
    });
    return { ok: true, sha256Hash: stored.sha256Hash };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Hash failed",
    };
  }
}

export { lureHasEditorCover, speciesHasEditorHero };

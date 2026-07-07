import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  fetchRemoteImageBytes,
} from "@/modules/studio/media/lib/media-storage";
import {
  extensionFromContentType,
  extensionFromUrl,
  sha256Hex,
} from "@/modules/studio/media/lib/image-bytes";
import {
  processMediaBytes,
  variantPathFromOriginal,
} from "@/modules/studio/media/lib/media-processor";
import type { MediaMetadataInput } from "@/modules/studio/media/types";
import { isRemoteImageUrl } from "@/modules/import/images/persist-import-image";
import { MediaAssetVariantKind } from "@/generated/prisma/client";

export type EnsuredMediaAsset = {
  mediaAssetId: string;
  sha256Hash: string;
  publicUrl: string;
  sourceUrl: string | null;
  widthPx: number | null;
  heightPx: number | null;
  sizeBytes: number;
  mimeType: string;
  created: boolean;
  variantPaths: Partial<Record<MediaAssetVariantKind, string>>;
};

type EnsureMediaAssetInput = {
  bytes?: Buffer;
  remoteUrl?: string;
  localPath?: string;
  contentType?: string;
  manufacturerId?: string | null;
  metadata?: MediaMetadataInput;
  fetchFn?: typeof fetch;
  db?: Pick<PrismaClient, "mediaAsset" | "mediaAssetVariant">;
};

function metadataToAssetFields(metadata?: MediaMetadataInput) {
  return {
    creditEn: metadata?.creditEn?.trim() || null,
    creditTr: metadata?.creditTr?.trim() || null,
    photographerEn: metadata?.photographerEn?.trim() || null,
    photographerTr: metadata?.photographerTr?.trim() || null,
    copyrightEn: metadata?.copyrightEn?.trim() || null,
    copyrightTr: metadata?.copyrightTr?.trim() || null,
    licenseNoteEn: metadata?.licenseNoteEn?.trim() || null,
    licenseNoteTr: metadata?.licenseNoteTr?.trim() || null,
  };
}

async function readLocalMediaBytes(localPath: string): Promise<{
  bytes: Buffer;
  contentType: string;
}> {
  const trimmed = localPath.trim();
  const relative = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  const absolutePath = join(process.cwd(), "public", relative);
  const bytes = await readFile(absolutePath);
  const ext = trimmed.split(".").pop()?.toLowerCase();
  const contentType =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : ext === "gif"
          ? "image/gif"
          : ext === "svg"
            ? "image/svg+xml"
            : "image/jpeg";
  return { bytes, contentType };
}

function buildVariantMap(
  originalPath: string,
  variantRecords: Array<{ kind: MediaAssetVariantKind; publicPath: string }>,
): Partial<Record<MediaAssetVariantKind, string>> {
  const map: Partial<Record<MediaAssetVariantKind, string>> = {
    [MediaAssetVariantKind.ORIGINAL]: originalPath,
  };
  for (const variant of variantRecords) {
    map[variant.kind] = variant.publicPath;
  }
  for (const kind of [
    MediaAssetVariantKind.LARGE,
    MediaAssetVariantKind.MEDIUM,
    MediaAssetVariantKind.THUMBNAIL,
    MediaAssetVariantKind.WEBP,
  ] as const) {
    map[kind] ??= variantPathFromOriginal(originalPath, kind);
  }
  return map;
}

/** Ensure a managed MediaAsset exists for bytes or a remote/local source. */
export async function ensureMediaAsset(
  input: EnsureMediaAssetInput,
): Promise<EnsuredMediaAsset> {
  const db = input.db ?? prisma;
  let bytes = input.bytes;
  let contentType = input.contentType ?? "application/octet-stream";
  let sourceUrl: string | null = input.remoteUrl?.trim() || null;

  if (!bytes && input.remoteUrl?.trim()) {
    const fetched = await fetchRemoteImageBytes(
      input.remoteUrl.trim(),
      input.fetchFn,
    );
    bytes = fetched.bytes;
    contentType = fetched.contentType;
    sourceUrl = input.remoteUrl.trim();
  }

  if (!bytes && input.localPath?.trim()) {
    const local = await readLocalMediaBytes(input.localPath.trim());
    bytes = local.bytes;
    contentType = local.contentType;
    sourceUrl = sourceUrl ?? input.localPath.trim();
  }

  if (!bytes) {
    throw new Error("ensureMediaAsset requires bytes, remoteUrl, or localPath");
  }

  const sha256Hash = sha256Hex(bytes);
  const existing = await db.mediaAsset.findUnique({
    where: { sha256Hash },
    include: { variants: true },
  });

  if (existing) {
    const originalVariant =
      existing.variants.find((v) => v.kind === MediaAssetVariantKind.ORIGINAL) ??
      existing.variants[0];
    const publicUrl =
      originalVariant?.publicPath ??
      `/media/${sha256Hash}${extensionFromContentType(existing.mimeType)}`;

    return {
      mediaAssetId: existing.id,
      sha256Hash: existing.sha256Hash,
      publicUrl,
      sourceUrl: existing.originalUrl ?? sourceUrl,
      widthPx: existing.widthPx,
      heightPx: existing.heightPx,
      sizeBytes: existing.sizeBytes,
      mimeType: existing.mimeType,
      created: false,
      variantPaths: buildVariantMap(publicUrl, existing.variants),
    };
  }

  const processed = await processMediaBytes({ bytes, contentType });
  const assetFields = metadataToAssetFields(input.metadata);

  const created = await db.mediaAsset.create({
    data: {
      sha256Hash: processed.sha256Hash,
      originalUrl: sourceUrl,
      mimeType: processed.mimeType,
      widthPx: processed.widthPx,
      heightPx: processed.heightPx,
      sizeBytes: processed.sizeBytes,
      manufacturerId: input.manufacturerId ?? null,
      ...assetFields,
      variants: {
        create: processed.variants.map((variant) => ({
          kind: variant.kind,
          publicPath: variant.publicPath,
          mimeType: variant.mimeType,
          widthPx: variant.widthPx,
          heightPx: variant.heightPx,
          sizeBytes: variant.sizeBytes,
        })),
      },
    },
    include: { variants: true },
  });

  const originalVariant =
    created.variants.find((v) => v.kind === MediaAssetVariantKind.ORIGINAL) ??
    created.variants[0]!;
  const publicUrl = originalVariant.publicPath;

  return {
    mediaAssetId: created.id,
    sha256Hash: created.sha256Hash,
    publicUrl,
    sourceUrl: created.originalUrl,
    widthPx: created.widthPx,
    heightPx: created.heightPx,
    sizeBytes: created.sizeBytes,
    mimeType: created.mimeType,
    created: true,
    variantPaths: buildVariantMap(publicUrl, created.variants),
  };
}

export async function ensureMediaAssetFromUrl(
  url: string,
  options: Omit<EnsureMediaAssetInput, "remoteUrl" | "localPath" | "bytes"> = {},
): Promise<EnsuredMediaAsset> {
  const trimmed = url.trim();
  if (isRemoteImageUrl(trimmed)) {
    return ensureMediaAsset({ ...options, remoteUrl: trimmed });
  }
  if (trimmed.startsWith("/media/") || trimmed.startsWith("/lures/")) {
    return ensureMediaAsset({ ...options, localPath: trimmed });
  }
  return ensureMediaAsset({
    ...options,
    remoteUrl: trimmed,
    fetchFn: options.fetchFn,
  });
}

export function resolvePublicImagePath(
  url: string,
  preferredVariant: MediaAssetVariantKind = MediaAssetVariantKind.MEDIUM,
): string {
  const trimmed = url.trim();
  if (isRemoteImageUrl(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith("/lures/")) {
    return trimmed;
  }
  if (trimmed.startsWith("/media/")) {
    return variantPathFromOriginal(trimmed, preferredVariant);
  }
  return trimmed;
}

export function hashFromPublicMediaPath(url: string): string | null {
  const match = url.trim().match(/^\/media\/([a-f0-9]{64})(?:[.-][^/]+)?(?:\.[^./]+)?$/i);
  return match?.[1] ?? null;
}

export async function inferContentTypeFromUrl(url: string): Promise<string> {
  const ext = extensionFromUrl(url);
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".svg") return "image/svg+xml";
  return "image/jpeg";
}

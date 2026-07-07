import { mkdir, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import {
  extensionFromContentType,
  extensionFromUrl,
  sha256Hex,
} from "@/modules/studio/media/lib/image-bytes";
import type { StoredMediaFile } from "@/modules/studio/media/types";
import { ensureMediaAsset } from "@/modules/studio/media/lib/media-asset-service";

function resolvePublicMediaDir(): string {
  return join(process.cwd(), "public", "media");
}

/** @deprecated Prefer ensureMediaAsset — kept for legacy callers during migration. */
export async function storeMediaBytes(input: {
  bytes: Buffer;
  contentType: string;
  sourceUrl?: string | null;
  manufacturerId?: string | null;
}): Promise<StoredMediaFile> {
  const asset = await ensureMediaAsset({
    bytes: input.bytes,
    contentType: input.contentType,
    remoteUrl: input.sourceUrl ?? undefined,
    manufacturerId: input.manufacturerId ?? null,
  });

  return {
    publicUrl: asset.publicUrl,
    sha256Hash: asset.sha256Hash,
    contentType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    sourceUrl: asset.sourceUrl,
    mediaAssetId: asset.mediaAssetId,
  };
}

export async function fetchRemoteImageBytes(
  url: string,
  fetchFn: typeof fetch = fetch,
): Promise<{ bytes: Buffer; contentType: string }> {
  const response = await fetchFn(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Image download failed (${response.status})`);
  }

  const contentType =
    response.headers.get("content-type") ?? "application/octet-stream";
  const bytes = Buffer.from(await response.arrayBuffer());
  return { bytes, contentType };
}

export async function storeMediaFromUrl(
  url: string,
  fetchFn: typeof fetch = fetch,
  manufacturerId?: string | null,
): Promise<StoredMediaFile> {
  const trimmed = url.trim();
  const { bytes, contentType } = await fetchRemoteImageBytes(trimmed, fetchFn);
  const extension =
    extensionFromUrl(trimmed) ?? extensionFromContentType(contentType);
  const stored = await storeMediaBytes({
    bytes,
    contentType: contentType || `image/${extension.replace(".", "")}`,
    sourceUrl: trimmed,
    manufacturerId,
  });
  return stored;
}

/** Write raw bytes without optimization — internal fallback only. */
export async function writeRawMediaBytes(input: {
  bytes: Buffer;
  contentType: string;
}): Promise<{ publicUrl: string; sha256Hash: string }> {
  const sha256Hash = sha256Hex(input.bytes);
  const extension = extensionFromContentType(input.contentType);
  const fileName = `${sha256Hash}${extension}`;
  const mediaDir = resolvePublicMediaDir();
  await mkdir(mediaDir, { recursive: true });

  const absolutePath = join(mediaDir, fileName);
  try {
    await access(absolutePath, constants.F_OK);
  } catch {
    await writeFile(absolutePath, input.bytes);
  }

  return { publicUrl: `/media/${fileName}`, sha256Hash };
}

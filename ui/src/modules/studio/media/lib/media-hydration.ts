import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isLocalPublicImagePath,
  isRemoteImageUrl,
} from "@/modules/import/images/persist-import-image";
import { ensureMediaAssetFromUrl } from "@/modules/studio/media/lib/media-asset-service";

export type MediaHydrationResult = {
  downloaded: number;
  skipped: number;
  failed: number;
  errors: string[];
};

function resolveRemoteSource(url: string, sourceUrl: string | null): string | null {
  if (isRemoteImageUrl(url)) return url.trim();
  if (sourceUrl && isRemoteImageUrl(sourceUrl)) return sourceUrl.trim();
  return null;
}

/** Download remote images for a lure model and link local MediaAsset records. */
export async function hydrateLureModelMediaLocal(
  lureModelId: string,
  options: {
    manufacturerId?: string | null;
    db?: Pick<PrismaClient, "image" | "lureModel">;
  } = {},
): Promise<MediaHydrationResult> {
  const db = options.db ?? prisma;
  const model = await db.lureModel.findUnique({
    where: { id: lureModelId },
    select: { manufacturerId: true },
  });
  const manufacturerId = options.manufacturerId ?? model?.manufacturerId ?? null;

  const images = await db.image.findMany({
    where: { lureModelId, deletedAt: null },
    orderBy: { sortOrder: "asc" },
  });

  const result: MediaHydrationResult = {
    downloaded: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (const image of images) {
    const remoteSource = resolveRemoteSource(image.url, image.sourceUrl);

    if (!remoteSource && isLocalPublicImagePath(image.url) && image.mediaAssetId) {
      result.skipped += 1;
      continue;
    }

    if (!remoteSource && isLocalPublicImagePath(image.url)) {
      result.skipped += 1;
      continue;
    }

    if (!remoteSource) {
      result.skipped += 1;
      continue;
    }

    if (
      isLocalPublicImagePath(image.url) &&
      image.mediaAssetId &&
      image.sourceUrl === remoteSource
    ) {
      result.skipped += 1;
      continue;
    }

    try {
      const asset = await ensureMediaAssetFromUrl(remoteSource, {
        manufacturerId,
      });
      await db.image.update({
        where: { id: image.id },
        data: {
          url: asset.publicUrl,
          sourceUrl: remoteSource,
          sha256Hash: asset.sha256Hash,
          mediaAssetId: asset.mediaAssetId,
          mimeType: asset.mimeType,
          widthPx: asset.widthPx,
          heightPx: asset.heightPx,
        },
      });
      result.downloaded += 1;
    } catch (error) {
      result.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`${image.id}: ${message}`);
    }
  }

  return result;
}

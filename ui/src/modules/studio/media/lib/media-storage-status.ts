import { MediaAssetVariantKind } from "@/generated/prisma/client";
import { isRemoteImageUrl } from "@/modules/import/images/persist-import-image";

export type MediaStorageStatus =
  | "remote"
  | "downloaded"
  | "optimized"
  | "missing"
  | "broken";

type StatusInput = {
  url: string;
  mediaAssetId?: string | null;
  variantKinds?: Set<MediaAssetVariantKind>;
  fileExists?: boolean;
};

export function resolveMediaStorageStatus(input: StatusInput): MediaStorageStatus {
  if (isRemoteImageUrl(input.url)) {
    return "remote";
  }

  if (input.url.startsWith("/media/")) {
    if (input.fileExists === false) {
      return "broken";
    }
    if (input.fileExists === undefined && !input.mediaAssetId) {
      return "missing";
    }
    const kinds = input.variantKinds ?? new Set<MediaAssetVariantKind>();
    const hasOptimized =
      kinds.has(MediaAssetVariantKind.THUMBNAIL) &&
      kinds.has(MediaAssetVariantKind.WEBP) &&
      kinds.has(MediaAssetVariantKind.MEDIUM);
    if (hasOptimized) {
      return "optimized";
    }
    if (input.mediaAssetId || input.fileExists) {
      return "downloaded";
    }
    return "missing";
  }

  if (input.url.startsWith("/lures/")) {
    return input.fileExists === false ? "broken" : "downloaded";
  }

  return "missing";
}

export function isPublishedLifecycle(
  lifecycleState: string | null | undefined,
): boolean {
  return lifecycleState === "PUBLISHED" || lifecycleState === "READY";
}

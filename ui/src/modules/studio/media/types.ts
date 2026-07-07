export type MediaAssetKind = "lure" | "species" | "manufacturer";

export type MediaMetadataInput = {
  altTextEn?: string;
  altTextTr?: string;
  creditEn?: string;
  creditTr?: string;
  photographerEn?: string;
  photographerTr?: string;
  copyrightEn?: string;
  copyrightTr?: string;
  licenseNoteEn?: string;
  licenseNoteTr?: string;
};

export type MediaDuplicateRef = {
  kind: MediaAssetKind;
  id: string;
  entityName: string;
};

export type MediaLibraryRow = {
  id: string;
  kind: MediaAssetKind;
  entityId: string;
  entitySlug: string;
  entityName: string;
  url: string;
  sourceUrl: string | null;
  sha256Hash: string | null;
  mediaAssetId: string | null;
  role: string;
  altTextEn: string | null;
  altTextTr: string | null;
  creditEn: string | null;
  creditTr: string | null;
  copyrightEn: string | null;
  copyrightTr: string | null;
  sortOrder: number;
  createdAt: Date;
  duplicateOf: MediaDuplicateRef | null;
  storageStatus: "remote" | "downloaded" | "optimized" | "missing" | "broken";
  referenceCount: number;
};

export type MediaLibraryFilter = {
  kind?: MediaAssetKind | "all";
  limit?: number;
};

export type StoredMediaFile = {
  publicUrl: string;
  sha256Hash: string;
  contentType: string;
  sizeBytes: number;
  sourceUrl: string | null;
  mediaAssetId?: string;
};

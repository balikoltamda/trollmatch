import type { AppLocale } from "@/i18n/routing";
import type { EditorNoteConfidence } from "@/generated/prisma/client";

export type LocalizedAuthorString = Record<AppLocale, string>;

/** Future author profiles — editorial notes will reference `authorSlug`. */
export type AuthorProfile = {
  slug: string;
  name: LocalizedAuthorString;
  role: LocalizedAuthorString;
  organizationSlug: "balik-oltamda";
  bio: LocalizedAuthorString;
  /** Placeholder until per-author pages ship. */
  profileReady: boolean;
};

export type EditorialAttribution = {
  authorSlug: string;
  reviewedAt: string | null;
  confidence: EditorNoteConfidence | null;
};

export type InformationSourceType =
  | "manufacturer"
  | "editorial"
  | "community"
  | "ai";

export type EditorialNotePreview = {
  summary: LocalizedAuthorString;
  confidence: EditorNoteConfidence;
  updatedAt: string;
  authorSlug: string;
};

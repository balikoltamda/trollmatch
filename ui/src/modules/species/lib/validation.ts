import type { ContentLifecycleState, IucnRedListStatus } from "@/generated/prisma/client";
import { z } from "zod";

const optionalText = z.string().max(10000);
const optionalShort = z.string().max(512);

export const speciesCoreSchema = z.object({
  scientificName: z.string().trim().min(2).max(256),
  nameEn: z.string().trim().min(1).max(256),
  nameTr: z.string().trim().min(1).max(256),
  slugEn: z
    .string()
    .trim()
    .min(2)
    .max(128)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "English slug must be lowercase ASCII"),
  slugTr: z.string().trim().min(2).max(128),
  editorialNotesEn: optionalText,
  editorialNotesTr: optionalText,
});

export const speciesProfileSchema = z.object({
  descriptionEn: optionalText,
  descriptionTr: optionalText,
  habitatEn: optionalText,
  habitatTr: optionalText,
  distributionEn: optionalText,
  distributionTr: optionalText,
  depthMinM: optionalShort,
  depthMaxM: optionalShort,
  spawningEn: optionalText,
  spawningTr: optionalText,
  maxLengthCm: optionalShort,
  maxWeightG: optionalShort,
  conservationEn: optionalText,
  conservationTr: optionalText,
  iucnStatus: z
    .enum([
      "EX",
      "EW",
      "CR",
      "EN",
      "VU",
      "NT",
      "LC",
      "DD",
      "NE",
    ] as [IucnRedListStatus, ...IucnRedListStatus[]])
    .nullable()
    .optional(),
  lifecycleState: z.enum([
    "DRAFT",
    "PENDING_REVIEW",
    "READY",
    "PUBLISHED",
    "DEPRECATED",
    "REJECTED",
    "ARCHIVED",
  ] as [ContentLifecycleState, ...ContentLifecycleState[]]),
});

export const speciesEditorNoteSchema = z.object({
  mediterraneanNotesEn: optionalText,
  mediterraneanNotesTr: optionalText,
  aegeanNotesEn: optionalText,
  aegeanNotesTr: optionalText,
  northernCyprusNotesEn: optionalText,
  northernCyprusNotesTr: optionalText,
  internalNotes: optionalText,
});

export const speciesAliasInputSchema = z.object({
  alias: z.string().trim().min(1).max(256),
  kind: z.enum(["SEARCH_TERM", "REGIONAL_NAME", "MISSPELLING", "SYNONYM"]),
});

export const speciesConfusionInputSchema = z.object({
  confusedWithSpeciesId: z.string().uuid(),
  misappliedNameEn: optionalShort,
  misappliedNameTr: optionalShort,
  reasonEn: z.string().trim().min(1).max(2000),
  reasonTr: z.string().trim().min(1).max(2000),
});

export const speciesSaveSchema = speciesCoreSchema.extend({
  profile: speciesProfileSchema,
  editorNote: speciesEditorNoteSchema,
  regionIds: z.array(z.string().uuid()),
  techniqueIds: z.array(z.string().uuid()),
  aliases: z.array(speciesAliasInputSchema),
});

export type SpeciesSaveInput = z.infer<typeof speciesSaveSchema>;

export const speciesCreateSchema = speciesSaveSchema;

export const speciesImageMetadataSchema = z.object({
  altTextEn: optionalShort,
  altTextTr: optionalShort,
  creditEn: optionalShort,
  creditTr: optionalShort,
  photographerEn: optionalShort,
  photographerTr: optionalShort,
  copyrightEn: optionalShort,
  copyrightTr: optionalShort,
});

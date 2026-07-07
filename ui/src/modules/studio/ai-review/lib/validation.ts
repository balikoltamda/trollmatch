import { z } from "zod";

export const speciesSeedSchema = z
  .object({
    nameTr: z.string().trim().optional(),
    nameEn: z.string().trim().optional(),
    scientificName: z.string().trim().optional(),
  })
  .refine(
    (data) =>
      Boolean(data.nameTr?.length || data.nameEn?.length || data.scientificName?.length),
    { message: "Enter at least one of: Turkish name, English name, or scientific name" },
  );

export const techniqueSeedSchema = z
  .object({
    nameTr: z.string().trim().optional(),
    nameEn: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.nameTr?.length || data.nameEn?.length), {
    message: "Enter at least one technique name",
  });

export const manufacturerSeedSchema = z
  .object({
    nameEn: z.string().trim().optional(),
    nameTr: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.nameEn?.length || data.nameTr?.length), {
    message: "Enter at least one manufacturer name",
  });

export const lureSeedSchema = z.object({
  nameEn: z.string().trim().optional(),
  nameTr: z.string().trim().optional(),
  manufacturerSlug: z.string().trim().optional(),
});

export const knowledgeSourceSeedSchema = z
  .object({
    title: z.string().trim().optional(),
    url: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.title?.length || data.url?.length), {
    message: "Enter a title or URL",
  });

export const regionSeedSchema = z
  .object({
    nameEn: z.string().trim().optional(),
    nameTr: z.string().trim().optional(),
    code: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.nameEn?.length || data.nameTr?.length || data.code?.length), {
    message: "Enter at least one region identifier",
  });

export const catchReportSeedSchema = z.object({
  reportId: z.string().uuid().optional(),
  techniqueId: z.string().uuid().optional(),
});

export const acceptSuggestionSchema = z.object({
  suggestionId: z.string().uuid(),
  editedValue: z.string().optional(),
});

import { z } from "zod";

export const regionEditSchema = z.object({
  nameEn: z.string().trim().min(1, "English name is required").max(256),
  nameTr: z.string().trim().min(1, "Turkish name is required").max(256),
  descriptionEn: z.string().trim().max(10000).optional().default(""),
  descriptionTr: z.string().trim().max(10000).optional().default(""),
  displayOrder: z.coerce.number().int().min(0).max(9999),
  isActive: z.boolean(),
});

export type RegionEditSchema = z.infer<typeof regionEditSchema>;

import type { Prisma } from "@/generated/prisma/client";
import { PUBLIC_LURE_WHERE } from "@/modules/discovery/lib/public-visibility";

export function buildPublicLureWhere(
  filters: { q?: string | null; species?: string | null } = {},
): Prisma.LureModelWhereInput {
  const where: Prisma.LureModelWhereInput = { ...PUBLIC_LURE_WHERE };

  if (filters.species?.trim()) {
    where.lureSpeciesLinks = {
      some: {
        deletedAt: null,
        fishSpecies: {
          slug: filters.species.trim(),
          deletedAt: null,
        },
      },
    };
  }

  const q = filters.q?.trim();
  if (q) {
    where.AND = [
      {
        OR: [
          { nameEn: { contains: q, mode: "insensitive" } },
          { nameTr: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          {
            aliases: {
              some: {
                alias: { contains: q, mode: "insensitive" },
                deletedAt: null,
              },
            },
          },
          {
            manufacturer: {
              OR: [
                { nameEn: { contains: q, mode: "insensitive" } },
                { nameTr: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
              ],
              deletedAt: null,
            },
          },
          {
            lureTechniques: {
              some: {
                deletedAt: null,
                technique: {
                  OR: [
                    { nameEn: { contains: q, mode: "insensitive" } },
                    { nameTr: { contains: q, mode: "insensitive" } },
                    { slug: { contains: q, mode: "insensitive" } },
                  ],
                  deletedAt: null,
                },
              },
            },
          },
          {
            lureSpeciesLinks: {
              some: {
                deletedAt: null,
                fishSpecies: {
                  OR: [
                    { nameEn: { contains: q, mode: "insensitive" } },
                    { nameTr: { contains: q, mode: "insensitive" } },
                    { slug: { contains: q, mode: "insensitive" } },
                    {
                      aliases: {
                        some: {
                          alias: { contains: q, mode: "insensitive" },
                          deletedAt: null,
                        },
                      },
                    },
                  ],
                  deletedAt: null,
                },
              },
            },
          },
        ],
      },
    ];
  }

  return where;
}

/** Registry code → database manufacturer slug (codes may differ from slugs). */
export const IMPORTER_SLUG_BY_CODE: Record<string, string> = {
  duel: "duel",
  yozuri: "yo-zuri",
  halco: "halco",
  maria: "maria",
  shimano: "shimano",
  daiwa: "daiwa",
  jackson: "jackson",
};

export function resolveImporterSlug(code: string): string {
  return IMPORTER_SLUG_BY_CODE[code] ?? code;
}

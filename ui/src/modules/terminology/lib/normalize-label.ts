/**
 * Normalize a term label for search matching and deduplication.
 * Used by future search, importers, and Studio — not wired in Sprint 7.2.
 */

export function normalizeTermLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

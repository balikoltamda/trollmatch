import { DUEL_SITE_ORIGIN } from "@/modules/import/providers/duel/parser.types";

export type ManufacturerProductSource =
  | {
      kind: "duel_pid";
      pid: string;
      url: string;
    }
  | {
      kind: "unsupported";
      reason: string;
    };

export function duelProductUrl(pid: string): string {
  return `${DUEL_SITE_ORIGIN}/english/products/detail.html?pid=${pid}`;
}

export function extractDuelPidFromAliases(
  aliases: Array<{ alias: string }>,
): string | null {
  const match = aliases.find((row) => row.alias.startsWith("duel:pid:"));
  return match?.alias.replace(/^duel:pid:/, "") ?? null;
}

/** Resolve live manufacturer page identity for a catalog product. */
export function resolveManufacturerProductSource(input: {
  manufacturerSlug: string;
  aliases: Array<{ alias: string }>;
}): ManufacturerProductSource {
  if (input.manufacturerSlug === "duel") {
    const pid = extractDuelPidFromAliases(input.aliases);
    if (!pid) {
      return {
        kind: "unsupported",
        reason: "No duel:pid alias — product was not imported from DUEL catalog.",
      };
    }
    return { kind: "duel_pid", pid, url: duelProductUrl(pid) };
  }

  return {
    kind: "unsupported",
    reason: `Single-product refresh is not yet wired for ${input.manufacturerSlug}. Re-import via Import Center or run backfill.`,
  };
}

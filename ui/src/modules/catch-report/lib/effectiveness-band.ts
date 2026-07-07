import type { CommunityStatistics } from "@/modules/lure/types/lure-detail";

/** Evidence volume from approved catch reports — not sentiment (reports have no rating field). */
export function deriveEffectivenessBand(
  approvedReportCount: number,
): CommunityStatistics["effectivenessBand"] {
  if (approvedReportCount < 3) return "insufficient_data";
  if (approvedReportCount < 8) return "low";
  if (approvedReportCount < 20) return "moderate";
  return "high";
}

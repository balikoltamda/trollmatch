import type {
  AiInsight,
  ChangeHistoryEntry,
  CommunityStatistics,
  LureSpecies,
  LureSpecifications,
  LureTechnique,
  RelatedLure,
  SponsoredLink,
  TrollingInfo,
  VerificationStatus,
} from "@/modules/lure/types/lure-detail";

/**
 * UI sections not yet persisted in the LureAtlas catalog schema.
 * Keyed by LureModel.slug (matches imported catalog records).
 */
export type LureDetailEnrichment = {
  verificationStatus: VerificationStatus;
  lastVerifiedAt: string;
  specifications: Pick<
    LureSpecifications,
    "divingDepthM" | "buoyancy" | "action" | "bodyType" | "coatingType"
  >;
  recommendedSpecies?: LureSpecies[];
  recommendedTechniques?: LureTechnique[];
  trolling?: TrollingInfo;
  communityStatistics: CommunityStatistics;
  aiInsights: AiInsight;
  relatedLures: RelatedLure[];
  sponsoredLinks: SponsoredLink[];
  changeHistory: ChangeHistoryEntry[];
};

const LASER_PRO_190_DD: LureDetailEnrichment = {
  verificationStatus: "moderator_verified",
  lastVerifiedAt: "2025-11-14T09:00:00.000Z",
  specifications: {
    divingDepthM: { min: 5, max: 7 },
    buoyancy: {
      tr: "Yüzen",
      en: "Floating",
    },
    action: {
      tr: "Geniş yuvarlanma (rolling)",
      en: "Wide rolling action",
    },
  },
  recommendedSpecies: [
    {
      id: "yellowfin-tuna",
      name: { tr: "Sarıkanat ton balığı", en: "Yellowfin tuna" },
      kind: "curated",
    },
    {
      id: "wahoo",
      name: { tr: "Wahoo", en: "Wahoo" },
      kind: "curated",
    },
    {
      id: "dorado",
      name: { tr: "Lampuka", en: "Dorado" },
      kind: "marketing",
    },
    {
      id: "striped-marlin",
      name: { tr: "Çizgili marlin", en: "Striped marlin" },
      kind: "community",
    },
  ],
  recommendedTechniques: [
    {
      id: "offshore-trolling",
      name: { tr: "Açık deniz trolling", en: "Offshore trolling" },
    },
    {
      id: "downrigger-trolling",
      name: { tr: "Downrigger trolling", en: "Downrigger trolling" },
    },
    {
      id: "flat-line-trolling",
      name: { tr: "Flat line trolling", en: "Flat-line trolling" },
    },
  ],
  trolling: {
    speedKnots: { min: 4, max: 7 },
    leader: {
      tr: "150 lb monofilament veya fluoro, 2–3 m",
      en: "150 lb mono or fluoro, 2–3 m",
    },
    mainLine: {
      tr: "30–50 lb braid veya monofilament",
      en: "30–50 lb braid or monofilament",
    },
    notes: {
      tr: "Fabrika derinliği ~7 m; downrigger ile hedef derinlik genişletilebilir. Sabit hızda geniş rolling aksiyon.",
      en: "Factory depth ~7 m; downrigger extends target depth. Wide rolling action at steady speed.",
    },
  },
  communityStatistics: {
    usageAssertionCount: 47,
    verifiedCatchReportCount: 23,
    effectivenessBand: "high",
    topRegions: [
      { tr: "Doğu Akdeniz", en: "Eastern Mediterranean" },
      { tr: "Hint Okyanusu (batı)", en: "Western Indian Ocean" },
      { tr: "Avustralya batı kıyısı", en: "Western Australia coast" },
    ],
  },
  aiInsights: {
    summary: {
      tr: "Yayınlanmış kayıtlara göre Laser Pro 190 DD, açık deniz trolling ve pelagik avcılıkta sık referans verilen bir derin dalar minnow. Topluluk raporları en yüksek etkinliği sarıkanat ve wahoo ile ilişkilendiriyor.",
      en: "Based on published records, the Laser Pro 190 DD is a frequently referenced deep-diving minnow for offshore trolling and pelagic fishing. Community reports associate highest effectiveness with yellowfin tuna and wahoo.",
    },
    corpusDate: "2026-06-01",
    citations: [
      {
        tr: "47 onaylı kullanım iddiası · 23 doğrulanmış av raporu",
        en: "47 approved usage assertions · 23 verified catch reports",
      },
      {
        tr: "Halco 2024 basın materyali (moderatör doğrulandı)",
        en: "Halco 2024 press materials (moderator verified)",
      },
    ],
  },
  relatedLures: [
    {
      slug: "halco-laser-pro-160-dd",
      manufacturer: { tr: "Halco", en: "Halco" },
      modelName: { tr: "Laser Pro 160 DD", en: "Laser Pro 160 DD" },
      formFactor: {
        tr: "Derin dalar minnow",
        en: "Deep-diving minnow",
      },
      imageSrc: "/lures/placeholder.svg",
    },
    {
      slug: "rapala-x-rap-magnum-30",
      manufacturer: { tr: "Rapala", en: "Rapala" },
      modelName: { tr: "X-Rap Magnum 30", en: "X-Rap Magnum 30" },
      formFactor: {
        tr: "Derin dalar minnow",
        en: "Deep-diving minnow",
      },
      imageSrc: "/lures/placeholder.svg",
    },
    {
      slug: "nomad-dtx-minnow-220",
      manufacturer: { tr: "Nomad Design", en: "Nomad Design" },
      modelName: { tr: "DTX Minnow 220", en: "DTX Minnow 220" },
      formFactor: {
        tr: "Derin dalar minnow",
        en: "Deep-diving minnow",
      },
      imageSrc: "/lures/placeholder.svg",
    },
  ],
  sponsoredLinks: [
    {
      retailer: { tr: "Balık Oltamda", en: "Balık Oltamda" },
      disclosure: {
        tr: "Sponsorlu bağlantı — sıralamayı etkilemez",
        en: "Sponsored link — does not affect ranking",
      },
    },
    {
      retailer: { tr: "Örnek perakendeci", en: "Example retailer" },
      disclosure: {
        tr: "Sponsorlu bağlantı — sıralamayı etkilemez",
        en: "Sponsored link — does not affect ranking",
      },
    },
  ],
  changeHistory: [
    {
      date: "2025-11-14",
      description: {
        tr: "Fabrika dalış derinliği moderatör tarafından doğrulandı",
        en: "Factory diving depth verified by moderator",
      },
      actor: { tr: "Moderatör", en: "Moderator" },
    },
    {
      date: "2025-09-02",
      description: {
        tr: "H81 Green Mackerel varyantı eklendi",
        en: "H81 Green Mackerel variant added",
      },
      actor: { tr: "İçerik editörü", en: "Content editor" },
    },
    {
      date: "2025-06-18",
      description: {
        tr: "İlk yayın — Halco 2024 katalog kaynağı",
        en: "Initial publication — Halco 2024 catalog source",
      },
      actor: { tr: "İçerik editörü", en: "Content editor" },
    },
  ],
};

export const LURE_DETAIL_ENRICHMENTS: Record<string, LureDetailEnrichment> = {
  "laser-pro-190-dd": LASER_PRO_190_DD,
};

export function getLureDetailEnrichment(
  slug: string,
  updatedAt: Date,
): LureDetailEnrichment {
  const known = LURE_DETAIL_ENRICHMENTS[slug];
  if (known) {
    return known;
  }

  return createDefaultEnrichment(updatedAt);
}

function createDefaultEnrichment(updatedAt: Date): LureDetailEnrichment {
  const empty = { tr: "", en: "" };

  return {
    verificationStatus: "unverified",
    lastVerifiedAt: updatedAt.toISOString(),
    specifications: {},
    trolling: undefined,
    communityStatistics: {
      usageAssertionCount: 0,
      verifiedCatchReportCount: 0,
      effectivenessBand: "insufficient_data",
      topRegions: [],
    },
    aiInsights: {
      summary: empty,
      corpusDate: updatedAt.toISOString().slice(0, 10),
      citations: [],
    },
    relatedLures: [],
    sponsoredLinks: [],
    changeHistory: [],
  };
}

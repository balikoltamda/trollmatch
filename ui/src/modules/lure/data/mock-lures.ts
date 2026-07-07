import type { LureDetail } from "@/modules/lure/types/lure-detail";

const HALCO_LASER_PRO: LureDetail = {
  slug: "halco-laser-pro-190-dd",
  manufacturer: {
    tr: "Halco",
    en: "Halco",
  },
  productLine: {
    tr: "Laser Pro serisi",
    en: "Laser Pro series",
  },
  modelName: {
    tr: "Laser Pro 190 DD",
    en: "Laser Pro 190 DD",
  },
  formFactor: {
    tr: "Derin dalar minnow / bib crankbait",
    en: "Deep-diving minnow / bibbed crankbait",
  },
  shortDescription: {
    tr: "Offshore trolling ve pelagik türler için tasarlanmış, ~7 m dalış derinliğine sahip büyük bib crankbait.",
    en: "Large-bib crankbait designed for offshore trolling and pelagic species, with a factory-rated dive depth of ~7 m.",
  },
  verificationStatus: "moderator_verified",
  lastVerifiedAt: "2025-11-14T09:00:00.000Z",
  defaultVariantId: "h70-redhead",
  variants: [
    {
      id: "h70-redhead",
      label: {
        tr: "190 mm · H70 Redhead",
        en: "190 mm · H70 Redhead",
      },
      lengthMm: 190,
      weightG: 119,
      colorCode: "H70",
      imageSrc: "/lures/halco-laser-pro-190-dd.svg",
      galleryImages: ["/lures/halco-laser-pro-190-dd.svg"],
    },
    {
      id: "h81-green-mackerel",
      label: {
        tr: "190 mm · H81 Green Mackerel",
        en: "190 mm · H81 Green Mackerel",
      },
      lengthMm: 190,
      weightG: 119,
      colorCode: "H81",
      imageSrc: "/lures/halco-laser-pro-190-dd.svg",
      galleryImages: ["/lures/halco-laser-pro-190-dd.svg"],
    },
    {
      id: "h56-silver-flash",
      label: {
        tr: "190 mm · H56 Silver Flash",
        en: "190 mm · H56 Silver Flash",
      },
      lengthMm: 190,
      weightG: 119,
      colorCode: "H56",
      imageSrc: "/lures/halco-laser-pro-190-dd.svg",
      galleryImages: ["/lures/halco-laser-pro-190-dd.svg"],
    },
  ],
  specifications: {
    lengthMm: 190,
    weightG: 119,
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
  trust: {
    score: 88,
    answer:
      "Published after editorial verification — box specs plus field-tested notes.",
    manufacturerImportedAt: "2025-11-14T09:00:00.000Z",
    editorConfidence: "HIGH",
    published: true,
    communityConsensus: {
      assertions: 47,
      catchReports: 23,
      effectivenessBand: "high",
      summary: "23 verified catch reports · 47 usage assertions · effectiveness: high",
    },
    evidence: [
      "Imported from Halco feed",
      "Editorially verified and published",
      "23 verified catch reports",
    ],
    provenance: [
      { label: "Manufacturer", value: "Halco" },
      { label: "Published", value: "11/14/2025" },
    ],
    lastVerifiedAt: "2025-11-14T09:00:00.000Z",
    editorialReviewPublished: true,
    sourceCount: 4,
  },
  editorialNote: null,
  regionalNotes: null,
};

export const MOCK_LURES: Record<string, LureDetail> = {
  [HALCO_LASER_PRO.slug]: HALCO_LASER_PRO,
};

export const MOCK_LURE_SLUGS = Object.keys(MOCK_LURES);

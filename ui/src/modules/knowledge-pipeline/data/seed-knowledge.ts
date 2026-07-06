import type { KnowledgeSourceType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const SOURCE_SEEDS: Array<{
  slug: string;
  sourceType: KnowledgeSourceType;
  nameEn: string;
  nameTr: string;
  baseUrl: string | null;
  trustTier: number;
}> = [
  {
    slug: "manufacturer-feeds",
    sourceType: "MANUFACTURER",
    nameEn: "Manufacturer catalogs",
    nameTr: "Üretici katalogları",
    baseUrl: null,
    trustTier: 5,
  },
  {
    slug: "community-catch-reports",
    sourceType: "COMMUNITY",
    nameEn: "Community catch reports",
    nameTr: "Topluluk av raporları",
    baseUrl: null,
    trustTier: 3,
  },
  {
    slug: "youtube-angling",
    sourceType: "YOUTUBE",
    nameEn: "YouTube angling channels",
    nameTr: "YouTube balıkçılık kanalları",
    baseUrl: "https://www.youtube.com",
    trustTier: 2,
  },
  {
    slug: "fishing-forums-tr",
    sourceType: "FISHING_FORUM",
    nameEn: "Turkish fishing forums",
    nameTr: "Türk balıkçı forumları",
    baseUrl: null,
    trustTier: 2,
  },
  {
    slug: "public-articles",
    sourceType: "PUBLIC_ARTICLE",
    nameEn: "Public articles",
    nameTr: "Herkese açık makaleler",
    baseUrl: null,
    trustTier: 3,
  },
  {
    slug: "scientific-fisheries",
    sourceType: "SCIENTIFIC_PUBLICATION",
    nameEn: "Scientific fisheries publications",
    nameTr: "Bilimsel balıkçılık yayınları",
    baseUrl: null,
    trustTier: 5,
  },
  {
    slug: "fishing-blogs",
    sourceType: "FISHING_BLOG",
    nameEn: "Fishing blogs",
    nameTr: "Balıkçılık blogları",
    baseUrl: null,
    trustTier: 3,
  },
  {
    slug: "angling-magazines",
    sourceType: "MAGAZINE",
    nameEn: "Angling magazines",
    nameTr: "Balıkçılık dergileri",
    baseUrl: null,
    trustTier: 4,
  },
];

type DemoItemSeed = {
  sourceSlug: string;
  externalKey: string;
  url: string;
  titleEn: string;
  titleTr: string;
  summaryEn: string;
  summaryTr: string;
  previewEn: string;
  previewTr: string;
  language: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING_REVIEW" | "DUPLICATE" | "APPROVED";
  country: string;
  region: string;
  speciesSlug?: string;
  lureSlug?: string;
  techniqueSlug?: string;
  manufacturerSlug?: string;
  evidenceLabel: string;
  suggestionKind: string;
  suggestionEn: string;
  suggestionTr: string;
};

const DEMO_ITEMS: DemoItemSeed[] = [
  {
    sourceSlug: "manufacturer-feeds",
    externalKey: "demo-halco-depth-spec",
    url: "https://www.halco.com.au/lures/laser-pro-190-dd",
    titleEn: "Laser Pro 190 DD — rated depth update",
    titleTr: "Laser Pro 190 DD — dalış derinliği güncellemesi",
    summaryEn: "Halco documents 1.8–3.5 m trolling depth for Laser Pro 190 DD.",
    summaryTr: "Halco, Laser Pro 190 DD için 1,8–3,5 m trolling derinliği belirtiyor.",
    previewEn: "Manufacturer depth rating · Halco Laser Pro 190 DD",
    previewTr: "Üretici derinlik değeri · Halco Laser Pro 190 DD",
    language: "en",
    confidence: "HIGH",
    status: "APPROVED",
    country: "TR",
    region: "aegean",
    lureSlug: "laser-pro-190-dd",
    manufacturerSlug: "halco",
    techniqueSlug: "trolling",
    evidenceLabel: "Manufacturer spec table",
    suggestionKind: "FIELD_VALUE",
    suggestionEn: "Confirm diving depth range against imported catalog",
    suggestionTr: "Dalış aralığını içe aktarılan katalogla doğrula",
  },
  {
    sourceSlug: "youtube-angling",
    externalKey: "demo-yt-palamut-trolling",
    url: "https://www.youtube.com/watch?v=example-palamut",
    titleEn: "Autumn bonito trolling — Laser Pro depth band",
    titleTr: "Sonbahar palamut trolling — Laser Pro derinlik bandı",
    summaryEn: "Video discusses bonito trolling with Laser Pro around 2.5 m behind a planer.",
    summaryTr: "Video, planer arkasında ~2,5 m'de Laser Pro ile palamut trolling'ini ele alıyor.",
    previewEn: "YouTube · autumn bonito trolling depth band",
    previewTr: "YouTube · sonbahar palamut trolling derinlik bandı",
    language: "tr",
    confidence: "MEDIUM",
    status: "APPROVED",
    country: "TR",
    region: "mediterranean",
    speciesSlug: "bonito",
    lureSlug: "laser-pro-190-dd",
    techniqueSlug: "trolling",
    evidenceLabel: "Video timestamp 4:12",
    suggestionKind: "COMMUNITY_EFFECTIVENESS",
    suggestionEn: "Link bonito effectiveness to Laser Pro 190 DD",
    suggestionTr: "Palamut etkinliğini Laser Pro 190 DD'ye bağla",
  },
  {
    sourceSlug: "fishing-forums-tr",
    externalKey: "demo-forum-lufer-spin",
    url: "https://example-forum.local/threads/lufer-minnow",
    titleEn: "Bosphorus bluefish — shallow minnow preference",
    titleTr: "Boğaz lüferi — sığ minnow tercihi",
    summaryEn: "Forum thread suggests 120–140 mm minnows for dawn Bosphorus bluefish.",
    summaryTr: "Forum başlığı Boğaz lüferi için şafakta 120–140 mm minnow öneriyor.",
    previewEn: "Forum thread · Bosphorus bluefish minnow sizes",
    previewTr: "Forum başlığı · Boğaz lüferi minnow boyları",
    language: "tr",
    confidence: "MEDIUM",
    status: "PENDING_REVIEW",
    country: "TR",
    region: "bosphorus",
    speciesSlug: "bluefish",
    techniqueSlug: "casting",
    evidenceLabel: "Forum thread pages 2–4",
    suggestionKind: "SPECIES_TECHNIQUE",
    suggestionEn: "Curate bluefish + casting technique cluster",
    suggestionTr: "Lüfer + spin teknik kümesini düzenle",
  },
  {
    sourceSlug: "scientific-fisheries",
    externalKey: "demo-sci-dicentrarchus-labrax",
    url: "https://example-journal.local/dicentrarchus-labrax-aegean",
    titleEn: "European seabass seasonal distribution — Aegean",
    titleTr: "Levrek mevsimsel dağılımı — Ege",
    summaryEn: "Study notes Aegean European seabass nearshore aggregation April–June.",
    summaryTr: "Çalışma Ege levreğinin Nisan–Haziran kıyı yakını kümelenmesini not ediyor.",
    previewEn: "Scientific paper · Aegean seabass seasonal distribution",
    previewTr: "Bilimsel yayın · Ege levrek mevsimsel dağılımı",
    language: "en",
    confidence: "HIGH",
    status: "APPROVED",
    country: "TR",
    region: "aegean",
    speciesSlug: "european-seabass",
    evidenceLabel: "Abstract §2",
    suggestionKind: "SPECIES_HABITAT",
    suggestionEn: "Add seasonal habitat note to levrek species page",
    suggestionTr: "Levrek tür sayfasına mevsimsel habitat notu ekle",
  },
  {
    sourceSlug: "community-catch-reports",
    externalKey: "demo-community-trend-levrek",
    url: "https://guide.balikoltamda.net/species/european-seabass",
    titleEn: "Community trend — levrek shore reports increasing",
    titleTr: "Topluluk trendi — levrek kıyı raporları artıyor",
    summaryEn: "Approved catch reports cluster on shore casting for levrek in May.",
    summaryTr: "Onaylı av raporları Mayıs'ta levrek kıyı spin'de kümeleniyor.",
    previewEn: "Balık Oltamda trend · levrek shore casting",
    previewTr: "Balık Oltamda trend · levrek kıyı spin",
    language: "both",
    confidence: "LOW",
    status: "PENDING_REVIEW",
    country: "TR",
    region: "aegean",
    speciesSlug: "european-seabass",
    techniqueSlug: "casting",
    evidenceLabel: "Catch report aggregation",
    suggestionKind: "TREND_SIGNAL",
    suggestionEn: "Surface shore-casting trend for levrek",
    suggestionTr: "Levrek için kıyı spin trend sinyali",
  },
  {
    sourceSlug: "public-articles",
    externalKey: "demo-article-duplicate-levrek",
    url: "https://example-magazine.local/levrek-lure-guide",
    titleEn: "Magazine lure guide — levrek (possible duplicate)",
    titleTr: "Dergi yem rehberi — levrek (olası mükerrer)",
    summaryEn: "Magazine guide may duplicate levrek entry; uses regional slang over taxonomy.",
    summaryTr: "Dergi rehberi levrek girdisini mükerrer edebilir; taksonomi yerine bölgesel argo kullanıyor.",
    previewEn: "Magazine · levrek lure guide (possible duplicate)",
    previewTr: "Dergi · levrek yem rehberi (olası mükerrer)",
    language: "tr",
    confidence: "LOW",
    status: "DUPLICATE",
    country: "TR",
    region: "aegean",
    speciesSlug: "european-seabass",
    evidenceLabel: "Taxonomy check",
    suggestionKind: "TAXONOMY_CONFLICT",
    suggestionEn: "Regional name must not replace scientific taxonomy",
    suggestionTr: "Bölgesel ad bilimsel taksonomiyi değiştirmemeli",
  },
  {
    sourceSlug: "fishing-blogs",
    externalKey: "demo-blog-trolling-speed",
    url: "https://example-blog.local/trolling-speed-aegean",
    titleEn: "Aegean trolling speed notes for mid-water species",
    titleTr: "Ege orta su türleri için trolling hız notları",
    summaryEn: "Blog compares 4–6 kn trolling bands for bonito and small tuna in the Aegean.",
    summaryTr: "Blog, Ege'de palamut ve küçük orkinos için 4–6 kn trolling bantlarını karşılaştırıyor.",
    previewEn: "Blog article · Aegean trolling speed bands",
    previewTr: "Blog yazısı · Ege trolling hız bantları",
    language: "tr",
    confidence: "MEDIUM",
    status: "PENDING_REVIEW",
    country: "TR",
    region: "aegean",
    speciesSlug: "bonito",
    techniqueSlug: "trolling",
    evidenceLabel: "Blog section 3",
    suggestionKind: "TECHNIQUE_NOTE",
    suggestionEn: "Cross-link trolling speed guidance",
    suggestionTr: "Trolling hız rehberini çapraz bağla",
  },
];

async function resolveSlugMaps() {
  const [species, lures, techniques, manufacturers] = await Promise.all([
    prisma.fishSpecies.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true },
    }),
    prisma.lureModel.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true },
    }),
    prisma.technique.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true },
    }),
    prisma.manufacturer.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true },
    }),
  ]);

  return {
    species: new Map(species.map((s) => [s.slug, s.id])),
    lures: new Map(lures.map((l) => [l.slug, l.id])),
    techniques: new Map(techniques.map((t) => [t.slug, t.id])),
    manufacturers: new Map(manufacturers.map((m) => [m.slug, m.id])),
  };
}

export async function ensureKnowledgePipelineSeeds(): Promise<void> {
  try {
    for (const seed of SOURCE_SEEDS) {
      await prisma.knowledgeSource.upsert({
        where: { slug: seed.slug },
        create: seed,
        update: {
          nameEn: seed.nameEn,
          nameTr: seed.nameTr,
          baseUrl: seed.baseUrl,
          trustTier: seed.trustTier,
          active: true,
        },
      });
    }

    const existing = await prisma.knowledgeItem.count();
    if (existing > 0) {
      return;
    }

    const sources = await prisma.knowledgeSource.findMany({
      select: { id: true, slug: true },
    });
    const sourceBySlug = new Map(sources.map((s) => [s.slug, s.id]));
    const maps = await resolveSlugMaps();

    for (const demo of DEMO_ITEMS) {
      const sourceId = sourceBySlug.get(demo.sourceSlug);
      if (!sourceId) continue;

      const item = await prisma.knowledgeItem.create({
        data: {
          knowledgeSourceId: sourceId,
          externalKey: demo.externalKey,
          url: demo.url,
          titleEn: demo.titleEn,
          titleTr: demo.titleTr,
          aiSummaryEn: demo.summaryEn,
          aiSummaryTr: demo.summaryTr,
          sourcePreviewEn: demo.previewEn,
          sourcePreviewTr: demo.previewTr,
          language: demo.language,
          discoveredAt: new Date(),
          confidence: demo.confidence,
          status: demo.status,
          editorDecision: demo.status === "APPROVED" ? "APPROVED" : "NONE",
          country: demo.country,
          region: demo.region,
          fishSpeciesId: demo.speciesSlug
            ? maps.species.get(demo.speciesSlug) ?? null
            : null,
          lureModelId: demo.lureSlug
            ? maps.lures.get(demo.lureSlug) ?? null
            : null,
          techniqueId: demo.techniqueSlug
            ? maps.techniques.get(demo.techniqueSlug) ?? null
            : null,
          manufacturerId: demo.manufacturerSlug
            ? maps.manufacturers.get(demo.manufacturerSlug) ?? null
            : null,
          evidence: {
            create: {
              label: demo.evidenceLabel,
              excerptEn: "Indexed reference — view original source.",
              sourceUrl: demo.url,
              confidence: demo.confidence,
            },
          },
          suggestions: {
            create: {
              kind: demo.suggestionKind,
              proposedValueEn: demo.suggestionEn,
              proposedValueTr: demo.suggestionTr,
              status: "PENDING_REVIEW",
            },
          },
        },
      });

      const graphLinks: Array<{
        entityType: "SPECIES" | "LURE_MODEL" | "MANUFACTURER" | "TECHNIQUE";
        entityId: string;
        relationKind: "MENTIONS" | "SUPPORTS";
      }> = [];

      if (item.fishSpeciesId) {
        graphLinks.push({
          entityType: "SPECIES",
          entityId: item.fishSpeciesId,
          relationKind: "MENTIONS",
        });
      }
      if (item.lureModelId) {
        graphLinks.push({
          entityType: "LURE_MODEL",
          entityId: item.lureModelId,
          relationKind: "MENTIONS",
        });
      }
      if (item.manufacturerId) {
        graphLinks.push({
          entityType: "MANUFACTURER",
          entityId: item.manufacturerId,
          relationKind: "SUPPORTS",
        });
      }
      if (item.techniqueId) {
        graphLinks.push({
          entityType: "TECHNIQUE",
          entityId: item.techniqueId,
          relationKind: "MENTIONS",
        });
      }

      if (graphLinks.length > 0) {
        await prisma.knowledgeGraphLink.createMany({
          data: graphLinks.map((link) => ({
            knowledgeItemId: item.id,
            entityType: link.entityType,
            entityId: link.entityId,
            relationKind: link.relationKind,
            weight: demo.confidence === "HIGH" ? 0.9 : demo.confidence === "MEDIUM" ? 0.6 : 0.3,
          })),
        });
      }
    }
  } catch {
    // DB unavailable during build — seeds run at runtime in Studio
  }
}

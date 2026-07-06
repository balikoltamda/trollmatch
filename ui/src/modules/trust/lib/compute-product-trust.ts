import { LURE_DETAIL_ENRICHMENTS } from "@/modules/lure/data/lure-detail-enrichment";
import { prisma } from "@/lib/prisma";
import { editorialStatusLabel } from "@/modules/studio/lib/editorial";
import {
  computeTrustScore,
  deriveLastVerifiedAt,
  derivePublicVerificationStatus,
} from "@/modules/trust/lib/derive-verification";
import type {
  CommunityConsensus,
  PublicTrustSummary,
  TrustLayer,
  TrustProfile,
} from "@/modules/trust/types";

type TrustModelRecord = {
  id: string;
  slug: string;
  nameEn: string;
  lifecycleState: import("@/generated/prisma/client").ContentLifecycleState;
  manufacturerStatus: import("@/generated/prisma/client").ManufacturerProductStatus;
  lastImportedAt: Date | null;
  firstSeenAt: Date | null;
  bodyTypeEn: string | null;
  actionEn: string | null;
  divingDepthMaxM: { toString(): string } | null;
  manufacturer: { nameEn: string; slug: string };
  editorNote: {
    confidence: import("@/generated/prisma/client").EditorNoteConfidence;
    updatedAt: Date;
    currentRecommendationEn: string | null;
    shortRecommendationEn: string | null;
  } | null;
  _count: {
    images: number;
    catalogSuggestions: number;
    lureSpeciesLinks: number;
  };
};

function communityFromSlug(slug: string): CommunityConsensus | null {
  const enrichment = LURE_DETAIL_ENRICHMENTS[slug];
  if (!enrichment || enrichment.communityStatistics.verifiedCatchReportCount === 0) {
    return null;
  }
  const stats = enrichment.communityStatistics;
  return {
    assertions: stats.usageAssertionCount,
    catchReports: stats.verifiedCatchReportCount,
    effectivenessBand: stats.effectivenessBand,
    summary: `${stats.verifiedCatchReportCount} verified catch reports · effectiveness: ${stats.effectivenessBand}`,
  };
}

function buildLayers(
  model: TrustModelRecord,
  pendingCount: number,
  publishedAt: Date | null,
  community: CommunityConsensus | null,
): TrustLayer[] {
  const layers: TrustLayer[] = [];

  layers.push({
    id: "manufacturer",
    title: "Manufacturer source",
    summary: model.lastImportedAt
      ? `Specs from ${model.manufacturer.nameEn}, last updated ${model.lastImportedAt.toLocaleDateString()}.`
      : `Catalog entry for ${model.manufacturer.nameEn} — not yet confirmed against a live import.`,
    confidence: model.lastImportedAt ? "HIGH" : "LOW",
    evidence: [
      model.bodyTypeEn ? `Body type: ${model.bodyTypeEn}` : "Body type missing",
      model.actionEn ? `Action: ${model.actionEn}` : "Action missing",
      model.divingDepthMaxM
        ? `Dive depth: ${model.divingDepthMaxM.toString()} m`
        : "Dive depth missing",
      `${model._count.images} product image(s)`,
    ].filter(Boolean),
    provenance: [
      { label: "Manufacturer", value: model.manufacturer.nameEn },
      { label: "Feed status", value: model.manufacturerStatus },
      ...(model.lastImportedAt
        ? [
            {
              label: "Last import",
              value: model.lastImportedAt.toISOString(),
            },
          ]
        : []),
      ...(model.firstSeenAt
        ? [{ label: "First seen", value: model.firstSeenAt.toISOString() }]
        : []),
    ],
    verified: model.manufacturerStatus === "ACTIVE" && Boolean(model.lastImportedAt),
  });

  if (community) {
    layers.push({
      id: "community",
      title: "Angler reports",
      summary: community.summary,
      confidence:
        community.effectivenessBand === "high"
          ? "HIGH"
          : community.effectivenessBand === "moderate"
            ? "MEDIUM"
            : "LOW",
      evidence: [
        `${community.catchReports} verified catch reports`,
        `Effectiveness: ${community.effectivenessBand}`,
      ],
      provenance: [
        { label: "Source", value: "Verified angler catch reports" },
      ],
      verified: community.catchReports >= 3,
    });
  }

  const hasAiNote =
    Boolean(model.editorNote?.currentRecommendationEn?.trim()) ||
    Boolean(model.editorNote?.shortRecommendationEn?.trim());

  layers.push({
    id: "ai",
    title: "Editor summary",
    summary: hasAiNote
      ? "Editor note on file — check against real catch reports before relying on it."
      : pendingCount > 0
        ? "Editor suggestions awaiting review."
        : "No approved summary yet.",
    confidence: hasAiNote ? (model.editorNote?.confidence ?? "MEDIUM") : "LOW",
    evidence: hasAiNote
      ? ["Editor note present"]
      : ["No approved summary"],
    provenance: [{ label: "Pipeline", value: "Editorial review" }],
    verified: hasAiNote && (model.editorNote?.confidence ?? "LOW") !== "LOW",
  });

  layers.push({
    id: "editorial",
    title: "Editorial verification",
    summary:
      model.lifecycleState === "PUBLISHED"
        ? "Published after editorial review."
        : `${editorialStatusLabel(model.lifecycleState)} — not yet published.`,
    confidence: model.editorNote?.confidence ?? null,
    evidence: [
      `Status: ${editorialStatusLabel(model.lifecycleState)}`,
      model.editorNote
        ? `Editor confidence: ${model.editorNote.confidence}`
        : "No editor note",
      pendingCount > 0
        ? `${pendingCount} suggestion(s) still pending`
        : "All suggestions resolved",
      publishedAt ? `Published: ${publishedAt.toLocaleDateString()}` : "Not published",
    ],
    provenance: [
      { label: "Verifier", value: "Balık Oltamda editorial team" },
      ...(publishedAt
        ? [{ label: "Published at", value: publishedAt.toISOString() }]
        : []),
    ],
    verified:
      model.lifecycleState === "PUBLISHED" && pendingCount === 0,
  });

  return layers;
}

async function loadTrustModel(lureModelId: string): Promise<TrustModelRecord | null> {
  return prisma.lureModel.findFirst({
    where: { id: lureModelId, deletedAt: null },
    select: {
      id: true,
      slug: true,
      nameEn: true,
      lifecycleState: true,
      manufacturerStatus: true,
      lastImportedAt: true,
      firstSeenAt: true,
      bodyTypeEn: true,
      actionEn: true,
      divingDepthMaxM: true,
      manufacturer: { select: { nameEn: true, slug: true } },
      editorNote: {
        select: {
          confidence: true,
          updatedAt: true,
          currentRecommendationEn: true,
          shortRecommendationEn: true,
        },
      },
      _count: {
        select: {
          images: { where: { deletedAt: null } },
          catalogSuggestions: { where: { status: "PENDING" } },
          lureSpeciesLinks: { where: { deletedAt: null } },
        },
      },
    },
  });
}

async function getPublishedAt(lureModelId: string): Promise<Date | null> {
  const entry = await prisma.catalogAuditEntry.findFirst({
    where: { lureModelId, action: "PUBLISH" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return entry?.createdAt ?? null;
}

export async function computeProductTrustProfile(
  lureModelId: string,
): Promise<TrustProfile | null> {
  const model = await loadTrustModel(lureModelId);
  if (!model) return null;

  const [publishedAt] = await Promise.all([
    getPublishedAt(lureModelId),
  ]);

  const pendingCount = model._count.catalogSuggestions;
  const community = communityFromSlug(model.slug);

  const score = computeTrustScore({
    lifecycleState: model.lifecycleState,
    editorConfidence: model.editorNote?.confidence ?? null,
    lastImportedAt: model.lastImportedAt,
    pendingSuggestions: pendingCount,
    hasEditorNote: model.editorNote !== null,
    communityCatchReports: community?.catchReports ?? 0,
    manufacturerActive: model.manufacturerStatus === "ACTIVE",
  });

  const layers = buildLayers(model, pendingCount, publishedAt, community);

  const answer =
    score >= 80
      ? "High confidence — manufacturer data, editorial review, and community signals align."
      : score >= 55
        ? "Moderate confidence — some layers verified; review pending items before relying on it."
        : "Low confidence — treat as provisional until importer data and editorial verification complete.";

  return {
    score,
    headline: "Why should I trust this information?",
    answer,
    layers,
    communityConsensus: community,
    editorialVerification: {
      status: model.lifecycleState,
      statusLabel: editorialStatusLabel(model.lifecycleState),
      lastVerifiedAt: publishedAt ?? model.editorNote?.updatedAt ?? model.lastImportedAt,
      editorConfidence: model.editorNote?.confidence ?? null,
      published: model.lifecycleState === "PUBLISHED",
    },
    pendingVerificationCount: pendingCount,
    manufacturerStatus: model.manufacturerStatus,
  };
}

export function buildPublicTrustSummary(input: {
  slug: string;
  lifecycleState: import("@/generated/prisma/client").ContentLifecycleState;
  lastImportedAt: Date | null;
  editorConfidence: import("@/generated/prisma/client").EditorNoteConfidence | null;
  pendingSuggestions: number;
  manufacturerName: string;
  publishedAt: Date | null;
}): PublicTrustSummary {
  const community = communityFromSlug(input.slug);
  const score = computeTrustScore({
    lifecycleState: input.lifecycleState,
    editorConfidence: input.editorConfidence,
    lastImportedAt: input.lastImportedAt,
    pendingSuggestions: input.pendingSuggestions,
    hasEditorNote: input.editorConfidence !== null,
    communityCatchReports: community?.catchReports ?? 0,
    manufacturerActive: true,
  });

  const evidence: string[] = [];
  if (input.lastImportedAt) {
    evidence.push(`Imported from ${input.manufacturerName} feed`);
  }
  if (input.lifecycleState === "PUBLISHED") {
    evidence.push("Editorially verified and published");
  }
  if (community) {
    evidence.push(`${community.catchReports} verified catch reports`);
  }

  const provenance: { label: string; value: string }[] = [
    { label: "Manufacturer", value: input.manufacturerName },
  ];
  if (input.lastImportedAt) {
    provenance.push({
      label: "Last import",
      value: input.lastImportedAt.toLocaleDateString(),
    });
  }
  if (input.publishedAt) {
    provenance.push({
      label: "Published",
      value: input.publishedAt.toLocaleDateString(),
    });
  }

  const answer =
    input.lifecycleState === "PUBLISHED" && input.pendingSuggestions === 0
      ? "Published after Balık Oltamda review — manufacturer specs plus verified catch reports."
      : input.lastImportedAt
        ? "Manufacturer specs on file — catch reports and editorial review still building."
        : "Limited source detail — check catch reports before relying on this page.";

  return {
    score,
    answer,
    manufacturerImportedAt: input.lastImportedAt?.toISOString() ?? null,
    editorConfidence: input.editorConfidence,
    published: input.lifecycleState === "PUBLISHED",
    communityConsensus: community,
    evidence,
    provenance,
  };
}

export {
  derivePublicVerificationStatus,
  deriveLastVerifiedAt,
  computeTrustScore,
};

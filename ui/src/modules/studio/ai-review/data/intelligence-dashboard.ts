import { prisma } from "@/lib/prisma";
import { listScannableEntities } from "@/modules/studio/ai-review/lib/background-scanner";
import { parseEntityHealthFromSession } from "@/modules/studio/ai-review/lib/entity-health";
import {
  isMetaSuggestion,
  parseQualityReportFromSession,
  parseReadinessScoreFromSession,
  parseScoreBoardFromSession,
  type QualityCheckItem,
} from "@/modules/studio/ai-review/lib/quality-report";
import type { EditorReadinessStatus } from "@/modules/studio/ai-review/lib/readiness-status";
import type { AiReviewSessionView } from "@/modules/studio/ai-review/types";

export type IntelligenceEntityRow = {
  sessionId: string;
  entityType: string;
  entityId: string | null;
  label: string;
  overallScore: number;
  criticalIssues: number;
  warnings: number;
  pendingSuggestions: number;
  readyForPublication: boolean;
  readinessStatus: EditorReadinessStatus;
  reviewedAt: Date;
  scoreDelta?: number;
};

export type IntelligenceDashboardData = {
  needsReview: IntelligenceEntityRow[];
  lowScore: IntelligenceEntityRow[];
  missingTranslations: IntelligenceEntityRow[];
  missingMedia: IntelligenceEntityRow[];
  missingTechniques: IntelligenceEntityRow[];
  missingRegions: IntelligenceEntityRow[];
  missingKnowledge: IntelligenceEntityRow[];
  brokenGraph: IntelligenceEntityRow[];
  possibleDuplicates: number;
  topQuality: IntelligenceEntityRow[];
  recentSessions: IntelligenceEntityRow[];
  recentImprovements: IntelligenceEntityRow[];
  scannableEntityCount: number;
  totals: {
    sessions: number;
    pendingSuggestions: number;
    avgScore: number;
  };
};

function hasCheckIssue(checks: QualityCheckItem[], predicate: (c: QualityCheckItem) => boolean): boolean {
  return checks.some((c) => predicate(c) && c.status !== "pass");
}

function sessionToRow(
  session: AiReviewSessionView,
  label: string,
  scoreDelta?: number,
): IntelligenceEntityRow {
  const board = parseScoreBoardFromSession(session.suggestions);
  const health = parseEntityHealthFromSession(session.suggestions);
  const overall = board?.overall ?? parseReadinessScoreFromSession(session.suggestions) ?? 0;
  const fieldSuggestions = session.suggestions.filter((s) => !isMetaSuggestion(s.fieldKey));

  return {
    sessionId: session.id,
    entityType: session.entityType,
    entityId: session.entityId,
    label,
    overallScore: overall,
    criticalIssues: board?.criticalIssues ?? health?.criticalIssues.length ?? 0,
    warnings: board?.warnings ?? health?.warnings.length ?? 0,
    pendingSuggestions: fieldSuggestions.filter((s) => s.status === "PENDING").length,
    readyForPublication: board?.readyForPublication ?? false,
    readinessStatus:
      health?.readinessStatus ??
      (board?.readyForPublication ? "READY" : fieldSuggestions.some((s) => s.status === "PENDING") ? "REVIEW_NEEDED" : "INCOMPLETE"),
    reviewedAt: session.createdAt,
    scoreDelta,
  };
}

async function resolveLabel(entityType: string, entityId: string | null): Promise<string> {
  if (!entityId) return "Draft";
  switch (entityType) {
    case "SPECIES": {
      const r = await prisma.fishSpecies.findUnique({ where: { id: entityId }, select: { nameEn: true } });
      return r?.nameEn ?? entityId.slice(0, 8);
    }
    case "LURE": {
      const r = await prisma.lureModel.findUnique({ where: { id: entityId }, select: { nameEn: true } });
      return r?.nameEn ?? entityId.slice(0, 8);
    }
    case "TECHNIQUE": {
      const r = await prisma.technique.findUnique({ where: { id: entityId }, select: { nameEn: true } });
      return r?.nameEn ?? entityId.slice(0, 8);
    }
    case "MANUFACTURER": {
      const r = await prisma.manufacturer.findUnique({ where: { id: entityId }, select: { nameEn: true } });
      return r?.nameEn ?? entityId.slice(0, 8);
    }
    case "REGION": {
      const r = await prisma.region.findUnique({ where: { id: entityId }, select: { nameEn: true } });
      return r?.nameEn ?? entityId.slice(0, 8);
    }
    case "KNOWLEDGE_SOURCE": {
      const r = await prisma.knowledgeSource.findUnique({ where: { id: entityId }, select: { nameEn: true } });
      return r?.nameEn ?? entityId.slice(0, 8);
    }
    case "CATCH_REPORT": {
      const r = await prisma.catchReport.findUnique({
        where: { id: entityId },
        select: { fishSpecies: { select: { nameEn: true } } },
      });
      return r?.fishSpecies.nameEn ?? entityId.slice(0, 8);
    }
    default:
      return entityId.slice(0, 8);
  }
}

function mapSession(session: {
  id: string;
  entityType: string;
  entityId: string | null;
  seedInput: unknown;
  createdAt: Date;
  suggestions: Array<{
    id: string;
    sessionId: string;
    entityType: string;
    entityId: string | null;
    fieldKey: string;
    fieldLabel: string;
    suggestedValue: string;
    currentValue: string | null;
    confidencePct: number;
    source: string;
    reasoning: string | null;
    status: string;
    editedValue: string | null;
    resolvedAt: Date | null;
    resolvedBy: string | null;
  }>;
}): AiReviewSessionView {
  return {
    id: session.id,
    entityType: session.entityType as AiReviewSessionView["entityType"],
    entityId: session.entityId,
    seedInput: session.seedInput as Record<string, unknown>,
    createdAt: session.createdAt,
    suggestions: session.suggestions.map((s) => ({
      id: s.id,
      sessionId: s.sessionId,
      entityType: s.entityType as AiReviewSessionView["entityType"],
      entityId: s.entityId,
      fieldKey: s.fieldKey,
      fieldLabel: s.fieldLabel,
      suggestedValue: s.suggestedValue,
      currentValue: s.currentValue,
      confidencePct: s.confidencePct,
      source: s.source as AiReviewSessionView["suggestions"][0]["source"],
      reasoning: s.reasoning ?? "",
      status: s.status as AiReviewSessionView["suggestions"][0]["status"],
      editedValue: s.editedValue,
      resolvedAt: s.resolvedAt,
      resolvedBy: s.resolvedBy,
    })),
  };
}

export async function loadIntelligenceDashboard(): Promise<IntelligenceDashboardData> {
  const [sessions, scannable] = await Promise.all([
    prisma.studioAiReviewSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 120,
      include: {
        suggestions: { orderBy: { confidencePct: "desc" } },
      },
    }),
    listScannableEntities(),
  ]);

  const rows: IntelligenceEntityRow[] = [];
  const checksBySession = new Map<string, QualityCheckItem[]>();

  for (const session of sessions) {
    const view = mapSession(session);
    const label = await resolveLabel(session.entityType, session.entityId);
    const checks = parseQualityReportFromSession(view.suggestions);
    checksBySession.set(session.id, checks);
    rows.push(sessionToRow(view, label));
  }

  const latestByEntity = new Map<string, IntelligenceEntityRow>();
  const previousScoreByEntity = new Map<string, number>();
  for (const row of rows) {
    if (!row.entityId) continue;
    const key = `${row.entityType}:${row.entityId}`;
    if (!latestByEntity.has(key)) {
      latestByEntity.set(key, row);
    } else if (!previousScoreByEntity.has(key)) {
      previousScoreByEntity.set(key, row.overallScore);
    }
  }

  const dedupedRows = [...latestByEntity.values()];
  for (const row of dedupedRows) {
    if (!row.entityId) continue;
    const key = `${row.entityType}:${row.entityId}`;
    const prev = previousScoreByEntity.get(key);
    if (prev != null && row.overallScore > prev) {
      row.scoreDelta = row.overallScore - prev;
    }
  }

  const avgScore =
    dedupedRows.length > 0
      ? Math.round(dedupedRows.reduce((sum, r) => sum + r.overallScore, 0) / dedupedRows.length)
      : 0;

  const pendingSuggestions = dedupedRows.reduce((sum, r) => sum + r.pendingSuggestions, 0);

  const missingTranslations = dedupedRows.filter((row) => {
    const checks = checksBySession.get(row.sessionId) ?? [];
    return hasCheckIssue(checks, (c) => c.category === "localization");
  });

  const missingMedia = dedupedRows.filter((row) => {
    const checks = checksBySession.get(row.sessionId) ?? [];
    return hasCheckIssue(checks, (c) => c.category === "media");
  });

  const missingTechniques = dedupedRows.filter((row) => {
    const checks = checksBySession.get(row.sessionId) ?? [];
    return hasCheckIssue(
      checks,
      (c) => c.id.includes("technique") || c.id === "graph.techniques" || c.label.toLowerCase().includes("technique"),
    );
  });

  const missingRegions = dedupedRows.filter((row) => {
    const checks = checksBySession.get(row.sessionId) ?? [];
    return hasCheckIssue(
      checks,
      (c) => c.id.includes("region") || c.id === "graph.regions" || c.label.toLowerCase().includes("region"),
    );
  });

  const missingKnowledge = dedupedRows.filter((row) => {
    const checks = checksBySession.get(row.sessionId) ?? [];
    return hasCheckIssue(checks, (c) => c.category === "knowledge" || c.id.startsWith("graph.knowledge"));
  });

  const brokenGraph = dedupedRows.filter((row) => {
    const checks = checksBySession.get(row.sessionId) ?? [];
    return hasCheckIssue(
      checks,
      (c) =>
        c.id.startsWith("graph.") ||
        c.id.startsWith("integrity.") ||
        c.category === "relationships",
    );
  });

  return {
    needsReview: dedupedRows
      .filter((r) => r.readinessStatus === "REVIEW_NEEDED" || r.pendingSuggestions > 0)
      .slice(0, 12),
    lowScore: dedupedRows.filter((r) => r.overallScore < 70).slice(0, 12),
    missingTranslations: missingTranslations.slice(0, 10),
    missingMedia: missingMedia.slice(0, 10),
    missingTechniques: missingTechniques.slice(0, 10),
    missingRegions: missingRegions.slice(0, 10),
    missingKnowledge: missingKnowledge.slice(0, 10),
    brokenGraph: brokenGraph.slice(0, 10),
    possibleDuplicates: sessions.filter((s) =>
      s.suggestions.some((sg) => sg.fieldKey === "duplicateWarning" && sg.status === "PENDING"),
    ).length,
    topQuality: [...dedupedRows].sort((a, b) => b.overallScore - a.overallScore).slice(0, 8),
    recentSessions: rows.slice(0, 10),
    recentImprovements: dedupedRows
      .filter((r) => (r.scoreDelta ?? 0) >= 5)
      .sort((a, b) => (b.scoreDelta ?? 0) - (a.scoreDelta ?? 0))
      .slice(0, 8),
    scannableEntityCount: scannable.length,
    totals: { sessions: dedupedRows.length, pendingSuggestions, avgScore },
  };
}

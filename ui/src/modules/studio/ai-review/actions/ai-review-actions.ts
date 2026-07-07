"use server";

import { revalidatePath } from "next/cache";
import type { StudioReviewEntityType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  auditActor,
  isUnauthorizedResult,
  requireEditorOrUnauthorized,
} from "@/modules/studio/auth/permissions";
import { recordCatalogAudit } from "@/modules/studio/data/audit";
import { isBulkActionable } from "@/modules/studio/ai-review/lib/quality-report";
import { detectDuplicates } from "@/modules/studio/ai-review/lib/duplicate-detector";
import { runEditorialReview } from "@/modules/studio/ai-review/lib/run-editorial-review";
import { triggerEditorialReview } from "@/modules/studio/ai-review/lib/trigger-editorial-review";
import {
  catchReportSeedSchema,
  knowledgeSourceSeedSchema,
  manufacturerSeedSchema,
  regionSeedSchema,
  speciesSeedSchema,
  techniqueSeedSchema,
} from "@/modules/studio/ai-review/lib/validation";
import {
  getLatestAiReviewSession,
  getSuggestionById,
} from "@/modules/studio/ai-review/data/ai-review-repository";
import {
  STUDIO_INTELLIGENCE_PATH,
  STUDIO_REGIONS_PATH,
  STUDIO_SPECIES_PATH,
} from "@/modules/studio/lib/studio-routes";

function parseSeed(
  entityType: StudioReviewEntityType,
  seedInput: unknown,
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  switch (entityType) {
    case "SPECIES": {
      const parsed = speciesSeedSchema.safeParse(seedInput);
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
      }
      return { ok: true, data: parsed.data };
    }
    case "TECHNIQUE": {
      const parsed = techniqueSeedSchema.safeParse(seedInput);
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
      }
      return { ok: true, data: parsed.data };
    }
    case "MANUFACTURER": {
      const parsed = manufacturerSeedSchema.safeParse(seedInput);
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
      }
      return { ok: true, data: parsed.data };
    }
    case "KNOWLEDGE_SOURCE": {
      const parsed = knowledgeSourceSeedSchema.safeParse(seedInput);
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
      }
      return { ok: true, data: parsed.data };
    }
    case "REGION": {
      const parsed = regionSeedSchema.safeParse(seedInput);
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
      }
      return { ok: true, data: parsed.data };
    }
    case "CATCH_REPORT": {
      const parsed = catchReportSeedSchema.safeParse(seedInput);
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
      }
      return { ok: true, data: parsed.data };
    }
    default:
      return { ok: true, data: (seedInput ?? {}) as Record<string, unknown> };
  }
}

function revalidateEntity(entityType: StudioReviewEntityType, entityId?: string | null) {
  switch (entityType) {
    case "SPECIES":
      revalidatePath(STUDIO_SPECIES_PATH);
      if (entityId) revalidatePath(`${STUDIO_SPECIES_PATH}/new`);
      break;
    case "TECHNIQUE":
      revalidatePath("/studio/techniques");
      revalidatePath("/studio/techniques/new");
      break;
    case "MANUFACTURER":
      revalidatePath("/studio/manufacturers");
      break;
    case "LURE":
      revalidatePath("/studio/products");
      if (entityId) revalidatePath(`/studio/products/${entityId}`);
      break;
    case "KNOWLEDGE_SOURCE":
      revalidatePath("/studio/source-archive");
      break;
    case "REGION":
      revalidatePath(STUDIO_REGIONS_PATH);
      break;
    case "CATCH_REPORT":
      revalidatePath("/studio/community/reports");
      break;
    case "LURE_VARIANT":
    case "PRODUCT_LINE":
      revalidatePath(STUDIO_INTELLIGENCE_PATH);
      break;
    default:
      revalidatePath(STUDIO_INTELLIGENCE_PATH);
      break;
  }
}

export async function runAiReviewAnalysis(
  entityType: StudioReviewEntityType,
  seedInput: unknown,
  entityId?: string | null,
): Promise<
  | {
      ok: true;
      sessionId: string;
      duplicateCount: number;
      suggestionCount: number;
      readinessScore: number;
    }
  | { ok: false; error: string }
> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  const parsed = parseSeed(entityType, seedInput);
  if (!parsed.ok) return parsed;

  try {
    const parsed = parseSeed(entityType, seedInput);
    if (!parsed.ok) return parsed;

    const result = await runEditorialReview({
      entityType,
      entityId: entityId ?? null,
      seedInput: parsed.data,
      createdBy: auditActor(auth),
      trigger: "MANUAL",
    });

    revalidateEntity(entityType, entityId);

    return {
      ok: true,
      sessionId: result.sessionId,
      duplicateCount: result.duplicateCount,
      suggestionCount: result.suggestionCount,
      readinessScore: result.readinessScore,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Analysis failed",
    };
  }
}

/** Auto-start editorial review when editor opens an entity — skips if a session exists. */
export async function ensureEntityAiReview(
  entityType: StudioReviewEntityType,
  entityId: string,
): Promise<{ started: boolean; sessionId?: string }> {
  const existing = await getLatestAiReviewSession({ entityType, entityId });
  if (existing && existing.suggestions.length > 0) {
    return { started: false };
  }

  const result = await triggerEditorialReview(entityType, entityId, "EDIT", "studio");
  if (!result) return { started: false };
  return { started: true, sessionId: result.sessionId };
}

export async function acceptAiSuggestion(
  suggestionId: string,
  editedValue?: string,
): Promise<{ ok: true; fieldKey: string; value: string } | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const suggestion = await getSuggestionById(suggestionId);
    if (!suggestion || suggestion.status !== "PENDING") {
      return { ok: false, error: "Suggestion not found or already resolved" };
    }

    const value = (editedValue?.trim() || suggestion.suggestedValue).trim();
    if (!value && !suggestion.fieldKey.startsWith("meta.")) {
      return { ok: false, error: "Accepted value cannot be empty" };
    }

    await prisma.studioAiSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: "APPROVED",
        editedValue: editedValue?.trim() ? value : null,
        resolvedAt: new Date(),
        resolvedBy: auditActor(auth),
      },
    });

    await recordCatalogAudit({
      entityType: "studio_ai_suggestion",
      entityId: suggestionId,
      action: "AI_SUGGESTION_ACCEPT",
      actor: auditActor(auth),
      summary: `Accepted AI suggestion: ${suggestion.fieldLabel}`,
      metadata: {
        fieldKey: suggestion.fieldKey,
        oldValue: suggestion.currentValue,
        newValue: value,
        value,
        sessionId: suggestion.sessionId,
        entityType: suggestion.entityType,
        entityId: suggestion.entityId,
        confidencePct: suggestion.confidencePct,
        source: suggestion.source,
        reason: suggestion.reasoning,
      },
    });

    revalidateEntity(suggestion.entityType, suggestion.entityId);

    return { ok: true, fieldKey: suggestion.fieldKey, value };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Accept failed",
    };
  }
}

export async function rejectAiSuggestion(
  suggestionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const suggestion = await getSuggestionById(suggestionId);
    if (!suggestion || suggestion.status !== "PENDING") {
      return { ok: false, error: "Suggestion not found or already resolved" };
    }

    await prisma.studioAiSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: "REJECTED",
        resolvedAt: new Date(),
        resolvedBy: auditActor(auth),
      },
    });

    await recordCatalogAudit({
      entityType: "studio_ai_suggestion",
      entityId: suggestionId,
      action: "AI_SUGGESTION_REJECT",
      actor: auditActor(auth),
      summary: `Rejected AI suggestion: ${suggestion.fieldLabel}`,
      metadata: {
        fieldKey: suggestion.fieldKey,
        oldValue: suggestion.currentValue,
        sessionId: suggestion.sessionId,
        confidencePct: suggestion.confidencePct,
        reason: suggestion.reasoning,
      },
    });

    revalidateEntity(suggestion.entityType, suggestion.entityId);

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Reject failed",
    };
  }
}

export async function acceptAllAiSuggestions(
  sessionId: string,
): Promise<{ ok: true; accepted: number } | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  const session = await prisma.studioAiReviewSession.findUnique({
    where: { id: sessionId },
    include: { suggestions: true },
  });
  if (!session) return { ok: false, error: "Session not found" };

  const pending = session.suggestions.filter(
    (s) => s.status === "PENDING" && isBulkActionable(s.fieldKey),
  );

  let accepted = 0;
  for (const suggestion of pending) {
    const result = await acceptAiSuggestion(suggestion.id);
    if (result.ok) accepted += 1;
  }

  revalidateEntity(session.entityType, session.entityId);
  return { ok: true, accepted };
}

export async function rejectAllAiSuggestions(
  sessionId: string,
): Promise<{ ok: true; rejected: number } | { ok: false; error: string }> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  const session = await prisma.studioAiReviewSession.findUnique({
    where: { id: sessionId },
    include: { suggestions: true },
  });
  if (!session) return { ok: false, error: "Session not found" };

  const pending = session.suggestions.filter(
    (s) => s.status === "PENDING" && isBulkActionable(s.fieldKey),
  );

  let rejected = 0;
  for (const suggestion of pending) {
    const result = await rejectAiSuggestion(suggestion.id);
    if (result.ok) rejected += 1;
  }

  revalidateEntity(session.entityType, session.entityId);
  return { ok: true, rejected };
}

export async function loadAiReviewSession(
  entityType: StudioReviewEntityType,
  entityId?: string | null,
  sessionId?: string,
) {
  return getLatestAiReviewSession({ entityType, entityId, sessionId });
}

export async function checkEntityDuplicates(
  entityType: StudioReviewEntityType,
  seedInput: unknown,
) {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  const parsed = parseSeed(entityType, seedInput);
  if (!parsed.ok) return parsed;

  const duplicates = await detectDuplicates(entityType, parsed.data);
  return { ok: true as const, duplicates };
}

/** Manual or cron-triggered scan of one entity. */
export async function scanEditorialEntity(
  entityType: StudioReviewEntityType,
  entityId: string,
): Promise<
  | { ok: true; sessionId: string; readinessScore: number }
  | { ok: false; error: string }
> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const { scanEntity } = await import("@/modules/studio/ai-review/lib/background-scanner");
    const result = await scanEntity(entityType, entityId, auditActor(auth));
    if (!result) return { ok: false, error: "Entity not found or not scannable" };

    revalidateEntity(entityType, entityId);
    revalidatePath(STUDIO_INTELLIGENCE_PATH);

    return {
      ok: true,
      sessionId: result.sessionId,
      readinessScore: result.readinessScore,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Scan failed",
    };
  }
}

/** Full knowledge-graph scan — reusable by future cron jobs. */
export async function scanAllEditorialEntities(options?: {
  limit?: number;
}): Promise<
  | { ok: true; scanned: number; failed: number }
  | { ok: false; error: string }
> {
  const auth = await requireEditorOrUnauthorized();
  if (isUnauthorizedResult(auth)) return auth;

  try {
    const { scanAllEntities } = await import("@/modules/studio/ai-review/lib/background-scanner");
    const result = await scanAllEntities(auditActor(auth), options);

    revalidatePath(STUDIO_INTELLIGENCE_PATH);

    return { ok: true, scanned: result.scanned, failed: result.failed };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Background scan failed",
    };
  }
}

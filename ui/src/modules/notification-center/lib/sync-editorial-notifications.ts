import type { PlatformNotificationSeverity } from "@/generated/prisma/client";
import type { StudioReviewEntityType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isMetaSuggestion } from "@/modules/studio/ai-review/lib/quality-report";
import type { QualityCheckItem } from "@/modules/studio/ai-review/lib/quality-report";
import type { AiSuggestionDraft } from "@/modules/studio/ai-review/types";
import {
  resolveEntityHref,
  resolveEntityName,
  resolveEntitySlug,
} from "@/modules/notification-center/lib/entity-links";
import {
  buildCheckFingerprint,
  buildDuplicateFingerprint,
  buildSuggestionFingerprint,
} from "@/modules/notification-center/lib/issue-fingerprint";
import type { NotificationDraft } from "@/modules/notification-center/types";

function checkSeverity(status: QualityCheckItem["status"]): PlatformNotificationSeverity | null {
  if (status === "fail") return "CRITICAL";
  if (status === "warn") return "WARNING";
  return null;
}

function draftsFromReview(input: {
  entityType: StudioReviewEntityType;
  entityId: string;
  entitySlug: string;
  entityLabel: string;
  entityHref: string | null;
  sessionId: string;
  checks: QualityCheckItem[];
  suggestions: AiSuggestionDraft[];
}): NotificationDraft[] {
  const drafts: NotificationDraft[] = [];

  for (const check of input.checks) {
    const severity = checkSeverity(check.status);
    if (!severity) continue;
    drafts.push({
      source: "EDITORIAL_INTELLIGENCE",
      severity,
      entityType: input.entityType,
      entityId: input.entityId,
      entityLabel: input.entityLabel,
      entityHref: input.entityHref,
      category: check.category,
      title: check.label,
      description: check.detail ?? `${check.label} needs editorial attention.`,
      issueFingerprint: buildCheckFingerprint(input.entityType, input.entitySlug, check.id),
      sessionId: input.sessionId,
    });
  }

  for (const suggestion of input.suggestions) {
    if (isMetaSuggestion(suggestion.fieldKey)) continue;

    if (suggestion.fieldKey === "duplicateWarning") {
      drafts.push({
        source: "EDITORIAL_INTELLIGENCE",
        severity: "CRITICAL",
        entityType: input.entityType,
        entityId: input.entityId,
        entityLabel: input.entityLabel,
        entityHref: input.entityHref,
        category: "editorial",
        title: "Possible duplicate",
        description: suggestion.reasoning,
        issueFingerprint: buildDuplicateFingerprint(input.entityType, input.entitySlug),
        sessionId: input.sessionId,
      });
      continue;
    }

    drafts.push({
      source: "EDITORIAL_INTELLIGENCE",
      severity: "SUGGESTION",
      entityType: input.entityType,
      entityId: input.entityId,
      entityLabel: input.entityLabel,
      entityHref: input.entityHref,
      category: "editorial",
      title: suggestion.fieldLabel,
      description: suggestion.reasoning,
      issueFingerprint: buildSuggestionFingerprint(
        input.entityType,
        input.entitySlug,
        suggestion.fieldKey,
      ),
      sessionId: input.sessionId,
    });
  }

  return drafts;
}

/**
 * Sync editorial scan results into the notification work queue.
 * - Active fingerprint → update in place (no duplicates)
 * - Reviewed + issue persists → stay reviewed (no duplicate)
 * - Missing fingerprint → auto-resolve (keep history)
 * - Resolved + issue returns → brand new notification
 */
export async function syncEditorialNotifications(input: {
  entityType: StudioReviewEntityType;
  entityId: string;
  sessionId: string;
  checks: QualityCheckItem[];
  suggestions: AiSuggestionDraft[];
}): Promise<number> {
  const [entityLabel, entityHref, entitySlug] = await Promise.all([
    resolveEntityName(input.entityType, input.entityId),
    resolveEntityHref(input.entityType, input.entityId),
    resolveEntitySlug(input.entityType, input.entityId),
  ]);

  const drafts = draftsFromReview({
    entityType: input.entityType,
    entityId: input.entityId,
    entitySlug,
    entityLabel,
    entityHref,
    sessionId: input.sessionId,
    checks: input.checks,
    suggestions: input.suggestions,
  });

  const currentFingerprints = new Set(drafts.map((d) => d.issueFingerprint));
  const now = new Date();

  const openRows = await prisma.platformNotification.findMany({
    where: {
      source: "EDITORIAL_INTELLIGENCE",
      entityType: input.entityType,
      entityId: input.entityId,
      status: { in: ["ACTIVE", "REVIEWED"] },
    },
  });

  for (const row of openRows) {
    if (!currentFingerprints.has(row.issueFingerprint)) {
      await prisma.platformNotification.update({
        where: { id: row.id },
        data: {
          status: "RESOLVED",
          resolvedAt: now,
          resolvedAutomatically: true,
          closedAt: now,
        },
      });
    }
  }

  let created = 0;

  for (const draft of drafts) {
    const active = await prisma.platformNotification.findFirst({
      where: { issueFingerprint: draft.issueFingerprint, status: "ACTIVE" },
    });

    if (active) {
      await prisma.platformNotification.update({
        where: { id: active.id },
        data: {
          title: draft.title,
          description: draft.description,
          severity: draft.severity,
          category: draft.category,
          entityLabel: draft.entityLabel,
          entityHref: draft.entityHref,
          sessionId: draft.sessionId,
        },
      });
      continue;
    }

    const reviewed = openRows.find(
      (row) => row.issueFingerprint === draft.issueFingerprint && row.status === "REVIEWED",
    );
    if (reviewed) continue;

    const lastResolved = await prisma.platformNotification.findFirst({
      where: {
        issueFingerprint: draft.issueFingerprint,
        status: { in: ["RESOLVED", "CLOSED"] },
      },
      orderBy: { resolvedAt: "desc" },
    });

    if (!lastResolved) {
      const anyOpen = await prisma.platformNotification.findFirst({
        where: {
          issueFingerprint: draft.issueFingerprint,
          status: { in: ["ACTIVE", "REVIEWED"] },
        },
      });
      if (!anyOpen) {
        await prisma.platformNotification.create({ data: draft });
        created += 1;
      }
      continue;
    }

    await prisma.platformNotification.create({ data: draft });
    created += 1;
  }

  return created;
}

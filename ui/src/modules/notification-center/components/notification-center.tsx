"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Bell, Check, CheckCheck, ExternalLink, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getNotificationCenterData,
  markAllNotificationsAsReviewed,
  markNotificationAsReviewed,
  markNotificationCategoryAsReviewed,
} from "@/modules/notification-center/actions/notification-actions";
import {
  FILTER_LABELS,
  SEVERITY_LABELS,
  SEVERITY_ORDER,
  type NotificationCenterData,
  type NotificationFilter,
  type NotificationView,
} from "@/modules/notification-center/types";
import { STUDIO_WORK_QUEUE_PATH } from "@/modules/studio/lib/studio-routes";
import type { PlatformNotificationSeverity } from "@/generated/prisma/client";

const POLL_MS = 30_000;

function severityVariant(severity: PlatformNotificationSeverity): "coral" | "muted" | "ocean" {
  switch (severity) {
    case "CRITICAL":
      return "coral";
    case "WARNING":
      return "muted";
    default:
      return "ocean";
  }
}

function NotificationRow({
  item,
  onReviewed,
  showReviewAction,
}: {
  item: NotificationView;
  onReviewed: () => void;
  showReviewAction: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <article className="border-border space-y-2 border-b px-4 py-3 last:border-b-0">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={severityVariant(item.severity)} className="text-[10px]">
            {SEVERITY_LABELS[item.severity]}
          </Badge>
          {item.entityName ? (
            <span className="text-muted-foreground truncate text-xs">{item.entityName}</span>
          ) : null}
          {item.category ? (
            <span className="text-muted-foreground text-[10px]">{item.category}</span>
          ) : null}
        </div>
        <h3 className="text-sm font-medium">{item.title}</h3>
        <p className="text-muted-foreground text-xs leading-relaxed">{item.description}</p>
        <p className="text-muted-foreground text-[10px]">
          {new Date(item.createdAt).toLocaleString()}
          {item.reviewedAt ? ` · Reviewed ${new Date(item.reviewedAt).toLocaleString()}` : null}
          {item.resolvedAt ? ` · Resolved ${new Date(item.resolvedAt).toLocaleString()}` : null}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {item.entityHref ? (
          <Link
            href={item.entityHref}
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            <ExternalLink className="mr-1 size-3" />
            Open entity
          </Link>
        ) : null}
        {showReviewAction ? (
          <button
            type="button"
            disabled={pending}
            className={buttonVariants({ size: "sm", variant: "ghost" })}
            onClick={() => {
              startTransition(async () => {
                await markNotificationAsReviewed(item.id);
                onReviewed();
              });
            }}
          >
            <Check className="mr-1 size-3" />
            Mark reviewed
          </button>
        ) : null}
      </div>
    </article>
  );
}

function CategorySection({
  severity,
  items,
  onReviewed,
  showReviewAction,
}: {
  severity: PlatformNotificationSeverity;
  items: NotificationView[];
  onReviewed: () => void;
  showReviewAction: boolean;
}) {
  const [pending, startTransition] = useTransition();
  if (items.length === 0) return null;

  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <section className="space-y-1">
      <div className="bg-muted/30 flex items-center justify-between px-4 py-2">
        <h3 className="text-xs font-semibold tracking-wide uppercase">
          {SEVERITY_LABELS[severity]} ({sorted.length})
        </h3>
        {showReviewAction ? (
          <button
            type="button"
            disabled={pending}
            className={buttonVariants({ size: "sm", variant: "ghost" })}
            onClick={() => {
              startTransition(async () => {
                await markNotificationCategoryAsReviewed(severity);
                onReviewed();
              });
            }}
          >
            Mark category reviewed
          </button>
        ) : null}
      </div>
      {sorted.map((item) => (
        <NotificationRow
          key={item.id}
          item={item}
          onReviewed={onReviewed}
          showReviewAction={showReviewAction}
        />
      ))}
    </section>
  );
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>("unread");
  const [data, setData] = useState<NotificationCenterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [bulkPending, startBulkTransition] = useTransition();

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await getNotificationCenterData(filter);
    if ("unresolvedCount" in result) {
      setData(result);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const grouped = SEVERITY_ORDER.reduce(
    (acc, severity) => {
      acc[severity] = data?.notifications.filter((n) => n.severity === severity) ?? [];
      return acc;
    },
    {} as Record<PlatformNotificationSeverity, NotificationView[]>,
  );

  const showReviewActions = filter === "unread" || filter === "all";
  const unresolvedCount = data?.unresolvedCount ?? 0;

  return (
    <>
      <button
        type="button"
        aria-label={`Notifications, ${unresolvedCount} unresolved`}
        className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "relative size-9 p-0")}
        onClick={() => setOpen(true)}
      >
        <Bell className="size-4" />
        {unresolvedCount > 0 ? (
          <span className="bg-coral absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white">
            {unresolvedCount > 99 ? "99+" : unresolvedCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close notification panel"
            className="absolute inset-0 bg-black/20 sm:bg-black/30"
            onClick={() => setOpen(false)}
          />
          <aside
            className="bg-background border-border relative flex h-full w-full max-w-md flex-col border-l shadow-xl sm:max-w-lg"
            role="complementary"
            aria-label="Notification center"
          >
            <header className="border-border space-y-3 border-b px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Editorial Notifications</h2>
                  <p className="text-muted-foreground text-xs">
                    {unresolvedCount} unresolved · work queue
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  className={buttonVariants({ size: "sm", variant: "ghost" })}
                  onClick={() => setOpen(false)}
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {(Object.keys(FILTER_LABELS) as NotificationFilter[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs transition-colors",
                      filter === key
                        ? "bg-ocean/10 text-ocean font-medium"
                        : "text-muted-foreground hover:bg-muted/50",
                    )}
                    onClick={() => setFilter(key)}
                  >
                    {FILTER_LABELS[key]}
                  </button>
                ))}
              </div>
            </header>

            {showReviewActions && data && data.notifications.some((n) => n.status === "ACTIVE") ? (
              <div className="border-border flex flex-wrap gap-2 border-b px-4 py-2">
                <button
                  type="button"
                  disabled={bulkPending}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                  onClick={() => {
                    startBulkTransition(async () => {
                      await markAllNotificationsAsReviewed();
                      await refresh();
                    });
                  }}
                >
                  <CheckCheck className="mr-1 size-3" />
                  Mark all reviewed
                </button>
                <Link href={STUDIO_WORK_QUEUE_PATH} className={buttonVariants({ size: "sm", variant: "ghost" })}>
                  Open work queue
                </Link>
              </div>
            ) : null}

            <div className="flex-1 overflow-y-auto">
              {loading && !data ? (
                <p className="text-muted-foreground px-4 py-8 text-sm">Loading…</p>
              ) : data && data.notifications.length === 0 ? (
                <p className="text-muted-foreground px-4 py-8 text-sm">
                  No notifications in this view. Unresolved issues reappear after the next editorial scan.
                </p>
              ) : (
                SEVERITY_ORDER.map((severity) => (
                  <CategorySection
                    key={severity}
                    severity={severity}
                    items={grouped[severity]}
                    onReviewed={() => void refresh()}
                    showReviewAction={showReviewActions}
                  />
                ))
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

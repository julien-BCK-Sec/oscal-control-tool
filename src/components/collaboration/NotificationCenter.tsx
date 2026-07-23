"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { NotificationView } from "@/components/collaboration/notification-presentation";
import {
  countUnreadNotificationsAction,
  deleteNotificationAction,
  listNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/notifications";
import { organization } from "@/auth/client";
import { Button } from "@/components/design-system/button/Button";
import { formatControlActivityTimestamp } from "@/data/control-activity";

export type NotificationCenterProps = {
  /** Optional organization context label for screen readers. */
  label?: string;
};

/**
 * In-app notification center (Milestone 02A WP4). Loads the signed-in user's
 * notifications; email delivery is out of scope.
 */
export function NotificationCenter({
  label = "Notifications",
}: NotificationCenterProps) {
  const router = useRouter();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationView[]>([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      try {
        const [list, count] = await Promise.all([
          listNotificationsAction({ limit: 30 }),
          countUnreadNotificationsAction(),
        ]);
        setItems(list);
        setUnread(count);
        setError(null);
      } catch {
        setError("Unable to load notifications.");
      }
    });
  }

  useEffect(() => {
    refresh();
  }, []);

  function onToggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      refresh();
    }
  }

  function onMarkRead(id: string) {
    startTransition(async () => {
      await markNotificationReadAction(id);
      refresh();
    });
  }

  function onMarkAll() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      refresh();
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      await deleteNotificationAction(id);
      refresh();
    });
  }

  function onOpen(item: NotificationView) {
    startTransition(async () => {
      if (!item.readAt) {
        await markNotificationReadAction(item.id);
      }
      try {
        await organization.setActive({
          organizationId: item.organizationId,
        });
      } catch {
        // Active-org switch is best-effort; project load still authorizes
        // against the project's organization membership.
      }
      if (item.href) {
        setOpen(false);
        router.push(item.href);
        return;
      }
      refresh();
    });
  }

  const unreadLabel =
    unread > 0
      ? `${unread} unread notification${unread === 1 ? "" : "s"}`
      : "No unread notifications";

  return (
    <div className="relative">
      <Button
        type="button"
        variant="default"
        size="sm"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${label}. ${unreadLabel}`}
        onClick={onToggle}
      >
        Notifications
        {unread > 0 ? (
          <span
            className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-sm bg-danger px-1 text-xs font-medium text-white"
            aria-hidden="true"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div
          id={panelId}
          role="region"
          aria-label={label}
          className="absolute right-0 z-20 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-md border border-border bg-surface shadow-md"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
            <p className="text-sm font-medium text-text-primary">{label}</p>
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={pending || unread === 0}
              onClick={onMarkAll}
            >
              Mark all read
            </Button>
          </div>

          {error ? (
            <p className="px-3 py-4 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {!error && items.length === 0 ? (
            <p className="px-3 py-6 text-sm text-text-secondary">
              No notifications yet.
            </p>
          ) : null}

          <ul className="max-h-96 overflow-y-auto">
            {items.map((item) => {
              const isUnread = !item.readAt;
              const metaParts = [
                item.projectName,
                item.controlIdDisplay,
                item.controlTitle,
                item.eventTypeLabel,
              ].filter((part): part is string => Boolean(part));

              return (
                <li
                  key={item.id}
                  className={`border-b border-border px-3 py-3 last:border-b-0 ${
                    isUnread ? "bg-accent-muted/40" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="block w-full rounded-sm text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    disabled={pending || !item.href}
                    onClick={() => onOpen(item)}
                  >
                    {isUnread ? (
                      <span className="sr-only">Unread. </span>
                    ) : null}
                    <p className="text-sm font-medium text-text-primary">
                      {item.summary}
                    </p>
                    {metaParts.length > 0 ? (
                      <p className="mt-1 text-xs text-text-secondary">
                        {metaParts.join(" · ")}
                      </p>
                    ) : null}
                    {item.preview ? (
                      <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                        {item.preview}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-text-muted">
                      {formatControlActivityTimestamp(item.createdAt)}
                    </p>
                  </button>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {isUnread ? (
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        disabled={pending}
                        onClick={() => onMarkRead(item.id)}
                      >
                        Mark read
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      disabled={pending}
                      onClick={() => onDelete(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

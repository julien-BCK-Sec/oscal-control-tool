/**
 * Presentation helpers for the in-app notification center.
 * Pure functions only — no persistence or authorization.
 */

import {
  NOTIFICATION_EVENT_TYPES,
  type Notification,
  type NotificationEventType,
} from "@/data/collaboration";
import { FRAMEWORK_CONTROLS } from "@/data/framework";
import { formatControlIdDisplay } from "@/components/controlBrowser/presentation";

const EVENT_TYPE_LABELS: Record<NotificationEventType, string> = {
  comment_mention: "Mention",
  comment_reply: "Reply",
  discussion_resolved: "Discussion resolved",
  assignment_created: "Assignment",
  assignment_reassigned: "Reassignment",
  assignment_completed: "Assignment completed",
  assignment_removed: "Assignment removed",
};

const PREVIEW_MAX_LENGTH = 140;

const controlById = new Map(
  FRAMEWORK_CONTROLS.map((control) => [control.id, control] as const),
);

export type NotificationView = Notification & {
  projectName: string | null;
  controlIdDisplay: string | null;
  controlTitle: string | null;
  eventTypeLabel: string;
  preview: string | null;
  href: string | null;
};

export function formatNotificationEventType(
  eventType: NotificationEventType,
): string {
  return EVENT_TYPE_LABELS[eventType] ?? eventType;
}

export function resolveControlTitle(controlId: string | null): string | null {
  if (!controlId) {
    return null;
  }
  return controlById.get(controlId)?.title ?? null;
}

export function resolveControlIdDisplay(
  controlId: string | null,
): string | null {
  if (!controlId) {
    return null;
  }
  return formatControlIdDisplay(controlId);
}

/** Truncate comment body for notification list previews. */
export function truncateNotificationPreview(
  body: string | null | undefined,
  maxLength: number = PREVIEW_MAX_LENGTH,
): string | null {
  if (typeof body !== "string") {
    return null;
  }
  const trimmed = body.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return null;
  }
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

/**
 * Deep-link into the project workspace Controls tab.
 * Comment id is included only for comment-related notifications.
 */
export function buildNotificationHref(
  notification: Pick<
    Notification,
    "projectId" | "controlId" | "relatedObjectType" | "relatedObjectId"
  >,
): string | null {
  const projectId = notification.projectId?.trim();
  if (!projectId) {
    return null;
  }
  const params = new URLSearchParams();
  params.set("view", "controls");
  const controlId = notification.controlId?.trim();
  if (controlId) {
    params.set("control", controlId);
  }
  if (
    notification.relatedObjectType === "comment" &&
    notification.relatedObjectId.trim()
  ) {
    params.set("comment", notification.relatedObjectId.trim());
  }
  return `/projects/${encodeURIComponent(projectId)}?${params.toString()}`;
}

export function isNotificationEventTypeLabelKnown(
  value: string,
): value is NotificationEventType {
  return (NOTIFICATION_EVENT_TYPES as readonly string[]).includes(value);
}

export function toNotificationView(
  notification: Notification,
  enrichment: {
    projectName?: string | null;
    preview?: string | null;
  } = {},
): NotificationView {
  return {
    ...notification,
    projectName: enrichment.projectName ?? null,
    controlIdDisplay: resolveControlIdDisplay(notification.controlId),
    controlTitle: resolveControlTitle(notification.controlId),
    eventTypeLabel: formatNotificationEventType(notification.eventType),
    preview: enrichment.preview ?? null,
    href: buildNotificationHref(notification),
  };
}

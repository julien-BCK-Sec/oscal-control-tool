import { controlActivityTypeLabel } from "./labels";
import { formatActivityFieldDisplayValue } from "./diff";
import type { ControlActivity } from "./types";

function actorLabel(activity: ControlActivity): string {
  const name = activity.actorDisplayName?.trim();
  return name && name.length > 0 ? name : "System";
}

/**
 * Compact one-line summary for the History panel.
 * Does not expose metadataJson.
 */
export function formatControlActivitySummary(activity: ControlActivity): string {
  const actor = actorLabel(activity);

  switch (activity.activityType) {
    case "control_record_created":
      return `${actor} created the control record`;
    case "owner_changed":
      return `${actor} assigned owner to ${formatActivityFieldDisplayValue("owner", activity.newValue)}`;
    case "co_owner_changed":
      return `${actor} assigned co-owner to ${formatActivityFieldDisplayValue("coOwner", activity.newValue)}`;
    case "business_unit_changed":
      return `${actor} set business unit to ${formatActivityFieldDisplayValue("businessUnit", activity.newValue)}`;
    case "implementation_status_changed": {
      const from = formatActivityFieldDisplayValue(
        "implementationStatus",
        activity.previousValue,
      );
      const to = formatActivityFieldDisplayValue(
        "implementationStatus",
        activity.newValue,
      );
      return `${actor} changed implementation status from ${from} to ${to}`;
    }
    case "review_due_date_changed":
      return `${actor} set review due date to ${formatActivityFieldDisplayValue("reviewDueDate", activity.newValue)}`;
    default:
      return `${actor} ${controlActivityTypeLabel(activity.activityType).toLowerCase()}`;
  }
}

/**
 * Relative-friendly timestamp label for history rows.
 * Falls back to a locale date string for older events.
 */
export function formatControlActivityTimestamp(
  createdAt: string,
  now: Date = new Date(),
): string {
  const then = new Date(createdAt);
  if (Number.isNaN(then.getTime())) {
    return createdAt;
  }

  const diffMs = now.getTime() - then.getTime();
  if (diffMs < 0) {
    return then.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) {
    return "Yesterday";
  }
  if (days < 7) {
    return `${days} days ago`;
  }

  return then.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

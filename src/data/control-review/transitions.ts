import type { ControlReviewStatus } from "@/data/control-record";
import type {
  ControlReviewAction,
  ControlReviewTransition,
} from "./types";

export const CONTROL_REVIEW_ACTIONS: readonly ControlReviewAction[] = [
  "submit_for_review",
  "start_review",
  "approve_review",
  "request_changes",
  "resubmit_for_review",
  "reopen_review",
] as const;

/**
 * Canonical legal transitions. UI and services must use this table —
 * do not duplicate transition rules in React components.
 */
export const CONTROL_REVIEW_TRANSITIONS: readonly ControlReviewTransition[] = [
  {
    action: "submit_for_review",
    from: "not_reviewed",
    to: "ready_for_review",
    activityType: "review_requested",
    label: "Submit for Review",
  },
  {
    action: "start_review",
    from: "ready_for_review",
    to: "under_review",
    activityType: "review_started",
    label: "Start Review",
  },
  {
    action: "approve_review",
    from: "under_review",
    to: "approved",
    activityType: "review_approved",
    label: "Approve",
  },
  {
    action: "request_changes",
    from: "under_review",
    to: "changes_requested",
    activityType: "changes_requested",
    label: "Request Changes",
  },
  {
    action: "resubmit_for_review",
    from: "changes_requested",
    to: "ready_for_review",
    activityType: "review_resubmitted",
    label: "Resubmit for Review",
  },
  {
    action: "reopen_review",
    from: "approved",
    to: "ready_for_review",
    activityType: "review_reopened",
    label: "Reopen Review",
  },
] as const;

export const CONTROL_REVIEW_ACTION_LABELS: Record<ControlReviewAction, string> =
  {
    submit_for_review: "Submit for Review",
    start_review: "Start Review",
    approve_review: "Approve",
    request_changes: "Request Changes",
    resubmit_for_review: "Resubmit for Review",
    reopen_review: "Reopen Review",
  };

export function isControlReviewAction(
  value: unknown,
): value is ControlReviewAction {
  return (
    typeof value === "string" &&
    (CONTROL_REVIEW_ACTIONS as readonly string[]).includes(value)
  );
}

export function controlReviewActionLabel(action: ControlReviewAction): string {
  return CONTROL_REVIEW_ACTION_LABELS[action];
}

/** Actions legal from the given review status (for UI buttons). */
export function getAvailableReviewActions(
  status: ControlReviewStatus,
): ControlReviewAction[] {
  return CONTROL_REVIEW_TRANSITIONS.filter(
    (transition) => transition.from === status,
  ).map((transition) => transition.action);
}

/** Resolve a legal transition for (status, action), or null if illegal. */
export function resolveReviewTransition(
  from: ControlReviewStatus,
  action: ControlReviewAction,
): ControlReviewTransition | null {
  return (
    CONTROL_REVIEW_TRANSITIONS.find(
      (transition) => transition.from === from && transition.action === action,
    ) ?? null
  );
}

/**
 * True when `to` is reachable from `from` via some legal action.
 * Direct arbitrary status assignment is never allowed through APIs.
 */
export function isLegalReviewStatusTransition(
  from: ControlReviewStatus,
  to: ControlReviewStatus,
): boolean {
  return CONTROL_REVIEW_TRANSITIONS.some(
    (transition) => transition.from === from && transition.to === to,
  );
}

import type {
  ControlActivityType,
  ControlActivityTypeSupported,
} from "./types";

export const CONTROL_ACTIVITY_TYPES_SUPPORTED: readonly ControlActivityTypeSupported[] =
  [
    "control_record_created",
    "owner_changed",
    "co_owner_changed",
    "business_unit_changed",
    "implementation_status_changed",
    "review_due_date_changed",
    "review_requested",
    "review_started",
    "review_approved",
    "changes_requested",
    "review_resubmitted",
    "review_reopened",
    "comment_added",
    "comment_edited",
    "comment_deleted",
    "comment_restored",
    "comment_resolved",
    "discussion_reopened",
    "assignment_changed",
    "assignment_completed",
    "assignment_removed",
  ] as const;

export const CONTROL_ACTIVITY_TYPE_LABELS: Record<ControlActivityType, string> =
  {
    control_record_created: "Created the control record",
    owner_changed: "Changed owner",
    co_owner_changed: "Changed co-owner",
    business_unit_changed: "Changed business unit",
    implementation_status_changed: "Changed implementation status",
    review_due_date_changed: "Changed review due date",
    review_requested: "Submitted the control for review",
    review_started: "Started the review",
    review_approved: "Approved the review",
    changes_requested: "Requested changes",
    review_resubmitted: "Resubmitted the control for review",
    review_reopened: "Reopened the review",
    implementation_updated: "Updated implementation",
    parameter_changed: "Changed parameter",
    comment_added: "Added a comment",
    comment_edited: "Edited a comment",
    comment_deleted: "Deleted a comment",
    comment_restored: "Restored a comment",
    comment_resolved: "Resolved a discussion",
    discussion_reopened: "Reopened a discussion",
    evidence_added: "Added evidence",
    evidence_removed: "Removed evidence",
    assignment_changed: "Changed assignment",
    assignment_completed: "Completed an assignment",
    assignment_removed: "Removed an assignment",
  };

export function isControlActivityType(
  value: unknown,
): value is ControlActivityType {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(CONTROL_ACTIVITY_TYPE_LABELS, value)
  );
}

export function controlActivityTypeLabel(type: ControlActivityType): string {
  return CONTROL_ACTIVITY_TYPE_LABELS[type];
}

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
  ] as const;

export const CONTROL_ACTIVITY_TYPE_LABELS: Record<ControlActivityType, string> =
  {
    control_record_created: "Created the control record",
    owner_changed: "Changed owner",
    co_owner_changed: "Changed co-owner",
    business_unit_changed: "Changed business unit",
    implementation_status_changed: "Changed implementation status",
    review_due_date_changed: "Changed review due date",
    implementation_updated: "Updated implementation",
    parameter_changed: "Changed parameter",
    comment_added: "Added a comment",
    comment_resolved: "Resolved a comment",
    review_requested: "Requested review",
    review_approved: "Approved review",
    changes_requested: "Requested changes",
    evidence_added: "Added evidence",
    evidence_removed: "Removed evidence",
    assignment_changed: "Changed assignment",
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

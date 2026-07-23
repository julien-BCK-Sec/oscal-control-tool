import {
  controlImplementationStatusLabel,
  controlReviewStatusLabel,
  evidenceRequirementLabel,
  isControlImplementationStatus,
  isControlReviewStatus,
  isEvidenceRequirement,
  type ControlRecordFields,
} from "@/data/control-record";
import type { ControlActivityTypeSupported } from "./types";

export type ControlRecordFieldChange = {
  activityType: Exclude<
    ControlActivityTypeSupported,
    | "control_record_created"
    | "review_requested"
    | "review_started"
    | "review_approved"
    | "changes_requested"
    | "review_resubmitted"
    | "review_reopened"
    | "comment_added"
    | "comment_edited"
    | "comment_deleted"
    | "comment_restored"
    | "comment_resolved"
    | "discussion_reopened"
    | "assignment_changed"
    | "assignment_completed"
    | "assignment_removed"
    | "evidence_added"
    | "evidence_removed"
  >;
  fieldName: keyof ControlRecordFields;
  previousValue: string | null;
  newValue: string | null;
};

/** Store empty strings as null in the activity stream. */
export function activityValueOrNull(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  return value.trim() === "" ? null : value;
}

function fieldEquals(a: string | null, b: string | null): boolean {
  return activityValueOrNull(a) === activityValueOrNull(b);
}

/**
 * Diff persisted vs incoming ControlRecord fields.
 * Used to emit only real changes (no-op autosaves produce an empty list).
 */
export function detectControlRecordFieldChanges(
  previous: ControlRecordFields,
  next: ControlRecordFields,
): ControlRecordFieldChange[] {
  const changes: ControlRecordFieldChange[] = [];

  if (!fieldEquals(previous.owner, next.owner)) {
    changes.push({
      activityType: "owner_changed",
      fieldName: "owner",
      previousValue: activityValueOrNull(previous.owner),
      newValue: activityValueOrNull(next.owner),
    });
  }
  if (!fieldEquals(previous.coOwner, next.coOwner)) {
    changes.push({
      activityType: "co_owner_changed",
      fieldName: "coOwner",
      previousValue: activityValueOrNull(previous.coOwner),
      newValue: activityValueOrNull(next.coOwner),
    });
  }
  if (!fieldEquals(previous.businessUnit, next.businessUnit)) {
    changes.push({
      activityType: "business_unit_changed",
      fieldName: "businessUnit",
      previousValue: activityValueOrNull(previous.businessUnit),
      newValue: activityValueOrNull(next.businessUnit),
    });
  }
  if (previous.implementationStatus !== next.implementationStatus) {
    changes.push({
      activityType: "implementation_status_changed",
      fieldName: "implementationStatus",
      previousValue: previous.implementationStatus,
      newValue: next.implementationStatus,
    });
  }
  if (!fieldEquals(previous.reviewDueDate, next.reviewDueDate)) {
    changes.push({
      activityType: "review_due_date_changed",
      fieldName: "reviewDueDate",
      previousValue: activityValueOrNull(previous.reviewDueDate),
      newValue: activityValueOrNull(next.reviewDueDate),
    });
  }
  if (previous.evidenceRequirement !== next.evidenceRequirement) {
    changes.push({
      activityType: "evidence_requirement_changed",
      fieldName: "evidenceRequirement",
      previousValue: previous.evidenceRequirement,
      newValue: next.evidenceRequirement,
    });
  }

  return changes;
}

/** Human-readable value for history lines (status labels, Unassigned, etc.). */
export function formatActivityFieldDisplayValue(
  fieldName: string | null,
  value: string | null,
): string {
  if (value === null || value.trim() === "") {
    if (fieldName === "owner" || fieldName === "coOwner") {
      return "Unassigned";
    }
    if (fieldName === "reviewDueDate") {
      return "None";
    }
    return "Empty";
  }
  if (
    fieldName === "implementationStatus" &&
    isControlImplementationStatus(value)
  ) {
    return controlImplementationStatusLabel(value);
  }
  if (fieldName === "reviewStatus" && isControlReviewStatus(value)) {
    return controlReviewStatusLabel(value);
  }
  if (fieldName === "evidenceRequirement" && isEvidenceRequirement(value)) {
    return evidenceRequirementLabel(value);
  }
  return value;
}

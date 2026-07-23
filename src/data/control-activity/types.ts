/**
 * Append-only activity stream for ControlRecord operational metadata.
 * Separate from OSCAL / project_json document history.
 */

/** Emitted by ControlRecord metadata saves, review transitions, and collaboration. */
export type ControlActivityTypeSupported =
  | "control_record_created"
  | "owner_changed"
  | "co_owner_changed"
  | "business_unit_changed"
  | "implementation_status_changed"
  | "review_due_date_changed"
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
  | "evidence_requirement_changed";

/**
 * Reserved for future narrative / parameter events.
 * Included in the union so new emitters can extend without renames.
 */
export type ControlActivityTypeFuture =
  | "implementation_updated"
  | "parameter_changed";

export type ControlActivityType =
  | ControlActivityTypeSupported
  | ControlActivityTypeFuture;

export type ControlActivity = {
  id: string;
  controlRecordId: string;
  activityType: ControlActivityType;
  actorId: string | null;
  actorDisplayName: string | null;
  fieldName: string | null;
  previousValue: string | null;
  newValue: string | null;
  /** Opaque JSON string for future structured payloads; not shown in MVP UI. */
  metadataJson: string | null;
  createdAt: string;
};

export type AppendControlActivityInput = {
  controlRecordId: string;
  activityType: ControlActivityType;
  actorId?: string | null;
  actorDisplayName?: string | null;
  fieldName?: string | null;
  previousValue?: string | null;
  newValue?: string | null;
  metadataJson?: string | null;
  /** Defaults to now when omitted. */
  createdAt?: string;
};

export type ListControlActivitiesOptions = {
  /** Maximum rows to return (newest first). */
  limit?: number;
  /** ISO timestamp cursor: return activities created strictly before this. */
  beforeCreatedAt?: string;
};

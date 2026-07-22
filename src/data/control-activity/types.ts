/**
 * Append-only activity stream for ControlRecord operational metadata.
 * Separate from OSCAL / project_json document history.
 */

/** Currently emitted by ControlRecord metadata saves. */
export type ControlActivityTypeSupported =
  | "control_record_created"
  | "owner_changed"
  | "co_owner_changed"
  | "business_unit_changed"
  | "implementation_status_changed"
  | "review_due_date_changed";

/**
 * Reserved for future workflow / comment / evidence events.
 * Included in the union so new emitters can extend without renames.
 */
export type ControlActivityTypeFuture =
  | "implementation_updated"
  | "parameter_changed"
  | "comment_added"
  | "comment_resolved"
  | "review_requested"
  | "review_approved"
  | "changes_requested"
  | "evidence_added"
  | "evidence_removed"
  | "assignment_changed";

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

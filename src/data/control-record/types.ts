/**
 * Application-level control implementation lifecycle.
 * Separate from OSCAL, from ControlImplementation.status (narrative editor),
 * and from reviewStatus (review workflow).
 */
export type ControlImplementationStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "implemented"
  | "deprecated";

/**
 * Review workflow lifecycle for a control in a project.
 * Independent of implementationStatus; changed only via controlled transitions.
 */
export type ControlReviewStatus =
  | "not_reviewed"
  | "ready_for_review"
  | "under_review"
  | "changes_requested"
  | "approved";

/**
 * Editable Control Freak metadata for one control in a project.
 * References an OSCAL/framework control id; never mixed into OSCAL models.
 * Does not include reviewStatus — that changes only through workflow transitions.
 */
export type ControlRecordFields = {
  owner: string;
  coOwner: string;
  businessUnit: string;
  implementationStatus: ControlImplementationStatus;
  /** ISO date `YYYY-MM-DD`, or null when unset. */
  reviewDueDate: string | null;
};

/**
 * Persisted ControlRecord row (application DTO, no Drizzle types).
 * Future ControlComment / evidence / etc. reference `id`.
 */
export type ControlRecord = ControlRecordFields & {
  id: string;
  projectId: string;
  /** Framework / OSCAL control identifier (e.g. `ac-2`). */
  controlId: string;
  reviewStatus: ControlReviewStatus;
  createdAt: string;
  updatedAt: string;
};

export type UpsertControlRecordInput = ControlRecordFields & {
  controlId: string;
};

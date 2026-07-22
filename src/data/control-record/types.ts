/**
 * Application-level control implementation lifecycle.
 * Separate from OSCAL, from ControlImplementation.status (narrative editor),
 * and from a future reviewStatus workflow field.
 */
export type ControlImplementationStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "implemented"
  | "deprecated";

/**
 * Editable Control Freak metadata for one control in a project.
 * References an OSCAL/framework control id; never mixed into OSCAL models.
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
 * Future ControlComment / ControlReview / etc. reference `id`.
 */
export type ControlRecord = ControlRecordFields & {
  id: string;
  projectId: string;
  /** Framework / OSCAL control identifier (e.g. `ac-2`). */
  controlId: string;
  createdAt: string;
  updatedAt: string;
};

export type UpsertControlRecordInput = ControlRecordFields & {
  controlId: string;
};

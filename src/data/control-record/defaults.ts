import type {
  ControlRecordFields,
  ControlImplementationStatus,
} from "./types";

export const CONTROL_IMPLEMENTATION_STATUSES: readonly ControlImplementationStatus[] =
  [
    "draft",
    "in_review",
    "approved",
    "implemented",
    "deprecated",
  ] as const;

export const CONTROL_IMPLEMENTATION_STATUS_LABELS: Record<
  ControlImplementationStatus,
  string
> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  implemented: "Implemented",
  deprecated: "Deprecated",
};

export const DEFAULT_CONTROL_RECORD_FIELDS: ControlRecordFields = {
  owner: "",
  coOwner: "",
  businessUnit: "",
  implementationStatus: "draft",
  reviewDueDate: null,
};

export function controlImplementationStatusLabel(
  status: ControlImplementationStatus,
): string {
  return CONTROL_IMPLEMENTATION_STATUS_LABELS[status];
}

/** True when owner is empty (unassigned). */
export function isControlOwnerUnassigned(owner: string): boolean {
  return owner.trim() === "";
}

export function displayControlOwner(owner: string): string {
  const trimmed = owner.trim();
  return trimmed === "" ? "Unassigned" : trimmed;
}

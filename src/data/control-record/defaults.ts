import {
  DEFAULT_EVIDENCE_REQUIREMENT,
  evidenceRequirementLabel,
  isEvidenceRequirement,
} from "@/data/evidence/defaults";
import type { EvidenceRequirement } from "@/data/evidence/types";
import type {
  ControlRecordFields,
  ControlImplementationStatus,
  ControlReviewStatus,
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

export const CONTROL_REVIEW_STATUSES: readonly ControlReviewStatus[] = [
  "not_reviewed",
  "ready_for_review",
  "under_review",
  "changes_requested",
  "approved",
] as const;

export const CONTROL_REVIEW_STATUS_LABELS: Record<ControlReviewStatus, string> =
  {
    not_reviewed: "Not Reviewed",
    ready_for_review: "Ready for Review",
    under_review: "Under Review",
    changes_requested: "Changes Requested",
    approved: "Approved",
  };

export const DEFAULT_CONTROL_REVIEW_STATUS: ControlReviewStatus = "not_reviewed";

export const DEFAULT_CONTROL_RECORD_FIELDS: ControlRecordFields = {
  owner: "",
  coOwner: "",
  businessUnit: "",
  implementationStatus: "draft",
  reviewDueDate: null,
  evidenceRequirement: DEFAULT_EVIDENCE_REQUIREMENT,
};

export { evidenceRequirementLabel, isEvidenceRequirement };
export type { EvidenceRequirement };

export function controlImplementationStatusLabel(
  status: ControlImplementationStatus,
): string {
  return CONTROL_IMPLEMENTATION_STATUS_LABELS[status];
}

export function controlReviewStatusLabel(status: ControlReviewStatus): string {
  return CONTROL_REVIEW_STATUS_LABELS[status];
}

/** True when owner is empty (unassigned). */
export function isControlOwnerUnassigned(owner: string): boolean {
  return owner.trim() === "";
}

export function displayControlOwner(owner: string): string {
  const trimmed = owner.trim();
  return trimmed === "" ? "Unassigned" : trimmed;
}

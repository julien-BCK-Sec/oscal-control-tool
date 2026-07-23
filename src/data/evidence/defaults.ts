import type {
  EvidenceRequirement,
  EvidenceStatus,
  EvidenceType,
} from "./types";
import {
  EVIDENCE_REQUIREMENTS,
  EVIDENCE_STATUSES,
  EVIDENCE_TYPES,
} from "./types";

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  document: "Document",
  screenshot: "Screenshot",
  log: "Log",
  policy: "Policy",
  attestation: "Attestation",
  other: "Other",
};

export const EVIDENCE_REQUIREMENT_LABELS: Record<EvidenceRequirement, string> =
  {
    required: "Required",
    optional: "Optional",
    not_required: "Not required",
  };

/**
 * Default for new / lazy-created ControlRecords.
 *
 * Required (not optional): compliance posture makes missing evidence visible
 * until authors intentionally set Optional or Not required. The milestone rule
 * “controls are not automatically incomplete when no evidence exists” is
 * satisfied by the explicit requirement enum — Optional / Not required clear
 * the gap — not by defaulting every control to optional.
 */
export const DEFAULT_EVIDENCE_REQUIREMENT: EvidenceRequirement = "required";

export const DEFAULT_EVIDENCE_STATUS: EvidenceStatus = "draft";

export function evidenceStatusLabel(status: EvidenceStatus): string {
  return EVIDENCE_STATUS_LABELS[status];
}

export function evidenceTypeLabel(type: EvidenceType): string {
  return EVIDENCE_TYPE_LABELS[type];
}

export function evidenceRequirementLabel(
  requirement: EvidenceRequirement,
): string {
  return EVIDENCE_REQUIREMENT_LABELS[requirement];
}

export function isEvidenceStatus(value: unknown): value is EvidenceStatus {
  return (
    typeof value === "string" &&
    (EVIDENCE_STATUSES as readonly string[]).includes(value)
  );
}

export function isEvidenceType(value: unknown): value is EvidenceType {
  return (
    typeof value === "string" &&
    (EVIDENCE_TYPES as readonly string[]).includes(value)
  );
}

export function isEvidenceRequirement(
  value: unknown,
): value is EvidenceRequirement {
  return (
    typeof value === "string" &&
    (EVIDENCE_REQUIREMENTS as readonly string[]).includes(value)
  );
}

/**
 * Required + no non-archived linked evidence → missing.
 * Optional / Not required → not missing even with zero evidence.
 */
export function isEvidenceMissing(
  requirement: EvidenceRequirement,
  nonArchivedLinkedCount: number,
): boolean {
  if (requirement !== "required") {
    return false;
  }
  return nonArchivedLinkedCount <= 0;
}

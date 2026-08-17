/**
 * Derived Evidence coverage read models (Milestone 03D).
 * Not a domain aggregate. Not persisted. Not a compliance score.
 */

import { DEFAULT_EVIDENCE_REQUIREMENT } from "./defaults";
import type { EvidenceRequirement } from "./types";

export const CONTROL_EVIDENCE_COVERAGE_STATES = [
  "not_required",
  "optional_absent",
  "optional_present",
  "required_missing",
  "required_present",
] as const;

export type ControlEvidenceCoverageState =
  (typeof CONTROL_EVIDENCE_COVERAGE_STATES)[number];

export const CONTROL_EVIDENCE_COVERAGE_LABELS: Record<
  ControlEvidenceCoverageState,
  string
> = {
  not_required: "Not required",
  optional_absent: "Optional — no evidence",
  optional_present: "Optional — evidence present",
  required_missing: "Required — missing evidence",
  required_present: "Required — evidence present",
};

/** Compact control-tree labels (still text, never color-only). */
export const CONTROL_EVIDENCE_COVERAGE_SHORT_LABELS: Record<
  ControlEvidenceCoverageState,
  string
> = {
  not_required: "Not required",
  optional_absent: "Optional — no evidence",
  optional_present: "Optional — evidence present",
  required_missing: "Missing evidence",
  required_present: "Evidence present",
};

export function isControlEvidenceCoverageState(
  value: unknown,
): value is ControlEvidenceCoverageState {
  return (
    typeof value === "string" &&
    (CONTROL_EVIDENCE_COVERAGE_STATES as readonly string[]).includes(value)
  );
}

export function controlEvidenceCoverageLabel(
  state: ControlEvidenceCoverageState,
): string {
  return CONTROL_EVIDENCE_COVERAGE_LABELS[state];
}

export function controlEvidenceCoverageShortLabel(
  state: ControlEvidenceCoverageState,
): string {
  return CONTROL_EVIDENCE_COVERAGE_SHORT_LABELS[state];
}

/**
 * Presence means at least one eligible `active` linked Evidence record.
 * Draft and archived Evidence do not satisfy coverage.
 */
export function deriveControlCoverageState(
  requirement: EvidenceRequirement,
  activeLinkedCount: number,
): ControlEvidenceCoverageState {
  if (requirement === "not_required") {
    return "not_required";
  }
  const present = activeLinkedCount > 0;
  if (requirement === "optional") {
    return present ? "optional_present" : "optional_absent";
  }
  return present ? "required_present" : "required_missing";
}

export type ControlEvidenceCoverage = {
  projectId: string;
  controlId: string;
  evidenceRequirement: EvidenceRequirement;
  /** Eligible (`active`) linked Evidence. */
  activeEvidenceCount: number;
  /** Active linked Evidence with a current Version. */
  evidenceWithCurrentVersionCount: number;
  draftEvidenceCount: number;
  evidenceWithoutCurrentVersionCount: number;
  /** Non-archived linked Evidence that is due soon. */
  dueSoonCount: number;
  /** Non-archived linked Evidence that is overdue. */
  overdueCount: number;
  coverageState: ControlEvidenceCoverageState;
};

export type ProjectEvidenceSummary = {
  asOfDate: string;
  totalControls: number;
  requiredControls: number;
  requiredWithEvidence: number;
  requiredMissingEvidence: number;
  optionalControls: number;
  notRequiredControls: number;
  dueSoonEvidence: number;
  overdueEvidence: number;
  unlinkedEvidence: number;
  archivedEvidence: number;
  draftEvidence: number;
};

export type ProjectEvidenceCoverageResult = {
  asOfDate: string;
  summary: ProjectEvidenceSummary;
  controls: ControlEvidenceCoverage[];
};

export type LinkedEvidenceFacts = {
  status: "draft" | "active" | "archived";
  hasCurrentVersion: boolean;
  freshness: "current" | "due_soon" | "overdue" | "no_review_date";
};

export function resolveEvidenceRequirement(
  persisted: EvidenceRequirement | null | undefined,
): EvidenceRequirement {
  return persisted ?? DEFAULT_EVIDENCE_REQUIREMENT;
}

export function buildControlEvidenceCoverage(input: {
  projectId: string;
  controlId: string;
  evidenceRequirement: EvidenceRequirement;
  linked: readonly LinkedEvidenceFacts[];
}): ControlEvidenceCoverage {
  let activeEvidenceCount = 0;
  let evidenceWithCurrentVersionCount = 0;
  let draftEvidenceCount = 0;
  let evidenceWithoutCurrentVersionCount = 0;
  let dueSoonCount = 0;
  let overdueCount = 0;

  for (const item of input.linked) {
    if (item.status === "archived") {
      continue;
    }
    if (item.status === "draft") {
      draftEvidenceCount += 1;
    }
    if (item.status === "active") {
      activeEvidenceCount += 1;
      if (item.hasCurrentVersion) {
        evidenceWithCurrentVersionCount += 1;
      } else {
        evidenceWithoutCurrentVersionCount += 1;
      }
    }
    if (item.freshness === "due_soon") {
      dueSoonCount += 1;
    } else if (item.freshness === "overdue") {
      overdueCount += 1;
    }
  }

  return {
    projectId: input.projectId,
    controlId: input.controlId,
    evidenceRequirement: input.evidenceRequirement,
    activeEvidenceCount,
    evidenceWithCurrentVersionCount,
    draftEvidenceCount,
    evidenceWithoutCurrentVersionCount,
    dueSoonCount,
    overdueCount,
    coverageState: deriveControlCoverageState(
      input.evidenceRequirement,
      activeEvidenceCount,
    ),
  };
}

export function formatControlEvidenceCoverageCaption(
  coverage: ControlEvidenceCoverage,
): string {
  const parts = [CONTROL_EVIDENCE_COVERAGE_LABELS[coverage.coverageState]];
  if (coverage.draftEvidenceCount > 0) {
    parts.push(
      `${coverage.draftEvidenceCount} draft${
        coverage.draftEvidenceCount === 1 ? "" : "s"
      }`,
    );
  }
  if (coverage.overdueCount > 0) {
    parts.push(
      `${coverage.overdueCount} overdue`,
    );
  }
  if (coverage.dueSoonCount > 0) {
    parts.push(
      `${coverage.dueSoonCount} due soon`,
    );
  }
  return parts.join(" — ");
}

export function summarizeProjectEvidenceCoverage(input: {
  asOfDate: string;
  controls: readonly ControlEvidenceCoverage[];
  dueSoonEvidence: number;
  overdueEvidence: number;
  unlinkedEvidence: number;
  archivedEvidence: number;
  draftEvidence: number;
}): ProjectEvidenceSummary {
  let requiredControls = 0;
  let requiredWithEvidence = 0;
  let requiredMissingEvidence = 0;
  let optionalControls = 0;
  let notRequiredControls = 0;

  for (const control of input.controls) {
    if (control.coverageState === "not_required") {
      notRequiredControls += 1;
      continue;
    }
    if (
      control.coverageState === "optional_absent" ||
      control.coverageState === "optional_present"
    ) {
      optionalControls += 1;
      continue;
    }
    requiredControls += 1;
    if (control.coverageState === "required_present") {
      requiredWithEvidence += 1;
    } else {
      requiredMissingEvidence += 1;
    }
  }

  return {
    asOfDate: input.asOfDate,
    totalControls: input.controls.length,
    requiredControls,
    requiredWithEvidence,
    requiredMissingEvidence,
    optionalControls,
    notRequiredControls,
    dueSoonEvidence: input.dueSoonEvidence,
    overdueEvidence: input.overdueEvidence,
    unlinkedEvidence: input.unlinkedEvidence,
    archivedEvidence: input.archivedEvidence,
    draftEvidence: input.draftEvidence,
  };
}

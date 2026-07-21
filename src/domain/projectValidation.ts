import type { FrameworkControl } from "@/data/framework";
import type { ControlImplementation } from "@/data/implementation";
import { isControlImplementation } from "@/data/implementation";
import {
  isProjectMetadata,
  type ProjectMetadata,
} from "@/data/project";
import { isImplementationComplete } from "./completion";

export type ValidationCheckStatus = "pass" | "fail";

export type ValidationCheckId =
  | "baseline-coverage"
  | "missing-implementations"
  | "duplicate-control-ids"
  | "unknown-control-ids"
  | "domain-project-valid"
  | "oscal-ssp-valid";

export type ValidationCheck = {
  id: ValidationCheckId;
  label: string;
  status: ValidationCheckStatus;
  detail: string;
  /** Control ids related to the issue, when applicable. */
  controlIds?: string[];
};

export type ImplementationCoverageAnalysis = {
  baselineCount: number;
  completedCount: number;
  missingIds: string[];
  unknownIds: string[];
  duplicateIds: string[];
};

/**
 * Analyze implementations against the configured framework baseline.
 * Duplicate detection uses Object.keys order; JS objects cannot hold true
 * duplicate keys, so duplicateIds is typically empty unless callers merge lists.
 */
export function analyzeImplementationCoverage(
  frameworkControls: readonly FrameworkControl[],
  implementations: Readonly<Record<string, ControlImplementation>>,
): ImplementationCoverageAnalysis {
  const baselineIds = frameworkControls.map((control) => control.id);
  const baselineSet = new Set(baselineIds);
  const implementationIds = Object.keys(implementations);

  const seen = new Set<string>();
  const duplicateIds: string[] = [];
  for (const id of implementationIds) {
    if (seen.has(id)) {
      duplicateIds.push(id);
    }
    seen.add(id);
  }

  const missingIds = baselineIds.filter(
    (id) => !isImplementationComplete(implementations[id]),
  );
  const unknownIds = implementationIds.filter((id) => !baselineSet.has(id));

  return {
    baselineCount: baselineIds.length,
    completedCount: baselineIds.length - missingIds.length,
    missingIds,
    unknownIds,
    duplicateIds,
  };
}

export function isDomainProjectValid(input: {
  metadata: unknown;
  implementations: unknown;
}): boolean {
  if (!isProjectMetadata(input.metadata)) {
    return false;
  }
  if (
    input.implementations === null ||
    typeof input.implementations !== "object" ||
    Array.isArray(input.implementations)
  ) {
    return false;
  }
  for (const value of Object.values(
    input.implementations as Record<string, unknown>,
  )) {
    if (!isControlImplementation(value)) {
      return false;
    }
  }
  return true;
}

/**
 * Cheap, synchronous validation checks suitable for Overview.
 * Does not run OSCAL schema validation — callers add that on demand.
 */
export function buildDomainValidationChecks(input: {
  frameworkControls: readonly FrameworkControl[];
  metadata: ProjectMetadata;
  implementations: Readonly<Record<string, ControlImplementation>>;
}): ValidationCheck[] {
  const coverage = analyzeImplementationCoverage(
    input.frameworkControls,
    input.implementations,
  );
  const domainValid = isDomainProjectValid({
    metadata: input.metadata,
    implementations: input.implementations,
  });

  const checks: ValidationCheck[] = [
    {
      id: "baseline-coverage",
      label: "Baseline coverage",
      status:
        coverage.completedCount === coverage.baselineCount ? "pass" : "fail",
      detail: `${coverage.completedCount} of ${coverage.baselineCount} controls have implementation text`,
      controlIds:
        coverage.missingIds.length > 0 ? coverage.missingIds : undefined,
    },
    {
      id: "missing-implementations",
      label: "Missing implementations",
      status: coverage.missingIds.length === 0 ? "pass" : "fail",
      detail:
        coverage.missingIds.length === 0
          ? "All configured controls contain implementation text"
          : `${coverage.missingIds.length} control${coverage.missingIds.length === 1 ? "" : "s"} have no implementation`,
      controlIds:
        coverage.missingIds.length > 0 ? coverage.missingIds : undefined,
    },
    {
      id: "duplicate-control-ids",
      label: "Duplicate control IDs",
      status: coverage.duplicateIds.length === 0 ? "pass" : "fail",
      detail:
        coverage.duplicateIds.length === 0
          ? "No duplicate control IDs"
          : `${coverage.duplicateIds.length} duplicate control ID${coverage.duplicateIds.length === 1 ? "" : "s"}`,
      controlIds:
        coverage.duplicateIds.length > 0 ? coverage.duplicateIds : undefined,
    },
    {
      id: "unknown-control-ids",
      label: "Unknown control IDs",
      status: coverage.unknownIds.length === 0 ? "pass" : "fail",
      detail:
        coverage.unknownIds.length === 0
          ? "No unknown control IDs"
          : `${coverage.unknownIds.length} unknown control ID${coverage.unknownIds.length === 1 ? "" : "s"}`,
      controlIds:
        coverage.unknownIds.length > 0 ? coverage.unknownIds : undefined,
    },
    {
      id: "domain-project-valid",
      label: "Domain project valid",
      status: domainValid ? "pass" : "fail",
      detail: domainValid
        ? "Domain project valid"
        : "Project metadata or implementations failed domain checks",
    },
  ];

  return checks;
}

export type OscalValidationState =
  | { status: "idle" }
  | { status: "running" }
  | {
      status: "complete";
      ok: boolean;
      detail: string;
      checkedAt: string;
    };

/** Returns an OSCAL check only after validation has actually run. */
export function oscalValidationCheck(
  state: OscalValidationState,
): ValidationCheck | null {
  if (state.status !== "complete") {
    return null;
  }
  return {
    id: "oscal-ssp-valid",
    label: "OSCAL SSP valid",
    status: state.ok ? "pass" : "fail",
    detail: state.ok
      ? `OSCAL SSP valid (checked ${formatCheckedAt(state.checkedAt)})`
      : `${state.detail} (checked ${formatCheckedAt(state.checkedAt)})`,
  };
}

function formatCheckedAt(iso: string): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) {
    return iso;
  }
  return new Date(parsed).toLocaleString();
}

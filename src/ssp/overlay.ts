/**
 * IL4 overlay mapping for the SSP view model.
 * Uses the framework read model only. Does not inline assignments into
 * catalog statements and does not compute conflict winners.
 */

import type {
  FrameworkAuthoritativeValueStatus,
  FrameworkControl,
  FrameworkProvenanceText,
} from "@/data/framework";
import type {
  SspFrameworkAssignment,
  SspNotice,
  SspProvenanceText,
} from "./types";

const SOURCE_LABELS: Record<string, string> = {
  "fedramp-moderate-baseline": "FedRAMP Moderate",
  "dod-ssp-addendum-v1.2": "DoD IL4",
  "csp-srg-v1r7-appendix-d": "CSP SRG Appendix D",
};

const CONDITION_LABELS: Record<string, string> = {
  cds: "Cross Domain Solution (CDS)",
};

export function sourceDisplayLabel(source: string): string {
  const trimmed = source.trim();
  return SOURCE_LABELS[trimmed] ?? trimmed;
}

export function conditionDisplayLabel(condition: string | null): string | null {
  if (!condition) {
    return null;
  }
  const trimmed = condition.trim();
  return CONDITION_LABELS[trimmed] ?? trimmed;
}

function classificationCopy(
  status: FrameworkAuthoritativeValueStatus | undefined,
): { classificationLabel: string; supportingText: string } | null {
  if (status === "baseline-inherited") {
    return {
      classificationLabel: "FedRAMP base, inherited for IL4",
      supportingText:
        "FedRAMP Moderate assignment applies. No DoD IL4 adjustment is listed for this requirement.",
    };
  }
  if (status === "overlay-explicit") {
    return {
      classificationLabel: "DoD IL4 adjustment",
      supportingText: "DoD IL4 defines an additional or adjusted requirement.",
    };
  }
  if (status === "satisfied-by-overlay") {
    return {
      classificationLabel: "DoD IL4 adjustment",
      supportingText:
        "DoD IL4 defines an additional or adjusted requirement. Table D-1 required a DSPAV; the public Addendum supplies the value used here.",
    };
  }
  if (status === "may-use-baseline") {
    return {
      classificationLabel: "DoD permits FedRAMP value",
      supportingText:
        "DoD explicitly permits the FedRAMP value for this requirement.",
    };
  }
  if (status === "csp-organization-defined") {
    return {
      classificationLabel: "CSP/organization-defined",
      supportingText:
        "The framework leaves this value to the CSP or organization. Control Freak has not filled it in.",
    };
  }
  return null;
}

function normalizedText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function blockFrom(
  value: FrameworkProvenanceText | null | undefined,
): SspProvenanceText | null {
  if (!value?.text.trim()) {
    return null;
  }
  return {
    text: value.text.trim(),
    sourceLabel: sourceDisplayLabel(value.source),
  };
}

export type SspOverlayMapping = {
  assignments: SspFrameworkAssignment[];
  supplements: SspProvenanceText[];
  notices: SspNotice[];
};

function assignmentFrom(
  block: SspProvenanceText,
  kind: SspFrameworkAssignment["kind"],
  classification: { classificationLabel: string; supportingText: string } | null,
): SspFrameworkAssignment {
  return {
    text: block.text,
    sourceLabel: block.sourceLabel,
    classificationLabel: classification?.classificationLabel ?? null,
    supportingText: classification?.supportingText ?? null,
    kind,
  };
}

/**
 * Map overlay metadata into separate assignment/notice blocks.
 * Returns empty collections for catalog-only NIST/CMMC items.
 */
export function mapOverlayForSsp(control: FrameworkControl): SspOverlayMapping {
  const parameters = control.parameters;
  const supplements: SspProvenanceText[] = [];
  const seenSupplements = new Set<string>();
  for (const entry of control.supplements ?? []) {
    const block = blockFrom(entry);
    if (!block) {
      continue;
    }
    const key = `${block.sourceLabel}::${normalizedText(block.text)}`;
    if (seenSupplements.has(key)) {
      continue;
    }
    seenSupplements.add(key);
    supplements.push(block);
  }

  const baselineAssignment = blockFrom(parameters?.baselineAssignment);
  const baselineGuidance = blockFrom(parameters?.baselineAdditionalGuidance);
  const overlayAssignment = blockFrom(parameters?.overlayAssignment);

  const supplementTexts = new Set(
    supplements.map((entry) => normalizedText(entry.text)),
  );
  const overlayAssignmentForDisplay =
    overlayAssignment &&
    !supplementTexts.has(normalizedText(overlayAssignment.text)) &&
    (!baselineAssignment ||
      normalizedText(overlayAssignment.text) !==
        normalizedText(baselineAssignment.text))
      ? overlayAssignment
      : null;

  const classification = classificationCopy(parameters?.authoritativeValueStatus);
  const assignments: SspFrameworkAssignment[] = [];
  if (baselineAssignment) {
    assignments.push(
      assignmentFrom(baselineAssignment, "assignment", classification),
    );
  }
  if (baselineGuidance) {
    assignments.push(
      assignmentFrom(baselineGuidance, "additional-guidance", classification),
    );
  }
  if (overlayAssignmentForDisplay) {
    assignments.push(
      assignmentFrom(overlayAssignmentForDisplay, "assignment", classification),
    );
  }

  const notices: SspNotice[] = [];
  const conflict =
    parameters?.interpretationConflict === true ||
    parameters?.authoritativeValueStatus === "source-conflict";
  if (conflict) {
    notices.push({
      kind: "source-conflict",
      title: "Source interpretation requires review",
      explanation:
        "FedRAMP guidance and the DoD Addendum assignment both apply to this item. Control Freak has not chosen a winner or computed an effective assignment.",
    });
  }
  if (parameters?.authoritativeValueStatus === "authoritative-value-required") {
    notices.push({
      kind: "authoritative-value-required",
      title: "DoD assignment required",
      explanation:
        "DoD requires an authoritative assignment. The current value is not available in the public source material used by Control Freak. Control Freak has not guessed a value.",
    });
  }
  if (control.applicability?.kind === "conditional") {
    const label =
      conditionDisplayLabel(control.applicability.condition) ?? "Conditional";
    notices.push({
      kind: "conditional-applicability",
      title: `Conditional: ${label}`,
      explanation: `This item remains in the framework. Applicability is conditional on ${label}. Control Freak does not mark it not applicable automatically.`,
    });
  }

  return { assignments, supplements, notices };
}

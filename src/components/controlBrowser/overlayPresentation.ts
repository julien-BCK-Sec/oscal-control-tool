/**
 * Presentation helpers for overlay metadata on a FrameworkControl.
 * Does not mutate framework population, compute assignment winners, or
 * persist overlay data. UI copy is derived from generic runtime fields.
 */

import type {
  FrameworkControl,
  FrameworkProvenanceText,
} from "@/data/framework/types";
import type { FrameworkItemTerms } from "@/components/framework/presentation";
import { renderAuthoringRequirement } from "@/components/controlBrowser/authoringRequirement";
import { assignmentTextFullyInlined } from "@/components/controlBrowser/effectiveRequirement";
import { statementHasParamInsert } from "@/components/controlBrowser/requirementText";

const SOURCE_LABELS: Record<string, string> = {
  "fedramp-moderate-baseline": "FedRAMP Moderate",
  "dod-ssp-addendum-v1.2": "DoD IL4",
  "csp-srg-v1r7-appendix-d": "CSP SRG Appendix D",
};

const CONDITION_LABELS: Record<string, string> = {
  cds: "Cross Domain Solution (CDS)",
};

export type OverlayNoticeKind =
  | "source-conflict"
  | "authoritative-value-required"
  | "conditional-applicability";

export type OverlayNotice = {
  kind: OverlayNoticeKind;
  title: string;
  explanation: string;
};

export type OverlayTextBlock = {
  text: string;
  sourceLabel: string;
};

export type OverlayLayerSection = {
  heading: string;
  assignments: OverlayTextBlock[];
  additionalGuidance: OverlayTextBlock[];
  supplements: OverlayTextBlock[];
  applicability: { label: string; notes: string } | null;
};

export type EffectiveRequirementPresentation = {
  text: string;
  sourceLabel: string;
};

export type OverlayPresentation = {
  notices: OverlayNotice[];
  layers: OverlayLayerSection[];
  /** Derived authoring view. Null when substitution is not deterministic. */
  effectiveRequirement: EffectiveRequirementPresentation | null;
};

export type StatementReferenceChrome = {
  heading: string;
  showHint: string;
  hideHint: string;
  collapsible: boolean;
};

export function isGeneralReadinessItem(control: FrameworkControl): boolean {
  return control.itemKind === "other";
}

export function frameworkItemSingular(
  control: FrameworkControl,
  frameworkTerms: FrameworkItemTerms,
): string {
  if (isGeneralReadinessItem(control)) {
    return "general readiness requirement";
  }
  return frameworkTerms.singular;
}

/** Fallback label when a framework item title is missing. */
export function frameworkItemKindLabel(
  control: FrameworkControl | undefined,
  frameworkTerms: FrameworkItemTerms,
): string {
  if (!control) {
    return frameworkTerms.singular;
  }
  return frameworkItemSingular(control, frameworkTerms);
}

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

export function statementReferenceChrome(
  control: FrameworkControl,
  frameworkTerms: FrameworkItemTerms,
  overlay: OverlayPresentation | null = buildOverlayPresentation(control),
): StatementReferenceChrome {
  if (isGeneralReadinessItem(control)) {
    return {
      heading: "General readiness requirement",
      showHint: "Show questionnaire",
      hideHint: "Hide questionnaire",
      collapsible: false,
    };
  }
  if (overlay?.effectiveRequirement || statementHasParamInsert(control.statement)) {
    return {
      heading: "Source statement",
      showHint: "Show catalog text",
      hideHint: "Hide catalog text",
      collapsible: true,
    };
  }
  if (overlay) {
    return {
      heading: "Control statement",
      showHint: "Show catalog text",
      hideHint: "Hide catalog text",
      collapsible: true,
    };
  }
  if (frameworkTerms.singular === "requirement") {
    return {
      heading: "Requirement",
      showHint: "Show reference",
      hideHint: "Hide reference",
      collapsible: true,
    };
  }
  return {
    heading: "Requirement",
    showHint: "Show OSCAL text",
    hideHint: "Hide reference",
    collapsible: true,
  };
}

function normalizedText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function blockFrom(
  value: FrameworkProvenanceText | null,
): OverlayTextBlock | null {
  if (!value?.text.trim()) {
    return null;
  }
  return {
    text: value.text.trim(),
    sourceLabel: sourceDisplayLabel(value.source),
  };
}

function uniqueBlocks(
  blocks: OverlayTextBlock[],
): OverlayTextBlock[] {
  const seen = new Set<string>();
  const unique: OverlayTextBlock[] = [];
  for (const block of blocks) {
    const key = `${block.sourceLabel}::${normalizedText(block.text)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(block);
  }
  return unique;
}

function layerHasContent(layer: OverlayLayerSection): boolean {
  return (
    layer.assignments.length > 0 ||
    layer.additionalGuidance.length > 0 ||
    layer.supplements.length > 0 ||
    layer.applicability !== null
  );
}

export function hasOverlayPresentation(control: FrameworkControl): boolean {
  return buildOverlayPresentation(control) !== null;
}

/**
 * Build overlay sections for a framework item. Returns null when there is
 * nothing to show (NIST/CMMC catalog items and empty overlay records).
 */
export function buildOverlayPresentation(
  control: FrameworkControl,
): OverlayPresentation | null {
  const parameters = control.parameters;
  const supplements = uniqueBlocks(
    (control.supplements ?? [])
      .map((entry) => blockFrom(entry))
      .filter((entry): entry is OverlayTextBlock => entry !== null),
  );
  const baselineAssignment = blockFrom(parameters?.baselineAssignment ?? null);
  const baselineGuidance = blockFrom(
    parameters?.baselineAdditionalGuidance ?? null,
  );
  const overlayAssignment = blockFrom(parameters?.overlayAssignment ?? null);

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

  const conditional =
    control.applicability?.kind === "conditional"
      ? {
          label:
            conditionDisplayLabel(control.applicability.condition) ??
            "Conditional",
          notes: control.applicability.notes.trim(),
        }
      : null;

  const baseline: OverlayLayerSection = {
    heading: baselineAssignment?.sourceLabel ?? baselineGuidance?.sourceLabel ?? "Baseline",
    assignments: baselineAssignment ? [baselineAssignment] : [],
    additionalGuidance: baselineGuidance ? [baselineGuidance] : [],
    supplements: [],
    applicability: null,
  };
  const overlay: OverlayLayerSection = {
    heading:
      overlayAssignmentForDisplay?.sourceLabel ??
      supplements[0]?.sourceLabel ??
      "Overlay",
    assignments: overlayAssignmentForDisplay ? [overlayAssignmentForDisplay] : [],
    additionalGuidance: [],
    supplements,
    applicability: conditional,
  };

  const notices: OverlayNotice[] = [];
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
  if (conditional) {
    notices.push({
      kind: "conditional-applicability",
      title: `Conditional: ${conditional.label}`,
      explanation: `This item remains in the framework. Applicability is conditional on ${conditional.label}. Control Freak does not mark it not applicable automatically.`,
    });
  }

  const authoring = renderAuthoringRequirement(control);
  const effectiveRequirement =
    authoring.substitutedAssignments && parameters
      ? {
          text: authoring.text,
          sourceLabel: sourceDisplayLabel(
            parameters.effectiveAssignmentSource ?? "",
          ),
        }
      : null;
  if (effectiveRequirement) {
    const applied = authoring.appliedFragments;
    if (
      baselineAssignment &&
      assignmentTextFullyInlined(baselineAssignment.text, applied)
    ) {
      baseline.assignments = [];
    }
    if (
      overlayAssignmentForDisplay &&
      assignmentTextFullyInlined(overlayAssignmentForDisplay.text, applied)
    ) {
      overlay.assignments = [];
    }
  }

  const layers = [baseline, overlay].filter(layerHasContent);
  if (
    !effectiveRequirement &&
    notices.length === 0 &&
    layers.length === 0
  ) {
    return null;
  }

  return { notices, layers, effectiveRequirement };
}

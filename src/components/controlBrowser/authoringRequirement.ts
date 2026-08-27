/**
 * Presentation-only authoring requirement renderer.
 * Substitutes known overlay assignments and replaces remaining catalog
 * insert tokens with human-readable NIST parameter metadata.
 * Does not mutate FrameworkControl.statement or persist results.
 */

import type {
  FrameworkControl,
  FrameworkOrganizationDefinedParameter,
} from "@/data/framework/types";
import {
  substituteEffectiveRequirement,
  type AssignmentFragment,
} from "@/components/controlBrowser/effectiveRequirement";
import { PARAM_INSERT_PATTERN, statementHasParamInsert } from "@/components/controlBrowser/requirementText";

export type AuthoringSegment =
  | { kind: "text"; value: string }
  | { kind: "assigned"; value: string }
  | { kind: "odp"; value: string; paramId: string; label: string };

export type AuthoringRequirement = {
  /** Concatenated authoring text, including [brackets] around unresolved ODPs. */
  text: string;
  segments: AuthoringSegment[];
  substitutedAssignments: boolean;
  hasParamInserts: boolean;
  appliedFragments: AssignmentFragment[];
};

const FALLBACK_ODP_LABEL = "organization-defined parameter";
const RAW_INSERT_MARKER = "{{ insert: param";

function parameterMap(
  control: FrameworkControl,
): Map<string, FrameworkOrganizationDefinedParameter> {
  const map = new Map<string, FrameworkOrganizationDefinedParameter>();
  for (const param of control.parameters?.organizationDefined ?? []) {
    map.set(param.id, param);
  }
  return map;
}

function canInlineAuthoritativeAssignments(control: FrameworkControl): boolean {
  if (control.itemKind === "other") {
    return false;
  }
  const parameters = control.parameters;
  if (!parameters?.effectiveAssignmentText?.trim()) {
    return false;
  }
  if (parameters.interpretationConflict === true) {
    return false;
  }
  if (parameters.authoritativeValueStatus === "source-conflict") {
    return false;
  }
  return true;
}

function replaceInsertsInProse(
  text: string,
  byId: Map<string, FrameworkOrganizationDefinedParameter>,
  visiting: Set<string>,
): string {
  const pattern = new RegExp(PARAM_INSERT_PATTERN.source, PARAM_INSERT_PATTERN.flags);
  return text.replace(pattern, (_match, rawId: string) => {
    const paramId = rawId.trim();
    return formatUnresolvedOdpLabel(paramId, byId, visiting);
  });
}

export function formatUnresolvedOdpLabel(
  paramId: string,
  byId: Map<string, FrameworkOrganizationDefinedParameter>,
  visiting: Set<string> = new Set(),
): string {
  if (visiting.has(paramId)) {
    return FALLBACK_ODP_LABEL;
  }
  const param = byId.get(paramId);
  if (!param) {
    return FALLBACK_ODP_LABEL;
  }
  visiting.add(paramId);
  const label = param.label.trim();
  if (label) {
    visiting.delete(paramId);
    return label;
  }
  const description = param.description.trim().replace(/;+\s*$/, "");
  if (description) {
    visiting.delete(paramId);
    return replaceInsertsInProse(description, byId, visiting);
  }
  if (param.select?.choices.length) {
    const resolved = param.select.choices.map((choice) =>
      replaceInsertsInProse(choice, byId, visiting),
    );
    const joined = resolved.join("; ");
    const howMany = param.select.howMany;
    visiting.delete(paramId);
    if (howMany === "one-or-more") {
      return `one or more of: ${joined}`;
    }
    if (howMany === "one") {
      return `one of: ${joined}`;
    }
    return joined;
  }
  visiting.delete(paramId);
  return FALLBACK_ODP_LABEL;
}

function bracketOdp(label: string): string {
  return `[${label}]`;
}

function assignmentReplacementAt(
  replacements: Array<{ start: number; end: number; value: string }>,
  start: number,
): string | null {
  const found = replacements.find((replacement) => replacement.start === start);
  return found?.value ?? null;
}

/**
 * Build the human-readable authoring requirement for a control.
 * GRRs and statements without catalog insert tokens are returned unchanged.
 */
export function renderAuthoringRequirement(
  control: FrameworkControl,
): AuthoringRequirement {
  const statement = control.statement;
  const hasParamInserts = statementHasParamInsert(statement);
  const pattern = new RegExp(PARAM_INSERT_PATTERN.source, PARAM_INSERT_PATTERN.flags);

  if (control.itemKind === "other" || !hasParamInserts) {
    return {
      text: statement,
      segments: [{ kind: "text", value: statement }],
      substitutedAssignments: false,
      hasParamInserts,
      appliedFragments: [],
    };
  }

  const assignment =
    canInlineAuthoritativeAssignments(control) &&
    control.parameters?.effectiveAssignmentText
      ? substituteEffectiveRequirement(
          statement,
          control.parameters.effectiveAssignmentText,
          control.id,
        )
      : {
          text: statement,
          substituted: false,
          appliedFragments: [],
          replacements: [],
        };

  const byId = parameterMap(control);
  const segments: AuthoringSegment[] = [];
  let cursor = 0;
  for (const match of statement.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      segments.push({ kind: "text", value: statement.slice(cursor, index) });
    }
    const paramId = match[1]?.trim() ?? "";
    const assigned = assignmentReplacementAt(assignment.replacements, index);
    if (assigned !== null) {
      segments.push({ kind: "assigned", value: assigned });
    } else {
      const label = formatUnresolvedOdpLabel(paramId, byId);
      segments.push({
        kind: "odp",
        value: bracketOdp(label),
        paramId,
        label,
      });
    }
    cursor = index + match[0].length;
  }
  if (cursor < statement.length) {
    segments.push({ kind: "text", value: statement.slice(cursor) });
  }
  if (segments.length === 0) {
    segments.push({ kind: "text", value: statement });
  }

  const text = segments.map((segment) => segment.value).join("");
  return {
    text,
    segments,
    substitutedAssignments: assignment.substituted,
    hasParamInserts: true,
    appliedFragments: assignment.appliedFragments,
  };
}

export function authoringTextContainsRawParamInsert(text: string): boolean {
  return text.includes(RAW_INSERT_MARKER);
}

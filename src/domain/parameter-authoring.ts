import type {
  FrameworkControl,
  FrameworkOrganizationDefinedParameter,
  FrameworkParameterChoice,
} from "@/data/framework/types";
import type {
  ProjectParameterRecord,
  ProjectParameterRecords,
} from "@/data/parameter";
import { isAggregateCatalogParameter } from "@/framework/nist-sp-800-53-rev5/parameters";
import type { EffectiveParameter } from "./parameter-resolution";

const PARAM_INSERT_PATTERN =
  /\{\{\s*insert:\s*param,\s*([^}]+?)\s*\}\}/gi;

export type ParameterEditorMode =
  | "assignment"
  | "selection"
  | "framework-authoritative"
  | "may-use-baseline"
  | "authoritative-value-required"
  | "source-conflict"
  | "control-level-unmapped"
  | "orphan";

function nestedOnlyParameterIds(
  params: readonly FrameworkOrganizationDefinedParameter[],
  statement: string,
): Set<string> {
  const nested = new Set<string>();
  for (const param of params) {
    for (const choice of param.select?.choices ?? []) {
      for (const nestedId of choice.nestedParameterIds) {
        nested.add(nestedId);
      }
    }
  }
  const inserted = new Set<string>();
  const pattern = new RegExp(
    PARAM_INSERT_PATTERN.source,
    PARAM_INSERT_PATTERN.flags,
  );
  for (const match of statement.matchAll(pattern)) {
    const id = match[1]?.trim();
    if (id) {
      inserted.add(id);
    }
  }
  for (const id of nested) {
    if (inserted.has(id)) {
      nested.delete(id);
    }
  }
  return nested;
}

export function visibleAuthoringParameters(
  control: FrameworkControl,
): FrameworkOrganizationDefinedParameter[] {
  const params = control.parameters?.organizationDefined ?? [];
  if (params.length === 0) {
    return [];
  }
  const nestedOnly = nestedOnlyParameterIds(params, control.statement);
  return params.filter(
    (param) => !isAggregateCatalogParameter(param) && !nestedOnly.has(param.id),
  );
}

export function parameterEditorMode(
  effective: EffectiveParameter,
): ParameterEditorMode {
  if (!effective.catalog) {
    return "orphan";
  }
  if (effective.framework?.mappingBasis === "control-level-unmapped") {
    if (effective.substitution.kind === "unresolved") {
      if (effective.substitution.reason === "authoritative-value-required") {
        return "authoritative-value-required";
      }
      if (effective.substitution.reason === "source-conflict") {
        return "source-conflict";
      }
    }
    return "control-level-unmapped";
  }
  if (effective.substitution.kind === "unresolved") {
    if (effective.substitution.reason === "authoritative-value-required") {
      return "authoritative-value-required";
    }
    if (effective.substitution.reason === "source-conflict") {
      return "source-conflict";
    }
    if (effective.substitution.reason === "may-use-baseline") {
      return "may-use-baseline";
    }
    if (effective.substitution.reason === "orphan") {
      return "orphan";
    }
  }
  if (
    effective.substitution.kind === "value" &&
    effective.substitution.origin === "framework"
  ) {
    return "framework-authoritative";
  }
  if (
    effective.substitution.kind === "value" &&
    effective.substitution.origin === "accepted-baseline"
  ) {
    return "may-use-baseline";
  }
  if (effective.framework?.status === "may-use-baseline") {
    return "may-use-baseline";
  }
  if (effective.catalog.select) {
    return "selection";
  }
  return "assignment";
}

export function catalogChoiceVisibleText(
  choice: FrameworkParameterChoice,
): string {
  const lead = choice.text
    .replace(new RegExp(PARAM_INSERT_PATTERN.source, PARAM_INSERT_PATTERN.flags), "")
    .replace(/\s+/g, " ")
    .trim();
  if (choice.nestedParameterIds.length > 0 && lead && !lead.endsWith(":")) {
    return `${lead}:`;
  }
  return lead;
}

export function nestedParametersForChoice(
  choice: FrameworkParameterChoice,
  byId: Map<string, FrameworkOrganizationDefinedParameter>,
): FrameworkOrganizationDefinedParameter[] {
  const nested: FrameworkOrganizationDefinedParameter[] = [];
  const seen = new Set<string>();
  for (const nestedId of choice.nestedParameterIds) {
    if (seen.has(nestedId)) {
      continue;
    }
    const nestedParam = byId.get(nestedId);
    if (nestedParam) {
      seen.add(nestedId);
      nested.push(nestedParam);
    }
  }
  return nested;
}

/**
 * Update the parent selection record only. Nested project records are left
 * in place when a choice is deselected.
 */
export function withCatalogSelection(
  records: ProjectParameterRecords,
  controlId: string,
  param: FrameworkOrganizationDefinedParameter,
  selectedKeys: readonly string[],
): ProjectParameterRecords {
  const next = { ...records };
  if (selectedKeys.length === 0) {
    delete next[param.id];
    return next;
  }
  const record: ProjectParameterRecord = {
    controlId,
    parameterId: param.id,
    intent: "organization-defined",
    body: {
      form: "selection",
      howMany: param.select?.howMany ?? "one",
      selectedChoiceKeys: [...selectedKeys],
    },
  };
  next[param.id] = record;
  return next;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function snippetAroundInsert(
  text: string,
  parameterId: string,
  prompt: string,
): string | null {
  const pattern = new RegExp(
    `\\{\\{\\s*insert:\\s*param,\\s*${escapeRegExp(parameterId)}\\s*\\}\\}`,
    "i",
  );
  if (!pattern.test(text)) {
    return null;
  }
  const labeled = text.replace(
    new RegExp(pattern.source, "gi"),
    `[${prompt}]`,
  );
  const withoutOtherInserts = labeled.replace(
    new RegExp(PARAM_INSERT_PATTERN.source, PARAM_INSERT_PATTERN.flags),
    "…",
  );
  return withoutOtherInserts.replace(/\s+/g, " ").trim();
}

/**
 * Surrounding catalog prose that this parameter fills, for authoring context.
 * Does not infer or validate a datatype.
 */
export function parameterInsertContext(
  control: FrameworkControl,
  param: FrameworkOrganizationDefinedParameter,
): string | null {
  const prompt = parameterPrompt(param);
  const fromStatement = snippetAroundInsert(control.statement, param.id, prompt);
  if (fromStatement) {
    return fromStatement;
  }
  for (const other of control.parameters?.organizationDefined ?? []) {
    for (const choice of other.select?.choices ?? []) {
      const fromChoice = snippetAroundInsert(choice.text, param.id, prompt);
      if (fromChoice) {
        return fromChoice;
      }
    }
  }
  return null;
}

export function parameterPrompt(
  param: FrameworkOrganizationDefinedParameter,
): string {
  const label = param.label.trim();
  if (label) {
    return label;
  }
  const description = param.description.trim().replace(/;+\s*$/, "");
  if (description) {
    return description;
  }
  if (param.select?.choices.length) {
    return param.select.howMany === "one-or-more"
      ? "one or more catalog choices"
      : "one catalog choice";
  }
  return "organization-defined parameter";
}

export function frameworkStatusLabel(effective: EffectiveParameter): string {
  if (effective.framework?.mappingBasis === "control-level-unmapped") {
    return "Control-level overlay only — not mapped to this parameter";
  }
  switch (effective.framework?.status) {
    case "baseline-inherited":
      return "Baseline inherited";
    case "may-use-baseline":
      return "Permitted baseline (not automatically accepted)";
    case "overlay-explicit":
      return "Overlay assignment";
    case "satisfied-by-overlay":
      return "Satisfied by overlay";
    case "authoritative-value-required":
      return "Authoritative value required";
    case "source-conflict":
      return "Source conflict";
    case "csp-organization-defined":
      return "Organization-defined";
    default:
      return "Organization-defined";
  }
}

export function resolutionStateLabel(effective: EffectiveParameter): string {
  if (effective.substitution.kind === "value") {
    if (effective.substitution.origin === "framework") {
      return "Framework authoritative";
    }
    if (effective.substitution.origin === "accepted-baseline") {
      return "Accepted permitted baseline";
    }
    return "Project-resolved";
  }
  switch (effective.substitution.reason) {
    case "may-use-baseline":
      return "Unresolved — permitted baseline not accepted";
    case "authoritative-value-required":
      return "Unresolved — authoritative value required";
    case "source-conflict":
      return "Unresolved — source conflict";
    case "control-level-unmapped":
      return "Unresolved — overlay not mapped to this parameter";
    case "orphan":
      return "Orphaned project record";
    default:
      return "Unresolved organization-defined parameter";
  }
}

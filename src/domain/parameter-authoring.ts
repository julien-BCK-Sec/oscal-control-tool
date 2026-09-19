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

export function selectedNestedParameters(
  param: FrameworkOrganizationDefinedParameter,
  records: ProjectParameterRecords,
  byId: Map<string, FrameworkOrganizationDefinedParameter>,
): FrameworkOrganizationDefinedParameter[] {
  const project = records[param.id];
  const selectedKeys =
    project?.body?.form === "selection" ? [...project.body.selectedChoiceKeys] : [];
  const nested: FrameworkOrganizationDefinedParameter[] = [];
  const seen = new Set<string>();
  for (const choice of param.select?.choices ?? []) {
    if (!selectedKeys.includes(choice.key)) {
      continue;
    }
    for (const nestedParam of nestedParametersForChoice(choice, byId)) {
      if (seen.has(nestedParam.id)) {
        continue;
      }
      seen.add(nestedParam.id);
      nested.push(nestedParam);
    }
  }
  return nested;
}

export function isFailClosedParameterMode(mode: ParameterEditorMode): boolean {
  return (
    mode === "authoritative-value-required" ||
    mode === "source-conflict" ||
    mode === "control-level-unmapped" ||
    mode === "may-use-baseline" ||
    mode === "orphan"
  );
}

/**
 * Compact resolved rows hide the editor until Edit. Selection rows stay
 * expanded so nested catalog editors remain visible.
 */
export function parameterUsesCompactResolvedPresentation(input: {
  substitutionKind: EffectiveParameter["substitution"]["kind"];
  nested?: boolean;
  failClosed: boolean;
  mode: ParameterEditorMode;
}): boolean {
  return (
    input.substitutionKind === "value" &&
    !input.nested &&
    !input.failClosed &&
    input.mode !== "selection"
  );
}

export function currentlyAuthorableParameterIds(
  control: FrameworkControl,
  records: ProjectParameterRecords,
): string[] {
  const visible = visibleAuthoringParameters(control);
  const byId = new Map(
    (control.parameters?.organizationDefined ?? []).map((param) => [
      param.id,
      param,
    ]),
  );
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const param of visible) {
    if (!seen.has(param.id)) {
      seen.add(param.id);
      ids.push(param.id);
    }
    for (const nested of selectedNestedParameters(param, records, byId)) {
      if (!seen.has(nested.id)) {
        seen.add(nested.id);
        ids.push(nested.id);
      }
    }
  }
  return ids;
}

export type ParameterAuthoringSummary = {
  total: number;
  resolvedCount: number;
  unresolvedCount: number;
  caption: string;
};

function parameterAuthoringCaption(
  resolvedCount: number,
  total: number,
  unresolvedCount: number,
): string {
  if (total === 0) {
    return "None on this item";
  }
  const resolved = `${resolvedCount} of ${total} resolved`;
  if (unresolvedCount <= 0) {
    return resolved;
  }
  return `${resolved} · ${unresolvedCount} need attention`;
}

/**
 * Compact authoring counts from canonical EffectiveParameter substitutions.
 * Nested parameters are counted only while their parent choice is selected.
 */
export function parameterAuthoringSummary(
  control: FrameworkControl,
  resolved: readonly EffectiveParameter[],
  records: ProjectParameterRecords,
): ParameterAuthoringSummary {
  const ids = currentlyAuthorableParameterIds(control, records);
  const byId = new Map(resolved.map((row) => [row.parameterId, row]));
  let resolvedCount = 0;
  for (const id of ids) {
    if (byId.get(id)?.substitution.kind === "value") {
      resolvedCount += 1;
    }
  }
  const total = ids.length;
  const unresolvedCount = total - resolvedCount;
  return {
    total,
    resolvedCount,
    unresolvedCount,
    caption: parameterAuthoringCaption(resolvedCount, total, unresolvedCount),
  };
}

/**
 * Unresolved parameters must not force the ODP section open. Complexity is
 * why the author needs a collapsed summary first.
 */
export function parameterOdpSectionDefaultOpen(
  summary: ParameterAuthoringSummary,
): boolean {
  void summary;
  return false;
}

export function parameterDetailsDefaultOpen(): boolean {
  return false;
}

export function authorFacingStatusLabel(effective: EffectiveParameter): string {
  if (effective.substitution.kind === "value") {
    return "Resolved";
  }
  if (effective.substitution.reason === "orphan") {
    return "Orphaned";
  }
  return "Unresolved";
}

export function sharedAuthorableEditorMode(
  control: FrameworkControl,
  resolved: readonly EffectiveParameter[],
  records: ProjectParameterRecords,
): ParameterEditorMode | null {
  const ids = currentlyAuthorableParameterIds(control, records);
  if (ids.length === 0) {
    return null;
  }
  const byId = new Map(resolved.map((row) => [row.parameterId, row]));
  let shared: ParameterEditorMode | null = null;
  for (const id of ids) {
    const row = byId.get(id);
    if (!row) {
      return null;
    }
    const mode = parameterEditorMode(row);
    if (shared === null) {
      shared = mode;
      continue;
    }
    if (mode !== shared) {
      return null;
    }
  }
  return shared;
}

export type SharedParameterSectionNotice = {
  mode: ParameterEditorMode;
  title: string;
  body: string;
  helpSlug: string;
  helpHash?: string;
};

/**
 * Section-level copy for a condition shared by every currently authorable
 * parameter. Mixed modes return null so distinct states stay distinct.
 */
export function sharedParameterSectionNotice(
  mode: ParameterEditorMode | null,
): SharedParameterSectionNotice | null {
  if (mode === "control-level-unmapped") {
    return {
      mode,
      title: "Parameter-specific overlay assignments unavailable",
      body: "This control has an overlay assignment, but the authoritative source does not map that assignment to individual catalog parameters. Project documentation can be recorded below but does not resolve these parameters in the SSP.",
      helpSlug: "dod-cloud-il4",
      helpHash: "parameter-assignments",
    };
  }
  if (mode === "may-use-baseline") {
    return {
      mode,
      title: "Permitted baseline values are not accepted automatically",
      body: "DoD permits the baseline value. It is not used in the resolved requirement until someone explicitly accepts it for each parameter, or authors an organization value.",
      helpSlug: "authoring-controls",
      helpHash: "organization-defined-parameters",
    };
  }
  if (mode === "authoritative-value-required") {
    return {
      mode,
      title: "Authoritative external value required",
      body: "An authoritative value is required from a restricted source (for example DSPAV). Control Freak does not invent that value. A project assertion is documentation only and is not substituted into the SSP.",
      helpSlug: "dod-cloud-il4",
      helpHash: "dod-assignment-required",
    };
  }
  if (mode === "source-conflict") {
    return {
      mode,
      title: "Source interpretation requires review",
      body: "Authoritative sources disagree. Both remain visible. A proceeding note does not choose a winner or resolve the parameter.",
      helpSlug: "dod-cloud-il4",
      helpHash: "source-interpretation-requires-review",
    };
  }
  return null;
}

export function authorFacingStatusHint(
  mode: ParameterEditorMode,
  sharedMode: ParameterEditorMode | null,
): string | null {
  if (sharedMode !== null && mode === sharedMode && sharedParameterSectionNotice(sharedMode)) {
    return null;
  }
  switch (mode) {
    case "may-use-baseline":
      return "DoD permits the baseline value. Accept it explicitly or author an organization value.";
    case "authoritative-value-required":
      return "An authoritative external value is required. Control Freak does not invent it.";
    case "source-conflict":
      return "Authoritative sources disagree. A proceeding note does not choose a winner.";
    case "control-level-unmapped":
      return "Overlay assignment is not mapped to this parameter. Project documentation does not resolve it in the SSP.";
    case "orphan":
      return "Preserved on the project and excluded from SSP substitution.";
    default:
      return null;
  }
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

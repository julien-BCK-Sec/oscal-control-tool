/**
 * Safe 07B ODP presentation: humanize catalog insert tokens without
 * substituting framework assignments into the source statement.
 */

import type {
  FrameworkControl,
  FrameworkOrganizationDefinedParameter,
} from "@/data/framework";
import { unresolvedOdpPlaceholder } from "./placeholders";
import type { SspUnresolvedParameter } from "./types";

export const PARAM_INSERT_PATTERN =
  /\{\{\s*insert:\s*param,\s*([^}]+?)\s*\}\}/gi;

const FALLBACK_ODP_LABEL = "organization-defined parameter";

export type HumanizedSourceStatement = {
  text: string;
  unresolvedParameters: SspUnresolvedParameter[];
};

function parameterMap(
  control: FrameworkControl,
): Map<string, FrameworkOrganizationDefinedParameter> {
  const map = new Map<string, FrameworkOrganizationDefinedParameter>();
  for (const param of control.parameters?.organizationDefined ?? []) {
    map.set(param.id, param);
  }
  return map;
}

function replaceInsertsInProse(
  text: string,
  byId: Map<string, FrameworkOrganizationDefinedParameter>,
  visiting: Set<string>,
): string {
  const pattern = new RegExp(
    PARAM_INSERT_PATTERN.source,
    PARAM_INSERT_PATTERN.flags,
  );
  return text.replace(pattern, (_match, rawId: string) => {
    const paramId = rawId.trim();
    return formatOdpLabel(paramId, byId, visiting);
  });
}

export function formatOdpLabel(
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

/**
 * Replace catalog insert tokens with unresolved-ODP placeholders.
 * Does not apply overlay/FedRAMP assignment values.
 */
export function humanizeSourceStatement(
  control: FrameworkControl,
): HumanizedSourceStatement {
  const statement = control.statement;
  const byId = parameterMap(control);
  const unresolved: SspUnresolvedParameter[] = [];
  const seen = new Set<string>();
  const pattern = new RegExp(
    PARAM_INSERT_PATTERN.source,
    PARAM_INSERT_PATTERN.flags,
  );

  const text = statement.replace(pattern, (_match, rawId: string) => {
    const parameterId = rawId.trim();
    const label = formatOdpLabel(parameterId, byId);
    if (!seen.has(parameterId)) {
      seen.add(parameterId);
      unresolved.push({ id: parameterId, label });
    }
    return unresolvedOdpPlaceholder(parameterId, label);
  });

  return { text, unresolvedParameters: unresolved };
}

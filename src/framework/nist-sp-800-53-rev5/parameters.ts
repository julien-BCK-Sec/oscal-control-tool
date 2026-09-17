import type {
  FrameworkAuthoritativeValueStatus,
  FrameworkOrganizationDefinedParameter,
  FrameworkParameterChoice,
  FrameworkParameterMappingBasis,
  FrameworkParameterResolution,
  FrameworkParameterSelect,
  FrameworkParameterSelectHowMany,
  FrameworkProvenanceText,
} from "@/data/framework/types";

export const CATALOG_PARAM_INSERT_PATTERN =
  /\{\{\s*insert:\s*param,\s*([^}]+?)\s*\}\}/gi;

type CatalogParamProp = {
  name?: string;
  value?: string;
};

type CatalogParam = {
  id?: string;
  label?: string;
  guidelines?: Array<{ prose?: string }>;
  select?: {
    "how-many"?: string;
    choice?: unknown[];
  };
  props?: CatalogParamProp[];
};

function isHowMany(value: string): value is FrameworkParameterSelectHowMany {
  return value === "one" || value === "one-or-more";
}

export function nestedParameterIdsInText(text: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const pattern = new RegExp(
    CATALOG_PARAM_INSERT_PATTERN.source,
    CATALOG_PARAM_INSERT_PATTERN.flags,
  );
  for (const match of text.matchAll(pattern)) {
    const id = match[1]?.trim() ?? "";
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function propValues(props: CatalogParamProp[] | undefined, name: string): string[] {
  const values: string[] = [];
  for (const prop of props ?? []) {
    if (prop.name !== name) {
      continue;
    }
    const value = prop.value?.trim() ?? "";
    if (value) {
      values.push(value);
    }
  }
  return values;
}

function extractSelect(
  select: CatalogParam["select"],
): FrameworkParameterSelect | undefined {
  if (!select) {
    return undefined;
  }
  const rawChoices = (select.choice ?? []).filter(
    (choice): choice is string =>
      typeof choice === "string" && choice.trim().length > 0,
  );
  if (rawChoices.length === 0) {
    return undefined;
  }
  const howManyRaw = select["how-many"]?.trim();
  const howMany: FrameworkParameterSelectHowMany =
    howManyRaw && isHowMany(howManyRaw) ? howManyRaw : "one";
  const choices: FrameworkParameterChoice[] = rawChoices.map((text, index) => ({
    key: String(index),
    text: text.trim(),
    nestedParameterIds: nestedParameterIdsInText(text),
  }));
  return { howMany, choices };
}

/**
 * Copy NIST catalog parameter metadata used for identity, authoring, and
 * resolution. Does not resolve assignments or rewrite catalog statements.
 */
export function extractOrganizationDefinedParameters(
  params: CatalogParam[] | undefined,
): FrameworkOrganizationDefinedParameter[] {
  const extracted: FrameworkOrganizationDefinedParameter[] = [];
  for (const param of params ?? []) {
    if (typeof param.id !== "string" || !param.id.trim()) {
      continue;
    }
    const select = extractSelect(param.select);
    extracted.push({
      id: param.id,
      label: param.label?.trim() ?? "",
      description:
        param.guidelines
          ?.map((guideline) => guideline.prose?.trim() ?? "")
          .filter(Boolean)
          .join(" ") ?? "",
      altIdentifiers: propValues(param.props, "alt-identifier"),
      aggregatedParameterIds: propValues(param.props, "aggregates"),
      ...(select ? { select } : {}),
    });
  }
  return extracted;
}

export function isAggregateCatalogParameter(
  param: FrameworkOrganizationDefinedParameter,
): boolean {
  return param.aggregatedParameterIds.length > 0;
}

export function catalogUnassignedResolutions(
  controlId: string,
  params: readonly FrameworkOrganizationDefinedParameter[],
): FrameworkParameterResolution[] {
  return params.map((param) => ({
    controlId,
    parameterId: param.id,
    status: "csp-organization-defined",
    mappingBasis: "catalog-unassigned",
    values: [],
    sources: [],
  }));
}

export function overlayParameterResolutions(input: {
  controlId: string;
  params: readonly FrameworkOrganizationDefinedParameter[];
  status: FrameworkAuthoritativeValueStatus;
  mappingBasis: FrameworkParameterMappingBasis;
  values?: readonly string[];
  sources?: readonly FrameworkProvenanceText[];
  controlOverlaySummary?: FrameworkParameterResolution["controlOverlaySummary"];
}): FrameworkParameterResolution[] {
  return input.params.map((param) => ({
    controlId: input.controlId,
    parameterId: param.id,
    status: input.status,
    mappingBasis: input.mappingBasis,
    values: input.values ?? [],
    sources: input.sources ?? [],
    ...(input.controlOverlaySummary
      ? { controlOverlaySummary: input.controlOverlaySummary }
      : {}),
  }));
}

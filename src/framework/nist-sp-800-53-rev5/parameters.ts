import type {
  FrameworkOrganizationDefinedParameter,
  FrameworkParameterSelect,
  FrameworkParameterSelectHowMany,
} from "@/data/framework/types";

type CatalogParam = {
  id?: string;
  label?: string;
  guidelines?: Array<{ prose?: string }>;
  select?: {
    "how-many"?: string;
    choice?: unknown[];
  };
};

function isHowMany(value: string): value is FrameworkParameterSelectHowMany {
  return value === "one" || value === "one-or-more";
}

function extractSelect(
  select: CatalogParam["select"],
): FrameworkParameterSelect | undefined {
  if (!select) {
    return undefined;
  }
  const choices = (select.choice ?? []).filter(
    (choice): choice is string =>
      typeof choice === "string" && choice.trim().length > 0,
  );
  if (choices.length === 0) {
    return undefined;
  }
  const howManyRaw = select["how-many"]?.trim();
  return {
    ...(howManyRaw && isHowMany(howManyRaw) ? { howMany: howManyRaw } : {}),
    choices: choices.map((choice) => choice.trim()),
  };
}

/**
 * Copy NIST catalog parameter metadata used for authoring presentation.
 * Does not resolve assignments or rewrite catalog statements.
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
      ...(select ? { select } : {}),
    });
  }
  return extracted;
}

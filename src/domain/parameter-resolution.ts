import type {
  FrameworkAuthoritativeValueStatus,
  FrameworkControl,
  FrameworkOrganizationDefinedParameter,
  FrameworkParameterResolution,
} from "@/data/framework/types";
import { isAggregateCatalogParameter } from "@/framework/nist-sp-800-53-rev5/parameters";
import type {
  AuthoredParameterBody,
  ProjectParameterRecord,
  ProjectParameterRecords,
} from "@/data/parameter";

export type ParameterSubstitution =
  | {
      kind: "unresolved";
      reason:
        | "organization-defined"
        | "may-use-baseline"
        | "authoritative-value-required"
        | "source-conflict"
        | "control-level-unmapped"
        | "orphan"
        | "missing-catalog";
    }
  | {
      kind: "value";
      values: readonly string[];
      origin: "project" | "framework" | "accepted-baseline";
    };

export type ParameterAnnotation =
  | {
      kind: "documented-deviation";
      values: readonly string[];
      notes?: string;
    }
  | {
      kind: "dspav-assertion";
      values: readonly string[];
      sourceNote: string;
      notes?: string;
    }
  | {
      kind: "conflict-proceeding";
      notes?: string;
    }
  | {
      kind: "control-overlay-unmapped";
      status: FrameworkAuthoritativeValueStatus;
      effectiveAssignmentText: string | null;
      effectiveAssignmentSource: string | null;
    }
  | {
      kind: "permitted-baseline-available";
      values: readonly string[];
    }
  | {
      kind: "orphan";
    }
  | {
      kind: "project-documentation";
      values: readonly string[];
      notes?: string;
    };

export type EffectiveParameter = {
  controlId: string;
  parameterId: string;
  catalog: FrameworkOrganizationDefinedParameter | null;
  framework: FrameworkParameterResolution | null;
  project: ProjectParameterRecord | undefined;
  substitution: ParameterSubstitution;
  annotations: ParameterAnnotation[];
  isAggregate: boolean;
};

function authoredValues(
  catalog: FrameworkOrganizationDefinedParameter | undefined,
  body: AuthoredParameterBody | undefined,
): string[] {
  if (!body) {
    return [];
  }
  if (body.form === "assignment") {
    return [...body.values];
  }
  if (!catalog?.select) {
    return [];
  }
  const byKey = new Map(
    catalog.select.choices.map((choice) => [choice.key, choice.text]),
  );
  const values: string[] = [];
  for (const key of body.selectedChoiceKeys) {
    const text = byKey.get(key);
    if (text) {
      values.push(text);
    }
  }
  return values;
}

function frameworkStatusAllowsAuthoritativeSubstitution(
  resolution: FrameworkParameterResolution,
): boolean {
  if (
    resolution.mappingBasis === "control-level-unmapped" ||
    resolution.mappingBasis === "catalog-unassigned"
  ) {
    return false;
  }
  if (resolution.values.length === 0) {
    return false;
  }
  return (
    resolution.status === "baseline-inherited" ||
    resolution.status === "overlay-explicit" ||
    resolution.status === "satisfied-by-overlay"
  );
}

function isOrganizationDefinedSlot(
  resolution: FrameworkParameterResolution | undefined,
): boolean {
  if (!resolution) {
    return true;
  }
  if (resolution.mappingBasis === "control-level-unmapped") {
    return false;
  }
  return (
    resolution.status === "csp-organization-defined" ||
    resolution.mappingBasis === "catalog-unassigned"
  );
}

function isMayUseBaseline(
  resolution: FrameworkParameterResolution | undefined,
): boolean {
  return (
    resolution?.status === "may-use-baseline" &&
    resolution.mappingBasis !== "control-level-unmapped"
  );
}

export function resolveParameter(input: {
  controlId: string;
  parameterId: string;
  catalog?: FrameworkOrganizationDefinedParameter;
  framework?: FrameworkParameterResolution;
  project?: ProjectParameterRecord;
}): EffectiveParameter {
  const { controlId, parameterId, catalog, framework, project } = input;
  const annotations: ParameterAnnotation[] = [];
  const isAggregate = catalog ? isAggregateCatalogParameter(catalog) : false;

  if (!catalog) {
    return {
      controlId,
      parameterId,
      catalog: null,
      framework: framework ?? null,
      project,
      substitution: { kind: "unresolved", reason: project ? "orphan" : "missing-catalog" },
      annotations: project ? [{ kind: "orphan" }] : [],
      isAggregate: false,
    };
  }

  if (framework?.mappingBasis === "control-level-unmapped") {
    const summary = framework.controlOverlaySummary;
    annotations.push({
      kind: "control-overlay-unmapped",
      status: summary?.status ?? framework.status,
      effectiveAssignmentText: summary?.effectiveAssignmentText ?? null,
      effectiveAssignmentSource: summary?.effectiveAssignmentSource ?? null,
    });
    if (project?.intent === "dspav-assertion" && project.body) {
      annotations.push({
        kind: "dspav-assertion",
        values: authoredValues(catalog, project.body),
        sourceNote: project.dspavSourceNote ?? "",
        notes: project.notes,
      });
    } else if (project?.intent === "conflict-proceeding") {
      annotations.push({ kind: "conflict-proceeding", notes: project.notes });
    } else if (project?.intent === "documented-deviation" && project.body) {
      annotations.push({
        kind: "documented-deviation",
        values: authoredValues(catalog, project.body),
        notes: project.notes,
      });
    } else if (
      project?.intent === "organization-defined" &&
      project.body &&
      authoredValues(catalog, project.body).length > 0
    ) {
      annotations.push({
        kind: "project-documentation",
        values: authoredValues(catalog, project.body),
        notes: project.notes,
      });
    }
    const reason =
      framework.status === "authoritative-value-required"
        ? "authoritative-value-required"
        : framework.status === "source-conflict"
          ? "source-conflict"
          : "control-level-unmapped";
    return {
      controlId,
      parameterId,
      catalog,
      framework,
      project,
      substitution: { kind: "unresolved", reason },
      annotations,
      isAggregate,
    };
  }

  if (framework && frameworkStatusAllowsAuthoritativeSubstitution(framework)) {
    if (project?.intent === "documented-deviation" && project.body) {
      annotations.push({
        kind: "documented-deviation",
        values: authoredValues(catalog, project.body),
        notes: project.notes,
      });
    }
    return {
      controlId,
      parameterId,
      catalog,
      framework,
      project,
      substitution: {
        kind: "value",
        values: framework.values,
        origin: "framework",
      },
      annotations,
      isAggregate,
    };
  }

  if (framework?.status === "authoritative-value-required") {
    if (project?.intent === "dspav-assertion" && project.body) {
      annotations.push({
        kind: "dspav-assertion",
        values: authoredValues(catalog, project.body),
        sourceNote: project.dspavSourceNote ?? "",
        notes: project.notes,
      });
    }
    return {
      controlId,
      parameterId,
      catalog,
      framework,
      project,
      substitution: { kind: "unresolved", reason: "authoritative-value-required" },
      annotations,
      isAggregate,
    };
  }

  if (framework?.status === "source-conflict") {
    if (project?.intent === "conflict-proceeding") {
      annotations.push({ kind: "conflict-proceeding", notes: project.notes });
    }
    return {
      controlId,
      parameterId,
      catalog,
      framework,
      project,
      substitution: { kind: "unresolved", reason: "source-conflict" },
      annotations,
      isAggregate,
    };
  }

  if (isMayUseBaseline(framework)) {
    annotations.push({
      kind: "permitted-baseline-available",
      values: framework?.values ?? [],
    });
    if (project?.intent === "accept-permitted-baseline") {
      const values =
        project.body && authoredValues(catalog, project.body).length > 0
          ? authoredValues(catalog, project.body)
          : [...(framework?.values ?? [])];
      if (values.length > 0) {
        return {
          controlId,
          parameterId,
          catalog,
          framework: framework ?? null,
          project,
          substitution: {
            kind: "value",
            values,
            origin: "accepted-baseline",
          },
          annotations,
          isAggregate,
        };
      }
    }
    if (
      project?.intent === "organization-defined" &&
      project.body &&
      authoredValues(catalog, project.body).length > 0
    ) {
      return {
        controlId,
        parameterId,
        catalog,
        framework: framework ?? null,
        project,
        substitution: {
          kind: "value",
          values: authoredValues(catalog, project.body),
          origin: "project",
        },
        annotations,
        isAggregate,
      };
    }
    return {
      controlId,
      parameterId,
      catalog,
      framework: framework ?? null,
      project,
      substitution: { kind: "unresolved", reason: "may-use-baseline" },
      annotations,
      isAggregate,
    };
  }

  if (isOrganizationDefinedSlot(framework)) {
    if (
      project?.intent === "organization-defined" &&
      project.body &&
      authoredValues(catalog, project.body).length > 0
    ) {
      return {
        controlId,
        parameterId,
        catalog,
        framework: framework ?? null,
        project,
        substitution: {
          kind: "value",
          values: authoredValues(catalog, project.body),
          origin: "project",
        },
        annotations,
        isAggregate,
      };
    }
    return {
      controlId,
      parameterId,
      catalog,
      framework: framework ?? null,
      project,
      substitution: { kind: "unresolved", reason: "organization-defined" },
      annotations,
      isAggregate,
    };
  }

  return {
    controlId,
    parameterId,
    catalog,
    framework: framework ?? null,
    project,
    substitution: { kind: "unresolved", reason: "organization-defined" },
    annotations,
    isAggregate,
  };
}

export function resolveControlParameters(
  control: FrameworkControl,
  records: ProjectParameterRecords,
): EffectiveParameter[] {
  const catalogParams = control.parameters?.organizationDefined ?? [];
  const resolutions = new Map(
    (control.parameters?.parameterResolutions ?? []).map((row) => [
      row.parameterId,
      row,
    ]),
  );
  const seen = new Set<string>();
  const resolved: EffectiveParameter[] = [];
  for (const catalog of catalogParams) {
    seen.add(catalog.id);
    resolved.push(
      resolveParameter({
        controlId: control.id,
        parameterId: catalog.id,
        catalog,
        framework: resolutions.get(catalog.id),
        project: records[catalog.id],
      }),
    );
  }
  for (const [parameterId, project] of Object.entries(records)) {
    if (seen.has(parameterId) || project.controlId !== control.id) {
      continue;
    }
    resolved.push(
      resolveParameter({
        controlId: control.id,
        parameterId,
        project,
      }),
    );
  }
  return resolved;
}

export function substitutionDisplayText(values: readonly string[]): string {
  return values.join("; ");
}

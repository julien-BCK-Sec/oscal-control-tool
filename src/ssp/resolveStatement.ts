import type { FrameworkControl } from "@/data/framework";
import {
  resolveControlParameters,
  substitutionDisplayText,
  type EffectiveParameter,
  type ParameterAnnotation,
} from "@/domain/parameter-resolution";
import { isAggregateCatalogParameter } from "@/framework/nist-sp-800-53-rev5/parameters";
import type { ProjectParameterRecords } from "@/data/parameter";
import { formatOdpLabel, PARAM_INSERT_PATTERN } from "./odp";
import { unresolvedOdpPlaceholder } from "./placeholders";
import type {
  SspParameterAnnotation,
  SspParameterResolution,
} from "./types";

function parameterCatalogMap(control: FrameworkControl) {
  const map = new Map(
    (control.parameters?.organizationDefined ?? []).map((param) => [
      param.id,
      param,
    ]),
  );
  return map;
}

function insertReplacement(
  parameterId: string,
  control: FrameworkControl,
  byId: Map<string, EffectiveParameter>,
  catalogById: ReturnType<typeof parameterCatalogMap>,
  visiting: Set<string>,
): string {
  if (visiting.has(parameterId)) {
    return unresolvedOdpPlaceholder(
      parameterId,
      formatOdpLabel(parameterId, catalogById),
    );
  }
  const catalog = catalogById.get(parameterId);
  if (catalog && isAggregateCatalogParameter(catalog)) {
    visiting.add(parameterId);
    const joined = catalog.aggregatedParameterIds
      .map((childId) =>
        insertReplacement(childId, control, byId, catalogById, visiting),
      )
      .join("; ");
    visiting.delete(parameterId);
    return joined;
  }
  const effective = byId.get(parameterId);
  const label = formatOdpLabel(parameterId, catalogById);
  if (!effective || effective.substitution.kind === "unresolved") {
    return unresolvedOdpPlaceholder(parameterId, label);
  }
  visiting.add(parameterId);
  const expanded = replaceInserts(
    substitutionDisplayText(effective.substitution.values),
    control,
    byId,
    catalogById,
    visiting,
  );
  visiting.delete(parameterId);
  return expanded;
}

function replaceInserts(
  text: string,
  control: FrameworkControl,
  byId: Map<string, EffectiveParameter>,
  catalogById: ReturnType<typeof parameterCatalogMap>,
  visiting: Set<string>,
): string {
  const pattern = new RegExp(
    PARAM_INSERT_PATTERN.source,
    PARAM_INSERT_PATTERN.flags,
  );
  return text.replace(pattern, (_match, rawId: string) =>
    insertReplacement(rawId.trim(), control, byId, catalogById, visiting),
  );
}

export function synthesizeResolvedStatement(
  control: FrameworkControl,
  resolved: readonly EffectiveParameter[],
): string {
  const byId = new Map(resolved.map((row) => [row.parameterId, row]));
  const catalogById = parameterCatalogMap(control);
  return replaceInserts(
    control.statement,
    control,
    byId,
    catalogById,
    new Set(),
  );
}

function provenanceLabel(effective: EffectiveParameter): string | null {
  if (effective.substitution.kind !== "value") {
    return null;
  }
  if (effective.substitution.origin === "framework") {
    return effective.framework?.sources[0]?.source ?? "Framework";
  }
  if (effective.substitution.origin === "accepted-baseline") {
    return "Accepted permitted baseline";
  }
  return "Project-authored";
}

function resolutionState(
  effective: EffectiveParameter,
): SspParameterResolution["state"] {
  if (effective.substitution.kind === "value") {
    if (effective.substitution.origin === "framework") {
      return "framework-authoritative";
    }
    if (effective.substitution.origin === "accepted-baseline") {
      return "accepted-baseline";
    }
    return "project-resolved";
  }
  return "unresolved";
}

export function mapParameterResolutions(
  control: FrameworkControl,
  resolved: readonly EffectiveParameter[],
): SspParameterResolution[] {
  const catalogById = parameterCatalogMap(control);
  const statementIds: string[] = [];
  const seen = new Set<string>();
  const pattern = new RegExp(
    PARAM_INSERT_PATTERN.source,
    PARAM_INSERT_PATTERN.flags,
  );
  for (const match of control.statement.matchAll(pattern)) {
    const id = match[1]?.trim();
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    const catalog = catalogById.get(id);
    if (catalog && isAggregateCatalogParameter(catalog)) {
      for (const childId of catalog.aggregatedParameterIds) {
        if (!seen.has(childId)) {
          seen.add(childId);
          statementIds.push(childId);
        }
      }
      continue;
    }
    statementIds.push(id);
  }
  const byId = new Map(resolved.map((row) => [row.parameterId, row]));
  return statementIds.map((id) => {
    const effective = byId.get(id);
    const label = formatOdpLabel(id, catalogById);
    if (!effective || effective.substitution.kind === "unresolved") {
      return {
        id,
        label,
        state: "unresolved" as const,
        unresolvedReason: effective?.substitution.kind === "unresolved"
          ? effective.substitution.reason
          : "organization-defined",
        displayText: null,
        placeholder: unresolvedOdpPlaceholder(id, label),
        provenanceLabel: null,
      };
    }
    return {
      id,
      label,
      state: resolutionState(effective),
      unresolvedReason: null,
      displayText: substitutionDisplayText(effective.substitution.values),
      placeholder: null,
      provenanceLabel: provenanceLabel(effective),
    };
  });
}

function annotationTitle(kind: ParameterAnnotation["kind"]): string {
  switch (kind) {
    case "documented-deviation":
      return "Documented operational deviation";
    case "dspav-assertion":
      return "Project DSPAV assertion";
    case "conflict-proceeding":
      return "Project conflict proceeding";
    case "control-overlay-unmapped":
      return "Control-level overlay (not mapped to this parameter)";
    case "permitted-baseline-available":
      return "Permitted baseline available";
    case "orphan":
      return "Orphaned parameter record";
    case "project-documentation":
      return "Project documentation (not used as authoritative substitution)";
  }
}

function annotationText(
  parameterId: string,
  annotation: ParameterAnnotation,
): string {
  switch (annotation.kind) {
    case "documented-deviation":
      return `Parameter ${parameterId}: organization documents operational values ${annotation.values.join("; ")}. This does not replace the authoritative framework value.${annotation.notes ? ` ${annotation.notes}` : ""}`;
    case "dspav-assertion":
      return `Parameter ${parameterId}: the organization asserts it obtained ${annotation.values.join("; ")} from ${annotation.sourceNote || "the restricted source"}. This is a project assertion, not a Control Freak-verified authoritative value.${annotation.notes ? ` ${annotation.notes}` : ""}`;
    case "conflict-proceeding":
      return `Parameter ${parameterId}: the organization recorded how it proceeded. This note does not resolve the source conflict.${annotation.notes ? ` ${annotation.notes}` : ""}`;
    case "control-overlay-unmapped":
      return annotation.effectiveAssignmentText
        ? `Parameter ${parameterId}: overlay text exists at control level (${annotation.effectiveAssignmentSource ?? "overlay"}) and is not attributed to this ODP.`
        : `Parameter ${parameterId}: overlay authority is control-level only and is not attributed to this ODP.`;
    case "permitted-baseline-available":
      return `Parameter ${parameterId}: DoD permits the baseline value ${annotation.values.join("; ") || "(none recorded)"}. The project has not automatically accepted it.`;
    case "orphan":
      return `Parameter ${parameterId} is stored on the project but is not in the current generated framework.`;
    case "project-documentation":
      return `Parameter ${parameterId}: ${annotation.values.join("; ")}. This project documentation is not used to resolve the insert while overlay mapping remains control-level.${annotation.notes ? ` ${annotation.notes}` : ""}`;
  }
}

export function mapParameterAnnotations(
  resolved: readonly EffectiveParameter[],
): SspParameterAnnotation[] {
  const rows: SspParameterAnnotation[] = [];
  for (const effective of resolved) {
    for (const annotation of effective.annotations) {
      if (annotation.kind === "control-overlay-unmapped") {
        continue;
      }
      rows.push({
        parameterId: effective.parameterId,
        kind: annotation.kind,
        title: annotationTitle(annotation.kind),
        text: annotationText(effective.parameterId, annotation),
      });
    }
  }
  return rows;
}

export function resolveControlForSsp(
  control: FrameworkControl,
  records: ProjectParameterRecords,
): {
  resolved: EffectiveParameter[];
  resolvedStatement: string;
  parameterResolutions: SspParameterResolution[];
  parameterAnnotations: SspParameterAnnotation[];
} {
  const resolved = resolveControlParameters(control, records);
  return {
    resolved,
    resolvedStatement: synthesizeResolvedStatement(control, resolved),
    parameterResolutions: mapParameterResolutions(control, resolved),
    parameterAnnotations: mapParameterAnnotations(resolved),
  };
}

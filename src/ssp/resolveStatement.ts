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
  SspUnresolvedParameter,
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

type SynthesisCollector = {
  unresolved: SspUnresolvedParameter[];
  resolutions: SspParameterResolution[];
  seen: Set<string>;
};

function toResolution(
  id: string,
  effective: EffectiveParameter | undefined,
  label: string,
): SspParameterResolution {
  if (!effective || effective.substitution.kind === "unresolved") {
    return {
      id,
      label,
      state: "unresolved",
      unresolvedReason:
        effective?.substitution.kind === "unresolved"
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
}

function recordVisitedInsert(
  collector: SynthesisCollector,
  id: string,
  effective: EffectiveParameter | undefined,
  label: string,
): void {
  if (collector.seen.has(id)) {
    return;
  }
  collector.seen.add(id);
  const resolution = toResolution(id, effective, label);
  collector.resolutions.push(resolution);
  if (resolution.state === "unresolved") {
    collector.unresolved.push({ id, label });
  }
}

function insertReplacement(
  parameterId: string,
  byId: Map<string, EffectiveParameter>,
  catalogById: ReturnType<typeof parameterCatalogMap>,
  visiting: Set<string>,
  collector: SynthesisCollector,
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
        insertReplacement(childId, byId, catalogById, visiting, collector),
      )
      .join("; ");
    visiting.delete(parameterId);
    return joined;
  }
  const effective = byId.get(parameterId);
  const label = formatOdpLabel(parameterId, catalogById);
  recordVisitedInsert(collector, parameterId, effective, label);
  if (!effective || effective.substitution.kind === "unresolved") {
    return unresolvedOdpPlaceholder(parameterId, label);
  }
  visiting.add(parameterId);
  const expanded = replaceInserts(
    substitutionDisplayText(effective.substitution.values),
    byId,
    catalogById,
    visiting,
    collector,
  );
  visiting.delete(parameterId);
  return expanded;
}

function replaceInserts(
  text: string,
  byId: Map<string, EffectiveParameter>,
  catalogById: ReturnType<typeof parameterCatalogMap>,
  visiting: Set<string>,
  collector: SynthesisCollector,
): string {
  const pattern = new RegExp(
    PARAM_INSERT_PATTERN.source,
    PARAM_INSERT_PATTERN.flags,
  );
  return text.replace(pattern, (_match, rawId: string) =>
    insertReplacement(rawId.trim(), byId, catalogById, visiting, collector),
  );
}

export type SynthesizedControlStatement = {
  resolvedStatement: string;
  unresolvedParameters: SspUnresolvedParameter[];
  parameterResolutions: SspParameterResolution[];
};

/**
 * Single per-insert walk used for the resolved requirement and the unresolved
 * parameter list. Nested inserts are reported only when a resolved ancestor
 * substitution still contains them.
 */
export function synthesizeControlStatement(
  control: FrameworkControl,
  resolved: readonly EffectiveParameter[],
): SynthesizedControlStatement {
  const byId = new Map(resolved.map((row) => [row.parameterId, row]));
  const catalogById = parameterCatalogMap(control);
  const collector: SynthesisCollector = {
    unresolved: [],
    resolutions: [],
    seen: new Set(),
  };
  const resolvedStatement = replaceInserts(
    control.statement,
    byId,
    catalogById,
    new Set(),
    collector,
  );
  return {
    resolvedStatement,
    unresolvedParameters: collector.unresolved,
    parameterResolutions: collector.resolutions,
  };
}

export function synthesizeResolvedStatement(
  control: FrameworkControl,
  resolved: readonly EffectiveParameter[],
): string {
  return synthesizeControlStatement(control, resolved).resolvedStatement;
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
  return synthesizeControlStatement(control, resolved).parameterResolutions;
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
  unresolvedParameters: SspUnresolvedParameter[];
  parameterResolutions: SspParameterResolution[];
  parameterAnnotations: SspParameterAnnotation[];
} {
  const resolved = resolveControlParameters(control, records);
  const synthesized = synthesizeControlStatement(control, resolved);
  return {
    resolved,
    resolvedStatement: synthesized.resolvedStatement,
    unresolvedParameters: synthesized.unresolvedParameters,
    parameterResolutions: synthesized.parameterResolutions,
    parameterAnnotations: mapParameterAnnotations(resolved),
  };
}

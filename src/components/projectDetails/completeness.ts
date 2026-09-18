import type { ProjectMetadata, SystemOperationalStatus } from "@/data/project";
import { OPERATIONAL_STATUS_LABELS } from "./copy";

export type DocumentationCompleteness = {
  caption: string;
  fullyDocumented: boolean;
};

function filled(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export function documentedFieldSummary(
  filledCount: number,
  totalCount: number,
): DocumentationCompleteness {
  if (filledCount <= 0) {
    return { caption: "Not documented", fullyDocumented: false };
  }
  if (filledCount >= totalCount) {
    return { caption: "Documented", fullyDocumented: true };
  }
  const missing = totalCount - filledCount;
  return {
    caption: `${missing} field${missing === 1 ? "" : "s"} undocumented`,
    fullyDocumented: false,
  };
}

export function documentedListSummary(count: number): DocumentationCompleteness {
  if (count <= 0) {
    return { caption: "None documented", fullyDocumented: false };
  }
  return {
    caption: `${count} documented`,
    fullyDocumented: true,
  };
}

export function systemIdentityCompleteness(
  metadata: ProjectMetadata,
): DocumentationCompleteness {
  const count = [
    metadata.systemName,
    metadata.systemNameShort,
    metadata.systemIdentifier,
    metadata.systemDescription,
  ].filter(filled).length;
  return documentedFieldSummary(count, 4);
}

export function sspOrganizationCompleteness(
  metadata: ProjectMetadata,
): DocumentationCompleteness {
  return documentedFieldSummary(filled(metadata.organizationName) ? 1 : 0, 1);
}

export function boundaryEnvironmentCompleteness(
  metadata: ProjectMetadata,
): DocumentationCompleteness {
  const count = [
    metadata.authorizationBoundary,
    metadata.environmentOfOperation,
  ].filter(filled).length;
  return documentedFieldSummary(count, 2);
}

export function systemRolesCompleteness(
  metadata: ProjectMetadata,
): DocumentationCompleteness {
  return documentedListSummary(metadata.systemRoles.length);
}

export function informationTypesAndCategorizationCompleteness(
  metadata: ProjectMetadata,
): DocumentationCompleteness {
  const cat = metadata.securityCategorization;
  const catFilled = [
    cat?.confidentiality,
    cat?.integrity,
    cat?.availability,
    cat?.rationale,
  ].filter(filled).length;
  const catCaption =
    catFilled === 0
      ? "categorization not documented"
      : catFilled === 4
        ? "categorization documented"
        : `${4 - catFilled} categorization fields undocumented`;
  const dodCaption = metadata.dodCloudImpactLevel?.level
    ? "DoD impact documented"
    : null;
  const typeCaption =
    metadata.informationTypes.length === 0
      ? "no information types documented"
      : `${metadata.informationTypes.length} information types documented`;
  return {
    caption: [catCaption, dodCaption, typeCaption].filter(Boolean).join(" · "),
    fullyDocumented: catFilled === 4,
  };
}

export function interconnectionsCompleteness(
  metadata: ProjectMetadata,
): DocumentationCompleteness {
  return documentedListSummary(metadata.interconnections.length);
}

export function operationalStatusCompleteness(
  metadata: ProjectMetadata,
): DocumentationCompleteness {
  if (!filled(metadata.operationalStatus)) {
    return { caption: "Not documented", fullyDocumented: false };
  }
  const status = metadata.operationalStatus as SystemOperationalStatus;
  return {
    caption: OPERATIONAL_STATUS_LABELS[status] ?? metadata.operationalStatus,
    fullyDocumented: true,
  };
}

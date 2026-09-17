/**
 * Pure mapping from canonical Control Freak project/framework data into the
 * SSP document/view model. Contains no DOCX types.
 */

import type { ControlRecord } from "@/data/control-record";
import type { EvidenceWithControlIds } from "@/data/evidence";
import {
  evidenceStatusLabel,
  evidenceTypeLabel,
} from "@/data/evidence";
import type { FrameworkControl } from "@/data/framework";
import { DEFAULT_CONTROL_IMPLEMENTATION } from "@/data/implementation";
import type {
  InformationType,
  ProjectMetadata,
  SystemInterconnection,
  SystemRole,
} from "@/data/project";
import { deriveOverallImpact } from "./categorization";
import {
  buildSspControlTree,
  formatSspItemDisplayId,
  parentControlId,
  sspItemKind,
} from "./identity";
import {
  DOD_CLOUD_IMPACT_LABELS,
  FIPS_IMPACT_LABELS,
  INTERCONNECTION_DIRECTION_LABELS,
  OPERATIONAL_STATUS_LABELS,
  SYSTEM_ROLE_LABELS,
} from "./labels";
import { humanizeSourceStatement } from "./odp";
import { mapOverlayForSsp } from "./overlay";
import { resolveControlForSsp } from "./resolveStatement";
import {
  COMPLETENESS_NOTICE_PARAGRAPHS,
  documented,
  fromOptionalText,
  notDocumented,
} from "./placeholders";
import { implementationDocumentationStatusLabel } from "./status";
import type {
  SspDocument,
  SspEvidenceRef,
  SspFrameworkItem,
  SspGenerationInput,
  SspInformationTypeRow,
  SspInterconnectionRow,
  SspRoleRow,
} from "./types";
import {
  CF_SSP_DOCUMENT_TYPE,
  CF_SSP_LAYOUT_ID,
  CF_SSP_LAYOUT_VERSION,
} from "./types";

function itemTerms(descriptor: SspGenerationInput["descriptor"]): {
  singular: string;
  plural: string;
} {
  return {
    singular: descriptor.itemSingular?.trim() || "control",
    plural: descriptor.itemPlural?.trim() || "controls",
  };
}

function mapRole(role: SystemRole): SspRoleRow {
  const name = fromOptionalText(role.name, "Name");
  const otherLabel =
    role.role === "other"
      ? fromOptionalText(role.otherRoleLabel, "Role label")
      : documented(SYSTEM_ROLE_LABELS[role.role]);
  const roleLabel =
    role.role === "other"
      ? otherLabel.kind === "documented"
        ? otherLabel.text
        : "Other"
      : SYSTEM_ROLE_LABELS[role.role];
  const isCompleteAccountableRole =
    name.kind === "documented" &&
    (role.role !== "other" || otherLabel.kind === "documented");
  return {
    roleLabel,
    name,
    title: fromOptionalText(role.title, "Title"),
    organization: fromOptionalText(role.organization, "Organization"),
    email: fromOptionalText(role.email, "Email"),
    phone: fromOptionalText(role.phone, "Phone"),
    isCompleteAccountableRole,
  };
}

function mapInformationType(item: InformationType): SspInformationTypeRow {
  return {
    title: fromOptionalText(item.title, "Information type title"),
    description: fromOptionalText(item.description, "Description"),
    confidentiality: item.confidentialityImpact
      ? documented(FIPS_IMPACT_LABELS[item.confidentialityImpact])
      : notDocumented("Confidentiality impact"),
    integrity: item.integrityImpact
      ? documented(FIPS_IMPACT_LABELS[item.integrityImpact])
      : notDocumented("Integrity impact"),
    availability: item.availabilityImpact
      ? documented(FIPS_IMPACT_LABELS[item.availabilityImpact])
      : notDocumented("Availability impact"),
  };
}

function mapInterconnection(
  item: SystemInterconnection,
): SspInterconnectionRow {
  return {
    name: fromOptionalText(item.name, "Interconnection name"),
    organization: fromOptionalText(item.organization, "External organization"),
    purpose: fromOptionalText(item.description, "Purpose"),
    informationExchanged: fromOptionalText(
      item.informationExchanged,
      "Information exchanged",
    ),
    direction: item.direction
      ? documented(INTERCONNECTION_DIRECTION_LABELS[item.direction])
      : notDocumented("Direction"),
    securityNotes: fromOptionalText(item.securityNotes, "Security notes"),
  };
}

function mapCategorization(metadata: ProjectMetadata) {
  const cat = metadata.securityCategorization;
  const confidentiality = cat?.confidentiality
    ? documented(FIPS_IMPACT_LABELS[cat.confidentiality])
    : notDocumented("Confidentiality");
  const integrity = cat?.integrity
    ? documented(FIPS_IMPACT_LABELS[cat.integrity])
    : notDocumented("Integrity");
  const availability = cat?.availability
    ? documented(FIPS_IMPACT_LABELS[cat.availability])
    : notDocumented("Availability");
  const derivedOverallImpact =
    cat?.confidentiality && cat.integrity && cat.availability
      ? deriveOverallImpact(cat.confidentiality, cat.integrity, cat.availability)
      : null;
  const dod = metadata.dodCloudImpactLevel;
  let dodCloudImpactLevel = notDocumented("DoD cloud impact level");
  if (dod) {
    const label = DOD_CLOUD_IMPACT_LABELS[dod.level];
    const notes = dod.notes?.trim();
    dodCloudImpactLevel = documented(
      notes ? `${label}. ${notes}` : label,
    );
  }
  return {
    confidentiality,
    integrity,
    availability,
    rationale: fromOptionalText(cat?.rationale, "Categorization rationale"),
    derivedOverallImpact,
    dodCloudImpactLevel,
  };
}

function mapEvidence(
  linked: readonly EvidenceWithControlIds[] | undefined,
): SspEvidenceRef[] {
  const rows = (linked ?? []).filter((item) => item.status !== "archived");
  rows.sort((left, right) => {
    const title = left.title.localeCompare(right.title);
    if (title !== 0) {
      return title;
    }
    return left.id.localeCompare(right.id);
  });
  return rows.map((item) => ({
    title: item.title,
    evidenceTypeLabel: evidenceTypeLabel(item.evidenceType),
    lifecycleStatusLabel: evidenceStatusLabel(item.status),
    collectionDate: item.collectionDate,
  }));
}

function mapFrameworkItem(
  control: FrameworkControl,
  input: SspGenerationInput,
  terms: { singular: string; plural: string },
): SspFrameworkItem {
  const implementation =
    input.project.implementations[control.id] ?? DEFAULT_CONTROL_IMPLEMENTATION;
  const humanized = humanizeSourceStatement(control);
  const synthesized = resolveControlForSsp(
    control,
    input.project.parameterRecords,
  );
  const overlay = mapOverlayForSsp(control);
  const record: ControlRecord | undefined = input.controlRecordsByControlId.get(
    control.id,
  );
  const owner = record?.owner.trim() || null;
  const narrative = implementation.narrative.trim();
  return {
    id: control.id,
    displayId: formatSspItemDisplayId(control.id),
    title: control.title,
    family: control.family,
    itemKind: sspItemKind(control, terms.singular),
    originId:
      terms.singular === "requirement" ? control.originId?.trim() || null : null,
    parentId: parentControlId(control.id),
    sourceStatement: humanized.text,
    resolvedStatement: synthesized.resolvedStatement,
    unresolvedParameters: humanized.unresolvedParameters,
    parameterResolutions: synthesized.parameterResolutions,
    parameterAnnotations: synthesized.parameterAnnotations,
    frameworkAssignments: overlay.assignments,
    supplements: overlay.supplements,
    notices: overlay.notices,
    implementationNarrative: narrative
      ? documented(narrative)
      : notDocumented("Implementation narrative"),
    implementationDocumentationStatus: {
      value: implementation.status,
      label: implementationDocumentationStatusLabel(implementation.status),
    },
    implementationOwnerLabel: owner,
    evidenceReferences: mapEvidence(input.evidenceByControlId.get(control.id)),
  };
}

export function buildSspDocument(input: SspGenerationInput): SspDocument {
  const { project, framework, descriptor, generatedAt } = input;
  const metadata = project.metadata;
  const terms = itemTerms(descriptor);
  const tree = buildSspControlTree(framework.controls);
  const families = tree.map((group) => ({
    family: group.family,
    items: group.nodes.flatMap((node) => [
      mapFrameworkItem(node.control, input, terms),
      ...node.enhancements.map((enhancement) =>
        mapFrameworkItem(enhancement, input, terms),
      ),
    ]),
  }));
  const allItems = families.flatMap((group) => group.items);
  const narrativesDocumented = allItems.filter(
    (item) => item.implementationNarrative.kind === "documented",
  ).length;

  return {
    identity: {
      documentType: CF_SSP_DOCUMENT_TYPE,
      layoutId: CF_SSP_LAYOUT_ID,
      layoutVersion: CF_SSP_LAYOUT_VERSION,
      systemName: fromOptionalText(metadata.systemName, "System name"),
      systemNameShort: fromOptionalText(metadata.systemNameShort, "Short name"),
      systemIdentifier: fromOptionalText(
        metadata.systemIdentifier,
        "System identifier",
      ),
      sspOrganization: fromOptionalText(
        metadata.organizationName,
        "SSP organization",
      ),
      documentedAgainst: {
        frameworkId: framework.id,
        frameworkTitle: descriptor.title || framework.title,
        itemSingular: terms.singular,
        itemPlural: terms.plural,
      },
      generatedAt,
      projectId: project.id,
      projectRevision: project.revision,
      projectSchemaVersion: project.schemaVersion,
    },
    completenessNotice: {
      paragraphs: [...COMPLETENESS_NOTICE_PARAGRAPHS],
    },
    systemOverview: {
      overview: fromOptionalText(metadata.systemDescription, "System overview"),
      operationalStatus: metadata.operationalStatus
        ? documented(OPERATIONAL_STATUS_LABELS[metadata.operationalStatus])
        : notDocumented("Operational status"),
      operationalStatusRemarks: fromOptionalText(
        metadata.operationalStatusRemarks,
        "Operational status remarks",
      ),
    },
    roles: {
      collection: metadata.systemRoles.length > 0 ? "documented" : "not-documented",
      rows: metadata.systemRoles.map(mapRole),
    },
    boundaryAndEnvironment: {
      authorizationBoundary: fromOptionalText(
        metadata.authorizationBoundary,
        "Authorization boundary",
      ),
      environmentOfOperation: fromOptionalText(
        metadata.environmentOfOperation,
        "Environment of operation",
      ),
    },
    categorization: mapCategorization(metadata),
    informationTypes: {
      collection:
        metadata.informationTypes.length > 0 ? "documented" : "not-documented",
      rows: metadata.informationTypes.map(mapInformationType),
    },
    interconnections: {
      collection:
        metadata.interconnections.length > 0 ? "documented" : "not-documented",
      rows: metadata.interconnections.map(mapInterconnection),
    },
    families,
    counts: {
      totalItems: allItems.length,
      narrativesDocumented,
    },
  };
}

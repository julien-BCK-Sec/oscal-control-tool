/**
 * Control Freak SSP document/view model (Milestone 07B).
 *
 * Semantic representation of a human-readable System Security Plan.
 * Independent of DOCX/OOXML. Independently testable. Not a generic
 * document engine and not canonical project data.
 */

import type { ControlRecord } from "@/data/control-record";
import type { EvidenceWithControlIds } from "@/data/evidence";
import type { Framework, FrameworkDescriptor } from "@/data/framework";
import type { ImplementationStatus } from "@/data/implementation";
import type { StoredProject } from "@/persistence/types";

export const CF_SSP_DOCUMENT_TYPE = "Control Freak System Security Plan" as const;
export const CF_SSP_LAYOUT_ID = "cf-ssp-docx" as const;
export const CF_SSP_LAYOUT_VERSION = "1.0" as const;

export type SspCompleteness =
  | { kind: "documented"; text: string }
  | { kind: "not-documented"; fieldLabel: string }
  | { kind: "incomplete"; fieldLabel: string; partial: string }
  | { kind: "not-applicable"; text: string }
  | { kind: "unresolved-odp"; parameterId: string; label: string }
  | { kind: "authoritative-value-required"; explanation: string }
  | { kind: "source-conflict"; explanation: string }
  | { kind: "conditional"; conditionLabel: string; notes: string };

export type SspProvenanceText = {
  text: string;
  sourceLabel: string;
};

export type SspNoticeKind =
  | "source-conflict"
  | "authoritative-value-required"
  | "conditional-applicability";

export type SspNotice = {
  kind: SspNoticeKind;
  title: string;
  explanation: string;
};

export type SspItemKind = "control" | "enhancement" | "requirement" | "grr";

export type SspUnresolvedParameter = {
  id: string;
  label: string;
};

export type SspParameterResolutionState =
  | "unresolved"
  | "project-resolved"
  | "framework-authoritative"
  | "accepted-baseline";

export type SspParameterResolution = {
  id: string;
  label: string;
  state: SspParameterResolutionState;
  unresolvedReason:
    | "organization-defined"
    | "may-use-baseline"
    | "authoritative-value-required"
    | "source-conflict"
    | "control-level-unmapped"
    | "orphan"
    | "missing-catalog"
    | null;
  displayText: string | null;
  placeholder: string | null;
  provenanceLabel: string | null;
};

export type SspParameterAnnotationKind =
  | "documented-deviation"
  | "dspav-assertion"
  | "conflict-proceeding"
  | "permitted-baseline-available"
  | "orphan"
  | "project-documentation";

export type SspParameterAnnotation = {
  parameterId: string;
  kind: SspParameterAnnotationKind;
  title: string;
  text: string;
};

export type SspFrameworkAssignment = {
  text: string;
  sourceLabel: string;
  classificationLabel: string | null;
  supportingText: string | null;
  kind: "assignment" | "additional-guidance";
};

export type SspFrameworkItem = {
  id: string;
  displayId: string;
  title: string;
  family: string;
  itemKind: SspItemKind;
  originId: string | null;
  parentId: string | null;
  sourceStatement: string;
  resolvedStatement: string;
  unresolvedParameters: SspUnresolvedParameter[];
  parameterResolutions: SspParameterResolution[];
  parameterAnnotations: SspParameterAnnotation[];
  frameworkAssignments: SspFrameworkAssignment[];
  supplements: SspProvenanceText[];
  notices: SspNotice[];
  implementationNarrative: SspCompleteness;
  implementationDocumentationStatus: {
    value: ImplementationStatus;
    label: string;
  };
  implementationOwnerLabel: string | null;
  evidenceReferences: SspEvidenceRef[];
};

export type SspEvidenceRef = {
  title: string;
  evidenceTypeLabel: string;
  lifecycleStatusLabel: string;
  collectionDate: string | null;
};

export type SspFamilyGroup = {
  family: string;
  items: SspFrameworkItem[];
};

export type SspRoleRow = {
  roleLabel: string;
  name: SspCompleteness;
  title: SspCompleteness;
  organization: SspCompleteness;
  email: SspCompleteness;
  phone: SspCompleteness;
  isCompleteAccountableRole: boolean;
};

export type SspInformationTypeRow = {
  title: SspCompleteness;
  description: SspCompleteness;
  confidentiality: SspCompleteness;
  integrity: SspCompleteness;
  availability: SspCompleteness;
};

export type SspInterconnectionRow = {
  name: SspCompleteness;
  organization: SspCompleteness;
  purpose: SspCompleteness;
  informationExchanged: SspCompleteness;
  direction: SspCompleteness;
  securityNotes: SspCompleteness;
};

export type SspDerivedOverallImpact = {
  level: "low" | "moderate" | "high";
  label: string;
  derivationNote: string;
};

export type SspCategorization = {
  confidentiality: SspCompleteness;
  integrity: SspCompleteness;
  availability: SspCompleteness;
  rationale: SspCompleteness;
  derivedOverallImpact: SspDerivedOverallImpact | null;
  dodCloudImpactLevel: SspCompleteness;
};

export type SspCollectionState = "not-documented" | "documented";

export type SspDocument = {
  identity: {
    documentType: typeof CF_SSP_DOCUMENT_TYPE;
    layoutId: typeof CF_SSP_LAYOUT_ID;
    layoutVersion: typeof CF_SSP_LAYOUT_VERSION;
    systemName: SspCompleteness;
    systemNameShort: SspCompleteness;
    systemIdentifier: SspCompleteness;
    sspOrganization: SspCompleteness;
    documentedAgainst: {
      frameworkId: string;
      frameworkTitle: string;
      itemSingular: string;
      itemPlural: string;
    };
    generatedAt: string;
    projectId: string;
    projectRevision: number;
    projectSchemaVersion: number;
  };
  completenessNotice: {
    paragraphs: string[];
  };
  systemOverview: {
    overview: SspCompleteness;
    operationalStatus: SspCompleteness;
    operationalStatusRemarks: SspCompleteness;
  };
  roles: {
    collection: SspCollectionState;
    rows: SspRoleRow[];
  };
  boundaryAndEnvironment: {
    authorizationBoundary: SspCompleteness;
    environmentOfOperation: SspCompleteness;
  };
  categorization: SspCategorization;
  informationTypes: {
    collection: SspCollectionState;
    rows: SspInformationTypeRow[];
  };
  interconnections: {
    collection: SspCollectionState;
    rows: SspInterconnectionRow[];
  };
  families: SspFamilyGroup[];
  counts: {
    totalItems: number;
    narrativesDocumented: number;
  };
};

export type SspGenerationInput = {
  project: StoredProject;
  framework: Framework;
  descriptor: FrameworkDescriptor;
  controlRecordsByControlId: ReadonlyMap<string, ControlRecord>;
  evidenceByControlId: ReadonlyMap<string, readonly EvidenceWithControlIds[]>;
  generatedAt: string;
};

/**
 * DoD IL4 SSP Addendum view model (Milestone 09D).
 *
 * Document semantics for layout `cf-il4-addendum-docx` 1.0.
 * Independent of DOCX. Not a second framework or synthesis path.
 */

import type { SspCompleteness, SspDocument, SspFrameworkItem } from "@/ssp";
import type { Il4SourcePin } from "@/framework/dod-cloud-il4-rev5/source-pins";
import type { TableD1AdjustmentKind } from "@/framework/dod-cloud-il4-rev5/types";

export const CF_IL4_ADDENDUM_DOCUMENT_TITLE =
  "DoD IL4 System Security Plan Addendum" as const;
export const CF_IL4_ADDENDUM_LAYOUT_ID = "cf-il4-addendum-docx" as const;
export const CF_IL4_ADDENDUM_LAYOUT_VERSION = "1.0" as const;
export const CF_IL4_ADDENDUM_GENERATOR = "Control Freak" as const;

export type Il4DeltaGroup =
  | "grr"
  | "nist-not-in-fedramp-moderate"
  | "fedramp-moderate-table-d1-adjustment";

export type Il4PopulationCounts = {
  totalFrameworkItems: number;
  detailedItemCount: number;
  detailedGrrCount: number;
  detailedNistCount: number;
  membershipNoteCount: number;
  notReprintedCount: number;
};

export type Il4DetailedEntry = {
  group: Il4DeltaGroup;
  inFedrampModerate: boolean;
  baselineRelationship: string;
  tableD1AdjustmentKind: TableD1AdjustmentKind | null;
  tableD1AdjustmentLabel: string | null;
  effectiveAssignmentSource: string | null;
  effectiveAssignmentProvenanceNote: string | null;
  addendumLeveragedFromFedrampModerate: boolean | null;
  addendumColumnNote: string | null;
  item: SspFrameworkItem;
};

export type Il4MembershipNote = {
  id: string;
  displayId: string;
  title: string;
  family: string;
  inFedrampModerate: true;
  tableD1AdjustmentKind: "inclusion-only";
  explanation: string;
};

export type Il4NistFamily = {
  family: string;
  entries: readonly Il4DetailedEntry[];
};

export type Il4AddendumDocument = {
  identity: {
    documentTitle: typeof CF_IL4_ADDENDUM_DOCUMENT_TITLE;
    generator: typeof CF_IL4_ADDENDUM_GENERATOR;
    layoutId: typeof CF_IL4_ADDENDUM_LAYOUT_ID;
    layoutVersion: typeof CF_IL4_ADDENDUM_LAYOUT_VERSION;
    generatedAt: string;
    projectId: string;
    projectRevision: number;
    projectSchemaVersion: number;
    frameworkId: string;
    frameworkTitle: string;
    systemName: SspCompleteness;
    systemNameShort: SspCompleteness;
    systemIdentifier: SspCompleteness;
    sspOrganization: SspCompleteness;
  };
  coverDisclaimer: string;
  scopeStatement: string;
  omissionsStatement: string;
  populationExplanation: string;
  completenessParagraphs: readonly string[];
  parameterReadingNotes: readonly string[];
  generationNotes: readonly string[];
  sources: readonly Il4SourcePin[];
  systemOverview: SspDocument["systemOverview"];
  roles: SspDocument["roles"];
  boundaryAndEnvironment: SspDocument["boundaryAndEnvironment"];
  categorization: SspDocument["categorization"];
  informationTypes: SspDocument["informationTypes"];
  interconnections: SspDocument["interconnections"];
  population: Il4PopulationCounts;
  grrs: readonly Il4DetailedEntry[];
  nistFamilies: readonly Il4NistFamily[];
  membershipNotes: readonly Il4MembershipNote[];
};

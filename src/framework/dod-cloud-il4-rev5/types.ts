export type SelectionProvenance = {
  inNistModerate: boolean;
  inFedrampModerate: boolean;
  inDodAddendum: boolean;
  addendumLeveragedFromFedrampModerate: boolean | null;
};

/**
 * Effective-assignment class for an IL4 overlay item.
 * The field name `dspavStatus` is historical; values are not limited to DSPAV.
 */
export type DspavStatus =
  | "csp-organization-defined"
  | "fedramp-base-inherited"
  | "fedramp-explicitly-referenced"
  | "dod-explicit"
  | "satisfied-by-addendum-value"
  | "authoritative-value-required"
  | "source-conflict"
  | "not-indicated";

/**
 * How Table D-1 lists an IL4-applicable control.
 * `inclusion-only` is membership without a parameter adjustment.
 */
export type TableD1AdjustmentKind =
  | "may-use-fedramp"
  | "dspav-must-be-used"
  | "explicit-value"
  | "inclusion-only";

export type ProvenanceText = {
  text: string;
  source: string;
};

export type NistOrganizationDefinedParameter = {
  id: string;
  label: string;
  description: string;
  select?: {
    howMany?: "one" | "one-or-more";
    choices: readonly string[];
  };
};

export type OverlayParameterMetadata = {
  nistOrganizationDefined: NistOrganizationDefinedParameter[];
  fedrampAssignment: ProvenanceText | null;
  fedrampAdditionalGuidance: ProvenanceText | null;
  dodAssignment: ProvenanceText | null;
  appendixD: ProvenanceText | null;
  appendixDIndicatesDspav: boolean;
  dspavStatus: DspavStatus;
  /**
   * Deterministic assignment text when layers do not conflict.
   * Omitted for IA-5(1) source conflict and when DSPAV is required
   * without a public value.
   */
  effectiveAssignmentText: string | null;
  effectiveAssignmentSource: string | null;
  conditionality: string | null;
  interpretationConflict: boolean;
};

export type OverlayApplicability = {
  kind: "always" | "conditional";
  condition: "cds" | null;
  notes: string;
};

export type OverlayItemKind = "nist-base" | "nist-enhancement" | "dod-grr";

export type DodIl4OverlayItem = {
  id: string;
  originId: string;
  title: string;
  family: string;
  statement: string;
  discussion: string | null;
  source: string;
  sourceVersion: string;
  itemKind: OverlayItemKind;
  selectionProvenance: SelectionProvenance;
  parameters: OverlayParameterMetadata;
  dodSupplements: ProvenanceText[];
  applicability: OverlayApplicability;
};

export type DodIl4SourceRecord = {
  role: string;
  publisher: string;
  title: string;
  version: string;
  sha256: string;
};

export type DodIl4FrameworkArtifact = {
  id: string;
  title: string;
  source: string;
  sourceVersion: string;
  sources: DodIl4SourceRecord[];
  counts: {
    fedrampModerateBase: number;
    fedrampModerateEnhancements: number;
    fedrampModerateTotal: number;
    nistBase: number;
    nistEnhancements: number;
    grr: number;
    total: number;
  };
  items: DodIl4OverlayItem[];
};

export type AddendumExtractRow = {
  row: number;
  identifier: string;
  sortId: string;
  family: string;
  name: string;
  controlText: string;
  discussion: string;
  relatedControls: string;
  fedrampAssignment: string;
  fedrampAdditionalGuidance: string;
  dodFedrampPlusParameters: string;
  leveragedFromFedrampModerate: string;
};

export type AddendumExtract = {
  source: {
    title: string;
    publisher: string;
    filename: string;
    sheet: string;
    sha256: string;
    modified: string;
    extractionNote: string;
  };
  rows: AddendumExtractRow[];
};

export type FedrampModerateRow = {
  originId: string;
  id: string;
  title: string;
  family: string;
  fedrampAssignment: string;
  fedrampAdditionalGuidance: string;
};

export type AppendixDNote = {
  id: string;
  originId: string;
  parameterValues: string;
  impactNote: string;
  indicatesDspav: boolean;
  listedInTableD1: boolean;
  tableD1AdjustmentKind: TableD1AdjustmentKind;
};

export type DerivationFailure = {
  ok: false;
  message: string;
};

export type DerivationSuccess = {
  ok: true;
  artifact: DodIl4FrameworkArtifact;
};

export type DerivationResult = DerivationSuccess | DerivationFailure;

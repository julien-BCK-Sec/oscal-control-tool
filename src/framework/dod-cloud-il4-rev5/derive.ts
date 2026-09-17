import {
  DOD_ADDED_NIST_BASE_IDS,
  DOD_ADDED_NIST_ENHANCEMENT_IDS,
  DOD_CLOUD_IL4_FRAMEWORK_ID,
  DOD_CLOUD_IL4_SOURCE,
  DOD_CLOUD_IL4_TITLE,
  DOD_GRR_FAMILY,
  FEDRAMP_MODERATE_BASE_COUNT,
  FEDRAMP_MODERATE_ENHANCEMENT_COUNT,
  FEDRAMP_MODERATE_TOTAL_COUNT,
  GRR_IDS,
  IL4_GRR_COUNT,
  IL4_NIST_BASE_COUNT,
  IL4_NIST_ENHANCEMENT_COUNT,
  IL4_TOTAL_COUNT,
  TABLE_D1_IL4_COUNT,
} from "./identities";
import { overlayParameterResolutions } from "@/framework/nist-sp-800-53-rev5/parameters";
import { indexNistCatalog } from "./catalog";
import {
  isGrrId,
  isNistBaseId,
  isNistEnhancementId,
  normalizeFrameworkControlId,
} from "./ids";
import {
  parseIl4ParameterMappings,
  type Il4ParameterMappingIndex,
} from "./parameter-mappings";
import {
  ADDENDUM_WORKBOOK_SHA256,
  CSP_SRG_V1R7_PDF_SHA256,
  FEDRAMP_BASELINE_SHA256,
  NIST_CATALOG_SHA256,
} from "./sources";
import { mapIl4DspavStatus } from "./status";
import type {
  AddendumExtract,
  AddendumExtractRow,
  AppendixDNote,
  DerivationResult,
  DodIl4OverlayItem,
  DspavStatus,
  FedrampModerateRow,
  OverlayParameterMetadata,
  ProvenanceText,
  TableD1AdjustmentKind,
} from "./types";

const ADDENDUM_SOURCE = "dod-ssp-addendum-v1.2";
const FEDRAMP_SOURCE = "fedramp-moderate-baseline";
const APPENDIX_D_SOURCE = "csp-srg-v1r7-appendix-d";

const CONFLICT_ID = "ia-5.1";
const CDS_CONTROL_ID = "sc-46";
const SUPPLEMENT_IDS = new Set(["sc-17"]);
const TABLE_D1_PARAMETER_ADJUSTMENT_KINDS = new Set<TableD1AdjustmentKind>([
  "may-use-fedramp",
  "dspav-must-be-used",
  "explicit-value",
]);
const DSPAV_MUST_BE_USED_OUTCOMES = new Set<DspavStatus>([
  "satisfied-by-addendum-value",
  "authoritative-value-required",
  "source-conflict",
]);

function isTableD1Member(note: AppendixDNote | undefined): note is AppendixDNote {
  return note?.listedInTableD1 === true;
}

function isTableD1ParameterAdjustment(
  note: AppendixDNote | undefined,
): boolean {
  return (
    isTableD1Member(note) &&
    TABLE_D1_PARAMETER_ADJUSTMENT_KINDS.has(note.tableD1AdjustmentKind)
  );
}

export type DeriveDodCloudIl4Input = {
  catalogRoot: unknown;
  nistModerateIds: readonly string[];
  fedrampRows: readonly FedrampModerateRow[];
  addendum: AddendumExtract;
  appendixDNotes: readonly AppendixDNote[];
  fedrampSha256: string;
  parameterMappings: unknown;
};

function nonempty(text: string | undefined | null): string | null {
  const trimmed = text?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function provenance(text: string | null, source: string): ProvenanceText | null {
  return text ? { text, source } : null;
}

function parseAppendixNotes(
  notes: readonly AppendixDNote[],
): Map<string, AppendixDNote> {
  const map = new Map<string, AppendixDNote>();
  for (const note of notes) {
    const id = note.id || normalizeFrameworkControlId(note.originId);
    if (!id) {
      throw new Error(`Appendix D note has unusable origin ${note.originId}`);
    }
    map.set(id, { ...note, id, originId: note.originId });
  }
  return map;
}

function classifyParameters(args: {
  id: string;
  fedrampRow: FedrampModerateRow | undefined;
  addendumRow: AddendumExtractRow;
  appendixD: AppendixDNote | undefined;
}): OverlayParameterMetadata {
  const { id, fedrampRow, addendumRow, appendixD } = args;
  const fedrampFromBaseline = nonempty(fedrampRow?.fedrampAssignment);
  const fedrampFromAddendum = nonempty(addendumRow.fedrampAssignment);
  const fedrampAssignmentForReference = fedrampFromBaseline ?? fedrampFromAddendum;
  const fedrampAssignmentSource = fedrampFromBaseline
    ? FEDRAMP_SOURCE
    : fedrampFromAddendum
      ? ADDENDUM_SOURCE
      : null;
  const fedrampAdditionalGuidance = nonempty(
    fedrampRow?.fedrampAdditionalGuidance ?? addendumRow.fedrampAdditionalGuidance,
  );
  const dodRaw = nonempty(addendumRow.dodFedrampPlusParameters);
  const dodLower = dodRaw?.toLowerCase() ?? "";
  const noDspavAvailable = dodLower.includes("no dspav available");
  const rateLimitFallback = dodLower.includes("normal dspav will be required");
  const tableD1Kind = isTableD1Member(appendixD)
    ? appendixD.tableD1AdjustmentKind
    : undefined;
  const parameterAdjustment = isTableD1ParameterAdjustment(appendixD);
  const interpretationConflict =
    id === CONFLICT_ID && Boolean(fedrampAdditionalGuidance) && Boolean(dodRaw);

  let dspavStatus: DspavStatus = "csp-organization-defined";
  let effectiveAssignmentText: string | null = null;
  let effectiveAssignmentSource: string | null = null;
  let conditionality: string | null = null;

  if (isGrrId(id)) {
    dspavStatus = "not-indicated";
  } else if (interpretationConflict) {
    dspavStatus = "source-conflict";
  } else if (noDspavAvailable) {
    dspavStatus = "authoritative-value-required";
  } else if (rateLimitFallback) {
    dspavStatus = "authoritative-value-required";
    conditionality =
      "If rate limiting is not used, normal DSPAV will be required.";
    effectiveAssignmentText = dodRaw;
    effectiveAssignmentSource = ADDENDUM_SOURCE;
  } else if (tableD1Kind === "may-use-fedramp") {
    dspavStatus = "fedramp-explicitly-referenced";
    effectiveAssignmentText = fedrampAssignmentForReference;
    effectiveAssignmentSource = fedrampAssignmentSource;
  } else if (tableD1Kind === "dspav-must-be-used") {
    if (dodRaw) {
      dspavStatus = "satisfied-by-addendum-value";
      effectiveAssignmentText = dodRaw;
      effectiveAssignmentSource = ADDENDUM_SOURCE;
    } else {
      dspavStatus = "authoritative-value-required";
    }
  } else if (tableD1Kind === "explicit-value" || (dodRaw && !SUPPLEMENT_IDS.has(id))) {
    dspavStatus = "dod-explicit";
    if (!SUPPLEMENT_IDS.has(id)) {
      effectiveAssignmentText = dodRaw;
      effectiveAssignmentSource = ADDENDUM_SOURCE;
    }
  } else if (fedrampFromBaseline && !parameterAdjustment) {
    // Ordinary FedRAMP+ inheritance uses the pinned Moderate baseline
    // assignment, not an Addendum FedRAMP-reference echo.
    dspavStatus = "fedramp-base-inherited";
    effectiveAssignmentText = fedrampFromBaseline;
    effectiveAssignmentSource = FEDRAMP_SOURCE;
  } else {
    dspavStatus = "csp-organization-defined";
  }

  if (appendixD?.impactNote.toLowerCase().includes("if cds is used")) {
    conditionality = conditionality
      ? `${conditionality} Appendix D: ${appendixD.impactNote}.`
      : `Appendix D applicability: ${appendixD.impactNote}.`;
  }

  return {
    nistOrganizationDefined: [],
    parameterResolutions: [],
    fedrampAssignment: provenance(
      nonempty(fedrampRow?.fedrampAssignment ?? addendumRow.fedrampAssignment),
      fedrampRow ? FEDRAMP_SOURCE : ADDENDUM_SOURCE,
    ),
    fedrampAdditionalGuidance: provenance(
      fedrampAdditionalGuidance,
      fedrampRow ? FEDRAMP_SOURCE : ADDENDUM_SOURCE,
    ),
    dodAssignment: provenance(dodRaw, ADDENDUM_SOURCE),
    appendixD: provenance(
      nonempty(appendixD?.parameterValues ?? "") ??
        nonempty(appendixD?.impactNote ?? ""),
      APPENDIX_D_SOURCE,
    ),
    appendixDIndicatesDspav: Boolean(appendixD?.indicatesDspav),
    dspavStatus,
    effectiveAssignmentText,
    effectiveAssignmentSource,
    conditionality,
    interpretationConflict,
  };
}

function tableD1RowProblems(args: {
  id: string;
  fedrampRow: FedrampModerateRow | undefined;
  addendumRow: AddendumExtractRow;
  appendixD: AppendixDNote | undefined;
  parameters: OverlayParameterMetadata;
}): string[] {
  const { id, fedrampRow, addendumRow, appendixD, parameters } = args;
  if (isGrrId(id)) {
    return [];
  }
  const problems: string[] = [];
  const dodRaw = nonempty(addendumRow.dodFedrampPlusParameters);
  const listed = isTableD1Member(appendixD);
  const kind = listed ? appendixD.tableD1AdjustmentKind : undefined;

  if (dodRaw && !listed) {
    problems.push(
      `Addendum ${id} has a DoD assignment but is not listed in Table D-1.`,
    );
  }
  if (kind === "inclusion-only" && dodRaw) {
    problems.push(
      `Table D-1 inclusion-only control ${id} has unexpected Addendum parameter text.`,
    );
  }
  if (kind === "may-use-fedramp") {
    if (!dodRaw?.toLowerCase().includes("may use fedramp")) {
      problems.push(
        `Table D-1 ${id} is may-use-fedramp but the Addendum does not contain that instruction.`,
      );
    }
    const fedrampText =
      nonempty(fedrampRow?.fedrampAssignment) ??
      nonempty(addendumRow.fedrampAssignment);
    if (!fedrampText) {
      problems.push(
        `Table D-1 ${id} permits a FedRAMP value but no FedRAMP-labeled assignment text is available.`,
      );
    }
  }
  if (
    kind === "dspav-must-be-used" &&
    !DSPAV_MUST_BE_USED_OUTCOMES.has(parameters.dspavStatus)
  ) {
    problems.push(
      `Table D-1 ${id} requires DSPAV but derivation did not reach an allowed outcome.`,
    );
  }
  if (kind === "explicit-value" && !dodRaw && !SUPPLEMENT_IDS.has(id)) {
    problems.push(
      `Table D-1 ${id} is an explicit value but the Addendum has no DoD parameter content.`,
    );
  }
  if (parameters.effectiveAssignmentSource === FEDRAMP_SOURCE && !fedrampRow) {
    problems.push(
      `Control ${id} claims FedRAMP Moderate provenance without a pinned FedRAMP Moderate baseline row.`,
    );
  }
  if (parameters.dspavStatus === "fedramp-base-inherited") {
    if (!parameters.effectiveAssignmentText) {
      problems.push(
        `Control ${id} is classified as FedRAMP base inherited without assignment text.`,
      );
    }
    if (isTableD1ParameterAdjustment(appendixD)) {
      problems.push(
        `Control ${id} inherited FedRAMP despite a Table D-1 parameter adjustment.`,
      );
    }
  }
  return problems;
}

function attachIl4ParameterResolutions(
  controlId: string,
  parameters: OverlayParameterMetadata,
  mappings: Il4ParameterMappingIndex,
): void {
  const status = mapIl4DspavStatus(parameters.dspavStatus);
  const controlMappings = mappings.get(controlId);
  parameters.parameterResolutions = parameters.nistOrganizationDefined.map(
    (param) => {
      const pinned = controlMappings?.get(param.id);
      if (pinned) {
        return {
          controlId,
          parameterId: param.id,
          status: pinned.status,
          mappingBasis: "pinned-overlay-mapping" as const,
          values: pinned.values,
          sources: [
            {
              text: pinned.evidence,
              source: "il4-parameter-mappings",
            },
          ],
        };
      }
      return overlayParameterResolutions({
        controlId,
        params: [param],
        status,
        mappingBasis: "control-level-unmapped",
        controlOverlaySummary: {
          status,
          effectiveAssignmentText: parameters.effectiveAssignmentText,
          effectiveAssignmentSource: parameters.effectiveAssignmentSource,
        },
      })[0]!;
    },
  );
}

export function deriveDodCloudIl4Framework(
  input: DeriveDodCloudIl4Input,
): DerivationResult {
  const problems: string[] = [];
  if (input.fedrampSha256 !== FEDRAMP_BASELINE_SHA256) {
    problems.push("FedRAMP workbook hash does not match the pinned SHA-256.");
  }
  if (input.addendum.source.sha256 !== ADDENDUM_WORKBOOK_SHA256) {
    problems.push("Addendum extract hash does not match the authoritative workbook.");
  }

  const catalog = indexNistCatalog(input.catalogRoot);
  const nistModerate = new Set(input.nistModerateIds);
  const fedrampById = new Map(input.fedrampRows.map((row) => [row.id, row]));
  const appendixById = parseAppendixNotes(input.appendixDNotes);
  const allowedControlIds = new Set(
    input.addendum.rows
      .map((row) => normalizeFrameworkControlId(row.identifier))
      .filter((id): id is string => Boolean(id)),
  );
  const paramsByControl = new Map(
    [...catalog.byId.entries()].map(([id, control]) => [id, control.parameters]),
  );
  let mappings: Il4ParameterMappingIndex = new Map();
  try {
    mappings = parseIl4ParameterMappings(input.parameterMappings, {
      allowedControlIds,
      paramsByControl,
    });
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error));
  }
  if (appendixById.size !== TABLE_D1_IL4_COUNT) {
    problems.push(
      `Table D-1 unique IDs ${appendixById.size} !== ${TABLE_D1_IL4_COUNT}`,
    );
  }
  for (const note of appendixById.values()) {
    if (!note.listedInTableD1) {
      problems.push(`Table D-1 note ${note.originId} is not marked listedInTableD1.`);
    }
  }

  if (fedrampById.size !== FEDRAMP_MODERATE_TOTAL_COUNT) {
    problems.push(
      `FedRAMP Moderate unique IDs ${fedrampById.size} !== ${FEDRAMP_MODERATE_TOTAL_COUNT}`,
    );
  }

  const items: DodIl4OverlayItem[] = [];
  const seen = new Set<string>();

  for (const row of input.addendum.rows) {
    const id = normalizeFrameworkControlId(row.identifier);
    if (!id) {
      problems.push(`Addendum row ${row.row}: unusable identifier ${row.identifier}`);
      continue;
    }
    if (seen.has(id)) {
      problems.push(`Duplicate Addendum identifier ${row.identifier} -> ${id}`);
      continue;
    }
    seen.add(id);

    const fedrampRow = fedrampById.get(id);
    const appendixD = appendixById.get(id);
    const parameters = classifyParameters({
      id,
      fedrampRow,
      addendumRow: row,
      appendixD,
    });
    problems.push(
      ...tableD1RowProblems({
        id,
        fedrampRow,
        addendumRow: row,
        appendixD,
        parameters,
      }),
    );

    if (isGrrId(id)) {
      items.push({
        id,
        originId: row.identifier,
        title: row.name,
        family: DOD_GRR_FAMILY,
        statement: row.controlText,
        discussion: nonempty(row.discussion),
        source: ADDENDUM_SOURCE,
        sourceVersion: "v1.2",
        itemKind: "dod-grr",
        selectionProvenance: {
          inNistModerate: false,
          inFedrampModerate: false,
          inDodAddendum: true,
          addendumLeveragedFromFedrampModerate: row.leveragedFromFedrampModerate === "Yes",
        },
        parameters: {
          ...parameters,
          nistOrganizationDefined: [],
          parameterResolutions: [],
        },
        dodSupplements: [],
        applicability: {
          kind: "always",
          condition: null,
          notes: "DoD General Readiness Requirement on the IL4 Moderate Addendum sheet (SRG §4.7).",
        },
      });
      continue;
    }

    const catalogControl = catalog.byId.get(id);
    if (!catalogControl) {
      problems.push(`NIST catalog is missing Addendum control ${id}`);
      continue;
    }
    parameters.nistOrganizationDefined = catalogControl.parameters;
    attachIl4ParameterResolutions(id, parameters, mappings);

    const dodSupplements: ProvenanceText[] = [];
    if (SUPPLEMENT_IDS.has(id) && nonempty(row.dodFedrampPlusParameters)) {
      dodSupplements.push({
        text: row.dodFedrampPlusParameters,
        source: ADDENDUM_SOURCE,
      });
    }

    const applicability =
      id === CDS_CONTROL_ID
        ? {
            kind: "conditional" as const,
            condition: "cds" as const,
            notes:
              "Listed on the Addendum IL4 Moderate sheet. Appendix D marks SC-46 as applicable if CDS is used. Framework inclusion does not mean the control is always applicable.",
          }
        : {
            kind: "always" as const,
            condition: null,
            notes: "Listed on the Addendum IL4 Moderate sheet.",
          };

    items.push({
      id,
      originId: row.identifier,
      title: catalogControl.title,
      family: catalogControl.family,
      statement: catalogControl.statement,
      discussion: nonempty(row.discussion),
      source: DOD_CLOUD_IL4_SOURCE,
      sourceVersion: catalog.sourceVersion,
      itemKind: isNistEnhancementId(id) ? "nist-enhancement" : "nist-base",
      selectionProvenance: {
        inNistModerate: nistModerate.has(id),
        inFedrampModerate: Boolean(fedrampRow),
        inDodAddendum: true,
        addendumLeveragedFromFedrampModerate:
          row.leveragedFromFedrampModerate === "Yes",
      },
      parameters,
      dodSupplements,
      applicability,
    });
  }

  for (const nistId of nistModerate) {
    if (!seen.has(nistId)) {
      problems.push(`NIST Moderate control ${nistId} is missing from IL4 Addendum.`);
    }
  }
  for (const fedrampId of fedrampById.keys()) {
    if (!seen.has(fedrampId)) {
      problems.push(`FedRAMP Moderate control ${fedrampId} is missing from IL4 Addendum.`);
    }
  }

  const nistBase = items.filter((item) => item.itemKind === "nist-base").length;
  const nistEnh = items.filter((item) => item.itemKind === "nist-enhancement").length;
  const grr = items.filter((item) => item.itemKind === "dod-grr").length;
  const fedrampBase = [...fedrampById.keys()].filter((id) => isNistBaseId(id)).length;
  const fedrampEnh = [...fedrampById.keys()].filter((id) => isNistEnhancementId(id)).length;

  if (items.length !== IL4_TOTAL_COUNT) {
    problems.push(`Derived ${items.length} IL4 items, expected ${IL4_TOTAL_COUNT}.`);
  }
  if (nistBase !== IL4_NIST_BASE_COUNT) {
    problems.push(`Derived ${nistBase} NIST bases, expected ${IL4_NIST_BASE_COUNT}.`);
  }
  if (nistEnh !== IL4_NIST_ENHANCEMENT_COUNT) {
    problems.push(
      `Derived ${nistEnh} NIST enhancements, expected ${IL4_NIST_ENHANCEMENT_COUNT}.`,
    );
  }
  if (grr !== IL4_GRR_COUNT) {
    problems.push(`Derived ${grr} GRRs, expected ${IL4_GRR_COUNT}.`);
  }
  if (fedrampBase !== FEDRAMP_MODERATE_BASE_COUNT) {
    problems.push(`FedRAMP base count ${fedrampBase} !== ${FEDRAMP_MODERATE_BASE_COUNT}`);
  }
  if (fedrampEnh !== FEDRAMP_MODERATE_ENHANCEMENT_COUNT) {
    problems.push(
      `FedRAMP enhancement count ${fedrampEnh} !== ${FEDRAMP_MODERATE_ENHANCEMENT_COUNT}`,
    );
  }

  for (const note of appendixById.values()) {
    if (note.listedInTableD1 && !seen.has(note.id)) {
      problems.push(`Table D-1 control ${note.originId} is missing from the IL4 Addendum.`);
    }
  }
  for (const id of [...DOD_ADDED_NIST_BASE_IDS, ...DOD_ADDED_NIST_ENHANCEMENT_IDS]) {
    if (!seen.has(id)) {
      problems.push(`Missing approved DoD-added NIST ID ${id}`);
    }
  }
  for (const id of GRR_IDS) {
    if (!seen.has(id)) {
      problems.push(`Missing GRR ${id}`);
    }
  }

  if (problems.length > 0) {
    return { ok: false, message: problems.join("; ") };
  }

  return {
    ok: true,
    artifact: {
      id: DOD_CLOUD_IL4_FRAMEWORK_ID,
      title: DOD_CLOUD_IL4_TITLE,
      source: DOD_CLOUD_IL4_SOURCE,
      sourceVersion: catalog.sourceVersion,
      sources: [
        {
          role: "nist-catalog",
          publisher: "NIST",
          title: "NIST SP 800-53 Revision 5 catalog",
          version: catalog.sourceVersion,
          sha256: NIST_CATALOG_SHA256,
        },
        {
          role: "fedramp-moderate-baseline",
          publisher: "FedRAMP / GSA",
          title: "FedRAMP Security Controls Baseline",
          version: "Rev. 5 Moderate",
          sha256: input.fedrampSha256,
        },
        {
          role: "dod-ssp-addendum-il4-moderate",
          publisher: "DISA",
          title: "DoD Rev 5 SSP Addendum Controls v1.2",
          version: "v1.2 (modified 2025-12-03)",
          sha256: ADDENDUM_WORKBOOK_SHA256,
        },
        {
          role: "csp-srg-appendix-d-cross-check",
          publisher: "DISA",
          title: "Cloud Service Provider SRG V1R7 Appendix D",
          version: "V1R7 / 30 June 2026 / Y26M06",
          sha256: CSP_SRG_V1R7_PDF_SHA256,
        },
      ],
      counts: {
        fedrampModerateBase: fedrampBase,
        fedrampModerateEnhancements: fedrampEnh,
        fedrampModerateTotal: fedrampById.size,
        nistBase,
        nistEnhancements: nistEnh,
        grr,
        total: items.length,
      },
      items,
    },
  };
}

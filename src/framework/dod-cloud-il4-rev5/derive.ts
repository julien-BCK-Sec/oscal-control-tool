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
} from "./identities";
import { indexNistCatalog } from "./catalog";
import {
  isGrrId,
  isNistBaseId,
  isNistEnhancementId,
  normalizeFrameworkControlId,
} from "./ids";
import {
  ADDENDUM_WORKBOOK_SHA256,
  CSP_SRG_V1R7_PDF_SHA256,
  FEDRAMP_BASELINE_SHA256,
  NIST_CATALOG_SHA256,
} from "./sources";
import type {
  AddendumExtract,
  AddendumExtractRow,
  AppendixDNote,
  DerivationResult,
  DodIl4OverlayItem,
  FedrampModerateRow,
  OverlayParameterMetadata,
  ProvenanceText,
} from "./types";

const ADDENDUM_SOURCE = "dod-ssp-addendum-v1.2";
const FEDRAMP_SOURCE = "fedramp-moderate-baseline";
const APPENDIX_D_SOURCE = "csp-srg-v1r7-appendix-d";

const CONFLICT_ID = "ia-5.1";
const CDS_CONTROL_ID = "sc-46";
const SUPPLEMENT_IDS = new Set(["sc-17"]);

export type DeriveDodCloudIl4Input = {
  catalogRoot: unknown;
  nistModerateIds: readonly string[];
  fedrampRows: readonly FedrampModerateRow[];
  addendum: AddendumExtract;
  appendixDNotes: readonly AppendixDNote[];
  fedrampSha256: string;
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
  const fedrampAssignment = nonempty(
    fedrampRow?.fedrampAssignment ?? addendumRow.fedrampAssignment,
  );
  const fedrampAdditionalGuidance = nonempty(
    fedrampRow?.fedrampAdditionalGuidance ?? addendumRow.fedrampAdditionalGuidance,
  );
  const dodRaw = nonempty(addendumRow.dodFedrampPlusParameters);
  const dodLower = dodRaw?.toLowerCase() ?? "";
  const noDspavAvailable = dodLower.includes("no dspav available");
  const mayUseFedramp = dodLower.includes("may use fedramp");
  const rateLimitFallback = dodLower.includes("normal dspav will be required");
  const interpretationConflict =
    id === CONFLICT_ID && Boolean(fedrampAdditionalGuidance) && Boolean(dodRaw);

  let dodAssignmentText: string | null = dodRaw;
  if (noDspavAvailable) {
    dodAssignmentText = dodRaw;
  }

  let dspavStatus: OverlayParameterMetadata["dspavStatus"] = "not-indicated";
  let effectiveAssignmentText: string | null = null;
  let effectiveAssignmentSource: string | null = null;
  let conditionality: string | null = null;

  if (interpretationConflict) {
    dspavStatus = "source-conflict";
  } else if (noDspavAvailable) {
    dspavStatus = "authoritative-value-required";
  } else if (rateLimitFallback) {
    dspavStatus = "authoritative-value-required";
    conditionality =
      "If rate limiting is not used, normal DSPAV will be required.";
    effectiveAssignmentText = dodRaw;
    effectiveAssignmentSource = ADDENDUM_SOURCE;
  } else if (mayUseFedramp) {
    dspavStatus = "may-use-fedramp";
    effectiveAssignmentText = fedrampAssignment;
    effectiveAssignmentSource = fedrampAssignment ? FEDRAMP_SOURCE : null;
  } else if (dodRaw && !SUPPLEMENT_IDS.has(id)) {
    dspavStatus = appendixD?.indicatesDspav
      ? "satisfied-by-addendum-value"
      : "not-indicated";
    effectiveAssignmentText = dodRaw;
    effectiveAssignmentSource = ADDENDUM_SOURCE;
  } else if (fedrampAssignment) {
    dspavStatus = "not-indicated";
    effectiveAssignmentText = fedrampAssignment;
    effectiveAssignmentSource = FEDRAMP_SOURCE;
  }

  if (appendixD?.impactNote.toLowerCase().includes("if cds is used")) {
    conditionality = conditionality
      ? `${conditionality} Appendix D: ${appendixD.impactNote}.`
      : `Appendix D applicability: ${appendixD.impactNote}.`;
  }

  return {
    nistOrganizationDefined: [],
    fedrampAssignment: provenance(
      nonempty(fedrampRow?.fedrampAssignment ?? addendumRow.fedrampAssignment),
      fedrampRow ? FEDRAMP_SOURCE : ADDENDUM_SOURCE,
    ),
    fedrampAdditionalGuidance: provenance(
      fedrampAdditionalGuidance,
      fedrampRow ? FEDRAMP_SOURCE : ADDENDUM_SOURCE,
    ),
    dodAssignment: provenance(dodAssignmentText, ADDENDUM_SOURCE),
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

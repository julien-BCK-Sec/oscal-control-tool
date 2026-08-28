import type {
  Framework,
  FrameworkApplicability,
  FrameworkAuthoritativeValueStatus,
  FrameworkControl,
  FrameworkItemKind,
  FrameworkParameterMetadata,
  FrameworkProvider,
  FrameworkProvenanceText,
  FrameworkSelectionProvenance,
} from "@/data/framework/types";
import generatedDodCloudIl4 from "@/data/framework/generated/dod-cloud-il4-rev5.json";
import {
  DOD_CLOUD_IL4_FRAMEWORK_ID,
  DOD_CLOUD_IL4_IDENTITY,
  DOD_GRR_FAMILY,
  GRR_IDS,
  IL4_GRR_COUNT,
  IL4_NIST_BASE_COUNT,
  IL4_NIST_ENHANCEMENT_COUNT,
  IL4_TOTAL_COUNT,
} from "./identities";
import type {
  DspavStatus,
  OverlayItemKind,
  OverlayParameterMetadata,
  ProvenanceText,
  SelectionProvenance,
} from "./types";

export class InvalidDodCloudIl4ArtifactError extends Error {
  constructor(message: string) {
    super(`Invalid DoD Cloud IL4 artifact: ${message}`);
    this.name = "InvalidDodCloudIl4ArtifactError";
  }
}

const REQUIRED_RUNTIME_IDS = [
  "ac-1",
  "ac-2",
  "ac-7",
  "sc-24",
  "sc-46",
  "au-5.1",
  "ia-5.1",
  "ma-5.1",
  "sa-9.5",
  "sc-17",
  "grr-1",
  "grr-10",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new InvalidDodCloudIl4ArtifactError(`${label} must be an object`);
  }
  return value;
}

function requireStringValue(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new InvalidDodCloudIl4ArtifactError(`${label} must be a string`);
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new InvalidDodCloudIl4ArtifactError(`${label} must be a nonempty string`);
  }
  return value;
}

function optionalString(value: unknown, label: string): string | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new InvalidDodCloudIl4ArtifactError(`${label} must be a string or null`);
  }
  return value;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new InvalidDodCloudIl4ArtifactError(`${label} must be a boolean`);
  }
  return value;
}

function optionalBoolean(value: unknown, label: string): boolean | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== "boolean") {
    throw new InvalidDodCloudIl4ArtifactError(
      `${label} must be a boolean or null`,
    );
  }
  return value;
}

function requireNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new InvalidDodCloudIl4ArtifactError(`${label} must be an integer`);
  }
  return value;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new InvalidDodCloudIl4ArtifactError(`${label} must be an array`);
  }
  return value;
}

function parseProvenanceText(
  value: unknown,
  label: string,
): ProvenanceText | null {
  if (value === null) {
    return null;
  }
  const record = requireRecord(value, label);
  return {
    text: requireString(record.text, `${label}.text`),
    source: requireString(record.source, `${label}.source`),
  };
}

function parseProvenanceList(
  value: unknown,
  label: string,
): ProvenanceText[] {
  return requireArray(value, label).map((entry, index) => {
    const parsed = parseProvenanceText(entry, `${label}[${index}]`);
    if (!parsed) {
      throw new InvalidDodCloudIl4ArtifactError(
        `${label}[${index}] must be an object`,
      );
    }
    return parsed;
  });
}

function parseItemKind(value: unknown, id: string): OverlayItemKind {
  if (
    value === "nist-base" ||
    value === "nist-enhancement" ||
    value === "dod-grr"
  ) {
    return value;
  }
  throw new InvalidDodCloudIl4ArtifactError(
    `item ${id} has unknown itemKind`,
  );
}

function parseDspavStatus(value: unknown, id: string): DspavStatus {
  if (
    value === "not-indicated" ||
    value === "may-use-fedramp" ||
    value === "satisfied-by-addendum-value" ||
    value === "authoritative-value-required" ||
    value === "source-conflict"
  ) {
    return value;
  }
  throw new InvalidDodCloudIl4ArtifactError(
    `item ${id} has unknown dspavStatus`,
  );
}

function parseSelectionProvenance(
  value: unknown,
  id: string,
): SelectionProvenance {
  const record = requireRecord(value, `item ${id} selectionProvenance`);
  return {
    inNistModerate: requireBoolean(
      record.inNistModerate,
      `item ${id} selectionProvenance.inNistModerate`,
    ),
    inFedrampModerate: requireBoolean(
      record.inFedrampModerate,
      `item ${id} selectionProvenance.inFedrampModerate`,
    ),
    inDodAddendum: requireBoolean(
      record.inDodAddendum,
      `item ${id} selectionProvenance.inDodAddendum`,
    ),
    addendumLeveragedFromFedrampModerate: optionalBoolean(
      record.addendumLeveragedFromFedrampModerate,
      `item ${id} selectionProvenance.addendumLeveragedFromFedrampModerate`,
    ),
  };
}

function parseOrganizationDefined(
  value: unknown,
  id: string,
): OverlayParameterMetadata["nistOrganizationDefined"] {
  return requireArray(
    value,
    `item ${id} parameters.nistOrganizationDefined`,
  ).map((entry, index) => {
    const record = requireRecord(
      entry,
      `item ${id} parameters.nistOrganizationDefined[${index}]`,
    );
    const parsed: OverlayParameterMetadata["nistOrganizationDefined"][number] = {
      id: requireString(
        record.id,
        `item ${id} parameters.nistOrganizationDefined[${index}].id`,
      ),
      label: requireStringValue(
        record.label,
        `item ${id} parameters.nistOrganizationDefined[${index}].label`,
      ),
      description: requireStringValue(
        record.description,
        `item ${id} parameters.nistOrganizationDefined[${index}].description`,
      ),
    };
    if (record.select !== undefined) {
      parsed.select = parseParameterSelect(
        record.select,
        `${id} parameters.nistOrganizationDefined[${index}].select`,
      );
    }
    return parsed;
  });
}

function parseParameterSelect(
  value: unknown,
  label: string,
): NonNullable<OverlayParameterMetadata["nistOrganizationDefined"][number]["select"]> {
  const record = requireRecord(value, label);
  const choices = requireArray(record.choices, `${label}.choices`).map(
    (choice, index) => requireString(choice, `${label}.choices[${index}]`),
  );
  const howMany = record.howMany;
  if (howMany !== undefined && howMany !== "one" && howMany !== "one-or-more") {
    throw new InvalidDodCloudIl4ArtifactError(
      `${label}.howMany must be "one" or "one-or-more" when present`,
    );
  }
  return {
    ...(howMany === "one" || howMany === "one-or-more"
      ? { howMany }
      : {}),
    choices,
  };
}

function parseParameters(
  value: unknown,
  id: string,
): OverlayParameterMetadata {
  const record = requireRecord(value, `item ${id} parameters`);
  return {
    nistOrganizationDefined: parseOrganizationDefined(
      record.nistOrganizationDefined,
      id,
    ),
    fedrampAssignment: parseProvenanceText(
      record.fedrampAssignment,
      `item ${id} parameters.fedrampAssignment`,
    ),
    fedrampAdditionalGuidance: parseProvenanceText(
      record.fedrampAdditionalGuidance,
      `item ${id} parameters.fedrampAdditionalGuidance`,
    ),
    dodAssignment: parseProvenanceText(
      record.dodAssignment,
      `item ${id} parameters.dodAssignment`,
    ),
    appendixD: parseProvenanceText(
      record.appendixD,
      `item ${id} parameters.appendixD`,
    ),
    appendixDIndicatesDspav: requireBoolean(
      record.appendixDIndicatesDspav,
      `item ${id} parameters.appendixDIndicatesDspav`,
    ),
    dspavStatus: parseDspavStatus(record.dspavStatus, id),
    effectiveAssignmentText: optionalString(
      record.effectiveAssignmentText,
      `item ${id} parameters.effectiveAssignmentText`,
    ),
    effectiveAssignmentSource: optionalString(
      record.effectiveAssignmentSource,
      `item ${id} parameters.effectiveAssignmentSource`,
    ),
    conditionality: optionalString(
      record.conditionality,
      `item ${id} parameters.conditionality`,
    ),
    interpretationConflict: requireBoolean(
      record.interpretationConflict,
      `item ${id} parameters.interpretationConflict`,
    ),
  };
}

function parseApplicability(
  value: unknown,
  id: string,
): FrameworkApplicability {
  const record = requireRecord(value, `item ${id} applicability`);
  const kind = record.kind;
  if (kind !== "always" && kind !== "conditional") {
    throw new InvalidDodCloudIl4ArtifactError(
      `item ${id} applicability.kind is invalid`,
    );
  }
  const condition = record.condition;
  if (condition !== null && typeof condition !== "string") {
    throw new InvalidDodCloudIl4ArtifactError(
      `item ${id} applicability.condition must be a string or null`,
    );
  }
  if (kind === "always" && condition !== null) {
    throw new InvalidDodCloudIl4ArtifactError(
      `item ${id} always-applicable items must not set a condition`,
    );
  }
  if (kind === "conditional" && (typeof condition !== "string" || !condition.trim())) {
    throw new InvalidDodCloudIl4ArtifactError(
      `item ${id} conditional items must set a condition token`,
    );
  }
  return {
    kind,
    condition: condition === null ? null : condition,
    notes: requireString(record.notes, `item ${id} applicability.notes`),
  };
}

function mapItemKind(kind: OverlayItemKind): FrameworkItemKind {
  if (kind === "nist-base") {
    return "base";
  }
  if (kind === "nist-enhancement") {
    return "enhancement";
  }
  return "other";
}

function mapAuthoritativeValueStatus(
  status: DspavStatus,
): FrameworkAuthoritativeValueStatus {
  if (status === "may-use-fedramp") {
    return "may-use-baseline";
  }
  if (status === "satisfied-by-addendum-value") {
    return "satisfied-by-overlay";
  }
  return status;
}

function mapSelectionProvenance(
  provenance: SelectionProvenance,
): FrameworkSelectionProvenance {
  return {
    inCatalogBaseline: provenance.inNistModerate,
    inExternalBaseline: provenance.inFedrampModerate,
    inOverlay: provenance.inDodAddendum,
    overlayMarksLeveragedFromExternalBaseline:
      provenance.addendumLeveragedFromFedrampModerate,
  };
}

function mapProvenance(
  value: ProvenanceText | null,
): FrameworkProvenanceText | null {
  return value;
}

function mapParameters(
  parameters: OverlayParameterMetadata,
): FrameworkParameterMetadata {
  return {
    organizationDefined: parameters.nistOrganizationDefined,
    baselineAssignment: mapProvenance(parameters.fedrampAssignment),
    baselineAdditionalGuidance: mapProvenance(
      parameters.fedrampAdditionalGuidance,
    ),
    overlayAssignment: mapProvenance(parameters.dodAssignment),
    policyCrossCheck: mapProvenance(parameters.appendixD),
    policyCrossCheckIndicatesAuthoritativeValue:
      parameters.appendixDIndicatesDspav,
    authoritativeValueStatus: mapAuthoritativeValueStatus(
      parameters.dspavStatus,
    ),
    effectiveAssignmentText: parameters.effectiveAssignmentText,
    effectiveAssignmentSource: parameters.effectiveAssignmentSource,
    conditionality: parameters.conditionality,
    interpretationConflict: parameters.interpretationConflict,
  };
}

function mapControl(item: {
  id: string;
  originId: string;
  title: string;
  family: string;
  statement: string;
  source: string;
  sourceVersion: string;
  itemKind: OverlayItemKind;
  selectionProvenance: SelectionProvenance;
  parameters: OverlayParameterMetadata;
  dodSupplements: ProvenanceText[];
  applicability: FrameworkApplicability;
}): FrameworkControl {
  if (item.itemKind === "dod-grr") {
    if (item.family !== DOD_GRR_FAMILY) {
      throw new InvalidDodCloudIl4ArtifactError(
        `GRR ${item.id} must use family ${DOD_GRR_FAMILY}`,
      );
    }
    if (item.selectionProvenance.inNistModerate) {
      throw new InvalidDodCloudIl4ArtifactError(
        `GRR ${item.id} must not claim NIST catalog provenance`,
      );
    }
  } else if (item.family === DOD_GRR_FAMILY) {
    throw new InvalidDodCloudIl4ArtifactError(
      `item ${item.id} must not use the GRR family`,
    );
  }

  return {
    id: item.id,
    originId: item.originId,
    title: item.title,
    family: item.family,
    statement: item.statement,
    source: item.source,
    sourceVersion: item.sourceVersion,
    itemKind: mapItemKind(item.itemKind),
    selectionProvenance: mapSelectionProvenance(item.selectionProvenance),
    parameters: mapParameters(item.parameters),
    supplements: item.dodSupplements,
    applicability: item.applicability,
  };
}

/**
 * Map the WP2 generated overlay artifact into the application Framework.
 * Fails closed if the artifact is missing, mistyped, or count-inconsistent.
 * Does not recompute overlay winners or drop conditional items.
 */
export function mapDodCloudIl4ArtifactToFramework(
  artifact: unknown,
): Framework {
  const root = requireRecord(artifact, "artifact");
  const id = requireString(root.id, "id");
  if (id !== DOD_CLOUD_IL4_FRAMEWORK_ID) {
    throw new InvalidDodCloudIl4ArtifactError(
      `id must be ${DOD_CLOUD_IL4_FRAMEWORK_ID}`,
    );
  }
  requireString(root.title, "title");
  const source = requireString(root.source, "source");
  const sourceVersion = requireString(root.sourceVersion, "sourceVersion");
  const counts = requireRecord(root.counts, "counts");
  const declared = {
    nistBase: requireNumber(counts.nistBase, "counts.nistBase"),
    nistEnhancements: requireNumber(
      counts.nistEnhancements,
      "counts.nistEnhancements",
    ),
    grr: requireNumber(counts.grr, "counts.grr"),
    total: requireNumber(counts.total, "counts.total"),
  };
  if (
    declared.nistBase !== IL4_NIST_BASE_COUNT ||
    declared.nistEnhancements !== IL4_NIST_ENHANCEMENT_COUNT ||
    declared.grr !== IL4_GRR_COUNT ||
    declared.total !== IL4_TOTAL_COUNT
  ) {
    throw new InvalidDodCloudIl4ArtifactError(
      "declared counts do not match the approved IL4 population",
    );
  }

  const rawItems = requireArray(root.items, "items");
  const seen = new Set<string>();
  const controls: FrameworkControl[] = [];
  let nistBase = 0;
  let nistEnhancements = 0;
  let grr = 0;

  for (const [index, rawItem] of rawItems.entries()) {
    const item = requireRecord(rawItem, `items[${index}]`);
    const itemId = requireString(item.id, `items[${index}].id`);
    if (seen.has(itemId)) {
      throw new InvalidDodCloudIl4ArtifactError(`duplicate item id ${itemId}`);
    }
    seen.add(itemId);
    const itemKind = parseItemKind(item.itemKind, itemId);
    if (itemKind === "nist-base") {
      nistBase += 1;
    } else if (itemKind === "nist-enhancement") {
      nistEnhancements += 1;
    } else {
      grr += 1;
    }
    controls.push(
      mapControl({
        id: itemId,
        originId: requireString(item.originId, `item ${itemId} originId`),
        title: requireString(item.title, `item ${itemId} title`),
        family: requireString(item.family, `item ${itemId} family`),
        statement: requireString(item.statement, `item ${itemId} statement`),
        source: requireString(item.source, `item ${itemId} source`),
        sourceVersion: requireString(
          item.sourceVersion,
          `item ${itemId} sourceVersion`,
        ),
        itemKind,
        selectionProvenance: parseSelectionProvenance(
          item.selectionProvenance,
          itemId,
        ),
        parameters: parseParameters(item.parameters, itemId),
        dodSupplements: parseProvenanceList(
          item.dodSupplements,
          `item ${itemId} dodSupplements`,
        ),
        applicability: parseApplicability(item.applicability, itemId),
      }),
    );
  }

  if (
    controls.length !== IL4_TOTAL_COUNT ||
    nistBase !== IL4_NIST_BASE_COUNT ||
    nistEnhancements !== IL4_NIST_ENHANCEMENT_COUNT ||
    grr !== IL4_GRR_COUNT
  ) {
    throw new InvalidDodCloudIl4ArtifactError(
      `item population is ${nistBase}/${nistEnhancements}/${grr}/${controls.length}, expected ${IL4_NIST_BASE_COUNT}/${IL4_NIST_ENHANCEMENT_COUNT}/${IL4_GRR_COUNT}/${IL4_TOTAL_COUNT}`,
    );
  }

  for (const requiredId of [...REQUIRED_RUNTIME_IDS, ...GRR_IDS]) {
    if (!seen.has(requiredId)) {
      throw new InvalidDodCloudIl4ArtifactError(`missing required id ${requiredId}`);
    }
  }

  return {
    id: DOD_CLOUD_IL4_IDENTITY.id,
    title: DOD_CLOUD_IL4_IDENTITY.title,
    source,
    sourceVersion,
    controls,
  };
}

export function createDodCloudIl4FrameworkProvider(
  artifact: unknown,
): FrameworkProvider {
  const framework = mapDodCloudIl4ArtifactToFramework(artifact);
  return {
    getFramework(): Framework {
      return framework;
    },
  };
}

export const dodCloudIl4FrameworkProvider: FrameworkProvider =
  createDodCloudIl4FrameworkProvider(generatedDodCloudIl4);

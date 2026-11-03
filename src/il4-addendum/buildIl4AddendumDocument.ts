/**
 * Map canonical project, IL4 framework, and SSP synthesis into the addendum
 * view model. Does not resolve parameters or synthesize statements itself.
 */

import type { FrameworkControl } from "@/data/framework";
import { dodCloudIl4SourcePins } from "@/framework/dod-cloud-il4-rev5/source-pins";
import { loadPinnedIl4TableD1Notes } from "@/framework/dod-cloud-il4-rev5/table-d1-index";
import type {
  AppendixDNote,
  TableD1AdjustmentKind,
} from "@/framework/dod-cloud-il4-rev5/types";
import { buildSspDocument } from "@/ssp";
import { formatSspItemDisplayId } from "@/ssp/identity";
import { sourceDisplayLabel } from "@/ssp/overlay";
import type { SspFrameworkItem, SspGenerationInput } from "@/ssp";
import {
  IL4_COVER_DISCLAIMER,
  IL4_GENERATION_NOTES,
  IL4_OMISSIONS_STATEMENT,
  IL4_PARAMETER_READING_NOTES,
  IL4_SCOPE_STATEMENT,
  populationExplanation,
} from "./copy";
import {
  classifyIl4AddendumPopulation,
  Il4AddendumPopulationError,
  type ClassifiedIl4Control,
} from "./population";
import { IL4_ADDENDUM_UNSUPPORTED_FRAMEWORK_MESSAGE, supportsIl4AddendumExport } from "./support";
import type {
  Il4AddendumDocument,
  Il4DetailedEntry,
  Il4DeltaGroup,
  Il4MembershipNote,
  Il4NistFamily,
} from "./types";
import {
  CF_IL4_ADDENDUM_DOCUMENT_TITLE,
  CF_IL4_ADDENDUM_GENERATOR,
  CF_IL4_ADDENDUM_LAYOUT_ID,
  CF_IL4_ADDENDUM_LAYOUT_VERSION,
} from "./types";

export class Il4AddendumUnsupportedFrameworkError extends Error {
  readonly frameworkId: string;

  constructor(frameworkId: string) {
    super(IL4_ADDENDUM_UNSUPPORTED_FRAMEWORK_MESSAGE);
    this.name = "Il4AddendumUnsupportedFrameworkError";
    this.frameworkId = frameworkId;
  }
}

const KIND_LABEL: Record<TableD1AdjustmentKind, string> = {
  "may-use-fedramp": "DoD permits the FedRAMP value",
  "dspav-must-be-used": "Table D-1 requires an authoritative value",
  "explicit-value": "Table D-1 records an explicit value",
  "inclusion-only": "Table D-1 inclusion only",
};

function baselineRelationship(
  group: Il4DeltaGroup,
  inFedrampModerate: boolean,
): string {
  if (group === "grr") {
    return "Not a NIST control and not part of the FedRAMP Moderate baseline. This is a DoD General Readiness Requirement.";
  }
  if (!inFedrampModerate) {
    return "Not present in the FedRAMP Moderate baseline. This item is part of the DoD IL4 authoring framework.";
  }
  return "Present in the FedRAMP Moderate baseline. Table D-1 records a DoD parameter adjustment for this item.";
}

function provenanceNote(
  kind: TableD1AdjustmentKind | null,
  source: string | null,
): string | null {
  const parts: string[] = [];
  if (kind === "may-use-fedramp") {
    parts.push(
      "Table D-1 permits the FedRAMP value. That permission is separate from FedRAMP Moderate baseline membership.",
    );
  }
  if (source === "dod-ssp-addendum-v1.2") {
    parts.push("Effective assignment provenance is the DoD Rev. 5 SSP Addendum.");
  } else if (source === "fedramp-moderate-baseline") {
    parts.push(
      "Effective assignment provenance is the FedRAMP Moderate baseline. DoD permission to use that value does not mean DoD authored it.",
    );
  } else if (source) {
    parts.push(`Effective assignment provenance: ${sourceDisplayLabel(source)}.`);
  }
  return parts.length > 0 ? parts.join(" ") : null;
}

function leveragedNote(value: boolean | null): string | null {
  if (value === null) {
    return null;
  }
  const marked = value ? "marks" : "does not mark";
  return `The Addendum column ${marked} this item as leveraged from FedRAMP Moderate. That column is provenance only. It is not the population rule and it is not a leveraged authorization.`;
}

function membershipExplanation(displayId: string, title: string): string {
  return `${displayId} (${title}) is already present in the FedRAMP Moderate baseline. The current IL4 Table D-1 treatment is inclusion-only, so no separate DoD parameter adjustment is represented. This addendum acknowledges that membership and does not duplicate the broader System Security Plan implementation entry.`;
}

function indexSspItems(
  families: ReturnType<typeof buildSspDocument>["families"],
): Map<string, SspFrameworkItem> {
  const map = new Map<string, SspFrameworkItem>();
  for (const family of families) {
    for (const item of family.items) {
      map.set(item.id, item);
    }
  }
  return map;
}

function toEntry(
  classified: ClassifiedIl4Control,
  items: Map<string, SspFrameworkItem>,
): Il4DetailedEntry {
  const item = items.get(classified.control.id);
  if (!item) {
    throw new Il4AddendumPopulationError(
      `SSP synthesis did not produce ${classified.control.id}.`,
    );
  }
  const group: Il4DeltaGroup =
    classified.classification === "grr"
      ? "grr"
      : classified.classification === "nist-not-in-fedramp-moderate"
        ? "nist-not-in-fedramp-moderate"
        : "fedramp-moderate-table-d1-adjustment";
  const inFedrampModerate =
    classified.control.selectionProvenance?.inExternalBaseline === true;
  const source = classified.control.parameters?.effectiveAssignmentSource ?? null;
  const leveraged =
    classified.control.selectionProvenance
      ?.overlayMarksLeveragedFromExternalBaseline ?? null;
  return {
    group,
    inFedrampModerate,
    baselineRelationship: baselineRelationship(group, inFedrampModerate),
    tableD1AdjustmentKind: classified.tableD1AdjustmentKind,
    tableD1AdjustmentLabel: classified.tableD1AdjustmentKind
      ? KIND_LABEL[classified.tableD1AdjustmentKind]
      : null,
    effectiveAssignmentSource: source,
    effectiveAssignmentProvenanceNote: provenanceNote(
      classified.tableD1AdjustmentKind,
      source,
    ),
    addendumLeveragedFromFedrampModerate: leveraged,
    addendumColumnNote: leveragedNote(leveraged),
    item,
  };
}

function toMembershipNote(classified: ClassifiedIl4Control): Il4MembershipNote {
  if (classified.tableD1AdjustmentKind !== "inclusion-only") {
    throw new Il4AddendumPopulationError(
      `Membership note ${classified.control.id} is not Table D-1 inclusion-only.`,
    );
  }
  if (classified.control.selectionProvenance?.inExternalBaseline !== true) {
    throw new Il4AddendumPopulationError(
      `Membership note ${classified.control.id} is not in FedRAMP Moderate.`,
    );
  }
  const displayId = formatSspItemDisplayId(classified.control.id);
  return {
    id: classified.control.id,
    displayId,
    title: classified.control.title,
    family: classified.control.family,
    inFedrampModerate: true,
    tableD1AdjustmentKind: "inclusion-only",
    explanation: membershipExplanation(displayId, classified.control.title),
  };
}

function groupFamilies(entries: readonly Il4DetailedEntry[]): Il4NistFamily[] {
  const groups: Il4NistFamily[] = [];
  const index = new Map<string, Il4DetailedEntry[]>();
  for (const entry of entries) {
    const existing = index.get(entry.item.family);
    if (existing) {
      existing.push(entry);
      continue;
    }
    const created: Il4DetailedEntry[] = [entry];
    index.set(entry.item.family, created);
    groups.push({ family: entry.item.family, entries: created });
  }
  return groups;
}

function inFrameworkOrder(
  controls: readonly FrameworkControl[],
  classified: readonly ClassifiedIl4Control[],
  accepted: ReadonlySet<ClassifiedIl4Control["classification"]>,
): ClassifiedIl4Control[] {
  const byId = new Map(classified.map((entry) => [entry.control.id, entry]));
  const ordered: ClassifiedIl4Control[] = [];
  for (const control of controls) {
    const entry = byId.get(control.id);
    if (entry && accepted.has(entry.classification)) {
      ordered.push(entry);
    }
  }
  return ordered;
}

export function buildIl4AddendumDocument(
  input: SspGenerationInput,
  options?: { tableD1Notes?: readonly AppendixDNote[] },
): Il4AddendumDocument {
  if (!supportsIl4AddendumExport(input.framework.id)) {
    throw new Il4AddendumUnsupportedFrameworkError(input.framework.id);
  }

  const tableD1Notes = options?.tableD1Notes ?? loadPinnedIl4TableD1Notes();
  const ssp = buildSspDocument(input);
  const classification = classifyIl4AddendumPopulation({
    controls: input.framework.controls,
    tableD1Notes,
  });
  const items = indexSspItems(ssp.families);
  const nistDetailed = inFrameworkOrder(
    input.framework.controls,
    [
      ...classification.nistNotInFedrampModerate,
      ...classification.fedrampTableD1Adjustments,
    ],
    new Set([
      "nist-not-in-fedramp-moderate",
      "fedramp-moderate-table-d1-adjustment",
    ]),
  );
  const membershipNotes = inFrameworkOrder(
    input.framework.controls,
    classification.membershipNotes,
    new Set(["table-d1-inclusion-note"]),
  ).map(toMembershipNote);

  const population = {
    totalFrameworkItems: input.framework.controls.length,
    detailedGrrCount: classification.grrs.length,
    detailedNistCount: nistDetailed.length,
    detailedItemCount: classification.grrs.length + nistDetailed.length,
    membershipNoteCount: membershipNotes.length,
    notReprintedCount: classification.notReprinted.length,
  };
  if (
    population.detailedItemCount +
      population.membershipNoteCount +
      population.notReprintedCount !==
    population.totalFrameworkItems
  ) {
    throw new Il4AddendumPopulationError(
      "IL4 addendum accounting does not match the framework population.",
    );
  }

  return {
    identity: {
      documentTitle: CF_IL4_ADDENDUM_DOCUMENT_TITLE,
      generator: CF_IL4_ADDENDUM_GENERATOR,
      layoutId: CF_IL4_ADDENDUM_LAYOUT_ID,
      layoutVersion: CF_IL4_ADDENDUM_LAYOUT_VERSION,
      generatedAt: input.generatedAt,
      projectId: input.project.id,
      projectRevision: input.project.revision,
      projectSchemaVersion: input.project.schemaVersion,
      frameworkId: input.framework.id,
      frameworkTitle: input.descriptor.title || input.framework.title,
      systemName: ssp.identity.systemName,
      systemNameShort: ssp.identity.systemNameShort,
      systemIdentifier: ssp.identity.systemIdentifier,
      sspOrganization: ssp.identity.sspOrganization,
    },
    coverDisclaimer: IL4_COVER_DISCLAIMER,
    scopeStatement: IL4_SCOPE_STATEMENT,
    omissionsStatement: IL4_OMISSIONS_STATEMENT,
    populationExplanation: populationExplanation(population),
    completenessParagraphs: ssp.completenessNotice.paragraphs,
    parameterReadingNotes: IL4_PARAMETER_READING_NOTES,
    generationNotes: IL4_GENERATION_NOTES,
    sources: dodCloudIl4SourcePins(),
    systemOverview: ssp.systemOverview,
    roles: ssp.roles,
    boundaryAndEnvironment: ssp.boundaryAndEnvironment,
    categorization: ssp.categorization,
    informationTypes: ssp.informationTypes,
    interconnections: ssp.interconnections,
    population,
    grrs: classification.grrs.map((entry) => toEntry(entry, items)),
    nistFamilies: groupFamilies(nistDetailed.map((entry) => toEntry(entry, items))),
    membershipNotes,
  };
}

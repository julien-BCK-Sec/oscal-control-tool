/**
 * IL4 addendum population.
 *
 * GRR identity and FedRAMP membership come from the framework read model.
 * Table D-1 adjustment kind comes from the pinned Appendix D extract.
 * A control is listed in Table D-1 only when that extract and the framework
 * policy cross-check agree. The Addendum leveraged column is not the rule.
 */

import type { FrameworkControl } from "@/data/framework";
import { DOD_GRR_FAMILY } from "@/framework/dod-cloud-il4-rev5/identities";
import type {
  AppendixDNote,
  TableD1AdjustmentKind,
} from "@/framework/dod-cloud-il4-rev5/types";

const PARAMETER_ADJUSTMENT_KINDS = new Set<TableD1AdjustmentKind>([
  "may-use-fedramp",
  "dspav-must-be-used",
  "explicit-value",
]);

export class Il4AddendumPopulationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Il4AddendumPopulationError";
  }
}

export type Il4PopulationClass =
  | "grr"
  | "nist-not-in-fedramp-moderate"
  | "fedramp-moderate-table-d1-adjustment"
  | "table-d1-inclusion-note"
  | "unchanged-fedramp";

export type ClassifiedIl4Control = {
  control: FrameworkControl;
  classification: Il4PopulationClass;
  tableD1AdjustmentKind: TableD1AdjustmentKind | null;
};

export type Il4PopulationClassification = {
  grrs: ClassifiedIl4Control[];
  nistNotInFedrampModerate: ClassifiedIl4Control[];
  fedrampTableD1Adjustments: ClassifiedIl4Control[];
  membershipNotes: ClassifiedIl4Control[];
  notReprinted: ClassifiedIl4Control[];
};

function fail(message: string): never {
  throw new Il4AddendumPopulationError(message);
}

function indexTableD1(
  notes: readonly AppendixDNote[],
): Map<string, AppendixDNote> {
  const map = new Map<string, AppendixDNote>();
  for (const note of notes) {
    if (note.listedInTableD1 !== true) {
      fail(`Table D-1 note ${note.originId} is not listed.`);
    }
    if (map.has(note.id)) {
      fail(`Table D-1 note ${note.originId} is duplicated.`);
    }
    if (
      note.tableD1AdjustmentKind !== "inclusion-only" &&
      !PARAMETER_ADJUSTMENT_KINDS.has(note.tableD1AdjustmentKind)
    ) {
      fail(
        `Table D-1 note ${note.originId} has unknown adjustment kind ${note.tableD1AdjustmentKind}.`,
      );
    }
    map.set(note.id, note);
  }
  return map;
}

function hasPolicyCrossCheck(control: FrameworkControl): boolean {
  return Boolean(control.parameters?.policyCrossCheck?.text?.trim());
}

function classifyControl(
  control: FrameworkControl,
  tableD1: Map<string, AppendixDNote>,
): ClassifiedIl4Control {
  const provenance = control.selectionProvenance;
  if (!provenance || typeof provenance.inExternalBaseline !== "boolean") {
    fail(`Control ${control.id} has no FedRAMP membership provenance.`);
  }
  const listed = tableD1.get(control.id);
  if (Boolean(listed) !== hasPolicyCrossCheck(control)) {
    fail(
      `Table D-1 membership for ${control.id} does not match the framework policy cross-check.`,
    );
  }
  const kind = listed?.tableD1AdjustmentKind ?? null;
  const inFedramp = provenance.inExternalBaseline;
  const grrFamily = control.family === DOD_GRR_FAMILY;

  if (control.itemKind === "other" || grrFamily) {
    if (control.itemKind !== "other" || !grrFamily) {
      fail(`Control ${control.id} has an ambiguous General Readiness Requirement identity.`);
    }
    if (!/^grr-\d+$/.test(control.id)) {
      fail(`General Readiness Requirement ${control.id} has an unusable identifier.`);
    }
    if (inFedramp || listed) {
      fail(
        `General Readiness Requirement ${control.id} cannot be classified as a FedRAMP or Table D-1 NIST row.`,
      );
    }
    return { control, classification: "grr", tableD1AdjustmentKind: null };
  }

  if (control.itemKind !== "base" && control.itemKind !== "enhancement") {
    fail(`Control ${control.id} has no usable item kind.`);
  }

  if (!inFedramp) {
    return {
      control,
      classification: "nist-not-in-fedramp-moderate",
      tableD1AdjustmentKind: kind,
    };
  }

  if (!listed || !kind) {
    return {
      control,
      classification: "unchanged-fedramp",
      tableD1AdjustmentKind: null,
    };
  }

  if (kind === "inclusion-only") {
    return {
      control,
      classification: "table-d1-inclusion-note",
      tableD1AdjustmentKind: kind,
    };
  }

  if (!PARAMETER_ADJUSTMENT_KINDS.has(kind)) {
    fail(`Control ${control.id} has an unusable Table D-1 adjustment kind.`);
  }

  return {
    control,
    classification: "fedramp-moderate-table-d1-adjustment",
    tableD1AdjustmentKind: kind,
  };
}

function grrNumber(id: string): number {
  const match = /^grr-(\d+)$/.exec(id);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

export function classifyIl4AddendumPopulation(input: {
  controls: readonly FrameworkControl[];
  tableD1Notes: readonly AppendixDNote[];
}): Il4PopulationClassification {
  const tableD1 = indexTableD1(input.tableD1Notes);
  const seen = new Set<string>();
  const grrs: ClassifiedIl4Control[] = [];
  const nistNotInFedrampModerate: ClassifiedIl4Control[] = [];
  const fedrampTableD1Adjustments: ClassifiedIl4Control[] = [];
  const membershipNotes: ClassifiedIl4Control[] = [];
  const notReprinted: ClassifiedIl4Control[] = [];

  for (const control of input.controls) {
    if (seen.has(control.id)) {
      fail(`Duplicate framework control ${control.id}.`);
    }
    seen.add(control.id);
    const classified = classifyControl(control, tableD1);
    switch (classified.classification) {
      case "grr":
        grrs.push(classified);
        break;
      case "nist-not-in-fedramp-moderate":
        nistNotInFedrampModerate.push(classified);
        break;
      case "fedramp-moderate-table-d1-adjustment":
        fedrampTableD1Adjustments.push(classified);
        break;
      case "table-d1-inclusion-note":
        membershipNotes.push(classified);
        break;
      case "unchanged-fedramp":
        notReprinted.push(classified);
        break;
      default: {
        const _exhaustive: never = classified.classification;
        return _exhaustive;
      }
    }
  }

  for (const id of tableD1.keys()) {
    if (!seen.has(id)) {
      fail(`Table D-1 control ${id} is not in the IL4 framework.`);
    }
  }

  const detailed =
    grrs.length +
    nistNotInFedrampModerate.length +
    fedrampTableD1Adjustments.length;
  const accounted =
    detailed + membershipNotes.length + notReprinted.length;
  if (accounted !== input.controls.length) {
    fail("IL4 addendum categories do not partition the framework.");
  }

  grrs.sort((left, right) => grrNumber(left.control.id) - grrNumber(right.control.id));

  return {
    grrs,
    nistNotInFedrampModerate,
    fedrampTableD1Adjustments,
    membershipNotes,
    notReprinted,
  };
}

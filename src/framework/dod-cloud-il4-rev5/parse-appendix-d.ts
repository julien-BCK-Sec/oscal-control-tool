import { TABLE_D1_IL4_COUNT } from "./identities";
import { normalizeFrameworkControlId } from "./ids";
import { CSP_SRG_V1R7_PDF_SHA256 } from "./sources";
import type { AppendixDNote, TableD1AdjustmentKind } from "./types";

const ADJUSTMENT_KINDS = new Set<TableD1AdjustmentKind>([
  "may-use-fedramp",
  "dspav-must-be-used",
  "explicit-value",
  "inclusion-only",
]);

type RawAppendixD = {
  source?: { pdfSha256?: string; section?: string };
  notes?: Array<{
    originId?: string;
    parameterValues?: string;
    impactNote?: string;
    indicatesDspav?: boolean;
    listedInTableD1?: boolean;
    tableD1AdjustmentKind?: string;
  }>;
};

export function inferTableD1AdjustmentKind(
  parameterValues: string,
): TableD1AdjustmentKind {
  const trimmed = parameterValues.trim();
  const lower = trimmed.toLowerCase();
  if (!trimmed) {
    return "inclusion-only";
  }
  if (lower.includes("may use fedramp")) {
    return "may-use-fedramp";
  }
  if (lower.includes("dspav must be used")) {
    return "dspav-must-be-used";
  }
  return "explicit-value";
}

function parseAdjustmentKind(
  value: unknown,
  originId: string,
): TableD1AdjustmentKind {
  if (typeof value === "string" && ADJUSTMENT_KINDS.has(value as TableD1AdjustmentKind)) {
    return value as TableD1AdjustmentKind;
  }
  throw new Error(
    `Appendix D note ${originId} has unknown tableD1AdjustmentKind.`,
  );
}

export function parseAppendixDExtract(raw: unknown): AppendixDNote[] {
  if (!raw || typeof raw !== "object") {
    throw new Error("Appendix D extract is not an object.");
  }
  const doc = raw as RawAppendixD;
  if (doc.source?.pdfSha256 !== CSP_SRG_V1R7_PDF_SHA256) {
    throw new Error("Appendix D extract does not match CSP SRG V1R7 PDF SHA-256.");
  }
  if (!Array.isArray(doc.notes)) {
    throw new Error("Appendix D extract is missing notes[].");
  }
  const notes = doc.notes.map((note, index) => {
    const originId = note.originId?.trim() ?? "";
    const id = normalizeFrameworkControlId(originId);
    if (!id) {
      throw new Error(`Appendix D note ${index} has unusable originId ${originId}`);
    }
    if (note.listedInTableD1 !== true) {
      throw new Error(
        `Appendix D note ${originId} must set listedInTableD1 to true.`,
      );
    }
    const parameterValues = note.parameterValues?.trim() ?? "";
    const tableD1AdjustmentKind = parseAdjustmentKind(
      note.tableD1AdjustmentKind,
      originId,
    );
    const inferred = inferTableD1AdjustmentKind(parameterValues);
    if (tableD1AdjustmentKind !== inferred) {
      throw new Error(
        `Appendix D note ${originId} tableD1AdjustmentKind ${tableD1AdjustmentKind} does not match parameter text (${inferred}).`,
      );
    }
    return {
      id,
      originId,
      parameterValues,
      impactNote: note.impactNote?.trim() ?? "",
      indicatesDspav: Boolean(note.indicatesDspav),
      listedInTableD1: true,
      tableD1AdjustmentKind,
    } satisfies AppendixDNote;
  });

  if (notes.length !== TABLE_D1_IL4_COUNT) {
    throw new Error(
      `Appendix D extract has ${notes.length} IL4 Table D-1 notes, expected ${TABLE_D1_IL4_COUNT}.`,
    );
  }
  const seen = new Set<string>();
  for (const note of notes) {
    if (seen.has(note.id)) {
      throw new Error(`Appendix D extract has duplicate control ${note.originId}.`);
    }
    seen.add(note.id);
  }
  return notes;
}

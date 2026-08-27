import { createHash } from "node:crypto";
import {
  FEDRAMP_MODERATE_BASE_COUNT,
  FEDRAMP_MODERATE_ENHANCEMENT_COUNT,
  FEDRAMP_MODERATE_TOTAL_COUNT,
} from "./identities";
import { FEDRAMP_BASELINE_SHA256 } from "./sources";
import { isNistEnhancementId, normalizeFrameworkControlId } from "./ids";
import type { FedrampModerateRow } from "./types";
import {
  cell,
  loadOoxmlWorkbook,
  readSheetCells,
  type SheetCellMap,
} from "./xlsx";

export function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function headerMap(row: Map<string, string> | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!row) {
    return map;
  }
  for (const [col, value] of row) {
    const key = value.replace(/\s+/g, " ").trim().toLowerCase();
    if (key) {
      map.set(key, col);
    }
  }
  return map;
}

function findColumn(headers: Map<string, string>, ...needles: string[]): string {
  for (const needle of needles) {
    for (const [label, col] of headers) {
      if (label === needle) {
        return col;
      }
    }
  }
  for (const needle of needles) {
    for (const [label, col] of headers) {
      if (label.includes(needle)) {
        return col;
      }
    }
  }
  throw new Error(
    `FedRAMP Moderate sheet missing column matching: ${needles.join(", ")}`,
  );
}

export function parseFedrampModerateWorkbook(buffer: Buffer): {
  sha256: string;
  rows: FedrampModerateRow[];
} {
  const digest = sha256(buffer);
  if (digest !== FEDRAMP_BASELINE_SHA256) {
    throw new Error(
      `FedRAMP baseline SHA-256 mismatch: expected ${FEDRAMP_BASELINE_SHA256}, got ${digest}`,
    );
  }

  const workbook = loadOoxmlWorkbook(buffer);
  const moderate = workbook.sheets.find((sheet) => sheet.name === "Moderate Baseline");
  if (!moderate) {
    throw new Error('FedRAMP workbook is missing the "Moderate Baseline" sheet.');
  }
  const cells = readSheetCells(workbook.files, workbook.sharedStrings, moderate.path);
  return { sha256: digest, rows: parseFedrampModerateSheet(cells) };
}

export function parseFedrampModerateSheet(cells: SheetCellMap): FedrampModerateRow[] {
  let headerRow = 0;
  let headers = new Map<string, string>();
  for (const [rowNumber, row] of [...cells.entries()].sort((a, b) => a[0] - b[0])) {
    const mapped = headerMap(row);
    if ([...mapped.keys()].some((label) => label === "id" || label.startsWith("id "))) {
      headerRow = rowNumber;
      headers = mapped;
      break;
    }
  }
  if (headerRow === 0) {
    throw new Error("FedRAMP Moderate sheet is missing an ID header row.");
  }

  const idCol = findColumn(headers, "id");
  const nameCol = findColumn(headers, "control name");
  const familyCol = findColumn(headers, "family");
  const assignmentCol = findColumn(headers, "fedramp-defined assignment");
  const extraCol = findColumn(headers, "additional fedramp requirements");

  const rows: FedrampModerateRow[] = [];
  const seen = new Set<string>();
  for (const [rowNumber, row] of [...cells.entries()].sort((a, b) => a[0] - b[0])) {
    if (rowNumber <= headerRow) {
      continue;
    }
    const originId = cell(row, idCol);
    if (!originId) {
      continue;
    }
    const id = normalizeFrameworkControlId(originId);
    if (!id || id.startsWith("grr-")) {
      throw new Error(`FedRAMP Moderate row ${rowNumber} has unusable ID ${originId}`);
    }
    if (seen.has(id)) {
      throw new Error(`Duplicate FedRAMP Moderate ID ${id}`);
    }
    seen.add(id);
    rows.push({
      originId,
      id,
      title: cell(row, nameCol),
      family: cell(row, familyCol),
      fedrampAssignment: cell(row, assignmentCol),
      fedrampAdditionalGuidance: cell(row, extraCol),
    });
  }

  const enhancements = rows.filter((row) => isNistEnhancementId(row.id)).length;
  const bases = rows.length - enhancements;
  if (
    bases !== FEDRAMP_MODERATE_BASE_COUNT ||
    enhancements !== FEDRAMP_MODERATE_ENHANCEMENT_COUNT ||
    rows.length !== FEDRAMP_MODERATE_TOTAL_COUNT
  ) {
    throw new Error(
      `FedRAMP Moderate population mismatch: ${bases} base / ${enhancements} enhancements / ${rows.length} total (expected ${FEDRAMP_MODERATE_BASE_COUNT}/${FEDRAMP_MODERATE_ENHANCEMENT_COUNT}/${FEDRAMP_MODERATE_TOTAL_COUNT}).`,
    );
  }
  return rows;
}

import { ADDENDUM_WORKBOOK_SHA256 } from "./sources";
import type { AddendumExtract, AddendumExtractRow } from "./types";
import { cell, loadOoxmlWorkbook, readSheetCells } from "./xlsx";
import { sha256 } from "./parse-fedramp-moderate";

export function parseAddendumExtract(raw: unknown): AddendumExtract {
  if (!raw || typeof raw !== "object") {
    throw new Error("Addendum extract is not an object.");
  }
  const extract = raw as AddendumExtract;
  if (extract.source?.sha256 !== ADDENDUM_WORKBOOK_SHA256) {
    throw new Error(
      `Addendum extract SHA-256 does not match the authoritative workbook (${ADDENDUM_WORKBOOK_SHA256}).`,
    );
  }
  if (extract.source?.sheet !== "IL4 Moderate") {
    throw new Error('Addendum extract must be from the "IL4 Moderate" sheet.');
  }
  if (!Array.isArray(extract.rows) || extract.rows.length === 0) {
    throw new Error("Addendum extract has no rows.");
  }
  return extract;
}

export function extractAddendumIl4Moderate(buffer: Buffer): AddendumExtract {
  const digest = sha256(buffer);
  if (digest !== ADDENDUM_WORKBOOK_SHA256) {
    throw new Error(
      `Addendum workbook SHA-256 mismatch: expected ${ADDENDUM_WORKBOOK_SHA256}, got ${digest}`,
    );
  }
  const workbook = loadOoxmlWorkbook(buffer);
  const sheet = workbook.sheets.find((entry) => entry.name.trim() === "IL4 Moderate");
  if (!sheet) {
    throw new Error('Addendum workbook is missing the "IL4 Moderate" sheet.');
  }
  const cells = readSheetCells(workbook.files, workbook.sharedStrings, sheet.path);
  const header = cells.get(1);
  if (cell(header, "A") !== "Control Identifier") {
    throw new Error("IL4 Moderate sheet header A1 is not Control Identifier.");
  }

  const rows: AddendumExtractRow[] = [];
  for (const [rowNumber, row] of [...cells.entries()].sort((a, b) => a[0] - b[0])) {
    if (rowNumber < 2) {
      continue;
    }
    const identifier = cell(row, "A");
    if (!identifier) {
      continue;
    }
    rows.push({
      row: rowNumber,
      identifier,
      sortId: cell(row, "B"),
      family: cell(row, "C"),
      name: cell(row, "D"),
      controlText: cell(row, "E"),
      discussion: cell(row, "F"),
      relatedControls: cell(row, "G"),
      fedrampAssignment: cell(row, "I"),
      fedrampAdditionalGuidance: cell(row, "J"),
      dodFedrampPlusParameters: cell(row, "K"),
      leveragedFromFedrampModerate: cell(row, "O"),
    });
  }
  return {
    source: {
      title: "DoD Rev 5 SSP Addendum Controls v1.2",
      publisher: "DISA",
      filename: "rev5_ssp_addendum_controls.xlsx",
      sheet: "IL4 Moderate",
      sha256: digest,
      modified: "2025-12-03T20:15:28Z",
      extractionNote:
        "Deterministic cell extract of the IL4 Moderate sheet. Regenerated from the authoritative workbook; not an unofficial mapping.",
    },
    rows,
  };
}

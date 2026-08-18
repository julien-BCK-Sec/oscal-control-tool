/**
 * Evidence inventory CSV (Milestone 03D).
 * One row per Evidence–control association; unlinked Evidence has empty control fields.
 * Never includes binaries, storage keys, or provider details.
 */

import {
  evidenceRequirementLabel,
  evidenceStatusLabel,
  evidenceTypeLabel,
} from "./defaults";
import { evidenceFreshnessLabel, type EvidenceFreshness } from "./freshness";
import type { EvidenceRequirement, EvidenceStatus, EvidenceType } from "./types";

export type EvidenceInventoryRow = {
  projectId: string;
  projectName: string;
  controlId: string | null;
  evidenceRequirement: EvidenceRequirement | null;
  evidenceId: string;
  title: string;
  evidenceType: EvidenceType;
  owner: string;
  status: EvidenceStatus;
  collectionDate: string | null;
  reviewDueDate: string | null;
  freshness: EvidenceFreshness;
  currentVersionFilename: string | null;
  currentVersionUploadedAt: string | null;
  linkedControlCount: number;
};

const COLUMNS = [
  "Project",
  "Project ID",
  "Control ID",
  "Evidence Requirement",
  "Evidence ID",
  "Evidence Title",
  "Evidence Type",
  "Owner",
  "Evidence Status",
  "Collection Date",
  "Review Due Date",
  "Freshness",
  "Current Version Filename",
  "Current Version Uploaded At",
  "Linked Control Count",
] as const;

/**
 * Neutralize spreadsheet formula injection. Prefix values that would be
 * interpreted as formulas or control sequences when opened in Excel/Sheets.
 * Applied before RFC-style quoting so escaping remains correct.
 */
export function neutralizeCsvFormulaPrefix(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

export function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  return escapeCsvField(neutralizeCsvFormulaPrefix(String(value)));
}

export function formatEvidenceInventoryCsv(
  rows: readonly EvidenceInventoryRow[],
  options?: { controlIdColumnLabel?: string },
): string {
  const controlIdColumnLabel = options?.controlIdColumnLabel?.trim() || "Control ID";
  const headers = COLUMNS.map((column) =>
    column === "Control ID" ? controlIdColumnLabel : column,
  );
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      [
        cell(row.projectName),
        cell(row.projectId),
        cell(row.controlId),
        cell(
          row.evidenceRequirement
            ? evidenceRequirementLabel(row.evidenceRequirement)
            : "",
        ),
        cell(row.evidenceId),
        cell(row.title),
        cell(evidenceTypeLabel(row.evidenceType)),
        cell(row.owner),
        cell(evidenceStatusLabel(row.status)),
        cell(row.collectionDate),
        cell(row.reviewDueDate),
        cell(evidenceFreshnessLabel(row.freshness)),
        cell(row.currentVersionFilename),
        cell(row.currentVersionUploadedAt),
        cell(row.linkedControlCount),
      ].join(","),
    );
  }
  return `${lines.join("\r\n")}\r\n`;
}

export function evidenceInventoryFilename(
  projectName: string,
  asOfDate: string,
): string {
  const slug = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const safeName = slug.length > 0 ? slug : "project";
  return `evidence-inventory-${safeName}-${asOfDate}.csv`;
}

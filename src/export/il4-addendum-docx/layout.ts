/**
 * Control Freak IL4 addendum layout `cf-il4-addendum-docx` version 1.0.
 * Presentation only. Population and parameter decisions stay in the view model.
 *
 * Visual language follows the historical IL4 SSP Addendum as a document type:
 * centered cover, shaded label tables, and a repeated requirement / summary /
 * response rhythm. It does not copy official seals, classification markings,
 * or obsolete control content.
 */

import type { Il4AddendumDocument, Il4DetailedEntry } from "@/il4-addendum";

export const IL4_ADDENDUM_DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Navy used by the historical heading styles. */
export const NAVY = "17365D";
/** Secondary heading blue from the historical heading styles. */
export const STEEL = "4F81BD";
/** Historical table-header fill. */
export const LABEL_FILL = "DBE5F1";
/** Slightly stronger band so the implementation response reads as the answer area. */
export const RESPONSE_FILL = "C5D4E8";
/** Warm band for source-conflict and authoritative-value warnings. */
export const WARNING_FILL = "FBF3D5";
export const RULE = "8FA4BF";
export const PLACEHOLDER_COLOR = "666666";
export const MUTED = "5C6770";

export const SECTION_TITLES = {
  documentStatus: "Document status and generation metadata",
  tableOfContents: "Table of contents",
  purpose: "1. Purpose and scope",
  sources: "2. Source provenance",
  identification: "3. System identification",
  boundary: "4. Authorization boundary and environment",
  categorization: "5. Security categorization and information types",
  roles: "6. Roles",
  interconnections: "7. System interconnections",
  population: "8. Addendum population",
  grrs: "9. DoD General Readiness Requirements",
  nistDelta: "10. NIST controls and enhancements",
  parameters: "11. How to read parameters and assignments",
  generation: "12. Generation record",
} as const;

export function itemHeadingText(entry: Il4DetailedEntry): string {
  const title = entry.item.title.trim() || entry.item.displayId;
  return `${entry.item.displayId} ${title}`.trim();
}

export function membershipHeading(displayId: string): string {
  return `${displayId} membership`;
}

export type TocHeading = {
  title: string;
  level: 1 | 2;
};

export function tocHeadings(document: Il4AddendumDocument): TocHeading[] {
  const headings: TocHeading[] = [
    { title: SECTION_TITLES.documentStatus, level: 1 },
    { title: SECTION_TITLES.tableOfContents, level: 1 },
    { title: SECTION_TITLES.purpose, level: 1 },
    { title: SECTION_TITLES.sources, level: 1 },
    { title: SECTION_TITLES.identification, level: 1 },
    { title: SECTION_TITLES.boundary, level: 1 },
    { title: SECTION_TITLES.categorization, level: 1 },
    { title: SECTION_TITLES.roles, level: 1 },
    { title: SECTION_TITLES.interconnections, level: 1 },
    { title: SECTION_TITLES.population, level: 1 },
    { title: SECTION_TITLES.grrs, level: 1 },
    { title: SECTION_TITLES.nistDelta, level: 1 },
  ];
  for (const family of document.nistFamilies) {
    headings.push({ title: family.family, level: 2 });
  }
  for (const note of document.membershipNotes) {
    headings.push({ title: membershipHeading(note.displayId), level: 2 });
  }
  headings.push(
    { title: SECTION_TITLES.parameters, level: 1 },
    { title: SECTION_TITLES.generation, level: 1 },
  );
  return headings;
}

export function headerSystemLabel(document: Il4AddendumDocument): string {
  if (document.identity.systemNameShort.kind === "documented") {
    return document.identity.systemNameShort.text;
  }
  if (document.identity.systemName.kind === "documented") {
    return document.identity.systemName.text;
  }
  return "Untitled system";
}

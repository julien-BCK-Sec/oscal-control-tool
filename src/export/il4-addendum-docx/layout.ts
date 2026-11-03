/**
 * Control Freak IL4 addendum layout `cf-il4-addendum-docx` version 1.0.
 * Presentation only. Population and parameter decisions stay in the view model.
 *
 * Visual language follows the historical IL4 SSP Addendum as a document type:
 * formal cover stack, shaded Control Summary Information tables, and a
 * requirement → summary → solution/response rhythm. It does not copy official
 * seals, classification markings, or obsolete control content.
 */

import type { Il4AddendumDocument, Il4DetailedEntry, Il4DeltaGroup } from "@/il4-addendum";

export const IL4_ADDENDUM_DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Navy used by the historical heading styles. */
export const NAVY = "17365D";
/** Secondary heading blue from the historical heading styles. */
export const STEEL = "4F81BD";
/** Historical table-header fill. */
export const LABEL_FILL = "DBE5F1";
/** White / clear body for response answer cells. */
export const RESPONSE_BODY_FILL = "FFFFFF";
/** Warm band for source-conflict and authoritative-value warnings. */
export const WARNING_FILL = "FBF3D5";
export const RULE = "8DB3E2";
export const PLACEHOLDER_COLOR = "666666";
export const MUTED = "5C6770";

export const SECTION_TITLES = {
  documentStatus: "Document Status and Generation Metadata",
  tableOfContents: "Contents",
  purpose: "1. Purpose and Scope",
  sources: "2. Source Provenance",
  identification: "3. System Identification",
  boundary: "4. Information System Component and Boundaries",
  categorization: "5. Cloud Service Offering Categorization",
  roles: "6. Assignment of Security Responsibility",
  interconnections: "7. System Interconnections",
  population: "8. IL4 Addendum Population",
  grrs: "9. DoD General Readiness Requirements",
  nistDelta: "10. Information Impact Level 4 DoD NIST SP 800-53 Controls",
  parameters: "11. Parameter Interpretation Notes",
  generation: "12. Generation Record",
} as const;

export const CONTROL_SUMMARY_BANNER = "Control Summary Information";

export function solutionBanner(displayId: string): string {
  return `${displayId} What is the solution and how is it implemented?`;
}

export function itemHeadingText(entry: Il4DetailedEntry): string {
  const title = entry.item.title.trim() || entry.item.displayId;
  return `${entry.item.displayId} ${title}`.trim();
}

export function membershipHeading(displayId: string): string {
  return `${displayId} Membership Note`;
}

export function familyHeading(
  family: string,
  entries: readonly Il4DetailedEntry[],
): string {
  const displayId = entries[0]?.item.displayId ?? "";
  const match = /^([A-Z]{1,4})(?:-|\s)/.exec(displayId);
  return match ? `${family} (${match[1]})` : family;
}

export function subgroupHeading(
  familyLabel: string,
  group: Extract<
    Il4DeltaGroup,
    "nist-not-in-fedramp-moderate" | "fedramp-moderate-table-d1-adjustment"
  >,
): string {
  if (group === "nist-not-in-fedramp-moderate") {
    return `${familyLabel} — Additional controls`;
  }
  return `${familyLabel} — Enhanced parameters`;
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
    headings.push({ title: familyHeading(family.family, family.entries), level: 2 });
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

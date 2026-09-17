/**
 * Control Freak SSP layout `cf-ssp-docx` version 1.0.
 * Presentation structure only. Not canonical project data.
 */

import {
  CF_SSP_DOCUMENT_TYPE,
  CF_SSP_LAYOUT_ID,
  CF_SSP_LAYOUT_VERSION,
  type SspDocument,
  type SspItemKind,
} from "@/ssp";

export { CF_SSP_DOCUMENT_TYPE, CF_SSP_LAYOUT_ID, CF_SSP_LAYOUT_VERSION };

export const SSP_DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const LAYOUT_DISCLAIMER =
  "This is a Control Freak System Security Plan. It is not an official FedRAMP, DoD, CMMC, or authorization package.";

export const EVIDENCE_CAPTION =
  "Linked Evidence records (not independently assessed or validated).";

export const NO_LINKED_EVIDENCE_COPY =
  "[No linked Evidence records in Control Freak]";

export const CMMC_ORIGIN_LABEL = "NIST SP 800-171 Rev. 2 origin";

export const SECTION_TITLES = {
  documentStatus: "Document status",
  tableOfContents: "Table of contents",
  identification: "1. System identification and overview",
  roles: "2. System roles",
  boundary: "3. Authorization boundary and environment",
  categorization: "4. Information types and security categorization",
  interconnections: "5. Interconnections",
  implementations: "6. Security requirements / control implementations",
  appendix: "Appendix A — Generation metadata",
} as const;

export const ITEM_KIND_LABELS: Record<SspItemKind, string> = {
  control: "Control",
  enhancement: "Control enhancement",
  requirement: "Requirement",
  grr: "General readiness requirement",
};

export const PLACEHOLDER_COLOR = "666666";
export const HEADER_FILL = "F2F2F2";
export const BORDER_COLOR = "CCCCCC";

export function headerSystemLabel(document: SspDocument): string {
  if (document.identity.systemNameShort.kind === "documented") {
    return document.identity.systemNameShort.text;
  }
  if (document.identity.systemName.kind === "documented") {
    return document.identity.systemName.text;
  }
  return "Untitled system";
}

export function footerCopy(): string {
  return `${CF_SSP_DOCUMENT_TYPE} · layout ${CF_SSP_LAYOUT_VERSION}`;
}

export function documentedAgainstLine(document: SspDocument): string {
  return `Documented against ${document.identity.documentedAgainst.frameworkTitle}`;
}

export function documentationCompletenessSentence(document: SspDocument): string {
  const items = document.identity.documentedAgainst.itemPlural;
  return `${document.counts.narrativesDocumented} implementation narratives documented of ${document.counts.totalItems} ${items}. This is documentation completeness, not a compliance score.`;
}

export type TocHeading = {
  title: string;
  level: 1 | 2;
};

export function tocHeadings(document: SspDocument): TocHeading[] {
  const headings: TocHeading[] = [
    { title: SECTION_TITLES.documentStatus, level: 1 },
    { title: SECTION_TITLES.tableOfContents, level: 1 },
    { title: SECTION_TITLES.identification, level: 1 },
    { title: SECTION_TITLES.roles, level: 1 },
    { title: SECTION_TITLES.boundary, level: 1 },
    { title: SECTION_TITLES.categorization, level: 1 },
    { title: SECTION_TITLES.interconnections, level: 1 },
    { title: SECTION_TITLES.implementations, level: 1 },
  ];
  for (const family of document.families) {
    headings.push({ title: family.family, level: 2 });
  }
  headings.push({ title: SECTION_TITLES.appendix, level: 1 });
  return headings;
}

export function itemHeadingText(item: {
  displayId: string;
  title: string;
  itemKind: SspItemKind;
}): string {
  const title = item.title.trim() || item.displayId;
  if (item.itemKind === "grr") {
    return `General readiness requirement ${item.displayId} ${title}`.trim();
  }
  return `${item.displayId} ${title}`.trim();
}

export function assignmentCaption(kind: "assignment" | "additional-guidance"): string {
  return kind === "additional-guidance"
    ? "Sourced framework additional guidance"
    : "Sourced framework assignment";
}

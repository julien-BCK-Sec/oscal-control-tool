/**
 * Control Freak SSP layout `cf-ssp-docx` version 2.0.
 * Presentation structure only. Not canonical project data.
 *
 * Visual language follows the formal 09D SSP-addendum patterns (navy/steel
 * Calibri, Control Summary Information, solution response) without coupling
 * to IL4 delta population logic. FedRAMP Rev. 5 Word templates are structural
 * references only (ADR-035); this layout does not fill those files.
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

export const GENERATOR_NAME = "Control Freak";

export const LAYOUT_DISCLAIMER =
  "This is a Control Freak System Security Plan. It is not an official FedRAMP, DoD, CMMC, or authorization package.";

export const EVIDENCE_CAPTION =
  "Linked Evidence records (not independently assessed or validated).";

export const NO_LINKED_EVIDENCE_COPY =
  "[No linked Evidence records in Control Freak]";

export const CMMC_ORIGIN_LABEL = "NIST SP 800-171 Rev. 2 origin";

export const CONTROL_SUMMARY_BANNER = "Control Summary Information";

/** Navy used by the formal SSP heading styles. */
export const NAVY = "17365D";
/** Secondary heading blue. */
export const STEEL = "4F81BD";
/** Table-header fill. */
export const LABEL_FILL = "DBE5F1";
/** White / clear body for response answer cells. */
export const RESPONSE_BODY_FILL = "FFFFFF";
/** Warm band for source-conflict and authoritative-value warnings. */
export const WARNING_FILL = "FBF3D5";
export const RULE = "8DB3E2";
export const PLACEHOLDER_COLOR = "666666";
export const MUTED = "5C6770";

/** @deprecated Use LABEL_FILL. Kept for any residual gray-header references. */
export const HEADER_FILL = LABEL_FILL;
export const BORDER_COLOR = RULE;

export const SECTION_TITLES = {
  documentStatus: "Document Status and Generation Information",
  purpose: "1. Purpose and Scope",
  tableOfContents: "Table of Contents",
  identification: "2. System Identification and Description",
  boundary: "3. System Environment and Authorization Boundary",
  categorization: "4. Security Categorization and Information Types",
  roles: "5. System Roles and Responsibilities",
  interconnections: "6. System Interconnections",
  implementations: "7. Security Control Implementation",
  generation: "8. Supporting References and Generation Record",
} as const;

export const ITEM_KIND_LABELS: Record<SspItemKind, string> = {
  control: "Control",
  enhancement: "Control enhancement",
  requirement: "Requirement",
  grr: "General readiness requirement",
};

export const SCOPE_DEFERRALS = [
  "Leveraged FedRAMP-authorized service registers",
  "Marketplace-shaped tables of external systems lacking FedRAMP authorization",
  "Architecture, data-flow, and network diagrams",
  "Services, ports, and protocols inventories",
  "Cryptographic module tables",
  "Separation-of-duties matrices",
  "Approvals, signatures, and FedRAMP package appendices B through Q",
  "Per-control Responsible Role and Control Origination checkbox sets",
] as const;

export function solutionBanner(displayId: string): string {
  return `${displayId} What is the solution and how is it implemented?`;
}

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

export function implementationsIntroSentence(document: SspDocument): string {
  const items = document.identity.documentedAgainst.itemPlural;
  const frameworkTitle = document.identity.documentedAgainst.frameworkTitle;
  return `This section includes all selected ${items} from ${frameworkTitle}.`;
}

export function isDodCloudIl4Framework(document: SspDocument): boolean {
  return document.identity.documentedAgainst.frameworkId === "dod-cloud-il4-rev5";
}

export function purposeParagraphs(document: SspDocument): string[] {
  const frameworkTitle = document.identity.documentedAgainst.frameworkTitle;
  const itemPlural = document.identity.documentedAgainst.itemPlural;
  const paragraphs = [
    `This Control Freak System Security Plan documents the selected system against ${frameworkTitle}. Framework labeling uses the project's actual selected framework. It does not equate that framework with a FedRAMP Moderate authorization package and does not imply FedRAMP, DoD, or CMMC authorization.`,
    `The document presents available system characteristics and the full selected population of ${itemPlural}. Implementation narratives are the primary control responses. Parameter values, unresolved organization-defined parameters, source conflicts, and provenance notices remain visible and are not silently resolved.`,
    `Unsupported official FedRAMP package sections are not printed as empty tables. This version does not model: ${SCOPE_DEFERRALS.map((item) => item.charAt(0).toLowerCase() + item.slice(1)).join("; ")}.`,
  ];
  if (isDodCloudIl4Framework(document)) {
    paragraphs.push(
      "For DoD Cloud Impact Level 4 projects, this general SSP prints the full IL4 documentation population, including FedRAMP Moderate baseline items that are not reprinted in the separate Control Freak DoD IL4 SSP Addendum. The Addendum remains a delta companion export and does not replace this document.",
    );
  }
  return paragraphs;
}

export type TocHeading = {
  title: string;
  level: 1 | 2;
};

/**
 * Cached TOC entries for the Word TOC field. Omits the Table of Contents
 * heading itself so the field is not self-referential. The on-page TOC title
 * is rendered without a Heading style for the same reason.
 */
export function tocHeadings(document: SspDocument): TocHeading[] {
  const headings: TocHeading[] = [
    { title: SECTION_TITLES.documentStatus, level: 1 },
    { title: SECTION_TITLES.purpose, level: 1 },
    { title: SECTION_TITLES.identification, level: 1 },
    { title: SECTION_TITLES.boundary, level: 1 },
    { title: SECTION_TITLES.categorization, level: 1 },
    { title: SECTION_TITLES.roles, level: 1 },
    { title: SECTION_TITLES.interconnections, level: 1 },
    { title: SECTION_TITLES.implementations, level: 1 },
  ];
  for (const family of document.families) {
    headings.push({ title: family.family, level: 2 });
  }
  headings.push({ title: SECTION_TITLES.generation, level: 1 });
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

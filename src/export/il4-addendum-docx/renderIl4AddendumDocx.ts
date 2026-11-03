/**
 * Control Freak IL4 addendum DOCX renderer (cf-il4-addendum-docx 1.0).
 * Consumes the addendum view model only. Presentation does not resolve
 * parameters or decide which items are printed.
 *
 * Layout follows the historical IL4 SSP Addendum document language:
 * formal cover, Control Summary Information tables, and a solution/response
 * table as the primary authored answer. Rev. 5 content and Control Freak
 * provenance replace obsolete requirements, seals, and classification marks.
 */

import "server-only";

import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  HeightRule,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  type FileChild,
  type ITableCellBorders,
} from "docx";
import type { Il4AddendumDocument, Il4DetailedEntry, Il4DeltaGroup } from "@/il4-addendum";
import {
  completenessText,
  EMPTY_COLLECTION_COPY,
  type SspFrameworkAssignment,
  type SspFrameworkItem,
  type SspParameterResolution,
} from "@/ssp";
import {
  CONTROL_SUMMARY_BANNER,
  LABEL_FILL,
  MUTED,
  NAVY,
  STEEL,
  PLACEHOLDER_COLOR,
  RESPONSE_BODY_FILL,
  RULE,
  SECTION_TITLES,
  WARNING_FILL,
  familyHeading,
  headerSystemLabel,
  itemHeadingText,
  membershipHeading,
  solutionBanner,
  subgroupHeading,
  tocHeadings,
} from "./layout";

const PAGE_WIDTH_DXA = 12240;
const PAGE_HEIGHT_DXA = 15840;
const MARGIN_DXA = 1080;
const CONTENT_WIDTH_DXA = PAGE_WIDTH_DXA - MARGIN_DXA * 2;
const LABEL_WIDTH_DXA = 2700;
const VALUE_WIDTH_DXA = CONTENT_WIDTH_DXA - LABEL_WIDTH_DXA;
/** Minimum body height only when an implementation narrative is documented. */
const DOCUMENTED_RESPONSE_MIN_HEIGHT_DXA = 1080;

const CELL_BORDERS: ITableCellBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: RULE },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE },
  left: { style: BorderStyle.SINGLE, size: 4, color: RULE },
  right: { style: BorderStyle.SINGLE, size: 4, color: RULE },
};

const LABEL_SHADING = { type: ShadingType.CLEAR, fill: LABEL_FILL };
const WARNING_SHADING = { type: ShadingType.CLEAR, fill: WARNING_FILL };
const RESPONSE_BODY_SHADING = { type: ShadingType.CLEAR, fill: RESPONSE_BODY_FILL };

const UNRESOLVED_MARK =
  /(\[(?:Unresolved[^\]]*|Not yet documented:[^\]]*)\])/g;

function presentProse(text: string): string {
  return text.replace(
    /\[Unresolved ODP:\s*[^—\]]+?(?:\s*—\s*([^\]]+))?\]/g,
    (_match, label: string | undefined) => {
      const name = label?.trim();
      return name ? `[Unresolved: ${name}]` : "[Unresolved]";
    },
  );
}

function isUnresolvedFragment(text: string): boolean {
  return text.startsWith("[Unresolved") || text.startsWith("[Not yet documented:");
}

function runs(
  text: string,
  options?: { bold?: boolean; color?: string; size?: number; italics?: boolean },
): TextRun[] {
  const parts = text.split(UNRESOLVED_MARK).filter((part) => part.length > 0);
  const pieces = parts.length > 0 ? parts : [text];
  return pieces.map(
    (part) =>
      new TextRun({
        text: part,
        bold: options?.bold,
        italics: options?.italics || isUnresolvedFragment(part),
        color: isUnresolvedFragment(part) ? PLACEHOLDER_COLOR : options?.color,
        size: options?.size,
        font: "Calibri",
      }),
  );
}

function paragraph(
  text: string,
  options?: {
    after?: number;
    before?: number;
    bold?: boolean;
    color?: string;
    center?: boolean;
    size?: number;
    italics?: boolean;
  },
): Paragraph {
  return new Paragraph({
    alignment: options?.center ? AlignmentType.CENTER : undefined,
    spacing: { before: options?.before ?? 0, after: options?.after ?? 120 },
    children: runs(text, options),
  });
}

function proseParagraphs(
  text: string,
  options?: { after?: number; keepNext?: boolean },
): Paragraph[] {
  const lines = presentProse(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const parts = lines.length > 0 ? lines : [presentProse(text)];
  return parts.map(
    (line) =>
      new Paragraph({
        keepNext: options?.keepNext,
        spacing: { before: 0, after: options?.after ?? 80 },
        children: runs(line),
      }),
  );
}

function heading1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    keepNext: true,
    spacing: { before: 360, after: 140 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 12, color: NAVY, space: 4 },
    },
    children: [new TextRun({ text, bold: true, font: "Calibri", size: 32, color: NAVY })],
  });
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    keepNext: true,
    spacing: { before: 320, after: 100 },
    children: [new TextRun({ text, bold: true, font: "Calibri", size: 26, color: STEEL })],
  });
}

function heading3(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    keepNext: true,
    spacing: { before: 280, after: 80 },
    children: [new TextRun({ text, bold: true, font: "Calibri", size: 24, color: NAVY })],
  });
}

function cellParagraphs(
  text: string,
  options?: { bold?: boolean; color?: string },
): Paragraph[] {
  const parts = presentProse(text)
    .split(/\r?\n+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  const lines = parts.length > 0 ? parts : [""];
  return lines.map(
    (line) =>
      new Paragraph({
        spacing: { after: 40 },
        children: runs(line, options),
      }),
  );
}

function tableCell(
  children: readonly Paragraph[],
  options?: {
    width?: number;
    span?: number;
    shading?: { type: (typeof ShadingType)[keyof typeof ShadingType]; fill: string };
  },
): TableCell {
  return new TableCell({
    borders: CELL_BORDERS,
    width: { size: options?.width ?? VALUE_WIDTH_DXA, type: WidthType.DXA },
    columnSpan: options?.span,
    verticalAlign: VerticalAlign.TOP,
    shading: options?.shading,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: children.length > 0 ? [...children] : [new Paragraph("")],
  });
}

function textCell(
  text: string,
  options?: {
    width?: number;
    span?: number;
    header?: boolean;
    shading?: { type: (typeof ShadingType)[keyof typeof ShadingType]; fill: string };
  },
): TableCell {
  const shading = options?.shading ?? (options?.header ? LABEL_SHADING : undefined);
  return tableCell(cellParagraphs(text, { bold: options?.header, color: options?.header ? NAVY : undefined }), {
    width: options?.width,
    span: options?.span,
    shading,
  });
}

function pairTable(rows: ReadonlyArray<readonly [string, string]>): Table {
  return new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [LABEL_WIDTH_DXA, VALUE_WIDTH_DXA],
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          cantSplit: true,
          children: [
            textCell(label, { header: true, width: LABEL_WIDTH_DXA }),
            textCell(value, { width: VALUE_WIDTH_DXA }),
          ],
        }),
    ),
  });
}

function gridTable(headers: readonly string[], rows: readonly (readonly string[])[]): Table {
  const columnWidth = Math.floor(CONTENT_WIDTH_DXA / headers.length);
  const widths = headers.map(() => columnWidth);
  return new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: headers.map((header, index) =>
          textCell(header, { header: true, width: widths[index] }),
        ),
      }),
      ...rows.map(
        (row) =>
          new TableRow({
            cantSplit: true,
            children: row.map((value, index) => textCell(value, { width: widths[index] })),
          }),
      ),
    ],
  });
}

function summaryHeaderRow(id: string, banner: string): TableRow {
  return new TableRow({
    cantSplit: true,
    tableHeader: true,
    children: [
      textCell(id, { header: true, width: LABEL_WIDTH_DXA, shading: LABEL_SHADING }),
      textCell(banner, { header: true, width: VALUE_WIDTH_DXA, shading: LABEL_SHADING }),
    ],
  });
}

function controlSummaryTable(
  id: string,
  rows: ReadonlyArray<readonly [string, string]>,
): Table {
  return new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [LABEL_WIDTH_DXA, VALUE_WIDTH_DXA],
    rows: [
      summaryHeaderRow(id, CONTROL_SUMMARY_BANNER),
      ...rows.map(
        ([label, value]) =>
          new TableRow({
            cantSplit: true,
            children: [
              textCell(label, { header: true, width: LABEL_WIDTH_DXA }),
              textCell(value, { width: VALUE_WIDTH_DXA }),
            ],
          }),
      ),
    ],
  });
}

/**
 * One table for Control Summary Information plus the solution/response so Word
 * does not separate the answer from its summary across a page break.
 */
function controlEntryTable(
  id: string,
  rows: ReadonlyArray<readonly [string, string]>,
  body: readonly Paragraph[],
  options?: { documented?: boolean },
): Table {
  const documented = options?.documented === true;
  return new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [LABEL_WIDTH_DXA, VALUE_WIDTH_DXA],
    rows: [
      summaryHeaderRow(id, CONTROL_SUMMARY_BANNER),
      ...rows.map(
        ([label, value]) =>
          new TableRow({
            cantSplit: true,
            children: [
              textCell(label, { header: true, width: LABEL_WIDTH_DXA }),
              textCell(value, { width: VALUE_WIDTH_DXA }),
            ],
          }),
      ),
      new TableRow({
        cantSplit: true,
        children: [
          textCell(solutionBanner(id), {
            header: true,
            width: CONTENT_WIDTH_DXA,
            span: 2,
            shading: LABEL_SHADING,
          }),
        ],
      }),
      new TableRow({
        cantSplit: true,
        height: documented
          ? { value: DOCUMENTED_RESPONSE_MIN_HEIGHT_DXA, rule: HeightRule.ATLEAST }
          : undefined,
        children: [
          tableCell(body, {
            width: CONTENT_WIDTH_DXA,
            span: 2,
            shading: RESPONSE_BODY_SHADING,
          }),
        ],
      }),
    ],
  });
}

function warningTable(title: string, explanation: string): Table {
  return new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH_DXA],
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          tableCell(
            [
              new Paragraph({
                spacing: { after: 40 },
                children: runs(title, { bold: true, color: NAVY }),
              }),
            ],
            { width: CONTENT_WIDTH_DXA, shading: WARNING_SHADING },
          ),
        ],
      }),
      new TableRow({
        cantSplit: true,
        children: [
          tableCell(proseParagraphs(explanation, { after: 40 }), {
            width: CONTENT_WIDTH_DXA,
            shading: WARNING_SHADING,
          }),
        ],
      }),
    ],
  });
}

function gap(after = 140): Paragraph {
  return new Paragraph({ spacing: { after }, children: [new TextRun("")] });
}

function pageBreak(): Paragraph {
  return new Paragraph({ children: [new PageBreak()] });
}

function resolutionStateLabel(resolution: SspParameterResolution): string {
  if (resolution.state === "project-resolved") {
    return "Recorded by the project";
  }
  if (resolution.state === "framework-authoritative") {
    return "Framework value";
  }
  if (resolution.state === "accepted-baseline") {
    return "Permitted baseline value, accepted by the project";
  }
  switch (resolution.unresolvedReason) {
    case "authoritative-value-required":
      return "Unresolved — DoD assignment required";
    case "source-conflict":
      return "Unresolved — sources conflict; no value selected";
    case "organization-defined":
      return "Unresolved — not yet assigned";
    case "may-use-baseline":
      return "Unresolved — permitted value not accepted";
    case "control-level-unmapped":
      return "Unresolved at this insert. Any permitted or authoritative control-level value below is not mapped to this individual parameter.";
    default:
      return "Unresolved";
  }
}

function parameterName(resolution: SspParameterResolution): string {
  const label = resolution.label.trim();
  if (!label) {
    return "Organization-defined value";
  }
  if (/_odp\b/i.test(label) || /^[a-z]{1,4}-\d/i.test(label)) {
    return "Organization-defined value";
  }
  if (label.length > 72) {
    return label.startsWith("one or more of:")
      ? "Selection"
      : label.startsWith("one of:")
        ? "Selection"
        : "Organization-defined value";
  }
  return label;
}

function parameterValue(resolution: SspParameterResolution): string {
  const state = resolutionStateLabel(resolution);
  const raw = resolution.displayText ?? resolution.placeholder ?? "";
  const detail = presentProse(raw).trim();
  if (
    resolution.state === "project-resolved" ||
    resolution.state === "framework-authoritative" ||
    resolution.state === "accepted-baseline"
  ) {
    return detail || state;
  }
  if (!detail || detail === "[Unresolved]" || detail.startsWith("[Unresolved:")) {
    return state;
  }
  return `${state}. ${detail}`;
}

function isPermissionRestatement(text: string): boolean {
  return /^CSP\/CSO may use FedRAMP value\.?$/i.test(text.trim());
}

function assignmentLabel(assignment: SspFrameworkAssignment): string {
  if (assignment.classificationLabel === "DoD permits FedRAMP value") {
    if (assignment.sourceLabel.toLowerCase().includes("fedramp")) {
      return "Permitted FedRAMP value (control-level)";
    }
    return "DoD permission to use FedRAMP value (control-level)";
  }
  if (assignment.classificationLabel) {
    return assignment.classificationLabel;
  }
  if (assignment.sourceLabel === "DoD IL4") {
    return "DoD guidance";
  }
  if (assignment.kind === "additional-guidance") {
    return `${assignment.sourceLabel} guidance`;
  }
  return assignment.sourceLabel;
}

function shouldShowAssignment(
  entry: Il4DetailedEntry,
  assignment: SspFrameworkAssignment,
): boolean {
  // Permission restatement duplicates Table D-1 / assignment-source rows.
  if (isPermissionRestatement(assignment.text)) {
    return false;
  }
  if (assignment.sourceLabel === "DoD IL4") {
    return true;
  }
  if (assignment.classificationLabel) {
    return true;
  }
  // Keep conflicting FedRAMP prose when a source conflict is open.
  if (
    entry.item.notices.some((notice) => notice.kind === "source-conflict") &&
    assignment.sourceLabel.toLowerCase().includes("fedramp")
  ) {
    return true;
  }
  // Skip short FedRAMP alignment notes that only restate the requirement.
  if (assignment.kind === "additional-guidance") {
    return false;
  }
  return true;
}

function annotationRow(
  item: SspFrameworkItem,
  annotation: SspFrameworkItem["parameterAnnotations"][number],
): readonly [string, string] | null {
  if (annotation.kind === "orphan") {
    return null;
  }
  const resolution = item.parameterResolutions.find((row) => row.id === annotation.parameterId);
  const name = resolution ? parameterName(resolution) : "Organization-defined value";
  const prefix = `Parameter ${annotation.parameterId}: `;
  let body = annotation.text.startsWith(prefix)
    ? annotation.text.slice(prefix.length)
    : annotation.text.replaceAll(annotation.parameterId, name);
  body = body
    .replaceAll(annotation.parameterId, name)
    .replaceAll("this ODP", "this part of the requirement")
    .replaceAll(
      "This project documentation is not used to resolve the insert while overlay mapping remains control-level.",
      "This project note is not used as the requirement value.",
    )
    .replace(
      /the organization recorded how it proceeded\./i,
      "The organization recorded how it proceeded.",
    )
    .trim();
  const title =
    annotation.kind === "project-documentation"
      ? "Project note (not the requirement value)"
      : annotation.kind === "dspav-assertion"
        ? "Project assertion (not independently verified)"
        : annotation.kind === "conflict-proceeding"
          ? "Project proceeding (conflict remains unresolved)"
          : annotation.kind === "documented-deviation"
            ? "Operational note (does not replace the requirement value)"
            : annotation.kind === "permitted-baseline-available"
              ? "Permitted value (not accepted)"
              : annotation.title;
  return [title, `Applies to ${name}: ${body}`];
}

function evidenceSummary(item: SspFrameworkItem): string {
  if (item.evidenceReferences.length === 0) {
    return "No linked evidence recorded.";
  }
  return item.evidenceReferences
    .map((row) => {
      const date = row.collectionDate ?? "[Not yet documented: Collection date]";
      return `${row.title} (${row.evidenceTypeLabel}; ${row.lifecycleStatusLabel}; ${date})`;
    })
    .join("\n");
}

function baselineCell(entry: Il4DetailedEntry): string {
  if (entry.group === "grr") {
    return "DoD General Readiness Requirement";
  }
  if (!entry.inFedrampModerate) {
    return "Not present in the FedRAMP Moderate baseline";
  }
  return "Present in FedRAMP Moderate; Table D-1 parameter adjustment";
}

function assignmentSource(entry: Il4DetailedEntry): string | null {
  if (entry.effectiveAssignmentSource === "dod-ssp-addendum-v1.2") {
    return "DoD Rev. 5 SSP Addendum";
  }
  if (entry.effectiveAssignmentSource === "fedramp-moderate-baseline") {
    return "FedRAMP Moderate baseline (DoD permission does not mean DoD authored it)";
  }
  return null;
}

function summaryRows(entry: Il4DetailedEntry): Array<readonly [string, string]> {
  const item = entry.item;
  const rows: Array<readonly [string, string]> = [
    ["Implementation status", item.implementationDocumentationStatus.label],
    ["Baseline relationship", baselineCell(entry)],
  ];
  if (entry.tableD1AdjustmentLabel) {
    rows.push(["Table D-1", entry.tableD1AdjustmentLabel]);
  }
  const source = assignmentSource(entry);
  if (source) {
    rows.push(["Assignment source", source]);
  }
  for (const resolution of item.parameterResolutions) {
    rows.push([`Parameter: ${parameterName(resolution)}`, parameterValue(resolution)]);
  }
  for (const assignment of item.frameworkAssignments) {
    if (!shouldShowAssignment(entry, assignment)) {
      continue;
    }
    rows.push([assignmentLabel(assignment), assignment.text]);
  }
  for (const supplement of item.supplements) {
    rows.push([supplement.sourceLabel, supplement.text]);
  }
  for (const annotation of item.parameterAnnotations) {
    const row = annotationRow(item, annotation);
    if (row) {
      rows.push(row);
    }
  }
  rows.push(["Linked evidence", evidenceSummary(item)]);
  return rows;
}

function noticeExplanation(text: string): string {
  return text
    .replace(" or computed an effective assignment", "")
    .replace(/\s+/g, " ")
    .trim();
}

function entryChildren(entry: Il4DetailedEntry): FileChild[] {
  const item = entry.item;
  const documented = item.implementationNarrative.kind === "documented";
  const children: FileChild[] = [
    heading3(itemHeadingText(entry)),
    // keepNext chains the requirement into the following notice/entry table
    // so Word does not orphan the control heading on a prior page.
    ...proseParagraphs(item.sourceStatement, { after: 80, keepNext: true }),
  ];
  for (const notice of item.notices) {
    children.push(warningTable(notice.title, noticeExplanation(notice.explanation)));
  }
  children.push(
    controlEntryTable(
      item.displayId,
      summaryRows(entry),
      proseParagraphs(completenessText(item.implementationNarrative), { after: 60 }),
      { documented },
    ),
    gap(160),
  );
  return children;
}

function documentHeader(document: Il4AddendumDocument): Header {
  return new Header({
    children: [
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 12, color: NAVY, space: 1 },
        },
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: "System Security Plan Addendum",
            font: "Calibri",
            size: 18,
            bold: true,
            color: NAVY,
          }),
          new TextRun({
            text: `\t${headerSystemLabel(document)}`,
            font: "Calibri",
            size: 18,
            color: MUTED,
          }),
        ],
        tabStops: [{ type: "right", position: CONTENT_WIDTH_DXA }],
      }),
    ],
  });
}

function documentFooter(document: Il4AddendumDocument): Footer {
  return new Footer({
    children: [
      new Paragraph({
        border: {
          top: { style: BorderStyle.SINGLE, size: 12, color: NAVY, space: 6 },
        },
        children: [
          new TextRun({
            text: "System Security Plan Addendum",
            font: "Calibri",
            size: 16,
            color: MUTED,
          }),
          new TextRun({
            text: `  ·  Generated by ${document.identity.generator}  ·  Page `,
            font: "Calibri",
            size: 16,
            color: MUTED,
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: "Calibri",
            size: 16,
            color: MUTED,
          }),
        ],
      }),
    ],
  });
}

function coverChildren(document: Il4AddendumDocument): FileChild[] {
  const identity = document.identity;
  return [
    new Paragraph({
      spacing: { before: 720, after: 120 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "DoD Addendum to the FedRAMP Moderate System Security Plan",
          bold: true,
          font: "Calibri",
          size: 36,
          color: NAVY,
        }),
      ],
    }),
    paragraph("Information Impact Level 4", {
      center: true,
      bold: true,
      size: 28,
      color: STEEL,
      after: 60,
    }),
    paragraph("System Security Plan Addendum", {
      center: true,
      bold: true,
      size: 26,
      color: NAVY,
      after: 280,
    }),
    pairTable([
      ["Information system name", completenessText(identity.systemName)],
      ["Short name", completenessText(identity.systemNameShort)],
      ["System identifier", completenessText(identity.systemIdentifier)],
      ["SSP organization", completenessText(identity.sspOrganization)],
      ["Framework", identity.frameworkTitle],
      ["Generated", identity.generatedAt],
      ["Prepared with", identity.generator],
    ]),
    gap(200),
    paragraph(document.coverDisclaimer, { after: 80, size: 18, color: MUTED }),
    pageBreak(),
  ];
}

function statusChildren(document: Il4AddendumDocument): FileChild[] {
  const identity = document.identity;
  return [
    heading1(SECTION_TITLES.documentStatus),
    paragraph(
      "This document reflects information recorded in Control Freak at generation time. Missing information uses placeholders. Empty collections mean the topic has not been documented, not that nothing exists.",
    ),
    paragraph(
      "Framework selection identifies the documentation baseline. It is not evidence of certification, assessment, authorization, an Authority to Operate, or a DoD Provisional Authorization.",
    ),
    pairTable([
      ["Document", identity.documentTitle],
      ["Generator", identity.generator],
      ["Layout", `${identity.layoutId} ${identity.layoutVersion}`],
      ["Generated", identity.generatedAt],
      ["Project revision", String(identity.projectRevision)],
      ["Framework", identity.frameworkId],
    ]),
    gap(),
  ];
}

function tocChildren(document: Il4AddendumDocument): FileChild[] {
  return [
    heading1(SECTION_TITLES.tableOfContents),
    paragraph(
      "Word refreshes this table of contents when the document is opened. Page numbers are not stored as a substitute for that refresh. The sections below are complete without it.",
    ),
    new TableOfContents("Table of contents", {
      hyperlink: true,
      headingStyleRange: "1-2",
      beginDirty: true,
      cachedEntries: tocHeadings(document),
    }),
    pageBreak(),
  ];
}

function purposeChildren(document: Il4AddendumDocument): FileChild[] {
  return [
    heading1(SECTION_TITLES.purpose),
    paragraph(document.scopeStatement),
    paragraph(document.omissionsStatement),
  ];
}

function sourceChildren(document: Il4AddendumDocument): FileChild[] {
  return [
    heading1(SECTION_TITLES.sources),
    paragraph(
      "Requirements in this addendum come from the pinned sources below through the Control Freak IL4 framework. Source hashes are recorded in the generation record.",
    ),
    gridTable(
      ["Title", "Publisher", "Version"],
      document.sources.map((source) => [source.title, source.publisher, source.version]),
    ),
    gap(),
  ];
}

function identificationChildren(document: Il4AddendumDocument): FileChild[] {
  return [
    heading1(SECTION_TITLES.identification),
    pairTable([
      ["Information system name", completenessText(document.identity.systemName)],
      ["Short name", completenessText(document.identity.systemNameShort)],
      ["System identifier", completenessText(document.identity.systemIdentifier)],
      ["SSP organization", completenessText(document.identity.sspOrganization)],
      ["Operational status", completenessText(document.systemOverview.operationalStatus)],
      [
        "Operational status remarks",
        completenessText(document.systemOverview.operationalStatusRemarks),
      ],
      ["Description and purpose", completenessText(document.systemOverview.overview)],
    ]),
    gap(),
  ];
}

function boundaryChildren(document: Il4AddendumDocument): FileChild[] {
  return [
    heading1(SECTION_TITLES.boundary),
    pairTable([
      [
        "Authorization boundary",
        completenessText(document.boundaryAndEnvironment.authorizationBoundary),
      ],
      [
        "Environment of operation",
        completenessText(document.boundaryAndEnvironment.environmentOfOperation),
      ],
    ]),
    gap(),
  ];
}

function categorizationChildren(document: Il4AddendumDocument): FileChild[] {
  const children: FileChild[] = [heading1(SECTION_TITLES.categorization)];
  if (document.informationTypes.collection === "not-documented") {
    children.push(paragraph(EMPTY_COLLECTION_COPY.informationTypes));
  } else {
    children.push(
      gridTable(
        ["Title", "Description", "Confidentiality", "Integrity", "Availability"],
        document.informationTypes.rows.map((row) => [
          completenessText(row.title),
          completenessText(row.description),
          completenessText(row.confidentiality),
          completenessText(row.integrity),
          completenessText(row.availability),
        ]),
      ),
      gap(),
    );
  }
  const derived = document.categorization.derivedOverallImpact;
  const rows: Array<readonly [string, string]> = [
    ["Confidentiality", completenessText(document.categorization.confidentiality)],
    ["Integrity", completenessText(document.categorization.integrity)],
    ["Availability", completenessText(document.categorization.availability)],
    ["Categorization rationale", completenessText(document.categorization.rationale)],
  ];
  if (derived) {
    rows.push(["Derived overall impact", derived.label]);
  }
  rows.push([
    "DoD cloud impact level",
    completenessText(document.categorization.dodCloudImpactLevel),
  ]);
  children.push(
    paragraph(
      "Security categorization is project-authored. Selecting the IL4 framework does not fill these values.",
    ),
    pairTable(rows),
    gap(),
  );
  if (derived) {
    children.push(paragraph(derived.derivationNote));
  }
  return children;
}

function rolesChildren(document: Il4AddendumDocument): FileChild[] {
  const children: FileChild[] = [heading1(SECTION_TITLES.roles)];
  if (document.roles.collection === "not-documented") {
    children.push(paragraph(EMPTY_COLLECTION_COPY.roles));
    return children;
  }
  children.push(
    gridTable(
      ["Role", "Name", "Title", "Organization", "Email", "Phone"],
      document.roles.rows.map((row) => [
        row.roleLabel,
        completenessText(row.name),
        completenessText(row.title),
        completenessText(row.organization),
        completenessText(row.email),
        completenessText(row.phone),
      ]),
    ),
    gap(),
  );
  return children;
}

function interconnectionsChildren(document: Il4AddendumDocument): FileChild[] {
  const children: FileChild[] = [heading1(SECTION_TITLES.interconnections)];
  if (document.interconnections.collection === "not-documented") {
    children.push(paragraph(EMPTY_COLLECTION_COPY.interconnections));
    return children;
  }
  children.push(
    gridTable(
      ["Name", "External organization", "Purpose", "Information exchanged", "Direction", "Security notes"],
      document.interconnections.rows.map((row) => [
        completenessText(row.name),
        completenessText(row.organization),
        completenessText(row.purpose),
        completenessText(row.informationExchanged),
        completenessText(row.direction),
        completenessText(row.securityNotes),
      ]),
    ),
    gap(),
  );
  return children;
}

function populationChildren(document: Il4AddendumDocument): FileChild[] {
  const counts = document.population;
  return [
    heading1(SECTION_TITLES.population),
    paragraph(document.populationExplanation),
    gridTable(
      ["Category", "Count"],
      [
        ["Detailed DoD General Requirements", String(counts.detailedGrrCount)],
        ["Detailed NIST controls/enhancements", String(counts.detailedNistCount)],
        ["Detailed items", String(counts.detailedItemCount)],
        ["Membership note only", String(counts.membershipNoteCount)],
        ["FedRAMP Moderate items not reprinted", String(counts.notReprintedCount)],
        ["Total IL4 authoring population", String(counts.totalFrameworkItems)],
      ],
    ),
    gap(),
    paragraph(
      `${counts.detailedItemCount} + ${counts.membershipNoteCount} + ${counts.notReprintedCount} = ${counts.totalFrameworkItems}`,
    ),
  ];
}

function grrChildren(document: Il4AddendumDocument): FileChild[] {
  const children: FileChild[] = [
    pageBreak(),
    heading1(SECTION_TITLES.grrs),
    paragraph(
      "Each entry is a DoD General Readiness Requirement. The requirement states the question. Control Summary Information records documentation status and evidence. The solution table is the project's implementation response. Status is documentation status, not an assessment result.",
    ),
  ];
  for (const entry of document.grrs) {
    children.push(...entryChildren(entry));
  }
  return children;
}

function partitionFamilyEntries(entries: readonly Il4DetailedEntry[]): {
  additional: Il4DetailedEntry[];
  enhanced: Il4DetailedEntry[];
} {
  const additional: Il4DetailedEntry[] = [];
  const enhanced: Il4DetailedEntry[] = [];
  for (const entry of entries) {
    if (entry.group === "nist-not-in-fedramp-moderate") {
      additional.push(entry);
    } else {
      enhanced.push(entry);
    }
  }
  return { additional, enhanced };
}

function emitFamilySubgroup(
  children: FileChild[],
  familyLabel: string,
  group: Extract<
    Il4DeltaGroup,
    "nist-not-in-fedramp-moderate" | "fedramp-moderate-table-d1-adjustment"
  >,
  entries: readonly Il4DetailedEntry[],
  showSubheading: boolean,
): void {
  if (entries.length === 0) {
    return;
  }
  if (showSubheading) {
    children.push(heading3(subgroupHeading(familyLabel, group)));
  }
  for (const entry of entries) {
    children.push(...entryChildren(entry));
  }
}

function nistChildren(document: Il4AddendumDocument): FileChild[] {
  const children: FileChild[] = [
    pageBreak(),
    heading1(SECTION_TITLES.nistDelta),
    paragraph(
      "This section records NIST controls and enhancements that are not in the FedRAMP Moderate baseline, and FedRAMP Moderate controls with a Table D-1 parameter adjustment. Families follow the historical Additional controls / Enhanced parameters grouping. The solution table is the project's implementation response.",
    ),
  ];
  for (const family of document.nistFamilies) {
    const label = familyHeading(family.family, family.entries);
    const { additional, enhanced } = partitionFamilyEntries(family.entries);
    children.push(heading2(label));
    const showSubheading = additional.length > 0 && enhanced.length > 0;
    emitFamilySubgroup(
      children,
      label,
      "nist-not-in-fedramp-moderate",
      additional,
      showSubheading || additional.length > 0,
    );
    emitFamilySubgroup(
      children,
      label,
      "fedramp-moderate-table-d1-adjustment",
      enhanced,
      showSubheading || enhanced.length > 0,
    );
  }
  for (const note of document.membershipNotes) {
    children.push(
      heading2(membershipHeading(note.displayId)),
      new Paragraph({
        keepNext: true,
        spacing: { after: 100 },
        children: runs(note.explanation),
      }),
      controlSummaryTable(note.displayId, [
        ["Title", note.title],
        ["Family", note.family],
        ["FedRAMP Moderate", "Already present"],
        ["Table D-1", "Inclusion only"],
      ]),
      gap(160),
    );
  }
  return children;
}

function parameterChildren(document: Il4AddendumDocument): FileChild[] {
  return [
    pageBreak(),
    heading1(SECTION_TITLES.parameters),
    paragraph(
      "These notes apply to every control and requirement above. They are not repeated on each entry.",
    ),
    ...document.parameterReadingNotes.map((note) => paragraph(note)),
  ];
}

function generationChildren(document: Il4AddendumDocument): FileChild[] {
  return [
    heading1(SECTION_TITLES.generation),
    ...document.generationNotes.map((note) => paragraph(note)),
    paragraph(
      "Linked Evidence records are documentation references. They have not been independently assessed or validated merely because they are linked.",
    ),
    gap(),
    gridTable(
      ["Source", "SHA-256"],
      document.sources.map((source) => [source.title, source.sha256]),
    ),
    gap(),
    pairTable([
      ["Layout", `${document.identity.layoutId} ${document.identity.layoutVersion}`],
      ["Project id", document.identity.projectId],
      ["Project revision", String(document.identity.projectRevision)],
      ["Schema version", String(document.identity.projectSchemaVersion)],
    ]),
  ];
}

export async function renderIl4AddendumDocx(
  document: Il4AddendumDocument,
): Promise<Buffer> {
  const systemName =
    document.identity.systemName.kind === "documented"
      ? document.identity.systemName.text
      : document.identity.documentTitle;
  const file = new Document({
    creator: "Control Freak",
    title: systemName,
    description: document.identity.documentTitle,
    subject: `${document.identity.frameworkTitle} (${document.identity.frameworkId})`,
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          paragraph: {
            spacing: { before: 360, after: 140 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 12, color: NAVY, space: 4 },
            },
          },
          run: { font: "Calibri", size: 32, bold: true, color: NAVY },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          paragraph: { spacing: { before: 320, after: 100 } },
          run: { font: "Calibri", size: 26, bold: true, color: STEEL },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          paragraph: { spacing: { before: 280, after: 80 } },
          run: { font: "Calibri", size: 24, bold: true, color: NAVY },
        },
      ],
    },
    features: { updateFields: true },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH_DXA, height: PAGE_HEIGHT_DXA },
            margin: {
              top: MARGIN_DXA,
              right: MARGIN_DXA,
              bottom: MARGIN_DXA,
              left: MARGIN_DXA,
              header: 720,
              footer: 720,
            },
          },
        },
        headers: { default: documentHeader(document) },
        footers: { default: documentFooter(document) },
        children: [
          ...coverChildren(document),
          ...statusChildren(document),
          ...tocChildren(document),
          ...purposeChildren(document),
          ...sourceChildren(document),
          ...identificationChildren(document),
          ...boundaryChildren(document),
          ...categorizationChildren(document),
          ...rolesChildren(document),
          ...interconnectionsChildren(document),
          ...populationChildren(document),
          ...grrChildren(document),
          ...nistChildren(document),
          ...parameterChildren(document),
          ...generationChildren(document),
        ],
      },
    ],
  });
  return Packer.toBuffer(file);
}

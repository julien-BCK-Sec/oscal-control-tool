/**
 * Control Freak IL4 addendum DOCX renderer (cf-il4-addendum-docx 1.0).
 * Consumes the addendum view model only. Presentation does not resolve
 * parameters or decide which items are printed.
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
import type { Il4AddendumDocument, Il4DetailedEntry } from "@/il4-addendum";
import {
  completenessText,
  EMPTY_COLLECTION_COPY,
  type SspFrameworkAssignment,
  type SspFrameworkItem,
  type SspParameterResolution,
} from "@/ssp";
import {
  LABEL_FILL,
  MUTED,
  NAVY,
  STEEL,
  PLACEHOLDER_COLOR,
  RESPONSE_FILL,
  RULE,
  SECTION_TITLES,
  WARNING_FILL,
  headerSystemLabel,
  itemHeadingText,
  membershipHeading,
  tocHeadings,
} from "./layout";

const PAGE_WIDTH_DXA = 12240;
const PAGE_HEIGHT_DXA = 15840;
const MARGIN_DXA = 1440;
const CONTENT_WIDTH_DXA = PAGE_WIDTH_DXA - MARGIN_DXA * 2;
const LABEL_WIDTH_DXA = 2880;
const VALUE_WIDTH_DXA = CONTENT_WIDTH_DXA - LABEL_WIDTH_DXA;

const CELL_BORDERS: ITableCellBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: RULE },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE },
  left: { style: BorderStyle.SINGLE, size: 4, color: RULE },
  right: { style: BorderStyle.SINGLE, size: 4, color: RULE },
};

const LABEL_SHADING = { type: ShadingType.CLEAR, fill: LABEL_FILL };
const RESPONSE_SHADING = { type: ShadingType.CLEAR, fill: RESPONSE_FILL };
const WARNING_SHADING = { type: ShadingType.CLEAR, fill: WARNING_FILL };

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

function proseParagraphs(text: string): Paragraph[] {
  const lines = presentProse(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const parts = lines.length > 0 ? lines : [presentProse(text)];
  return parts.map((line) => paragraph(line, { after: 80 }));
}

function heading1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    keepNext: true,
    spacing: { before: 360, after: 140 },
    children: [new TextRun({ text, bold: true, font: "Calibri", size: 32, color: NAVY })],
  });
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    keepNext: true,
    spacing: { before: 280, after: 100 },
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
    .split(/\n+/)
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

function bannerTable(
  id: string,
  banner: string,
  body: readonly Paragraph[],
  options?: { response?: boolean },
): Table {
  const headerFill = options?.response ? RESPONSE_SHADING : LABEL_SHADING;
  return new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [LABEL_WIDTH_DXA, VALUE_WIDTH_DXA],
    rows: [
      new TableRow({
        cantSplit: true,
        tableHeader: true,
        children: [
          textCell(id, { header: true, width: LABEL_WIDTH_DXA, shading: headerFill }),
          textCell(banner, { header: true, width: VALUE_WIDTH_DXA, shading: headerFill }),
        ],
      }),
      new TableRow({
        height: options?.response ? { value: 1400, rule: HeightRule.ATLEAST } : undefined,
        children: [
          tableCell(body, {
            width: CONTENT_WIDTH_DXA,
            span: 2,
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
              ...proseParagraphs(explanation),
            ],
            { width: CONTENT_WIDTH_DXA, shading: WARNING_SHADING },
          ),
        ],
      }),
    ],
  });
}

function gap(): Paragraph {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun("")] });
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
      return "Unresolved — not applied to this part of the requirement";
    default:
      return "Unresolved";
  }
}

function parameterName(resolution: SspParameterResolution): string {
  const label = resolution.label.trim();
  if (label && !/_odp\b/i.test(label) && !/^[a-z]{1,4}-\d/i.test(label)) {
    return label;
  }
  return "Organization-defined value";
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

function assignmentLabel(assignment: SspFrameworkAssignment): string {
  if (assignment.kind === "additional-guidance") {
    return `Additional guidance — ${assignment.sourceLabel}`;
  }
  return assignment.classificationLabel ?? assignment.sourceLabel;
}

function assignmentSource(entry: Il4DetailedEntry): string | null {
  if (entry.effectiveAssignmentSource === "dod-ssp-addendum-v1.2") {
    return "DoD Rev. 5 SSP Addendum";
  }
  if (entry.effectiveAssignmentSource === "fedramp-moderate-baseline") {
    return "FedRAMP Moderate baseline. DoD permission to use that value does not mean DoD authored it.";
  }
  return null;
}

function annotationRow(
  item: SspFrameworkItem,
  annotation: SspFrameworkItem["parameterAnnotations"][number],
): readonly [string, string] {
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
    );
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
              : annotation.kind === "orphan"
                ? "Project record outside the current framework"
                : annotation.title;
  return [title, `${name}. ${body}`];
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
  return "Present in the FedRAMP Moderate baseline. Table D-1 records a parameter adjustment.";
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
    rows.push([parameterName(resolution), parameterValue(resolution)]);
  }
  for (const assignment of item.frameworkAssignments) {
    rows.push([assignmentLabel(assignment), assignment.text]);
  }
  for (const supplement of item.supplements) {
    rows.push([supplement.sourceLabel, supplement.text]);
  }
  for (const annotation of item.parameterAnnotations) {
    rows.push(annotationRow(item, annotation));
  }
  rows.push(["Linked evidence", evidenceSummary(item)]);
  return rows;
}

function entryChildren(entry: Il4DetailedEntry): FileChild[] {
  const item = entry.item;
  const summaryBanner = entry.group === "grr" ? "Requirement summary" : "Control summary";
  const children: FileChild[] = [
    heading3(itemHeadingText(entry)),
    bannerTable(item.displayId, "Requirement", proseParagraphs(item.sourceStatement)),
    gap(),
  ];
  for (const notice of item.notices) {
    children.push(
      warningTable(
        notice.title,
        notice.explanation.replace(" or computed an effective assignment", ""),
      ),
      gap(),
    );
  }
  children.push(summaryTable(item.displayId, summaryBanner, summaryRows(entry)), gap());
  children.push(
    bannerTable(
      item.displayId,
      "Implementation response",
      proseParagraphs(completenessText(item.implementationNarrative)),
      { response: true },
    ),
    gap(),
  );
  return children;
}

function summaryTable(
  id: string,
  banner: string,
  rows: ReadonlyArray<readonly [string, string]>,
): Table {
  return new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [LABEL_WIDTH_DXA, VALUE_WIDTH_DXA],
    rows: [
      new TableRow({
        cantSplit: true,
        tableHeader: true,
        children: [
          textCell(id, { header: true, width: LABEL_WIDTH_DXA }),
          textCell(banner, { header: true, width: VALUE_WIDTH_DXA }),
        ],
      }),
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

function documentHeader(document: Il4AddendumDocument): Header {
  return new Header({
    children: [
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY, space: 1 },
        },
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: `${headerSystemLabel(document)} SSP Addendum`,
            font: "Calibri",
            size: 18,
            color: NAVY,
          }),
        ],
      }),
    ],
  });
}

function documentFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        border: {
          top: { style: BorderStyle.SINGLE, size: 8, color: NAVY, space: 6 },
        },
        children: [
          new TextRun({
            text: "System Security Plan Addendum",
            font: "Calibri",
            size: 16,
            color: MUTED,
          }),
          new TextRun({
            text: "  ·  Generated by Control Freak  ·  Page ",
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
      spacing: { before: 560, after: 80 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "System Security Plan Addendum",
          bold: true,
          font: "Calibri",
          size: 40,
          color: NAVY,
        }),
      ],
    }),
    paragraph("Information Impact Level 4", {
      center: true,
      bold: true,
      size: 28,
      color: STEEL,
      after: 80,
    }),
    paragraph(identity.documentTitle, {
      center: true,
      size: 22,
      color: NAVY,
      after: 280,
    }),
    pairTable([
      ["Information system name", completenessText(identity.systemName)],
      ["Short name", completenessText(identity.systemNameShort)],
      ["System identifier", completenessText(identity.systemIdentifier)],
      ["SSP organization", completenessText(identity.sspOrganization)],
      ["Framework", identity.frameworkTitle],
    ]),
    gap(),
    paragraph(document.coverDisclaimer, { after: 80 }),
    pageBreak(),
  ];
}

function statusChildren(document: Il4AddendumDocument): FileChild[] {
  const identity = document.identity;
  return [
    heading1(SECTION_TITLES.documentStatus),
    ...document.completenessParagraphs.map((line) => paragraph(line)),
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
      "Requirements in this addendum are taken from the pinned sources below, through the Control Freak IL4 framework built from them.",
    ),
    ...document.sources.flatMap((source) => [
      pairTable([
        ["Title", source.title],
        ["Publisher", source.publisher],
        ["Version", source.version],
        ["SHA-256", source.sha256],
      ]),
      gap(),
    ]),
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
      "Each entry is a DoD General Readiness Requirement. The requirement states the question. The implementation response is the project's documentation of how it is met. Implementation status is the project's documentation status. It is not an assessment result or an authorization decision.",
    ),
  ];
  for (const entry of document.grrs) {
    children.push(...entryChildren(entry));
  }
  return children;
}

function nistChildren(document: Il4AddendumDocument): FileChild[] {
  const children: FileChild[] = [
    pageBreak(),
    heading1(SECTION_TITLES.nistDelta),
    paragraph(
      "This section records NIST controls and enhancements that are not in the FedRAMP Moderate baseline, and FedRAMP Moderate controls with a Table D-1 parameter adjustment. The requirement is the authoritative control statement. The implementation response is the project's documentation. Implementation status is not an assessment result.",
    ),
    paragraph(
      "Where an Addendum column marks an item as leveraged from FedRAMP Moderate, that mark is provenance only. It is not the population rule and it is not a leveraged authorization.",
    ),
  ];
  for (const family of document.nistFamilies) {
    children.push(heading2(family.family));
    for (const entry of family.entries) {
      children.push(...entryChildren(entry));
    }
  }
  for (const note of document.membershipNotes) {
    children.push(
      heading2(membershipHeading(note.displayId)),
      paragraph(note.explanation),
      pairTable([
        ["Identifier", note.displayId],
        ["Title", note.title],
        ["Family", note.family],
        ["FedRAMP Moderate", "Already present"],
        ["Table D-1", "Inclusion only"],
      ]),
      gap(),
    );
  }
  return children;
}

function parameterChildren(document: Il4AddendumDocument): FileChild[] {
  return [
    heading1(SECTION_TITLES.parameters),
    paragraph(
      "The notes in this section apply to every control and requirement above. They are not repeated on each entry.",
    ),
    ...document.parameterReadingNotes.map((note) => paragraph(note)),
  ];
}

function generationChildren(document: Il4AddendumDocument): FileChild[] {
  return [
    heading1(SECTION_TITLES.generation),
    ...document.generationNotes.map((note) => paragraph(note)),
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
          paragraph: { spacing: { before: 360, after: 140 } },
          run: { font: "Calibri", size: 32, bold: true, color: NAVY },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          paragraph: { spacing: { before: 280, after: 100 } },
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
        footers: { default: documentFooter() },
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

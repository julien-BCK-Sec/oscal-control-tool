/**
 * Control Freak SSP DOCX renderer (cf-ssp-docx 2.0).
 * Consumes the SSP document/view model only. Does not decide security semantics.
 *
 * Presentation follows ADR-035: formal cover, Control Summary Information,
 * and solution/response rhythm informed by FedRAMP Rev. 5 conventions and
 * 09D patterns, without filling official templates or IL4 delta coupling.
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
import {
  completenessText,
  EMPTY_COLLECTION_COPY,
  type SspCompleteness,
  type SspDocument,
  type SspFrameworkItem,
  type SspParameterResolution,
} from "@/ssp";
import {
  assignmentCaption,
  CMMC_ORIGIN_LABEL,
  CONTROL_SUMMARY_BANNER,
  documentedAgainstLine,
  documentationCompletenessSentence,
  EVIDENCE_CAPTION,
  footerCopy,
  GENERATOR_NAME,
  headerSystemLabel,
  implementationsIntroSentence,
  ITEM_KIND_LABELS,
  itemHeadingText,
  LABEL_FILL,
  LAYOUT_DISCLAIMER,
  MUTED,
  NAVY,
  NO_LINKED_EVIDENCE_COPY,
  PLACEHOLDER_COLOR,
  purposeParagraphs,
  RESPONSE_BODY_FILL,
  RULE,
  SECTION_TITLES,
  solutionBanner,
  STEEL,
  tocHeadings,
  WARNING_FILL,
} from "./layout";

const PAGE_WIDTH_DXA = 12240;
const PAGE_HEIGHT_DXA = 15840;
const MARGIN_DXA = 1080;
const CONTENT_WIDTH_DXA = PAGE_WIDTH_DXA - MARGIN_DXA * 2;
const LABEL_WIDTH_DXA = 2700;
const VALUE_WIDTH_DXA = CONTENT_WIDTH_DXA - LABEL_WIDTH_DXA;
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
  /(\[(?:Unresolved[^\]]*|Not yet documented:[^\]]*|No linked Evidence[^\]]*)\])/g;

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
  return (
    text.startsWith("[Unresolved") ||
    text.startsWith("[Not yet documented:") ||
    text.startsWith("[No linked Evidence")
  );
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
    keepNext?: boolean;
  },
): Paragraph {
  return new Paragraph({
    alignment: options?.center ? AlignmentType.CENTER : undefined,
    keepNext: options?.keepNext,
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

function heading4(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_4,
    keepNext: true,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, font: "Calibri", size: 22, color: STEEL })],
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
  return tableCell(
    cellParagraphs(text, { bold: options?.header, color: options?.header ? NAVY : undefined }),
    {
      width: options?.width,
      span: options?.span,
      shading,
    },
  );
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

/**
 * Keep the solution banner in the same table row/cell as the start of the
 * implementation narrative so Word cannot orphan the banner alone at a page
 * break.
 */
function controlEntryTable(
  id: string,
  rows: ReadonlyArray<readonly [string, string]>,
  body: readonly Paragraph[],
  options?: { documented?: boolean },
): Table {
  const documented = options?.documented === true;
  const responseBody: Paragraph[] = [
    new Paragraph({
      spacing: { after: 80 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 8, color: RULE, space: 4 },
      },
      children: runs(solutionBanner(id), { bold: true, color: NAVY }),
    }),
    ...body,
  ];
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
        height: documented
          ? { value: DOCUMENTED_RESPONSE_MIN_HEIGHT_DXA, rule: HeightRule.ATLEAST }
          : undefined,
        children: [
          tableCell(responseBody, {
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

function completenessParagraph(label: string, value: SspCompleteness): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, font: "Calibri" }),
      ...runs(completenessText(value)),
    ],
  });
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
      return "Unresolved — authoritative value required";
    case "source-conflict":
      return "Unresolved — sources conflict; no value selected";
    case "organization-defined":
      return "Unresolved — not yet assigned";
    case "may-use-baseline":
      return "Unresolved — permitted value not accepted";
    case "control-level-unmapped":
      return "Unresolved at this insert";
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
    return label.startsWith("one or more of:") || label.startsWith("one of:")
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

/**
 * When several inserts share the same readable label inside one control,
 * number them by occurrence order already present in the resolution walk.
 * Does not invent catalog identities.
 */
function parameterLabelWithOccurrence(
  resolution: SspParameterResolution,
  index: number,
  resolutions: readonly SspParameterResolution[],
): string {
  const base = parameterName(resolution);
  const sameLabelIndexes: number[] = [];
  for (let i = 0; i < resolutions.length; i += 1) {
    if (parameterName(resolutions[i]!) === base) {
      sameLabelIndexes.push(i);
    }
  }
  if (sameLabelIndexes.length <= 1) {
    return base;
  }
  const occurrence = sameLabelIndexes.indexOf(index) + 1;
  return `${base} (${occurrence})`;
}

function normalizeRequirementText(text: string): string {
  return presentProse(text).replace(/\s+/g, " ").trim().toLowerCase();
}

function requirementsDifferMaterially(source: string, resolved: string): boolean {
  return normalizeRequirementText(source) !== normalizeRequirementText(resolved);
}

function evidenceSummary(item: SspFrameworkItem): string {
  if (item.evidenceReferences.length === 0) {
    return NO_LINKED_EVIDENCE_COPY;
  }
  return item.evidenceReferences
    .map((row) => {
      const date = row.collectionDate ?? "[Not yet documented: Collection date]";
      return `${row.title} (${row.evidenceTypeLabel}; ${row.lifecycleStatusLabel}; ${date})`;
    })
    .join("\n");
}

function summaryRows(item: SspFrameworkItem): Array<readonly [string, string]> {
  const rows: Array<readonly [string, string]> = [
    ["Kind", ITEM_KIND_LABELS[item.itemKind]],
    ["Family", item.family],
    ["Implementation documentation status", item.implementationDocumentationStatus.label],
  ];
  if (item.originId) {
    rows.push([CMMC_ORIGIN_LABEL, item.originId]);
  }
  if (item.implementationOwnerLabel) {
    rows.push([
      "Implementation owner (operational metadata; not Responsible Role)",
      item.implementationOwnerLabel,
    ]);
  }
  item.parameterResolutions.forEach((resolution, index) => {
    rows.push([
      `Parameter: ${parameterLabelWithOccurrence(resolution, index, item.parameterResolutions)}`,
      parameterValue(resolution),
    ]);
  });
  for (const assignment of item.frameworkAssignments) {
    const classification = assignment.classificationLabel
      ? ` (${assignment.classificationLabel})`
      : "";
    rows.push([
      `${assignmentCaption(assignment.kind)} — ${assignment.sourceLabel}${classification}`,
      assignment.supportingText
        ? `${assignment.text}\n${assignment.supportingText}`
        : assignment.text,
    ]);
  }
  for (const supplement of item.supplements) {
    rows.push([`Supplement — ${supplement.sourceLabel}`, supplement.text]);
  }
  for (const annotation of item.parameterAnnotations) {
    rows.push([annotation.title, annotation.text]);
  }
  rows.push([EVIDENCE_CAPTION, evidenceSummary(item)]);
  return rows;
}

function documentHeader(document: SspDocument): Header {
  return new Header({
    children: [
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 12, color: NAVY, space: 1 },
        },
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: "System Security Plan",
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

function documentFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        border: {
          top: { style: BorderStyle.SINGLE, size: 12, color: NAVY, space: 6 },
        },
        children: [
          new TextRun({
            text: footerCopy(),
            font: "Calibri",
            size: 16,
            color: MUTED,
          }),
          new TextRun({
            text: `  ·  Generated by ${GENERATOR_NAME}  ·  Page `,
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

function coverChildren(document: SspDocument): FileChild[] {
  const identity = document.identity;
  return [
    new Paragraph({
      spacing: { before: 720, after: 120 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: identity.documentType,
          bold: true,
          font: "Calibri",
          size: 36,
          color: NAVY,
        }),
      ],
    }),
    paragraph(documentedAgainstLine(document), {
      center: true,
      bold: true,
      size: 26,
      color: STEEL,
      after: 60,
    }),
    paragraph(`Generated by ${GENERATOR_NAME}`, {
      center: true,
      size: 22,
      color: MUTED,
      after: 280,
    }),
    pairTable([
      ["System name", completenessText(identity.systemName)],
      ["Short name", completenessText(identity.systemNameShort)],
      ["System identifier", completenessText(identity.systemIdentifier)],
      ["SSP organization", completenessText(identity.sspOrganization)],
      ["Framework", identity.documentedAgainst.frameworkTitle],
      ["Framework id", identity.documentedAgainst.frameworkId],
      ["Generated", identity.generatedAt],
      ["Layout", `${identity.layoutId} ${identity.layoutVersion}`],
    ]),
    gap(200),
    paragraph(LAYOUT_DISCLAIMER, { after: 80, size: 18, color: MUTED }),
    pageBreak(),
  ];
}

function statusChildren(document: SspDocument): FileChild[] {
  const identity = document.identity;
  return [
    heading1(SECTION_TITLES.documentStatus),
    ...document.completenessNotice.paragraphs.map((text) => paragraph(text)),
    pairTable([
      ["Document type", identity.documentType],
      ["Generator", GENERATOR_NAME],
      ["Layout", `${identity.layoutId} ${identity.layoutVersion}`],
      ["Generated", identity.generatedAt],
      ["Project id", identity.projectId],
      ["Project revision", String(identity.projectRevision)],
      ["Project schema version", String(identity.projectSchemaVersion)],
      ["Framework", identity.documentedAgainst.frameworkTitle],
      ["Framework id", identity.documentedAgainst.frameworkId],
    ]),
    gap(),
  ];
}

function purposeChildren(document: SspDocument): FileChild[] {
  return [
    heading1(SECTION_TITLES.purpose),
    ...purposeParagraphs(document).map((text) => paragraph(text)),
    gap(),
  ];
}

function tocChildren(document: SspDocument): FileChild[] {
  const cachedEntries = tocHeadings(document).map((heading) => ({
    title: heading.title,
    level: heading.level,
  }));
  return [
    // Not Heading1: avoids a self-referential TOC entry when Word refreshes fields.
    paragraph(SECTION_TITLES.tableOfContents, {
      bold: true,
      size: 32,
      color: NAVY,
      after: 140,
      before: 360,
    }),
    paragraph(
      "Word refreshes this table of contents when the document is opened. Page numbers are not stored as a substitute for that refresh. The sections below are complete without it.",
    ),
    new TableOfContents("Table of Contents", {
      hyperlink: true,
      headingStyleRange: "1-2",
      beginDirty: true,
      cachedEntries,
    }),
    pageBreak(),
  ];
}

function identificationChildren(document: SspDocument): FileChild[] {
  return [
    heading1(SECTION_TITLES.identification),
    pairTable([
      ["System name", completenessText(document.identity.systemName)],
      ["Short name", completenessText(document.identity.systemNameShort)],
      ["System identifier", completenessText(document.identity.systemIdentifier)],
      ["SSP organization", completenessText(document.identity.sspOrganization)],
      [
        "Operational status",
        completenessText(document.systemOverview.operationalStatus),
      ],
      [
        "Operational status remarks",
        completenessText(document.systemOverview.operationalStatusRemarks),
      ],
      ["System overview", completenessText(document.systemOverview.overview)],
    ]),
    gap(),
  ];
}

function boundaryChildren(document: SspDocument): FileChild[] {
  return [
    heading1(SECTION_TITLES.boundary),
    completenessParagraph(
      "Authorization boundary",
      document.boundaryAndEnvironment.authorizationBoundary,
    ),
    completenessParagraph(
      "Environment of operation",
      document.boundaryAndEnvironment.environmentOfOperation,
    ),
    paragraph(
      "Diagrams are not included in this layout. An empty narrative is not a claim that no boundary or environment exists.",
      { size: 18, color: MUTED },
    ),
    gap(),
  ];
}

function categorizationChildren(document: SspDocument): FileChild[] {
  const children: FileChild[] = [heading1(SECTION_TITLES.categorization)];
  if (document.informationTypes.collection === "not-documented") {
    children.push(paragraph(EMPTY_COLLECTION_COPY.informationTypes));
  } else {
    children.push(
      paragraph("Information types"),
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
      gap(80),
    );
  }

  const derived = document.categorization.derivedOverallImpact;
  const categorizationRows: Array<readonly [string, string]> = [
    ["Confidentiality", completenessText(document.categorization.confidentiality)],
    ["Integrity", completenessText(document.categorization.integrity)],
    ["Availability", completenessText(document.categorization.availability)],
    ["Categorization rationale", completenessText(document.categorization.rationale)],
  ];
  if (derived) {
    categorizationRows.push([
      "Derived overall impact",
      `Derived overall impact: ${derived.label}`,
    ]);
  }
  categorizationRows.push([
    "DoD cloud impact level",
    completenessText(document.categorization.dodCloudImpactLevel),
  ]);
  children.push(
    paragraph(
      "System security categorization. Framework selection does not populate these values.",
    ),
    pairTable(categorizationRows),
  );
  if (derived) {
    children.push(paragraph(derived.derivationNote, { size: 18, color: MUTED }));
  }
  children.push(gap());
  return children;
}

function rolesChildren(document: SspDocument): FileChild[] {
  const children: FileChild[] = [heading1(SECTION_TITLES.roles)];
  if (document.roles.collection === "not-documented") {
    children.push(paragraph(EMPTY_COLLECTION_COPY.roles));
    children.push(gap());
    return children;
  }
  children.push(
    paragraph(
      "SSP roles are documentation records. They are not application identities, per-control Responsible Role assignments, or authorization appointments.",
      { size: 18, color: MUTED },
    ),
    gridTable(
      [
        "Role",
        "Name",
        "Title",
        "Organization",
        "Email",
        "Phone",
        "Accountable role documented",
      ],
      document.roles.rows.map((row) => [
        row.roleLabel,
        completenessText(row.name),
        completenessText(row.title),
        completenessText(row.organization),
        completenessText(row.email),
        completenessText(row.phone),
        row.isCompleteAccountableRole
          ? "Yes"
          : "No — incomplete, not a complete accountable role",
      ]),
    ),
    gap(),
  );
  return children;
}

function interconnectionsChildren(document: SspDocument): FileChild[] {
  const children: FileChild[] = [heading1(SECTION_TITLES.interconnections)];
  if (document.interconnections.collection === "not-documented") {
    children.push(paragraph(EMPTY_COLLECTION_COPY.interconnections));
    children.push(gap());
    return children;
  }
  children.push(
    paragraph(
      "These interconnection summaries are project documentation. They are not FedRAMP marketplace leverage or authorization claims.",
      { size: 18, color: MUTED },
    ),
    gridTable(
      [
        "Name",
        "External organization",
        "Purpose",
        "Information exchanged",
        "Direction",
        "Security notes",
      ],
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

function itemChildren(item: SspFrameworkItem): FileChild[] {
  const heading =
    item.itemKind === "enhancement"
      ? heading4(itemHeadingText(item))
      : heading3(itemHeadingText(item));
  const documented = item.implementationNarrative.kind === "documented";
  const hasResolutions = item.parameterResolutions.length > 0;
  const showAuthoritativeSeparately =
    hasResolutions &&
    requirementsDifferMaterially(item.sourceStatement, item.resolvedStatement);
  const primaryLabel =
    item.itemKind === "requirement"
      ? hasResolutions
        ? "Resolved requirement"
        : "Requirement statement"
      : hasResolutions
        ? "Resolved requirement"
        : "Requirement";
  const primaryText = hasResolutions ? item.resolvedStatement : item.sourceStatement;
  const children: FileChild[] = [
    heading,
    paragraph(`${primaryLabel}:`, { bold: true, after: 40, keepNext: true }),
    ...proseParagraphs(primaryText, { after: 80, keepNext: true }),
  ];
  if (showAuthoritativeSeparately) {
    children.push(
      paragraph("Authoritative source statement:", {
        bold: true,
        after: 40,
        keepNext: true,
        size: 20,
        color: MUTED,
      }),
      ...proseParagraphs(item.sourceStatement, { after: 80, keepNext: true }),
    );
  }
  for (const notice of item.notices) {
    children.push(warningTable(notice.title, notice.explanation));
  }
  children.push(
    controlEntryTable(
      item.displayId,
      summaryRows(item),
      proseParagraphs(completenessText(item.implementationNarrative), { after: 60 }),
      { documented },
    ),
    gap(160),
  );
  return children;
}

function implementationsChildren(document: SspDocument): FileChild[] {
  const children: FileChild[] = [
    pageBreak(),
    heading1(SECTION_TITLES.implementations),
    paragraph(implementationsIntroSentence(document)),
    paragraph(documentationCompletenessSentence(document)),
  ];
  for (const family of document.families) {
    children.push(heading2(family.family));
    for (const item of family.items) {
      children.push(...itemChildren(item));
    }
  }
  return children;
}

function generationChildren(document: SspDocument): FileChild[] {
  const identity = document.identity;
  return [
    heading1(SECTION_TITLES.generation),
    pairTable([
      ["Document type", identity.documentType],
      ["Layout id", identity.layoutId],
      ["Layout version", identity.layoutVersion],
      ["Generator", GENERATOR_NAME],
      ["Project id", identity.projectId],
      ["Project revision", String(identity.projectRevision)],
      ["Project schema version", String(identity.projectSchemaVersion)],
      ["Framework id", identity.documentedAgainst.frameworkId],
      ["Framework title", identity.documentedAgainst.frameworkTitle],
      ["Generated at", identity.generatedAt],
      ["Total framework items", String(document.counts.totalItems)],
      ["Narratives documented", String(document.counts.narrativesDocumented)],
    ]),
  ];
}

export async function renderSspDocx(document: SspDocument): Promise<Buffer> {
  const header = documentHeader(document);
  const footer = documentFooter();
  const children: FileChild[] = [
    ...coverChildren(document),
    ...statusChildren(document),
    ...purposeChildren(document),
    ...tocChildren(document),
    ...identificationChildren(document),
    ...boundaryChildren(document),
    ...categorizationChildren(document),
    ...rolesChildren(document),
    ...interconnectionsChildren(document),
    ...implementationsChildren(document),
    ...generationChildren(document),
  ];

  const file = new Document({
    creator: GENERATOR_NAME,
    title:
      document.identity.systemName.kind === "documented"
        ? document.identity.systemName.text
        : "System Security Plan",
    description: document.identity.documentType,
    subject: documentedAgainstLine(document),
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
        {
          id: "Heading4",
          name: "Heading 4",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          paragraph: { spacing: { before: 200, after: 80 } },
          run: { font: "Calibri", size: 22, bold: true, color: STEEL },
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
        headers: { default: header },
        footers: { default: footer },
        children,
      },
    ],
  });

  return Packer.toBuffer(file);
}

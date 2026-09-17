/**
 * Control Freak SSP DOCX renderer (cf-ssp-docx 1.0).
 * Consumes the SSP document/view model only. Does not decide security semantics.
 */

import "server-only";

import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
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
} from "@/ssp";
import {
  assignmentCaption,
  BORDER_COLOR,
  CMMC_ORIGIN_LABEL,
  documentedAgainstLine,
  documentationCompletenessSentence,
  EVIDENCE_CAPTION,
  footerCopy,
  HEADER_FILL,
  headerSystemLabel,
  ITEM_KIND_LABELS,
  itemHeadingText,
  LAYOUT_DISCLAIMER,
  NO_LINKED_EVIDENCE_COPY,
  PLACEHOLDER_COLOR,
  SECTION_TITLES,
  tocHeadings,
} from "./layout";

const PAGE_WIDTH_DXA = 12240;
const MARGIN_DXA = 1440;
const CONTENT_WIDTH_DXA = PAGE_WIDTH_DXA - MARGIN_DXA * 2;
const LABEL_WIDTH_DXA = 2400;
const VALUE_WIDTH_DXA = CONTENT_WIDTH_DXA - LABEL_WIDTH_DXA;

const CELL_BORDERS: ITableCellBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
};

function isPlaceholderText(text: string): boolean {
  return (
    text.startsWith("[Not yet documented:") ||
    text.startsWith("[Unresolved ODP:") ||
    text.startsWith("[No linked Evidence")
  );
}

function textRun(text: string, options?: { bold?: boolean }): TextRun {
  const placeholder = isPlaceholderText(text);
  return new TextRun({
    text,
    bold: options?.bold,
    italics: placeholder,
    color: placeholder ? PLACEHOLDER_COLOR : undefined,
  });
}

function bodyParagraph(text: string, extra?: { spacingAfter?: number }): Paragraph {
  return new Paragraph({
    spacing: { after: extra?.spacingAfter ?? 160 },
    children: [textRun(text)],
  });
}

function heading1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 160 },
    children: [new TextRun(text)],
  });
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun(text)],
  });
}

function heading3(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun(text)],
  });
}

function heading4(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_4,
    spacing: { before: 160, after: 80 },
    children: [new TextRun(text)],
  });
}

function labeledParagraph(label: string, text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      textRun(text),
    ],
  });
}

function completenessParagraph(label: string, value: SspCompleteness): Paragraph {
  return labeledParagraph(label, completenessText(value));
}

function cellParagraphs(text: string, header = false): Paragraph[] {
  const parts = text.split(/\n+/).map((part) => part.trim()).filter(Boolean);
  const lines = parts.length > 0 ? parts : [""];
  return lines.map(
    (line) =>
      new Paragraph({
        children: [textRun(line, { bold: header })],
      }),
  );
}

function tableCell(
  text: string,
  options?: { header?: boolean; width?: number; shading?: boolean },
): TableCell {
  return new TableCell({
    borders: CELL_BORDERS,
    width: {
      size: options?.width ?? VALUE_WIDTH_DXA,
      type: WidthType.DXA,
    },
    verticalAlign: VerticalAlign.TOP,
    shading: options?.shading || options?.header ? { fill: HEADER_FILL } : undefined,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: cellParagraphs(text, options?.header === true),
  });
}

function definitionTable(rows: ReadonlyArray<readonly [string, string]>): Table {
  return new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [LABEL_WIDTH_DXA, VALUE_WIDTH_DXA],
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            tableCell(label, { header: true, width: LABEL_WIDTH_DXA, shading: true }),
            tableCell(value, { width: VALUE_WIDTH_DXA }),
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
        children: headers.map((header, index) =>
          tableCell(header, { header: true, width: widths[index], shading: true }),
        ),
      }),
      ...rows.map(
        (row) =>
          new TableRow({
            children: row.map((value, index) =>
              tableCell(value, { width: widths[index] }),
            ),
          }),
      ),
    ],
  });
}

function pageBreak(): Paragraph {
  return new Paragraph({
    children: [new PageBreak()],
  });
}

function documentHeader(document: SspDocument): Header {
  return new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: `${headerSystemLabel(document)} · Control Freak SSP`,
            italics: true,
            size: 18,
            color: PLACEHOLDER_COLOR,
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
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({ text: `${footerCopy()} · Page `, size: 18 }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
        ],
      }),
    ],
  });
}

function coverChildren(document: SspDocument): FileChild[] {
  const identity = document.identity;
  return [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun(identity.documentType)],
    }),
    bodyParagraph(LAYOUT_DISCLAIMER),
    definitionTable([
      ["System name", completenessText(identity.systemName)],
      ["Short name", completenessText(identity.systemNameShort)],
      ["System identifier", completenessText(identity.systemIdentifier)],
      ["SSP organization", completenessText(identity.sspOrganization)],
      ["Documented against", documentedAgainstLine(document)],
      ["Generated", identity.generatedAt],
      ["Layout", `${identity.layoutId} ${identity.layoutVersion}`],
    ]),
    pageBreak(),
  ];
}

function statusChildren(document: SspDocument): FileChild[] {
  return [
    heading1(SECTION_TITLES.documentStatus),
    ...document.completenessNotice.paragraphs.map((paragraph) => bodyParagraph(paragraph)),
  ];
}

function tocChildren(document: SspDocument): FileChild[] {
  const cachedEntries = tocHeadings(document).map((heading) => ({
    title: heading.title,
    level: heading.level,
  }));
  return [
    heading1(SECTION_TITLES.tableOfContents),
    bodyParagraph(
      "Word refreshes this table of contents when the document is opened. Page numbers are not invented in cached entries.",
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
    definitionTable([
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
  ];
}

function rolesChildren(document: SspDocument): FileChild[] {
  const children: FileChild[] = [heading1(SECTION_TITLES.roles)];
  if (document.roles.collection === "not-documented") {
    children.push(bodyParagraph(EMPTY_COLLECTION_COPY.roles));
    return children;
  }
  children.push(
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
  );
  return children;
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
  ];
}

function categorizationChildren(document: SspDocument): FileChild[] {
  const children: FileChild[] = [heading1(SECTION_TITLES.categorization)];
  if (document.informationTypes.collection === "not-documented") {
    children.push(bodyParagraph(EMPTY_COLLECTION_COPY.informationTypes));
  } else {
    children.push(
      bodyParagraph("Information types"),
      gridTable(
        [
          "Title",
          "Description",
          "Confidentiality",
          "Integrity",
          "Availability",
        ],
        document.informationTypes.rows.map((row) => [
          completenessText(row.title),
          completenessText(row.description),
          completenessText(row.confidentiality),
          completenessText(row.integrity),
          completenessText(row.availability),
        ]),
      ),
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
    bodyParagraph(
      "System security categorization. Framework selection does not populate these values.",
    ),
    definitionTable(categorizationRows),
  );
  if (derived) {
    children.push(bodyParagraph(derived.derivationNote));
  }
  return children;
}

function interconnectionsChildren(document: SspDocument): FileChild[] {
  const children: FileChild[] = [heading1(SECTION_TITLES.interconnections)];
  if (document.interconnections.collection === "not-documented") {
    children.push(bodyParagraph(EMPTY_COLLECTION_COPY.interconnections));
    return children;
  }
  children.push(
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
  );
  return children;
}

function itemChildren(item: SspFrameworkItem): FileChild[] {
  const heading =
    item.itemKind === "enhancement"
      ? heading4(itemHeadingText(item))
      : heading3(itemHeadingText(item));
  const children: FileChild[] = [heading];
  const metaRows: Array<readonly [string, string]> = [
    ["Kind", ITEM_KIND_LABELS[item.itemKind]],
    ["Family", item.family],
    [
      "Implementation documentation status",
      item.implementationDocumentationStatus.label,
    ],
  ];
  if (item.originId) {
    metaRows.splice(2, 0, [CMMC_ORIGIN_LABEL, item.originId]);
  }
  if (item.implementationOwnerLabel) {
    metaRows.push([
      "Implementation owner (documentation label)",
      item.implementationOwnerLabel,
    ]);
  }
  children.push(definitionTable(metaRows));
  children.push(
    labeledParagraph(
      item.itemKind === "requirement" ? "Requirement statement" : "Authoritative source statement",
      item.sourceStatement,
    ),
  );
  if (item.unresolvedParameters.length > 0) {
    children.push(
      bodyParagraph("Unresolved organization-defined parameters:"),
      ...item.unresolvedParameters.map((parameter) =>
        bodyParagraph(
          `[Unresolved ODP: ${parameter.id} — ${parameter.label}]`,
        ),
      ),
    );
  }
  for (const assignment of item.frameworkAssignments) {
    const classification = assignment.classificationLabel
      ? ` (${assignment.classificationLabel})`
      : "";
    children.push(
      labeledParagraph(
        `${assignmentCaption(assignment.kind)} — ${assignment.sourceLabel}${classification}`,
        assignment.text,
      ),
    );
    if (assignment.supportingText) {
      children.push(bodyParagraph(assignment.supportingText));
    }
  }
  for (const supplement of item.supplements) {
    children.push(
      labeledParagraph(
        `Supplement — ${supplement.sourceLabel}`,
        supplement.text,
      ),
    );
  }
  for (const notice of item.notices) {
    children.push(labeledParagraph(notice.title, notice.explanation));
  }
  children.push(
    completenessParagraph("Implementation narrative", item.implementationNarrative),
  );
  children.push(bodyParagraph(EVIDENCE_CAPTION));
  if (item.evidenceReferences.length === 0) {
    children.push(bodyParagraph(NO_LINKED_EVIDENCE_COPY));
  } else {
    children.push(
      gridTable(
        ["Title", "Type", "Lifecycle status", "Collection date"],
        item.evidenceReferences.map((row) => [
          row.title,
          row.evidenceTypeLabel,
          row.lifecycleStatusLabel,
          row.collectionDate ?? "[Not yet documented: Collection date]",
        ]),
      ),
    );
  }
  return children;
}

function implementationsChildren(document: SspDocument): FileChild[] {
  const itemsLabel = document.identity.documentedAgainst.itemPlural;
  const children: FileChild[] = [
    pageBreak(),
    heading1(SECTION_TITLES.implementations),
    bodyParagraph(
      `This section includes every selected ${itemsLabel} in the documentation framework.`,
    ),
    bodyParagraph(documentationCompletenessSentence(document)),
  ];
  for (const family of document.families) {
    children.push(heading2(family.family));
    for (const item of family.items) {
      children.push(...itemChildren(item));
    }
  }
  return children;
}

function appendixChildren(document: SspDocument): FileChild[] {
  const identity = document.identity;
  return [
    heading1(SECTION_TITLES.appendix),
    definitionTable([
      ["Document type", identity.documentType],
      ["Layout id", identity.layoutId],
      ["Layout version", identity.layoutVersion],
      ["Project id", identity.projectId],
      ["Project revision", String(identity.projectRevision)],
      ["Project schema version", String(identity.projectSchemaVersion)],
      ["Framework id", identity.documentedAgainst.frameworkId],
      ["Framework title", identity.documentedAgainst.frameworkTitle],
      ["Generated at", identity.generatedAt],
    ]),
  ];
}

export async function renderSspDocx(document: SspDocument): Promise<Buffer> {
  const header = documentHeader(document);
  const footer = documentFooter();
  const children: FileChild[] = [
    ...coverChildren(document),
    ...statusChildren(document),
    ...tocChildren(document),
    ...identificationChildren(document),
    ...rolesChildren(document),
    ...boundaryChildren(document),
    ...categorizationChildren(document),
    ...interconnectionsChildren(document),
    ...implementationsChildren(document),
    ...appendixChildren(document),
  ];

  const file = new Document({
    creator: "Control Freak",
    title:
      document.identity.systemName.kind === "documented"
        ? document.identity.systemName.text
        : "System Security Plan",
    description: document.identity.documentType,
    subject: documentedAgainstLine(document),
    features: { updateFields: true },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH_DXA, height: 15840 },
            margin: {
              top: MARGIN_DXA,
              right: MARGIN_DXA,
              bottom: MARGIN_DXA,
              left: MARGIN_DXA,
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

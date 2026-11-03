import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createProjectMetadata } from "@/data/project";
import { frameworkRegistry } from "@/data/framework";
import { DOD_CLOUD_IL4_FRAMEWORK_ID } from "@/framework/dod-cloud-il4-rev5/identities";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-sp-800-53-rev5/identities";
import type { StoredProject } from "@/persistence/types";
import { buildSspDocument } from "@/ssp";
import {
  CF_SSP_DOCUMENT_TYPE,
  CF_SSP_LAYOUT_ID,
  CF_SSP_LAYOUT_VERSION,
  CONTROL_SUMMARY_BANNER,
  EVIDENCE_CAPTION,
  LAYOUT_DISCLAIMER,
  NO_LINKED_EVIDENCE_COPY,
  SECTION_TITLES,
  solutionBanner,
  tocHeadings,
} from "./layout";
import { normalizeXml, readZipTextEntries } from "./readPackage";
import { renderSspDocx } from "./renderSspDocx";
import type { SspDocument } from "@/ssp";

const GENERATED_AT = "2026-09-16T12:00:00.000Z";
const GENERATED_AT_B = "2026-09-17T08:30:00.000Z";

function storedProject(frameworkId = NIST_MODERATE_FRAMEWORK_ID): StoredProject {
  return {
    id: "project-1",
    name: "Test Project",
    organizationId: "org-1",
    frameworkId,
    schemaVersion: 2,
    revision: 3,
    createdAt: GENERATED_AT,
    updatedAt: GENERATED_AT,
    metadata: createProjectMetadata({
      systemName: "Harbor Watch",
      systemNameShort: "HW",
      systemIdentifier: "HW-1",
      organizationName: "Harbor Org",
      systemDescription: "Coastal monitoring.",
      authorizationBoundary: "VPC edge.",
      environmentOfOperation: "GovCloud.",
      operationalStatus: "operational",
      securityCategorization: {
        confidentiality: "moderate",
        integrity: "low",
        availability: "low",
      },
      systemRoles: [
        {
          id: "role-1",
          role: "system-owner",
          name: "Alex Rivera",
          title: "Director",
        },
      ],
      informationTypes: [
        {
          id: "it-1",
          title: "CUI",
          confidentialityImpact: "moderate",
        },
      ],
    }),
    implementations: {
      "ac-1": {
        status: "in-progress",
        narrative: "Policy draft in review.",
      },
    },
    parameterRecords: {},
  };
}

function sampleDocument(
  generatedAt = GENERATED_AT,
  frameworkId = NIST_MODERATE_FRAMEWORK_ID,
): SspDocument {
  const framework = frameworkRegistry.require(frameworkId).getFramework();
  const descriptor = frameworkRegistry.requireDescriptor(frameworkId);
  const project = storedProject(frameworkId);
  const acFamily = framework.controls.filter(
    (control) => control.id === "ac-1" || control.id === "ac-2" || control.id === "ac-2.1",
  );
  return buildSspDocument({
    project,
    framework: { ...framework, controls: acFamily },
    descriptor,
    controlRecordsByControlId: new Map(),
    evidenceByControlId: new Map(),
    generatedAt,
  });
}

describe("renderSspDocx package structure", () => {
  it("produces a valid DOCX package with styles, headings, tables, header, footer, and TOC field", async () => {
    const buffer = await renderSspDocx(sampleDocument());
    assert.ok(Buffer.isBuffer(buffer));
    assert.ok(buffer.byteLength > 1000);
    const files = readZipTextEntries(buffer);
    assert.ok(files.has("[Content_Types].xml"));
    assert.ok(files.has("word/document.xml"));
    assert.ok([...files.keys()].some((name) => name.startsWith("word/header")));
    assert.ok([...files.keys()].some((name) => name.startsWith("word/footer")));
    assert.ok(files.has("word/styles.xml"));

    const documentXml = files.get("word/document.xml") ?? "";
    assert.match(documentXml, /w:instrText[^>]*>[^<]*TOC/i);
    assert.match(documentXml, /Heading1/);
    assert.match(documentXml, /Heading2/);
    assert.match(documentXml, new RegExp(CF_SSP_DOCUMENT_TYPE));
    assert.match(documentXml, /Harbor Watch/);
    assert.match(documentXml, /cf-ssp-docx/);
    assert.match(documentXml, /2\.0/);
    assert.match(documentXml, new RegExp(LAYOUT_DISCLAIMER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(documentXml, new RegExp(SECTION_TITLES.purpose));
    assert.match(documentXml, new RegExp(SECTION_TITLES.identification));
    assert.match(documentXml, new RegExp(SECTION_TITLES.implementations));
    assert.match(documentXml, new RegExp(SECTION_TITLES.generation));
    assert.match(documentXml, /Derived overall impact: Moderate/);
    assert.match(documentXml, /Implementation documentation status/);
    assert.match(documentXml, /In progress/);
    assert.match(documentXml, /Policy draft in review/);
    assert.match(documentXml, new RegExp(CONTROL_SUMMARY_BANNER));
    assert.match(documentXml, new RegExp(solutionBanner("AC-1").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(documentXml, new RegExp(EVIDENCE_CAPTION.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(documentXml, new RegExp(NO_LINKED_EVIDENCE_COPY.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(documentXml, /all selected controls from/);
    assert.doesNotMatch(documentXml, /every selected controls/);
    assert.match(documentXml, /w:tbl/);
    assert.match(documentXml, /not an official FedRAMP/i);
    assert.match(documentXml, /not independently assessed or validated/i);
    assert.match(
      documentXml,
      /not evidence of certification, assessment, authorization, an Authority to Operate, or a DoD Provisional Authorization/,
    );
    assert.match(documentXml, /NIST SP 800-53/);
    assert.match(
      documentXml,
      /does not equate that framework with a FedRAMP Moderate authorization package/,
    );
    assert.doesNotMatch(documentXml, /FedRAMP Moderate System Security Plan/);

    const headerXml = [...files.entries()].find(([name]) =>
      name.startsWith("word/header"),
    )?.[1];
    assert.ok(headerXml);
    assert.match(headerXml, /System Security Plan/);
    assert.match(headerXml, /HW/);

    const footerXml = [...files.entries()].find(([name]) =>
      name.startsWith("word/footer"),
    )?.[1];
    assert.ok(footerXml);
    assert.match(footerXml, new RegExp(CF_SSP_LAYOUT_VERSION));
    assert.match(footerXml, /fldChar|instrText|PAGE/i);
    assert.match(footerXml, /Generated by Control Freak/);

    const generatedAt = files.get("word/document.xml") ?? "";
    assert.match(generatedAt, new RegExp(GENERATED_AT));
    assert.equal(CF_SSP_LAYOUT_ID, "cf-ssp-docx");
    assert.equal(CF_SSP_LAYOUT_VERSION, "2.0");
  });

  it("labels IL4 projects with the IL4 framework and companion Addendum relationship", async () => {
    const document = sampleDocument(GENERATED_AT, DOD_CLOUD_IL4_FRAMEWORK_ID);
    const xml = readZipTextEntries(await renderSspDocx(document)).get("word/document.xml") ?? "";
    assert.match(xml, /DoD Cloud Impact Level 4/);
    assert.match(xml, /dod-cloud-il4-rev5/);
    assert.match(xml, /IL4 SSP Addendum/);
    assert.match(xml, /full IL4 documentation population/);
    assert.doesNotMatch(xml, /Documented against FedRAMP Moderate$/);
    assert.match(xml, /all selected/);
    assert.doesNotMatch(xml, /every selected/);
  });

  it("omits the Table of Contents heading from TOC cached entries and Heading styles", async () => {
    const document = sampleDocument();
    assert.ok(
      tocHeadings(document).every(
        (heading) => heading.title !== SECTION_TITLES.tableOfContents,
      ),
    );
    const xml = readZipTextEntries(await renderSspDocx(document)).get("word/document.xml") ?? "";
    assert.match(xml, new RegExp(SECTION_TITLES.tableOfContents));
    assert.match(xml, /w:instrText[^>]*>[^<]*TOC/i);
    // On-page TOC title is plain text, not Heading1/2 (avoids self-reference after refresh).
    const tocTitleEscaped = SECTION_TITLES.tableOfContents.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    assert.doesNotMatch(
      xml,
      new RegExp(
        `<w:pStyle[^>]*w:val="Heading[12]"[^/]*/>[\\s\\S]{0,400}${tocTitleEscaped}`,
      ),
    );
  });

  it("presents the resolved requirement prominently and keeps the solution banner with the narrative cell", async () => {
    const document = sampleDocument();
    const ac1 = document.families
      .flatMap((family) => family.items)
      .find((item) => item.id === "ac-1");
    assert.ok(ac1);
    assert.ok(ac1.parameterResolutions.length > 0);
    const xml = readZipTextEntries(await renderSspDocx(document)).get("word/document.xml") ?? "";
    assert.match(xml, /Resolved requirement/);
    // Banner text and narrative share presentation path; narrative still present.
    assert.match(xml, new RegExp(solutionBanner("AC-1").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(xml, /Policy draft in review/);
  });

  it("keeps semantic XML deterministic for the same injected timestamp", async () => {
    const first = await renderSspDocx(sampleDocument());
    const second = await renderSspDocx(sampleDocument());
    const firstXml = normalizeXml(readZipTextEntries(first).get("word/document.xml") ?? "");
    const secondXml = normalizeXml(readZipTextEntries(second).get("word/document.xml") ?? "");
    assert.equal(firstXml, secondXml);
  });

  it("changes only the injected generation timestamp in document XML", async () => {
    const first = readZipTextEntries(await renderSspDocx(sampleDocument(GENERATED_AT)));
    const second = readZipTextEntries(await renderSspDocx(sampleDocument(GENERATED_AT_B)));
    const firstXml = normalizeXml(first.get("word/document.xml") ?? "");
    const secondXml = normalizeXml(second.get("word/document.xml") ?? "");
    assert.notEqual(firstXml, secondXml);
    assert.equal(firstXml.replaceAll(GENERATED_AT, "TS"), secondXml.replaceAll(GENERATED_AT_B, "TS"));
  });

  it("renders empty collections as not documented rather than none exist", async () => {
    const framework = frameworkRegistry.require(NIST_MODERATE_FRAMEWORK_ID).getFramework();
    const descriptor = frameworkRegistry.requireDescriptor(NIST_MODERATE_FRAMEWORK_ID);
    const document = buildSspDocument({
      project: {
        ...storedProject(),
        metadata: createProjectMetadata({ systemName: "Empty Harbor" }),
        implementations: {},
      },
      framework: {
        ...framework,
        controls: framework.controls.filter((control) => control.id === "ac-1"),
      },
      descriptor,
      controlRecordsByControlId: new Map(),
      evidenceByControlId: new Map(),
      generatedAt: GENERATED_AT,
    });
    const xml = readZipTextEntries(await renderSspDocx(document)).get("word/document.xml") ?? "";
    assert.match(xml, /Interconnections have not been documented/);
    assert.doesNotMatch(xml, /has no interconnections/i);
    assert.match(xml, /\[Not yet documented: Authorization boundary\]/);
    assert.doesNotMatch(xml, /Derived overall impact/);
  });
});

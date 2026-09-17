import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createProjectMetadata } from "@/data/project";
import { frameworkRegistry } from "@/data/framework";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-sp-800-53-rev5/identities";
import type { StoredProject } from "@/persistence/types";
import { buildSspDocument } from "@/ssp";
import {
  CF_SSP_DOCUMENT_TYPE,
  CF_SSP_LAYOUT_ID,
  CF_SSP_LAYOUT_VERSION,
  EVIDENCE_CAPTION,
  LAYOUT_DISCLAIMER,
  NO_LINKED_EVIDENCE_COPY,
  SECTION_TITLES,
} from "./layout";
import { normalizeXml, readZipTextEntries } from "./readPackage";
import { renderSspDocx } from "./renderSspDocx";
import type { SspDocument } from "@/ssp";

const GENERATED_AT = "2026-09-16T12:00:00.000Z";
const GENERATED_AT_B = "2026-09-17T08:30:00.000Z";

function storedProject(): StoredProject {
  return {
    id: "project-1",
    name: "Test Project",
    organizationId: "org-1",
    frameworkId: NIST_MODERATE_FRAMEWORK_ID,
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

function sampleDocument(generatedAt = GENERATED_AT): SspDocument {
  const framework = frameworkRegistry.require(NIST_MODERATE_FRAMEWORK_ID).getFramework();
  const descriptor = frameworkRegistry.requireDescriptor(NIST_MODERATE_FRAMEWORK_ID);
  const project = storedProject();
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
    assert.match(documentXml, /1\.0/);
    assert.match(documentXml, new RegExp(LAYOUT_DISCLAIMER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(documentXml, new RegExp(SECTION_TITLES.identification));
    assert.match(documentXml, new RegExp(SECTION_TITLES.implementations));
    assert.match(documentXml, /Derived overall impact: Moderate/);
    assert.match(documentXml, /Implementation documentation status/);
    assert.match(documentXml, /In progress/);
    assert.match(documentXml, /Policy draft in review/);
    assert.match(documentXml, new RegExp(EVIDENCE_CAPTION.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(documentXml, new RegExp(NO_LINKED_EVIDENCE_COPY.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(documentXml, /w:tbl/);
    assert.match(documentXml, /not an official FedRAMP/i);
    assert.match(documentXml, /not independently assessed or validated/i);
    assert.match(
      documentXml,
      /not evidence of certification, assessment, authorization, an Authority to Operate, or a DoD Provisional Authorization/,
    );

    const headerXml = [...files.entries()].find(([name]) =>
      name.startsWith("word/header"),
    )?.[1];
    assert.ok(headerXml);
    assert.match(headerXml, /HW · Control Freak SSP/);

    const footerXml = [...files.entries()].find(([name]) =>
      name.startsWith("word/footer"),
    )?.[1];
    assert.ok(footerXml);
    assert.match(footerXml, new RegExp(CF_SSP_LAYOUT_VERSION));
    assert.match(footerXml, /fldChar|instrText|PAGE/i);

    const generatedAt = files.get("word/document.xml") ?? "";
    assert.match(generatedAt, new RegExp(GENERATED_AT));
    assert.equal(CF_SSP_LAYOUT_ID, "cf-ssp-docx");
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

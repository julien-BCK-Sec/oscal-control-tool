import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cmmcLevel2FrameworkProvider,
  dodCloudIl4FrameworkProvider,
  frameworkRegistry,
  nistModerateFrameworkProvider,
} from "@/data/framework";
import { createProjectMetadata } from "@/data/project";
import { CMMC_LEVEL_2_FRAMEWORK_ID } from "@/framework/cmmc-level-2-nist-sp-800-171-r2/identities";
import {
  DOD_CLOUD_IL4_FRAMEWORK_ID,
  IL4_GRR_COUNT,
  IL4_TOTAL_COUNT,
} from "@/framework/dod-cloud-il4-rev5/identities";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-sp-800-53-rev5/identities";
import type { StoredProject } from "@/persistence/types";
import { buildSspDocument } from "@/ssp";
import { CMMC_ORIGIN_LABEL, ITEM_KIND_LABELS } from "./layout";
import { readZipTextEntries } from "./readPackage";
import { renderSspDocx } from "./renderSspDocx";

const GENERATED_AT = "2026-09-16T15:00:00.000Z";

function project(frameworkId: string): StoredProject {
  return {
    id: `project-${frameworkId}`,
    name: "Generation Fixture",
    organizationId: "org-1",
    frameworkId,
    schemaVersion: 2,
    revision: 1,
    createdAt: GENERATED_AT,
    updatedAt: GENERATED_AT,
    metadata: createProjectMetadata({ systemName: "Generation Fixture" }),
    implementations: {},
  };
}

function documentFor(frameworkId: string) {
  const framework = frameworkRegistry.require(frameworkId).getFramework();
  const descriptor = frameworkRegistry.requireDescriptor(frameworkId);
  return buildSspDocument({
    project: project(frameworkId),
    framework,
    descriptor,
    controlRecordsByControlId: new Map(),
    evidenceByControlId: new Map(),
    generatedAt: GENERATED_AT,
  });
}

describe("SSP DOCX framework generation", () => {
  it("generates a NIST Moderate DOCX", async () => {
    const document = documentFor(NIST_MODERATE_FRAMEWORK_ID);
    assert.equal(
      document.counts.totalItems,
      nistModerateFrameworkProvider.getFramework().controls.length,
    );
    const started = Date.now();
    const buffer = await renderSspDocx(document);
    const elapsedMs = Date.now() - started;
    assert.ok(buffer.byteLength > 10_000);
    const xml = readZipTextEntries(buffer).get("word/document.xml") ?? "";
    assert.match(xml, /AC-1/);
    assert.match(xml, /AC-2 \(1\)/);
    assert.match(xml, /Unresolved ODP:/);
    assert.doesNotMatch(xml, /\{\{\s*insert:\s*param/);
    console.info("nist moderate ssp.docx generation", {
      byteLength: buffer.byteLength,
      elapsedMs,
      items: document.counts.totalItems,
    });
  });

  it("generates a CMMC Level 2 DOCX with requirement terminology", async () => {
    const document = documentFor(CMMC_LEVEL_2_FRAMEWORK_ID);
    assert.equal(
      document.counts.totalItems,
      cmmcLevel2FrameworkProvider.getFramework().controls.length,
    );
    const buffer = await renderSspDocx(document);
    const xml = readZipTextEntries(buffer).get("word/document.xml") ?? "";
    assert.match(xml, /requirement/i);
    assert.match(xml, new RegExp(CMMC_ORIGIN_LABEL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(xml, new RegExp(ITEM_KIND_LABELS.requirement));
    assert.match(xml, /AC\.L2-/);
    assert.doesNotMatch(xml, /MET \/ NOT MET|SPRS/);
    console.info("cmmc ssp.docx generation", {
      byteLength: buffer.byteLength,
      items: document.counts.totalItems,
    });
  });

  it("generates the full 345-item IL4 DOCX without pathological runtime", async () => {
    const document = documentFor(DOD_CLOUD_IL4_FRAMEWORK_ID);
    const il4 = dodCloudIl4FrameworkProvider.getFramework();
    assert.equal(il4.controls.length, IL4_TOTAL_COUNT);
    assert.equal(document.counts.totalItems, 345);
    const grrs = document.families.flatMap((group) =>
      group.items.filter((item) => item.itemKind === "grr"),
    );
    assert.equal(grrs.length, IL4_GRR_COUNT);
    const started = Date.now();
    const buffer = await renderSspDocx(document);
    const elapsedMs = Date.now() - started;
    assert.ok(Buffer.isBuffer(buffer));
    assert.ok(buffer.byteLength > 50_000);
    const files = readZipTextEntries(buffer);
    const xml = files.get("word/document.xml") ?? "";
    assert.match(xml, /\[Content_Types\]|w:document/);
    assert.match(xml, /General readiness requirement GRR-1/);
    assert.match(xml, /FedRAMP base, inherited for IL4/);
    assert.match(xml, /DoD IL4 adjustment/);
    assert.match(xml, /DoD permits FedRAMP value/);
    assert.match(xml, /DoD assignment required/);
    assert.match(xml, /Source interpretation requires review/);
    assert.match(xml, /Conditional: Cross Domain Solution \(CDS\)/);
    assert.match(
      xml,
      /not evidence of certification, assessment, authorization, an Authority to Operate, or a DoD Provisional Authorization/,
    );
    console.info("il4 ssp.docx generation", {
      byteLength: buffer.byteLength,
      elapsedMs,
      items: document.counts.totalItems,
      grrs: grrs.length,
    });
  });
});

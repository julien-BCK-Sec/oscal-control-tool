/**
 * Write representative general SSP DOCX samples for Milestone 09E manual review.
 * Layout identity: cf-ssp-docx 2.0. Not an official FedRAMP/DoD template.
 *
 * Usage:
 *   npx tsx --require ./scripts/mock-server-only.cjs scripts/generate-ssp-docx-samples.ts [output-dir]
 */

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { frameworkRegistry } from "@/data/framework";
import type { EvidenceWithControlIds } from "@/data/evidence";
import { renderSspDocx } from "@/export/ssp-docx";
import { DOD_CLOUD_IL4_FRAMEWORK_ID } from "@/framework/dod-cloud-il4-rev5/identities";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-sp-800-53-rev5/identities";
import type { StoredProject } from "@/persistence/types";
import { CANONICAL_PROJECTS } from "@/seed/demo/catalog";
import {
  buildDemoMetadata,
  buildFinalDemoImplementations,
} from "@/seed/demo/content";
import {
  DEMO_IL4_PARAMETER_RECORDS,
  DEMO_NIST_MODERATE_PARAMETER_RECORDS,
} from "@/seed/demo/parameter-records";
import {
  buildIl4Implementations,
  buildIl4ProjectDescription,
  buildSupportingMetadata,
} from "@/seed/demo/supporting";
import { buildSspDocument, buildSspDocxFilename, CF_SSP_LAYOUT_VERSION } from "@/ssp";

const generatedAt = "2026-11-03T18:00:00.000Z";
const outputDir = path.resolve(process.argv[2] ?? "/tmp/cf-ssp-docx-2.0-samples");

function nistModerateProject(): StoredProject {
  return {
    id: "demo-nist-moderate-flagship",
    name: CANONICAL_PROJECTS.flagship.name,
    organizationId: "demo-org",
    frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    schemaVersion: 3,
    revision: 1,
    createdAt: generatedAt,
    updatedAt: generatedAt,
    metadata: buildDemoMetadata(),
    implementations: buildFinalDemoImplementations(),
    parameterRecords: DEMO_NIST_MODERATE_PARAMETER_RECORDS,
  };
}

function il4Project(): StoredProject {
  const metadata = buildSupportingMetadata("il4", buildIl4ProjectDescription());
  return {
    id: "demo-il4-snow-goose",
    name: CANONICAL_PROJECTS.il4.name,
    organizationId: "demo-org",
    frameworkId: DOD_CLOUD_IL4_FRAMEWORK_ID,
    schemaVersion: 3,
    revision: 1,
    createdAt: generatedAt,
    updatedAt: generatedAt,
    metadata,
    implementations: buildIl4Implementations(),
    parameterRecords: DEMO_IL4_PARAMETER_RECORDS,
  };
}

const il4Evidence: EvidenceWithControlIds = {
  id: "demo-il4-pki",
  projectId: "demo-il4-snow-goose",
  title: "Snow Goose Cloud DoD PKI authentication note",
  description:
    "Demo note describing CAC/Alt-token authentication for Snow Goose Cloud operators. Not a DoD authorization artifact or DSPAV value.",
  owner: "Priya Sharma",
  evidenceType: "document",
  status: "active",
  collectionDate: "2026-05-01",
  reviewDueDate: "2026-11-01",
  currentVersionId: null,
  createdAt: generatedAt,
  updatedAt: generatedAt,
  controlIds: ["ac-2", "grr-1"],
};

async function writeSample(options: {
  label: string;
  project: StoredProject;
  evidenceByControlId: Map<string, readonly EvidenceWithControlIds[]>;
  filenameHint: string;
}): Promise<Record<string, unknown>> {
  const framework = frameworkRegistry.require(options.project.frameworkId).getFramework();
  const descriptor = frameworkRegistry.requireDescriptor(options.project.frameworkId);
  const started = Date.now();
  const document = buildSspDocument({
    project: options.project,
    framework,
    descriptor,
    controlRecordsByControlId: new Map(),
    evidenceByControlId: options.evidenceByControlId,
    generatedAt,
  });
  const buffer = await renderSspDocx(document);
  const durationMs = Date.now() - started;
  const filename = buildSspDocxFilename(
    options.project.metadata.systemName || options.filenameHint,
  );
  const outputPath = path.join(outputDir, filename);
  writeFileSync(outputPath, buffer);
  return {
    label: options.label,
    path: outputPath,
    filename,
    bytes: buffer.byteLength,
    durationMs,
    layoutVersion: CF_SSP_LAYOUT_VERSION,
    frameworkId: document.identity.documentedAgainst.frameworkId,
    frameworkTitle: document.identity.documentedAgainst.frameworkTitle,
    totalItems: document.counts.totalItems,
    narrativesDocumented: document.counts.narrativesDocumented,
  };
}

async function main(): Promise<void> {
  mkdirSync(outputDir, { recursive: true });
  const results = [
    await writeSample({
      label: "nist-moderate",
      project: nistModerateProject(),
      evidenceByControlId: new Map(),
      filenameHint: "nist-moderate-ssp",
    }),
    await writeSample({
      label: "dod-cloud-il4",
      project: il4Project(),
      evidenceByControlId: new Map([
        ["grr-1", [il4Evidence]],
        ["ac-2", [il4Evidence]],
      ]),
      filenameHint: "il4-ssp",
    }),
  ];
  console.log(JSON.stringify({ outputDir, layoutVersion: CF_SSP_LAYOUT_VERSION, results }, null, 2));
}

void main();

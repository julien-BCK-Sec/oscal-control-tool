/**
 * Write a representative IL4 Addendum DOCX for manual review.
 * The file is not a template and is not a source of requirements.
 *
 * Usage:
 *   npx tsx --require ./scripts/mock-server-only.cjs scripts/generate-il4-addendum-sample.ts [output-path]
 */

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { frameworkRegistry } from "@/data/framework";
import type { EvidenceWithControlIds } from "@/data/evidence";
import { renderIl4AddendumDocx } from "@/export/il4-addendum-docx";
import { DOD_CLOUD_IL4_FRAMEWORK_ID } from "@/framework/dod-cloud-il4-rev5/identities";
import { buildIl4AddendumDocument, buildIl4AddendumDocxFilename } from "@/il4-addendum";
import type { StoredProject } from "@/persistence/types";
import { CANONICAL_PROJECTS } from "@/seed/demo/catalog";
import { DEMO_IL4_PARAMETER_RECORDS } from "@/seed/demo/parameter-records";
import {
  buildIl4Implementations,
  buildIl4ProjectDescription,
  buildSupportingMetadata,
} from "@/seed/demo/supporting";

const generatedAt = "2026-09-28T16:00:00.000Z";
const outputPath = path.resolve(
  process.argv[2] ?? "/tmp/snow-goose-il4-ssp-addendum.docx",
);

const metadata = buildSupportingMetadata("il4", buildIl4ProjectDescription());
const project: StoredProject = {
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

const evidence: EvidenceWithControlIds = {
  id: "demo-il4-pki",
  projectId: project.id,
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

async function main(): Promise<void> {
  const started = Date.now();
  const document = buildIl4AddendumDocument({
    project,
    framework: frameworkRegistry.require(DOD_CLOUD_IL4_FRAMEWORK_ID).getFramework(),
    descriptor: frameworkRegistry.requireDescriptor(DOD_CLOUD_IL4_FRAMEWORK_ID),
    controlRecordsByControlId: new Map(),
    evidenceByControlId: new Map([["grr-1", [evidence]]]),
    generatedAt,
  });
  const buffer = await renderIl4AddendumDocx(document);
  const durationMs = Date.now() - started;
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, buffer);

  const filename = buildIl4AddendumDocxFilename(metadata.systemName);
  console.log(
    JSON.stringify(
      {
        path: outputPath,
        filename,
        bytes: buffer.byteLength,
        durationMs,
        population: document.population,
        detailedNist: document.nistFamilies.flatMap((family) =>
          family.entries.map((entry) => entry.item.displayId),
        ),
        membership: document.membershipNotes.map((note) => note.displayId),
      },
      null,
      2,
    ),
  );
}

void main();

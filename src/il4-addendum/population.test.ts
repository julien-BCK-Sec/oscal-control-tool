import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dodCloudIl4FrameworkProvider, frameworkRegistry } from "@/data/framework";
import { createProjectMetadata } from "@/data/project";
import { CMMC_LEVEL_2_FRAMEWORK_ID } from "@/framework/cmmc-level-2-nist-sp-800-171-r2/identities";
import {
  DOD_CLOUD_IL4_FRAMEWORK_ID,
  IL4_GRR_COUNT,
  IL4_TOTAL_COUNT,
} from "@/framework/dod-cloud-il4-rev5/identities";
import {
  mappingCount,
  parseIl4ParameterMappings,
} from "@/framework/dod-cloud-il4-rev5/parameter-mappings";
import { IL4_PARAMETER_MAPPINGS_VENDOR_FILE } from "@/framework/dod-cloud-il4-rev5/sources";
import { loadPinnedIl4TableD1Notes } from "@/framework/dod-cloud-il4-rev5/table-d1-index";
import {
  NIST_HIGH_FRAMEWORK_ID,
  NIST_LOW_FRAMEWORK_ID,
  NIST_MODERATE_FRAMEWORK_ID,
  frameworkHasOscalSspExport,
} from "@/framework/nist-sp-800-53-rev5/identities";
import type { StoredProject } from "@/persistence/types";
import { buildSspDocument } from "@/ssp";
import { classifyIl4AddendumPopulation, Il4AddendumPopulationError } from "./population";
import { supportsIl4AddendumExport } from "./support";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const NOT_IN_FEDRAMP = [
  "au-5.1",
  "ma-5.5",
  "ps-3.4",
  "sa-4.5",
  "sa-9.3",
  "sa-9.6",
  "sa-9.7",
  "sa-9.8",
  "sc-12.6",
  "sc-18.2",
  "sc-24",
  "sc-46",
] as const;

const TABLE_D1_ADJUSTMENTS = [
  "ac-7",
  "cm-7.5",
  "ia-5.1",
  "ma-5.1",
  "ma-6",
  "pe-15",
  "ps-4",
  "sa-9.1",
  "sa-9.5",
  "sc-17",
] as const;

function ids(entries: { control: { id: string } }[]): string[] {
  return entries.map((entry) => entry.control.id);
}

describe("IL4 addendum population", () => {
  const framework = dodCloudIl4FrameworkProvider.getFramework();
  const notes = loadPinnedIl4TableD1Notes();
  const population = classifyIl4AddendumPopulation({
    controls: framework.controls,
    tableD1Notes: notes,
  });

  it("partitions the current pin into the accepted delta", () => {
    assert.equal(framework.controls.length, IL4_TOTAL_COUNT);
    assert.equal(population.grrs.length, IL4_GRR_COUNT);
    assert.equal(population.nistNotInFedrampModerate.length, 12);
    assert.equal(population.fedrampTableD1Adjustments.length, 10);
    assert.equal(population.membershipNotes.length, 1);
    assert.equal(population.notReprinted.length, 312);
    const detailed =
      population.grrs.length +
      population.nistNotInFedrampModerate.length +
      population.fedrampTableD1Adjustments.length;
    assert.equal(detailed, 32);
    assert.equal(
      detailed + population.membershipNotes.length + population.notReprinted.length,
      345,
    );
    assert.deepEqual(ids(population.nistNotInFedrampModerate).sort(), [
      ...NOT_IN_FEDRAMP,
    ].sort());
    assert.deepEqual(ids(population.fedrampTableD1Adjustments).sort(), [
      ...TABLE_D1_ADJUSTMENTS,
    ].sort());
    assert.deepEqual(ids(population.membershipNotes), ["sc-18"]);
    assert.deepEqual(
      ids(population.grrs),
      ["grr-1", "grr-2", "grr-3", "grr-4", "grr-5", "grr-6", "grr-7", "grr-8", "grr-9", "grr-10"],
    );
  });

  it("does not treat the leveraged column or an ordinary FedRAMP control as the delta", () => {
    const byId = new Map(framework.controls.map((control) => [control.id, control]));
    assert.equal(
      byId.get("ac-7")?.selectionProvenance?.overlayMarksLeveragedFromExternalBaseline,
      false,
    );
    assert.equal(
      byId.get("ma-6")?.selectionProvenance?.overlayMarksLeveragedFromExternalBaseline,
      true,
    );
    assert.ok(ids(population.fedrampTableD1Adjustments).includes("ac-7"));
    assert.ok(ids(population.fedrampTableD1Adjustments).includes("ma-6"));
    assert.equal(ids(population.notReprinted).includes("ac-1"), true);
    assert.equal(ids(population.notReprinted).includes("ac-2"), true);
    assert.equal(
      [
        ...ids(population.nistNotInFedrampModerate),
        ...ids(population.fedrampTableD1Adjustments),
        ...ids(population.membershipNotes),
      ].includes("ac-1"),
      false,
    );
  });

  it("fails closed when Table D-1 membership disagrees with the framework cross-check", () => {
    const withoutSc18 = notes.filter((note) => note.id !== "sc-18");
    assert.throws(
      () =>
        classifyIl4AddendumPopulation({
          controls: framework.controls,
          tableD1Notes: withoutSc18,
        }),
      Il4AddendumPopulationError,
    );
  });

  it("keeps other framework populations and IL4 OSCAL availability unchanged", () => {
    assert.equal(
      frameworkRegistry.require(NIST_LOW_FRAMEWORK_ID).getFramework().controls.length,
      149,
    );
    assert.equal(
      frameworkRegistry.require(NIST_MODERATE_FRAMEWORK_ID).getFramework().controls.length,
      287,
    );
    assert.equal(
      frameworkRegistry.require(NIST_HIGH_FRAMEWORK_ID).getFramework().controls.length,
      370,
    );
    assert.equal(
      frameworkRegistry.require(CMMC_LEVEL_2_FRAMEWORK_ID).getFramework().controls.length,
      110,
    );
    assert.equal(framework.controls.length, 345);
    assert.equal(
      framework.controls.filter((control) => control.family === "DoD General Readiness Requirements")
        .length,
      10,
    );
    const mappings = parseIl4ParameterMappings(
      JSON.parse(
        readFileSync(path.join(repoRoot, IL4_PARAMETER_MAPPINGS_VENDOR_FILE), "utf8"),
      ),
      {
        allowedControlIds: new Set(framework.controls.map((control) => control.id)),
        paramsByControl: new Map(
          framework.controls.map((control) => [
            control.id,
            control.parameters?.organizationDefined ?? [],
          ]),
        ),
      },
    );
    assert.equal(mappingCount(mappings), 0);
    assert.equal(frameworkHasOscalSspExport(DOD_CLOUD_IL4_FRAMEWORK_ID), false);
    assert.equal(frameworkHasOscalSspExport(NIST_MODERATE_FRAMEWORK_ID), true);
    assert.equal(supportsIl4AddendumExport(DOD_CLOUD_IL4_FRAMEWORK_ID), true);
    assert.equal(supportsIl4AddendumExport(NIST_MODERATE_FRAMEWORK_ID), false);
    const project: StoredProject = {
      id: "project-1",
      name: "Regression",
      organizationId: "org-1",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      schemaVersion: 3,
      revision: 1,
      createdAt: "2026-09-28T00:00:00.000Z",
      updatedAt: "2026-09-28T00:00:00.000Z",
      metadata: createProjectMetadata({ systemName: "Regression" }),
      implementations: {},
      parameterRecords: {},
    };
    const ssp = buildSspDocument({
      project,
      framework: frameworkRegistry.require(NIST_MODERATE_FRAMEWORK_ID).getFramework(),
      descriptor: frameworkRegistry.requireDescriptor(NIST_MODERATE_FRAMEWORK_ID),
      controlRecordsByControlId: new Map(),
      evidenceByControlId: new Map(),
      generatedAt: "2026-09-28T00:00:00.000Z",
    });
    assert.equal(ssp.counts.totalItems, 287);
    assert.equal(ssp.identity.layoutId, "cf-ssp-docx");
  });
});

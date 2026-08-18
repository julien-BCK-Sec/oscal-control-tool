import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveFrameworkControls } from "@/data/framework";
import { CMMC_LEVEL_2_FRAMEWORK_ID } from "@/framework/cmmc-level-2-nist-sp-800-171-r2/identities";
import { CMMC_LEVEL_2_REQUIREMENT_COUNT } from "@/framework/cmmc-level-2-nist-sp-800-171-r2/families";
import {
  NIST_HIGH_FRAMEWORK_ID,
  NIST_LOW_FRAMEWORK_ID,
  NIST_MODERATE_FRAMEWORK_ID,
} from "@/framework/nist-sp-800-53-rev5/identities";
import {
  CANONICAL_ORGS,
  CANONICAL_PROJECTS,
  SUPPORTING_PROJECT_KEYS,
} from "./catalog";
import { DEMO_PROJECT_NAME } from "./constants";
import { DEMO_ORGANIZATION, DEMO_SYSTEM } from "./world";
import {
  buildCmmcImplementations,
  buildEarlyImplementations,
  buildEvidenceGapImplementations,
  buildFirstDoorImplementations,
  buildHighImplementations,
  cmmcAddressedCount,
} from "./supporting";

describe("canonical demo catalog", () => {
  it("preserves the Goose flagship identity", () => {
    assert.equal(CANONICAL_ORGS.cgds.name, DEMO_ORGANIZATION.name);
    assert.equal(CANONICAL_ORGS.cgds.slug, "canadian-goose-defence-system");
    assert.equal(CANONICAL_PROJECTS.flagship.name, DEMO_PROJECT_NAME);
    assert.equal(CANONICAL_PROJECTS.flagship.systemName, DEMO_SYSTEM.name);
    assert.equal(
      CANONICAL_PROJECTS.flagship.frameworkId,
      NIST_MODERATE_FRAMEWORK_ID,
    );
    assert.equal(SUPPORTING_PROJECT_KEYS.length, 6);
  });

  it("assigns CMMC Level 2 to the CUI enclave with partial progress", () => {
    const controls = resolveFrameworkControls(CMMC_LEVEL_2_FRAMEWORK_ID);
    assert.equal(controls.length, CMMC_LEVEL_2_REQUIREMENT_COUNT);
    assert.equal(CMMC_LEVEL_2_REQUIREMENT_COUNT, 110);
    assert.equal(CANONICAL_PROJECTS.cmmc.frameworkId, CMMC_LEVEL_2_FRAMEWORK_ID);

    const implementations = buildCmmcImplementations();
    assert.equal(Object.keys(implementations).length, cmmcAddressedCount());
    assert.ok(Object.keys(implementations).length < 110);
    const statuses = new Set(
      Object.values(implementations).map((row) => row.status),
    );
    assert.ok(statuses.has("implemented"));
    assert.ok(statuses.has("in-progress"));
    assert.ok(statuses.has("not-applicable"));
    assert.ok(implementations["AC.L2-3.1.1"]);
  });

  it("keeps supporting projects at distinct maturity levels", () => {
    const early = buildEarlyImplementations();
    const gap = buildEvidenceGapImplementations();
    const high = buildHighImplementations();
    const cmmc = buildCmmcImplementations();

    assert.equal(CANONICAL_PROJECTS.early.frameworkId, NIST_LOW_FRAMEWORK_ID);
    assert.equal(
      CANONICAL_PROJECTS.evidenceGap.frameworkId,
      NIST_MODERATE_FRAMEWORK_ID,
    );
    assert.equal(CANONICAL_PROJECTS.high.frameworkId, NIST_HIGH_FRAMEWORK_ID);

    assert.ok(Object.keys(early).length < Object.keys(cmmc).length);
    assert.ok(Object.keys(early).length < Object.keys(gap).length);
    assert.ok(Object.keys(cmmc).length < Object.keys(gap).length);
    assert.ok(Object.keys(high).length > Object.keys(early).length);
    assert.ok(
      Object.keys(high).length <
        resolveFrameworkControls(NIST_HIGH_FRAMEWORK_ID).length,
    );
  });

  it("assigns FirstDoor a Moderate sample project with placeholder implementations", () => {
    assert.equal(CANONICAL_ORGS.firstdoor.name, "FirstDoor");
    assert.equal(CANONICAL_ORGS.firstdoor.slug, "firstdoor");
    assert.equal(
      CANONICAL_PROJECTS.firstdoorCloud.frameworkId,
      NIST_MODERATE_FRAMEWORK_ID,
    );
    const implementations = buildFirstDoorImplementations();
    assert.ok(Object.keys(implementations).length >= 10);
    assert.ok(
      Object.keys(implementations).length <
        resolveFrameworkControls(NIST_MODERATE_FRAMEWORK_ID).length,
    );
    assert.ok(
      Object.values(implementations).every(
        (row) =>
          row.status === "implemented" || row.status === "in-progress",
      ),
    );
  });
});

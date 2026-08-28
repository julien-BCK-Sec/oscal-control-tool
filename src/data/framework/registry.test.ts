import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_FRAMEWORK_ID,
  FRAMEWORK,
  UnknownFrameworkError,
  assertProductSelectableFrameworkId,
  cmmcLevel2FrameworkProvider,
  dodCloudIl4FrameworkProvider,
  frameworkRegistry,
  isFrameworkControlId,
  isProductSelectableFramework,
  isProductSelectableFrameworkId,
  isRegisteredFrameworkId,
  listProductSelectableFrameworks,
  nistHighFrameworkProvider,
  nistLowFrameworkProvider,
  nistModerateFrameworkProvider,
  resolveFramework,
  resolveFrameworkControls,
} from "@/data/framework";
import { CMMC_LEVEL_2_FRAMEWORK_ID } from "@/framework/cmmc-level-2-nist-sp-800-171-r2/identities";
import { DOD_CLOUD_IL4_FRAMEWORK_ID } from "@/framework/dod-cloud-il4-rev5/identities";
import {
  NIST_HIGH_FRAMEWORK_ID,
  NIST_LOW_FRAMEWORK_ID,
  NIST_MODERATE_FRAMEWORK_ID,
} from "@/framework/nist-sp-800-53-rev5/identities";

describe("frameworkRegistry", () => {
  it("returns unique stable IDs for Low, Moderate, High, CMMC Level 2, and DoD IL4", () => {
    const listed = frameworkRegistry.list();
    const ids = listed.map((entry) => entry.id);
    assert.deepEqual(ids, [
      NIST_LOW_FRAMEWORK_ID,
      NIST_MODERATE_FRAMEWORK_ID,
      NIST_HIGH_FRAMEWORK_ID,
      CMMC_LEVEL_2_FRAMEWORK_ID,
      DOD_CLOUD_IL4_FRAMEWORK_ID,
    ]);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(DEFAULT_FRAMEWORK_ID, NIST_MODERATE_FRAMEWORK_ID);
  });

  it("makes DoD IL4 product-selectable without changing the Moderate default", () => {
    const selectable = listProductSelectableFrameworks().map((entry) => entry.id);
    assert.deepEqual(selectable, [
      NIST_LOW_FRAMEWORK_ID,
      NIST_MODERATE_FRAMEWORK_ID,
      NIST_HIGH_FRAMEWORK_ID,
      CMMC_LEVEL_2_FRAMEWORK_ID,
      DOD_CLOUD_IL4_FRAMEWORK_ID,
    ]);
    assert.equal(DEFAULT_FRAMEWORK_ID, NIST_MODERATE_FRAMEWORK_ID);
    assert.equal(isRegisteredFrameworkId(DOD_CLOUD_IL4_FRAMEWORK_ID), true);
    assert.equal(isProductSelectableFrameworkId(DOD_CLOUD_IL4_FRAMEWORK_ID), true);
    assert.equal(
      assertProductSelectableFrameworkId(DOD_CLOUD_IL4_FRAMEWORK_ID),
      DOD_CLOUD_IL4_FRAMEWORK_ID,
    );
    assert.equal(
      assertProductSelectableFrameworkId(NIST_MODERATE_FRAMEWORK_ID),
      NIST_MODERATE_FRAMEWORK_ID,
    );
    assert.throws(
      () => assertProductSelectableFrameworkId("not-a-framework"),
      /Unknown framework/,
    );
    assert.equal(
      isProductSelectableFramework({
        id: "gated-framework",
        title: "Gated",
        catalog: "Gated",
        revision: "",
        profile: "Test",
        provider: "test",
        source: "test",
        productSelectable: false,
      }),
      false,
    );
  });

  it("exposes catalog/revision/profile metadata without using display names as IDs", () => {
    const moderate = frameworkRegistry.requireDescriptor(
      NIST_MODERATE_FRAMEWORK_ID,
    );
    assert.equal(moderate.catalog, "NIST SP 800-53");
    assert.equal(moderate.revision, "Rev. 5");
    assert.equal(moderate.profile, "Moderate");
    assert.equal(moderate.provider, "nist-oscal");
    assert.notEqual(moderate.id, moderate.title);
    assert.ok(moderate.oscalProfileUri?.includes("MODERATE-baseline_profile"));
    const cmmc = frameworkRegistry.requireDescriptor(CMMC_LEVEL_2_FRAMEWORK_ID);
    assert.equal(cmmc.catalog, "CMMC");
    assert.equal(cmmc.profile, "Level 2");
    assert.equal(cmmc.itemSingular, "requirement");
    assert.equal(cmmc.itemPlural, "requirements");
    assert.equal(cmmc.oscalProfileUri, undefined);
    assert.equal(cmmc.provider, "cmmc-nist-800-171");
    const il4 = frameworkRegistry.requireDescriptor(DOD_CLOUD_IL4_FRAMEWORK_ID);
    assert.equal(il4.catalog, "DoD Cloud");
    assert.equal(il4.revision, "");
    assert.equal(il4.profile, "Impact Level 4");
    assert.equal(il4.title, "DoD Cloud Impact Level 4");
    assert.equal(il4.provider, "dod-cloud-overlay");
    assert.equal(il4.productSelectable, true);
    assert.equal(il4.oscalProfileUri, undefined);
    assert.notEqual(il4.id, il4.title);
  });

  it("resolves Low, Moderate, and High providers successfully", () => {
    const low = frameworkRegistry.require(NIST_LOW_FRAMEWORK_ID).getFramework();
    const moderate = frameworkRegistry
      .require(NIST_MODERATE_FRAMEWORK_ID)
      .getFramework();
    const high = frameworkRegistry.require(NIST_HIGH_FRAMEWORK_ID).getFramework();

    assert.equal(low.id, NIST_LOW_FRAMEWORK_ID);
    assert.equal(moderate.id, NIST_MODERATE_FRAMEWORK_ID);
    assert.equal(high.id, NIST_HIGH_FRAMEWORK_ID);
    assert.equal(low, nistLowFrameworkProvider.getFramework());
    assert.equal(moderate, nistModerateFrameworkProvider.getFramework());
    assert.equal(high, nistHighFrameworkProvider.getFramework());
    const cmmc = frameworkRegistry.require(CMMC_LEVEL_2_FRAMEWORK_ID).getFramework();
    assert.equal(cmmc.id, CMMC_LEVEL_2_FRAMEWORK_ID);
    assert.equal(cmmc, cmmcLevel2FrameworkProvider.getFramework());
    assert.equal(cmmc.controls.length, 110);
    assert.equal(cmmc.controls[0]?.id, "AC.L2-3.1.1");
    assert.equal(cmmc.controls[0]?.originId, "3.1.1");
    assert.equal(moderate, FRAMEWORK);
    const il4 = frameworkRegistry.require(DOD_CLOUD_IL4_FRAMEWORK_ID).getFramework();
    assert.equal(il4.id, DOD_CLOUD_IL4_FRAMEWORK_ID);
    assert.equal(il4, dodCloudIl4FrameworkProvider.getFramework());
    assert.equal(il4.controls.length, 345);
  });

  it("keeps Low, Moderate, and High control sets distinct", () => {
    const low = resolveFrameworkControls(NIST_LOW_FRAMEWORK_ID);
    const moderate = resolveFrameworkControls(NIST_MODERATE_FRAMEWORK_ID);
    const high = resolveFrameworkControls(NIST_HIGH_FRAMEWORK_ID);

    assert.ok(low.length > 5);
    assert.ok(moderate.length > low.length);
    assert.ok(high.length > moderate.length);
    assert.ok(low.every((control) => moderate.some((m) => m.id === control.id)));
    assert.ok(
      moderate.every((control) => high.some((h) => h.id === control.id)),
    );
    assert.ok(isFrameworkControlId(NIST_MODERATE_FRAMEWORK_ID, "ac-2"));
    assert.equal(isFrameworkControlId(NIST_LOW_FRAMEWORK_ID, "not-a-control"), false);
    assert.ok(isFrameworkControlId(CMMC_LEVEL_2_FRAMEWORK_ID, "AC.L2-3.1.1"));
    assert.equal(isFrameworkControlId(CMMC_LEVEL_2_FRAMEWORK_ID, "ac-2"), false);
    assert.equal(
      isFrameworkControlId(NIST_MODERATE_FRAMEWORK_ID, "AC.L2-3.1.1"),
      false,
    );
  });

  it("keeps NIST Moderate, CMMC, and DoD IL4 populations isolated", () => {
    const moderate = resolveFrameworkControls(NIST_MODERATE_FRAMEWORK_ID);
    const cmmc = resolveFrameworkControls(CMMC_LEVEL_2_FRAMEWORK_ID);
    const il4 = resolveFrameworkControls(DOD_CLOUD_IL4_FRAMEWORK_ID);
    const moderateIds = new Set(moderate.map((control) => control.id));
    const cmmcIds = new Set(cmmc.map((control) => control.id));
    const il4Ids = new Set(il4.map((control) => control.id));

    assert.equal(moderate.length, 287);
    assert.equal(cmmc.length, 110);
    assert.equal(il4.length, 345);
    const low = resolveFrameworkControls(NIST_LOW_FRAMEWORK_ID);
    const high = resolveFrameworkControls(NIST_HIGH_FRAMEWORK_ID);
    assert.equal(low.length, 149);
    assert.equal(high.length, 370);
    assert.equal(moderateIds.has("grr-1"), false);
    assert.equal(moderateIds.has("grr-10"), false);
    assert.equal(moderateIds.has("sc-46"), false);
    assert.equal(moderateIds.has("sc-24"), false);
    assert.equal(cmmcIds.has("grr-1"), false);
    assert.equal(cmmcIds.has("ac-2"), false);
    assert.equal(il4Ids.has("grr-1"), true);
    assert.equal(il4Ids.has("sc-46"), true);
    assert.equal(il4Ids.has("AC.L2-3.1.1"), false);
    assert.equal(isFrameworkControlId(DOD_CLOUD_IL4_FRAMEWORK_ID, "ac-1"), true);
    assert.equal(isFrameworkControlId(DOD_CLOUD_IL4_FRAMEWORK_ID, "grr-10"), true);
    assert.equal(
      isFrameworkControlId(NIST_MODERATE_FRAMEWORK_ID, "grr-1"),
      false,
    );
    assert.equal(isFrameworkControlId(CMMC_LEVEL_2_FRAMEWORK_ID, "grr-1"), false);
  });

  it("fails closed for unknown framework IDs", () => {
    assert.equal(frameworkRegistry.get("not-a-framework"), undefined);
    assert.equal(isRegisteredFrameworkId("not-a-framework"), false);
    assert.throws(
      () => resolveFramework("not-a-framework"),
      (error: unknown) =>
        error instanceof UnknownFrameworkError &&
        error.frameworkId === "not-a-framework",
    );
  });
});

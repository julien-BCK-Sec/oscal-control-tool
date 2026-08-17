import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_FRAMEWORK_ID,
  FRAMEWORK,
  UnknownFrameworkError,
  frameworkRegistry,
  isFrameworkControlId,
  isRegisteredFrameworkId,
  nistHighFrameworkProvider,
  nistLowFrameworkProvider,
  nistModerateFrameworkProvider,
  resolveFramework,
  resolveFrameworkControls,
} from "@/data/framework";
import {
  NIST_HIGH_FRAMEWORK_ID,
  NIST_LOW_FRAMEWORK_ID,
  NIST_MODERATE_FRAMEWORK_ID,
} from "@/framework/nist-sp-800-53-rev5/identities";

describe("frameworkRegistry", () => {
  it("returns unique stable IDs for Low, Moderate, and High", () => {
    const listed = frameworkRegistry.list();
    const ids = listed.map((entry) => entry.id);
    assert.deepEqual(ids, [
      NIST_LOW_FRAMEWORK_ID,
      NIST_MODERATE_FRAMEWORK_ID,
      NIST_HIGH_FRAMEWORK_ID,
    ]);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(DEFAULT_FRAMEWORK_ID, NIST_MODERATE_FRAMEWORK_ID);
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
    assert.equal(moderate, FRAMEWORK);
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

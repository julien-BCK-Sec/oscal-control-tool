import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { frameworkRegistry } from "@/data/framework";
import { CMMC_LEVEL_2_FRAMEWORK_ID } from "@/framework/cmmc-level-2-nist-sp-800-171-r2/identities";
import {
  evidenceCoverageDisclaimer,
  findFrameworkDescriptor,
  formatFrameworkFamilyGroup,
  formatFrameworkLabel,
  formatFrameworkProfile,
  frameworkItemTerms,
  groupFrameworkDescriptors,
} from "./presentation";

describe("framework presentation", () => {
  it("formats registry descriptors without hard-coded Moderate conditionals", () => {
    const descriptors = frameworkRegistry.list();
    assert.deepEqual(
      descriptors.map((entry) => formatFrameworkLabel(entry)),
      [
        "NIST SP 800-53 Rev. 5 — Low",
        "NIST SP 800-53 Rev. 5 — Moderate",
        "NIST SP 800-53 Rev. 5 — High",
        "CMMC Level 2",
      ],
    );
    assert.deepEqual(
      descriptors.map((entry) => formatFrameworkProfile(entry)),
      ["Low", "Moderate", "High", "Level 2"],
    );
    const groups = groupFrameworkDescriptors(descriptors);
    assert.deepEqual(
      groups.map((group) => group.label),
      ["NIST SP 800-53 Rev. 5", "CMMC"],
    );
    assert.equal(
      formatFrameworkFamilyGroup(
        frameworkRegistry.requireDescriptor(CMMC_LEVEL_2_FRAMEWORK_ID),
      ),
      "CMMC",
    );
    assert.deepEqual(
      frameworkItemTerms(
        frameworkRegistry.requireDescriptor(CMMC_LEVEL_2_FRAMEWORK_ID),
      ),
      { singular: "requirement", plural: "requirements" },
    );
  });

  it("explains that CMMC evidence coverage is not an assessment result", () => {
    assert.match(
      evidenceCoverageDisclaimer({ singular: "control", plural: "controls" }),
      /not a compliance score/,
    );
    assert.doesNotMatch(
      evidenceCoverageDisclaimer({ singular: "control", plural: "controls" }),
      /MET/,
    );
    assert.match(
      evidenceCoverageDisclaimer({
        singular: "requirement",
        plural: "requirements",
      }),
      /not a CMMC assessment result/,
    );
    assert.match(
      evidenceCoverageDisclaimer({
        singular: "requirement",
        plural: "requirements",
      }),
      /SPRS score/,
    );
  });

  it("looks up descriptors by id", () => {
    const descriptors = frameworkRegistry.list();
    const moderate = descriptors.find((entry) => entry.profile === "Moderate");
    assert.ok(moderate);
    assert.equal(
      findFrameworkDescriptor(descriptors, moderate.id)?.id,
      moderate.id,
    );
    assert.equal(findFrameworkDescriptor(descriptors, "missing"), undefined);
  });
});

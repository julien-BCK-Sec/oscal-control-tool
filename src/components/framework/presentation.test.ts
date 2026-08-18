import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { frameworkRegistry } from "@/data/framework";
import {
  findFrameworkDescriptor,
  formatFrameworkLabel,
  formatFrameworkProfile,
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
      ],
    );
    assert.deepEqual(
      descriptors.map((entry) => formatFrameworkProfile(entry)),
      ["Low", "Moderate", "High"],
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

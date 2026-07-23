import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_EVIDENCE_REQUIREMENT,
  isEvidenceMissing,
  isEvidenceRequirement,
  isEvidenceStatus,
  isEvidenceType,
  parseCreateEvidenceInput,
  parseUpdateEvidenceInput,
} from "@/data/evidence";

describe("evidence domain", () => {
  it("defaults evidence requirement to required", () => {
    assert.equal(DEFAULT_EVIDENCE_REQUIREMENT, "required");
    assert.equal(isEvidenceRequirement("required"), true);
    assert.equal(isEvidenceRequirement("optional"), true);
    assert.equal(isEvidenceRequirement("not_required"), true);
    assert.equal(isEvidenceRequirement("maybe"), false);
  });

  it("treats only required + zero non-archived links as missing", () => {
    assert.equal(isEvidenceMissing("required", 0), true);
    assert.equal(isEvidenceMissing("required", 1), false);
    assert.equal(isEvidenceMissing("optional", 0), false);
    assert.equal(isEvidenceMissing("not_required", 0), false);
  });

  it("parses create and update inputs", () => {
    const created = parseCreateEvidenceInput({
      projectId: "p1",
      title: " Access policy ",
      evidenceType: "policy",
      controlIds: ["ac-2", "ac-2", "ac-3"],
    });
    assert.ok(created);
    assert.equal(created?.title, "Access policy");
    assert.equal(created?.status, "draft");
    assert.deepEqual(created?.controlIds, ["ac-2", "ac-3"]);

    assert.equal(
      parseCreateEvidenceInput({
        projectId: "p1",
        title: "X",
        evidenceType: "policy",
        status: "archived",
      }),
      null,
    );

    const updated = parseUpdateEvidenceInput({
      title: "Revised",
      status: "active",
    });
    assert.ok(updated);
    assert.equal(updated?.title, "Revised");
    assert.equal(updated?.status, "active");
  });

  it("validates closed catalogs", () => {
    assert.equal(isEvidenceType("document"), true);
    assert.equal(isEvidenceType("blob"), false);
    assert.equal(isEvidenceStatus("draft"), true);
    assert.equal(isEvidenceStatus("gone"), false);
  });
});

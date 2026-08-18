import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { deriveCmmcLevel2Framework, presentationTitleFromStatement } from "./derive";
import {
  CMMC_LEVEL_2_REQUIREMENT_COUNT,
  cmmcLevel2ControlId,
  familyForOriginId,
} from "./families";
import { CMMC_LEVEL_2_IDENTITY } from "./identities";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function loadCsv(): string {
  return readFileSync(
    path.join(
      repoRoot,
      "vendor/nist/sp800-171/r2",
      CMMC_LEVEL_2_IDENTITY.vendorCsvFile,
    ),
    "utf8",
  );
}

describe("deriveCmmcLevel2Framework", () => {
  it("derives 110 CMMC Level 2 requirements from the pinned NIST CSV", () => {
    const result = deriveCmmcLevel2Framework(loadCsv(), CMMC_LEVEL_2_IDENTITY);
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.framework.id, CMMC_LEVEL_2_IDENTITY.id);
    assert.equal(result.framework.controls.length, CMMC_LEVEL_2_REQUIREMENT_COUNT);
    assert.equal(
      new Set(result.framework.controls.map((control) => control.id)).size,
      CMMC_LEVEL_2_REQUIREMENT_COUNT,
    );
  });

  it("uses CMMC identification numbers and retains NIST origin IDs", () => {
    const result = deriveCmmcLevel2Framework(loadCsv(), CMMC_LEVEL_2_IDENTITY);
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    const first = result.framework.controls[0];
    assert.equal(first?.id, "AC.L2-3.1.1");
    assert.equal(first?.originId, "3.1.1");
    assert.equal(first?.family, "Access Control");
    assert.match(first?.statement ?? "", /authorized users/);
    assert.equal(cmmcLevel2ControlId("3.13.11"), "SC.L2-3.13.11");
    assert.equal(familyForOriginId("3.12.4")?.abbreviation, "CA");

    const last = result.framework.controls.at(-1);
    assert.equal(last?.id, "SI.L2-3.14.7");
    assert.equal(last?.originId, "3.14.7");

    for (const control of result.framework.controls) {
      assert.match(control.id, /^[A-Z]{2}\.L2-3\.\d+\.\d+$/);
      assert.equal(control.id, cmmcLevel2ControlId(control.originId ?? ""));
      assert.equal(control.originId, control.id.slice("XX.L2-".length));
    }

    for (const family of [
      { title: "Access Control", count: 22 },
      { title: "Awareness and Training", count: 3 },
      { title: "Audit and Accountability", count: 9 },
      { title: "Configuration Management", count: 9 },
      { title: "Identification and Authentication", count: 11 },
      { title: "Incident Response", count: 3 },
      { title: "Maintenance", count: 6 },
      { title: "Media Protection", count: 9 },
      { title: "Personnel Security", count: 2 },
      { title: "Physical Protection", count: 6 },
      { title: "Risk Assessment", count: 3 },
      { title: "Security Assessment", count: 4 },
      { title: "System and Communications Protection", count: 16 },
      { title: "System and Information Integrity", count: 7 },
    ]) {
      assert.equal(
        result.framework.controls.filter((control) => control.family === family.title)
          .length,
        family.count,
        family.title,
      );
    }

    const ac111 = result.framework.controls.find((control) => control.id === "AC.L2-3.1.1");
    assert.match(ac111?.statement ?? "", /authorized users/);
    const sc1311 = result.framework.controls.find(
      (control) => control.id === "SC.L2-3.13.11",
    );
    assert.equal(sc1311?.family, "System and Communications Protection");
    assert.match(sc1311?.statement ?? "", /FIPS/i);
  });

  it("does not import discussion or assessment-objective text", () => {
    const result = deriveCmmcLevel2Framework(loadCsv(), CMMC_LEVEL_2_IDENTITY);
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    for (const control of result.framework.controls) {
      assert.doesNotMatch(control.statement, /3\.\d+\.\d+\[[a-z]\]/i);
      assert.doesNotMatch(control.statement, /Access control policies \(e\.g\./);
    }
  });

  it("fails closed for truncated CSV input", () => {
    const result = deriveCmmcLevel2Framework(
      "Family,Basic/Derived Security Requirement,Identifier,Sort-As,Security Requirement,Discussion\nAccess Control,Basic,3.1.1,03.01.01,Limit system access.,\n",
      CMMC_LEVEL_2_IDENTITY,
    );
    assert.equal(result.ok, false);
  });
});

describe("presentationTitleFromStatement", () => {
  it("uses the first sentence without a trailing period", () => {
    assert.equal(
      presentationTitleFromStatement(
        "Limit system access to authorized users, processes acting on behalf of authorized users, and devices (including other systems).",
      ),
      "Limit system access to authorized users, processes acting on behalf of authorized users, and devices (including other systems)",
    );
  });
});

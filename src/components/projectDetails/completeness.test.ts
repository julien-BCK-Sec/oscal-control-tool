import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_PROJECT_METADATA } from "@/data/project";
import {
  boundaryEnvironmentCompleteness,
  documentedFieldSummary,
  informationTypesAndCategorizationCompleteness,
  operationalStatusCompleteness,
  sspOrganizationCompleteness,
  systemIdentityCompleteness,
  systemRolesCompleteness,
} from "./completeness";

describe("system-characteristics documentation completeness", () => {
  it("describes empty metadata as not documented without inferring values", () => {
    const empty = DEFAULT_PROJECT_METADATA;
    assert.equal(systemIdentityCompleteness(empty).caption, "Not documented");
    assert.equal(sspOrganizationCompleteness(empty).caption, "Not documented");
    assert.equal(
      boundaryEnvironmentCompleteness(empty).caption,
      "Not documented",
    );
    assert.equal(systemRolesCompleteness(empty).caption, "None documented");
    assert.match(
      informationTypesAndCategorizationCompleteness(empty).caption,
      /categorization not documented/,
    );
    assert.match(
      informationTypesAndCategorizationCompleteness(empty).caption,
      /no information types documented/,
    );
    assert.equal(
      operationalStatusCompleteness(empty).caption,
      "Not documented",
    );
  });

  it("does not treat a filled system name as SSP organization or categorization", () => {
    const partial = {
      ...DEFAULT_PROJECT_METADATA,
      systemName: "SGOP",
      systemDescription: "Mission overview.",
    };
    const identity = systemIdentityCompleteness(partial);
    assert.equal(identity.fullyDocumented, false);
    assert.equal(identity.caption, "2 fields undocumented");
    assert.equal(sspOrganizationCompleteness(partial).caption, "Not documented");
    assert.match(
      informationTypesAndCategorizationCompleteness(partial).caption,
      /categorization not documented/,
    );
  });

  it("counts documented fields without calling the result compliance", () => {
    assert.equal(documentedFieldSummary(0, 4).caption, "Not documented");
    assert.equal(documentedFieldSummary(4, 4).caption, "Documented");
    assert.equal(documentedFieldSummary(3, 4).caption, "1 field undocumented");
    assert.doesNotMatch(documentedFieldSummary(4, 4).caption, /compliant/i);
    assert.doesNotMatch(documentedFieldSummary(0, 4).caption, /fail/i);
  });
});

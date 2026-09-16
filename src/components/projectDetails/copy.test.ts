import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_PROJECT_METADATA } from "@/data/project";
import {
  AUTHORIZATION_BOUNDARY_HINT,
  CATEGORIZATION_HINT,
  DOD_IMPACT_HINT,
  documentedAgainstCopy,
  OPERATIONAL_STATUS_HINT,
  PROJECT_DETAILS_INTRO,
  SSP_ORGANIZATION_HINT,
  SYSTEM_OVERVIEW_HINT,
  SYSTEM_ROLES_HINT,
} from "./copy";
import {
  createEmptyInformationType,
  createEmptyInterconnection,
  createEmptySystemRole,
} from "./rows";

describe("project details copy", () => {
  it("states that missing system characteristics stay missing", () => {
    assert.match(PROJECT_DETAILS_INTRO, /does not infer/i);
    assert.match(PROJECT_DETAILS_INTRO, /framework/i);
    assert.match(PROJECT_DETAILS_INTRO, /tenant/i);
    assert.match(SYSTEM_OVERVIEW_HINT, /not the authorization boundary/i);
    assert.match(AUTHORIZATION_BOUNDARY_HINT, /overview/i);
  });

  it("distinguishes SSP organization, SSP roles, and operational status from application identity", () => {
    assert.match(SSP_ORGANIZATION_HINT, /not your Control Freak tenant/i);
    assert.match(SYSTEM_ROLES_HINT, /not Control Freak user accounts/i);
    assert.match(SYSTEM_ROLES_HINT, /owner\/reviewer/i);
    assert.match(OPERATIONAL_STATUS_HINT, /not authorization status/i);
  });

  it("does not treat framework selection as categorization", () => {
    assert.match(CATEGORIZATION_HINT, /Selecting a framework does not set/i);
    assert.match(DOD_IMPACT_HINT, /Distinct from the project framework/i);
    assert.match(
      documentedAgainstCopy("DoD Cloud Impact Level 4"),
      /not a FIPS 199 categorization/,
    );
    assert.match(
      documentedAgainstCopy("NIST SP 800-53 Rev. 5 — Moderate"),
      /not a FIPS 199 categorization/,
    );
  });
});

describe("project details empty rows", () => {
  it("creates empty rows without inferring categorization, DoD IL, or identities", () => {
    const role = createEmptySystemRole("role-1");
    const informationType = createEmptyInformationType("info-1");
    const interconnection = createEmptyInterconnection("conn-1");

    assert.equal(role.name, "");
    assert.equal(role.role, "system-owner");
    assert.equal(informationType.title, "");
    assert.equal(informationType.confidentialityImpact, undefined);
    assert.equal(interconnection.name, "");
    assert.equal(DEFAULT_PROJECT_METADATA.securityCategorization, null);
    assert.equal(DEFAULT_PROJECT_METADATA.dodCloudImpactLevel, null);
    assert.deepEqual(DEFAULT_PROJECT_METADATA.systemRoles, []);
  });
});

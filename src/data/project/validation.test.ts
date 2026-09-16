import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_PROJECT_METADATA } from "./defaults";
import { createProjectMetadata, parseProjectMetadata } from "./validation";

describe("project metadata v2 parsing", () => {
  it("migrates v1-shaped metadata without inferring new fields", () => {
    const parsed = parseProjectMetadata({
      systemName: "SGOP",
      organizationName: "CGDS",
      systemDescription: "Overview",
    });
    assert.deepEqual(parsed, {
      ...DEFAULT_PROJECT_METADATA,
      systemName: "SGOP",
      organizationName: "CGDS",
      systemDescription: "Overview",
    });
    assert.equal(parsed?.securityCategorization, null);
    assert.equal(parsed?.dodCloudImpactLevel, null);
    assert.deepEqual(parsed?.systemRoles, []);
  });

  it("round-trips authored v2 system characteristics", () => {
    const metadata = createProjectMetadata({
      systemName: "SGOP",
      organizationName: "CGDS",
      systemDescription: "Overview",
      systemNameShort: "SGOP",
      systemIdentifier: "CGDS-SGOP-001",
      authorizationBoundary: "Inside the nest.",
      environmentOfOperation: "Honkwater Barracks.",
      operationalStatus: "operational",
      operationalStatusRemarks: "Production watch floor.",
      securityCategorization: {
        confidentiality: "moderate",
        integrity: "moderate",
        availability: "moderate",
        rationale: "Mission tasking records.",
      },
      dodCloudImpactLevel: { level: "il4", notes: "Documentation assertion only." },
      systemRoles: [
        {
          id: "role-1",
          role: "system-owner",
          name: "Gary Mercer",
          title: "Director of Goose Operations",
        },
      ],
      informationTypes: [
        {
          id: "info-1",
          title: "Deployment orders",
          confidentialityImpact: "moderate",
        },
      ],
      interconnections: [
        {
          id: "conn-1",
          name: "Weather feed",
          direction: "inbound",
        },
      ],
    });
    const parsed = parseProjectMetadata(metadata);
    assert.deepEqual(parsed, metadata);
  });

  it("rejects invalid FIPS impact values instead of coercing them", () => {
    assert.equal(
      parseProjectMetadata({
        systemName: "S",
        organizationName: "O",
        systemDescription: "D",
        securityCategorization: { confidentiality: "Moderate" },
      }),
      null,
    );
  });

  it("rejects invalid DoD impact-level values", () => {
    assert.equal(
      parseProjectMetadata({
        systemName: "S",
        organizationName: "O",
        systemDescription: "D",
        dodCloudImpactLevel: { level: "IL4" },
      }),
      null,
    );
  });

  it("accepts a draft other role without a label so empty UI rows can autosave", () => {
    const parsed = parseProjectMetadata({
      systemName: "S",
      organizationName: "O",
      systemDescription: "D",
      systemRoles: [{ id: "r1", role: "other", name: "Pat" }],
    });
    assert.ok(parsed);
    assert.equal(parsed.systemRoles[0]?.role, "other");
    assert.equal(parsed.systemRoles[0]?.otherRoleLabel, undefined);
  });

  it("ignores unknown extra keys without treating them as system facts", () => {
    const parsed = parseProjectMetadata({
      systemName: "S",
      organizationName: "O",
      systemDescription: "D",
      systemPurpose: "should not be copied",
      frameworkId: "nist-sp-800-53-rev5-moderate",
    });
    assert.ok(parsed);
    assert.equal(
      Object.prototype.hasOwnProperty.call(parsed, "systemPurpose"),
      false,
    );
    assert.equal(parsed.authorizationBoundary, "");
  });
});

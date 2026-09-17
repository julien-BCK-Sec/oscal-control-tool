import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_PROJECT_METADATA } from "@/data/project";
import {
  buildStoredProjectDocument,
  buildStoredProjectDocumentV1,
  buildStoredProjectDocumentV2,
  migrateProjectDocument,
  parseProjectDocumentJson,
} from "./document";

describe("project document validation", () => {
  it("migrates a valid v1 document to v3 without inferring system characteristics or parameter records", () => {
    const document = buildStoredProjectDocumentV1({
      id: "p1",
      name: "Demo",
      frameworkId: "nist-sp-800-53-rev5-moderate",
      metadata: {
        systemName: "Demo",
        organizationName: "Org",
        systemDescription: "Existing overview",
      },
      implementations: {
        "ac-1": { status: "implemented", narrative: "ok" },
        "ac-2.1": { status: "in-progress", narrative: "enh" },
      },
    });

    const parsed = parseProjectDocumentJson(JSON.stringify(document));
    assert.equal(parsed.ok, true);
    if (!parsed.ok) {
      return;
    }
    assert.equal(parsed.document.schemaVersion, 3);
    assert.deepEqual(parsed.document.project.parameterRecords, {});
    assert.equal(parsed.document.project.implementations["ac-2.1"]?.narrative, "enh");
    assert.equal(parsed.document.project.metadata.systemName, "Demo");
    assert.equal(parsed.document.project.metadata.organizationName, "Org");
    assert.equal(
      parsed.document.project.metadata.systemDescription,
      "Existing overview",
    );
    assert.equal(parsed.document.project.metadata.authorizationBoundary, "");
    assert.equal(parsed.document.project.metadata.securityCategorization, null);
    assert.equal(parsed.document.project.metadata.dodCloudImpactLevel, null);
    assert.deepEqual(parsed.document.project.metadata.systemRoles, []);
    assert.deepEqual(parsed.document.project.metadata.informationTypes, []);
    assert.deepEqual(parsed.document.project.metadata.interconnections, []);
  });

  it("round-trips a v3 document including parameter records", () => {
    const document = buildStoredProjectDocument({
      id: "p1",
      name: "Demo",
      frameworkId: "nist-sp-800-53-rev5-moderate",
      metadata: {
        ...DEFAULT_PROJECT_METADATA,
        systemName: "Demo",
        authorizationBoundary: "Boundary",
        systemRoles: [
          { id: "r1", role: "system-owner", name: "Ada" },
        ],
      },
      implementations: {},
      parameterRecords: {
        "ac-07_odp.01": {
          controlId: "ac-7",
          parameterId: "ac-07_odp.01",
          intent: "organization-defined",
          body: { form: "assignment", values: ["5"] },
        },
      },
    });
    const parsed = parseProjectDocumentJson(JSON.stringify(document));
    assert.equal(parsed.ok, true);
    if (!parsed.ok) {
      return;
    }
    assert.equal(parsed.document.schemaVersion, 3);
    assert.equal(
      parsed.document.project.metadata.authorizationBoundary,
      "Boundary",
    );
    assert.equal(parsed.document.project.metadata.systemRoles[0]?.name, "Ada");
    assert.equal(
      parsed.document.project.parameterRecords["ac-07_odp.01"]?.body?.form,
      "assignment",
    );
  });

  it("migrates a historical v2 document to v3 with empty parameter records and no narrative inference", () => {
    const document = buildStoredProjectDocumentV2({
      id: "p1",
      name: "Demo",
      frameworkId: "nist-sp-800-53-rev5-moderate",
      metadata: {
        ...DEFAULT_PROJECT_METADATA,
        systemName: "Demo",
      },
      implementations: {
        "ac-7": {
          status: "implemented",
          narrative: "FeatherAuth locks an account after five failed logon attempts within 15 minutes.",
        },
      },
    });
    const parsed = parseProjectDocumentJson(JSON.stringify(document));
    assert.equal(parsed.ok, true);
    if (!parsed.ok) {
      return;
    }
    assert.equal(parsed.document.schemaVersion, 3);
    assert.deepEqual(parsed.document.project.parameterRecords, {});
    assert.match(
      parsed.document.project.implementations["ac-7"]?.narrative ?? "",
      /five failed/,
    );
  });

  it("does not copy v1 extra keys into v2 metadata", () => {
    const parsed = migrateProjectDocument({
      schemaVersion: 1,
      project: {
        id: "p1",
        name: "Demo",
        frameworkId: "nist-sp-800-53-rev5-moderate",
        metadata: {
          systemName: "Demo",
          organizationName: "Org",
          systemDescription: "Overview",
          authorizationBoundary: "must not migrate from v1 extra key",
        },
        implementations: {},
      },
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) {
      return;
    }
    assert.equal(parsed.document.project.metadata.authorizationBoundary, "");
  });

  it("rejects unsupported future schema versions", () => {
    const result = migrateProjectDocument({
      schemaVersion: 99,
      project: {},
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.kind, "unsupported-schema");
    }
  });

  it("rejects invalid implementations", () => {
    const result = parseProjectDocumentJson(
      JSON.stringify({
        schemaVersion: 1,
        project: {
          id: "p1",
          name: "x",
          frameworkId: "nist-sp-800-53-rev5-moderate",
          metadata: {
            systemName: "",
            organizationName: "",
            systemDescription: "",
          },
          implementations: {
            "ac-1": { status: "nope", narrative: "" },
          },
        },
      }),
    );
    assert.equal(result.ok, false);
  });

  it("rejects invalid v2 system-characteristic enums", () => {
    const result = migrateProjectDocument({
      schemaVersion: 2,
      project: {
        id: "p1",
        name: "x",
        frameworkId: "nist-sp-800-53-rev5-moderate",
        metadata: {
          systemName: "S",
          organizationName: "O",
          systemDescription: "D",
          operationalStatus: "authorized",
        },
        implementations: {},
      },
    });
    assert.equal(result.ok, false);
  });
});

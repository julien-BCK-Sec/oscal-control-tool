import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildStoredProjectDocumentV1,
  migrateProjectDocument,
  parseProjectDocumentJson,
} from "./document";

describe("project document validation", () => {
  it("parses a valid v1 document", () => {
    const document = buildStoredProjectDocumentV1({
      id: "p1",
      name: "Demo",
      frameworkId: "nist-sp-800-53-rev5-moderate",
      metadata: {
        systemName: "Demo",
        organizationName: "Org",
        systemDescription: "",
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
    assert.equal(parsed.document.project.implementations["ac-2.1"]?.narrative, "enh");
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
});

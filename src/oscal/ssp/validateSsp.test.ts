import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FRAMEWORK_CONTROLS } from "@/data/framework";
import { assembleProject } from "@/domain";
import { projectToOscalSsp } from "@/oscal/ssp/exportSsp";
import { validateOscalSspDocument } from "@/oscal/ssp/validateSsp";
import type { OscalSspDocument } from "@/oscal/ssp/types";

function createDeterministicUuidFactory() {
  let sequence = 0;
  return () => {
    sequence += 1;
    return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
  };
}

function buildValidSsp(): OscalSspDocument {
  const project = assembleProject({
    metadata: {
      systemName: "Validation Test System",
      organizationName: "Example Organization",
      systemDescription: "System used for schema validation tests.",
    },
    frameworkControls: FRAMEWORK_CONTROLS,
    implementations: {
      "ac-1": {
        status: "implemented",
        narrative: "Policies are documented and reviewed annually.",
      },
    },
  });

  return projectToOscalSsp(project, {
    lastModified: "2026-07-21T15:00:00.000Z",
    createUuid: createDeterministicUuidFactory(),
  });
}

describe("validateOscalSspDocument", () => {
  it("accepts the current generated SSP against the pinned NIST schema", () => {
    const document = buildValidSsp();
    const result = validateOscalSspDocument(document);
    assert.equal(result.ok, true);
  });

  it("rejects removal of a required field", () => {
    const document = buildValidSsp();
    const clone = structuredClone(document) as {
      "system-security-plan": Record<string, unknown>;
    };
    delete clone["system-security-plan"].metadata;

    const result = validateOscalSspDocument(clone as OscalSspDocument);
    assert.equal(result.ok, false);
    if (result.ok) {
      return;
    }
    assert.match(result.message, /schema validation failed/i);
    assert.ok(
      result.ajvErrors.some(
        (error) =>
          error.keyword === "required" &&
          error.params?.missingProperty === "metadata",
      ),
    );
  });

  it("rejects an invalid UUID", () => {
    const document = buildValidSsp();
    document["system-security-plan"].uuid = "not-a-uuid";

    const result = validateOscalSspDocument(document);
    assert.equal(result.ok, false);
    if (result.ok) {
      return;
    }
    assert.ok(result.ajvErrors.length > 0);
    assert.ok(
      result.issues.some(
        (issue) =>
          issue.path.includes("uuid") ||
          issue.message.toLowerCase().includes("pattern") ||
          issue.keyword === "pattern",
      ),
    );
  });

  it("rejects an invalid enum value", () => {
    const document = buildValidSsp();
    document["system-security-plan"]["system-characteristics"].status.state =
      "not-a-valid-state" as "under-development";

    const result = validateOscalSspDocument(document);
    assert.equal(result.ok, false);
    if (result.ok) {
      return;
    }
    assert.ok(
      result.ajvErrors.some(
        (error) =>
          error.keyword === "enum" ||
          (typeof error.message === "string" &&
            error.message.includes("equal to one of the allowed values")),
      ),
    );
  });

  it("rejects an incorrectly shaped field", () => {
    const document = buildValidSsp();
    const ssp = document["system-security-plan"] as unknown as Record<
      string,
      unknown
    >;
    ssp["system-implementation"] = "not-an-object";

    const result = validateOscalSspDocument(document);
    assert.equal(result.ok, false);
    if (result.ok) {
      return;
    }
    assert.ok(
      result.ajvErrors.some(
        (error) =>
          error.keyword === "type" ||
          (typeof error.message === "string" &&
            error.message.includes("object")),
      ),
    );
  });
});

import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import {
  NIST_HIGH_FRAMEWORK_ID,
  NIST_LOW_FRAMEWORK_ID,
  NIST_MODERATE_FRAMEWORK_ID,
} from "@/framework/nist-sp-800-53-rev5/identities";
import {
  invalidFrameworkControlIds,
  parseRegisteredFrameworkId,
  resolveAuthoritativeFrameworkId,
  unknownFrameworkLoadError,
} from "./framework-identity";

describe("framework identity helpers", () => {
  it("parses registered framework IDs and rejects unknown values", () => {
    assert.equal(
      parseRegisteredFrameworkId(` ${NIST_MODERATE_FRAMEWORK_ID} `),
      NIST_MODERATE_FRAMEWORK_ID,
    );
    assert.throws(
      () => parseRegisteredFrameworkId("not-a-framework"),
      /Unknown framework/,
    );
  });

  it("uses the column framework ID and warns when the document copy differs", () => {
    const warn = mock.method(console, "warn", () => undefined);
    try {
      const resolved = resolveAuthoritativeFrameworkId({
        projectId: "project-1",
        columnFrameworkId: NIST_MODERATE_FRAMEWORK_ID,
        documentFrameworkId: NIST_HIGH_FRAMEWORK_ID,
      });
      assert.equal(resolved, NIST_MODERATE_FRAMEWORK_ID);
      assert.equal(warn.mock.callCount(), 1);
      const [message, details] = warn.mock.calls[0]?.arguments ?? [];
      assert.match(String(message), /diverged from projects\.framework_id/);
      assert.deepEqual(details, {
        projectId: "project-1",
        columnFrameworkId: NIST_MODERATE_FRAMEWORK_ID,
        documentFrameworkId: NIST_HIGH_FRAMEWORK_ID,
      });
    } finally {
      warn.mock.restore();
    }
  });

  it("does not warn when column and document framework IDs match", () => {
    const warn = mock.method(console, "warn", () => undefined);
    try {
      const resolved = resolveAuthoritativeFrameworkId({
        projectId: "project-1",
        columnFrameworkId: NIST_LOW_FRAMEWORK_ID,
        documentFrameworkId: NIST_LOW_FRAMEWORK_ID,
      });
      assert.equal(resolved, NIST_LOW_FRAMEWORK_ID);
      assert.equal(warn.mock.callCount(), 0);
    } finally {
      warn.mock.restore();
    }
  });

  it("lists invalid control IDs without treating them as globally meaningful", () => {
    assert.deepEqual(
      invalidFrameworkControlIds(NIST_LOW_FRAMEWORK_ID, ["ac-1", "not-a-control"]),
      ["not-a-control"],
    );
  });

  it("describes unknown column framework IDs without extra tenant fields", () => {
    const error = unknownFrameworkLoadError(" missing ");
    assert.equal(error.kind, "unknown-framework");
    assert.equal(error.frameworkId, "missing");
    assert.match(error.message, /Unknown framework: missing/);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveDatabasePath } from "./client";

describe("resolveDatabasePath", () => {
  it("uses DATABASE_PATH when set (absolute)", () => {
    assert.equal(
      resolveDatabasePath({ DATABASE_PATH: "/var/data/oscal-author.db" }),
      "/var/data/oscal-author.db",
    );
  });

  it("defaults to a local data file outside production", () => {
    const resolved = resolveDatabasePath({ NODE_ENV: "development" });
    assert.match(resolved, /data[/\\]oscal-control-tool\.sqlite$/);
  });

  it("refuses a repository-local default in production", () => {
    assert.throws(
      () => resolveDatabasePath({ NODE_ENV: "production" }),
      /DATABASE_PATH must be set in production/,
    );
  });

  it("allows unset DATABASE_PATH during next production build", () => {
    const resolved = resolveDatabasePath({
      NODE_ENV: "production",
      NEXT_PHASE: "phase-production-build",
    });
    assert.match(resolved, /data[/\\]oscal-control-tool\.sqlite$/);
  });
});

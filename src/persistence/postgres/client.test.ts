import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { resolveDatabaseUrl } from "./client";

describe("resolveDatabaseUrl", () => {
  it("uses DATABASE_URL when set", () => {
    assert.equal(
      resolveDatabaseUrl({
        DATABASE_URL: "postgres://user:pass@localhost:5432/oscal",
      }),
      "postgres://user:pass@localhost:5432/oscal",
    );
  });

  it("trims whitespace around DATABASE_URL", () => {
    assert.equal(
      resolveDatabaseUrl({
        DATABASE_URL: "  postgres://user:pass@localhost:5432/oscal  ",
      }),
      "postgres://user:pass@localhost:5432/oscal",
    );
  });

  it("returns undefined when unset outside production", () => {
    assert.equal(
      resolveDatabaseUrl({ NODE_ENV: "development" }),
      undefined,
    );
  });

  it("returns undefined when unset in test", () => {
    assert.equal(resolveDatabaseUrl({ NODE_ENV: "test" }), undefined);
  });

  it("refuses a silent default in production", () => {
    assert.throws(
      () => resolveDatabaseUrl({ NODE_ENV: "production" }),
      /DATABASE_URL must be set in production/,
    );
  });

  it("allows unset DATABASE_URL during next production build", () => {
    assert.equal(
      resolveDatabaseUrl({
        NODE_ENV: "production",
        NEXT_PHASE: "phase-production-build",
      }),
      undefined,
    );
  });

  it("still requires DATABASE_URL in production even with an empty string", () => {
    assert.throws(
      () => resolveDatabaseUrl({ NODE_ENV: "production", DATABASE_URL: "   " }),
      /DATABASE_URL must be set in production/,
    );
  });
});

describe("production module graph", () => {
  it("does not statically import PGlite (pruned from production images)", () => {
    const source = fs.readFileSync(
      path.join(import.meta.dirname, "client.ts"),
      "utf8",
    );
    assert.doesNotMatch(
      source,
      /^import .+@electric-sql\/pglite/m,
      "static PGlite import would fail npm start after npm prune --omit=dev",
    );
    assert.doesNotMatch(
      source,
      /^import .+drizzle-orm\/pglite/m,
      "static drizzle-orm/pglite import pulls PGlite into the production graph",
    );
  });
});

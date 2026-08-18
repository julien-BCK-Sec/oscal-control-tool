import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { ensureDevEnvLocal } from "./env";
import {
  assertDestructiveDemoResetAllowed,
  assertDevBootstrapAllowed,
  assertIdempotentDemoSeedAllowed,
  BootstrapSafetyError,
  DemoSeedSafetyError,
} from "./safety";
import {
  demoSeedMarker,
  hasDemoSeedMarker,
  DEMO_PASSWORD,
  ORGS,
  PROJECT_NAMES,
} from "./constants";
import { resolveDemoBootstrapPassword } from "./password";
import { CANONICAL_PROJECTS } from "@/seed/demo/catalog";

describe("dev bootstrap env", () => {
  it("creates .env.local from defaults without inventing production secrets twice", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cf-env-"));
    fs.writeFileSync(
      path.join(dir, ".env.example"),
      [
        "DATABASE_URL=",
        "BETTER_AUTH_SECRET=replace-with-a-long-random-secret",
        "BETTER_AUTH_URL=http://localhost:3000",
        "NEXT_PUBLIC_APP_URL=http://localhost:3000",
        "",
      ].join("\n"),
    );

    const first = ensureDevEnvLocal(dir);
    assert.equal(first.status, "created");
    const firstContent = fs.readFileSync(first.path, "utf8");
    assert.match(firstContent, /DATABASE_URL=postgres:\/\/postgres:postgres@localhost/);
    assert.match(firstContent, /BETTER_AUTH_SECRET=.+/);
    const secretLine = firstContent
      .split("\n")
      .find((line) => line.startsWith("BETTER_AUTH_SECRET="));
    assert.ok(secretLine);

    const second = ensureDevEnvLocal(dir);
    assert.equal(second.status, "unchanged");
    const secondContent = fs.readFileSync(first.path, "utf8");
    assert.equal(
      secondContent
        .split("\n")
        .find((line) => line.startsWith("BETTER_AUTH_SECRET=")),
      secretLine,
    );
  });

  it("only fills missing keys when .env.local already exists", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cf-env2-"));
    fs.writeFileSync(
      path.join(dir, ".env.example"),
      "DATABASE_URL=\nBETTER_AUTH_SECRET=replace-with-a-long-random-secret\n",
    );
    fs.writeFileSync(
      path.join(dir, ".env.local"),
      "DATABASE_URL=postgres://custom:custom@localhost:5432/custom_db\nBETTER_AUTH_URL=http://localhost:3000\n",
    );

    const result = ensureDevEnvLocal(dir);
    assert.equal(result.status, "updated");
    const content = fs.readFileSync(result.path, "utf8");
    assert.match(content, /DATABASE_URL=postgres:\/\/custom:custom@localhost:5432\/custom_db/);
    assert.match(content, /BETTER_AUTH_SECRET=/);
    assert.ok(result.addedKeys.includes("BETTER_AUTH_SECRET"));
  });
});

describe("dev bootstrap safety", () => {
  it("refuses production NODE_ENV", () => {
    assert.throws(
      () =>
        assertDevBootstrapAllowed({
          NODE_ENV: "production",
          DATABASE_URL: "postgres://postgres:postgres@localhost:5432/oscal_control_tool",
        }),
      BootstrapSafetyError,
    );
  });

  it("refuses remote database hosts", () => {
    assert.throws(
      () =>
        assertDevBootstrapAllowed({
          NODE_ENV: "development",
          DATABASE_URL: "postgres://user:pass@db.render.com:5432/app",
        }),
      BootstrapSafetyError,
    );
  });

  it("allows local Compose DATABASE_URL", () => {
    assert.doesNotThrow(() =>
      assertDevBootstrapAllowed({
        NODE_ENV: "development",
        DATABASE_URL:
          "postgres://postgres:postgres@localhost:5432/oscal_control_tool",
      }),
    );
  });
});

describe("idempotent vs destructive seed safety", () => {
  const localUrl =
    "postgres://postgres:postgres@localhost:5432/oscal_control_tool";

  it("allows idempotent seed locally", () => {
    assert.doesNotThrow(() =>
      assertIdempotentDemoSeedAllowed({
        NODE_ENV: "development",
        DATABASE_URL: localUrl,
      }),
    );
  });

  it("allows idempotent seed in production only when DEPLOYMENT_MODE=demo", () => {
    assert.throws(
      () =>
        assertIdempotentDemoSeedAllowed({
          NODE_ENV: "production",
          DATABASE_URL: "postgres://user:pass@db.example.com:5432/app",
        }),
      DemoSeedSafetyError,
    );
    assert.doesNotThrow(() =>
      assertIdempotentDemoSeedAllowed({
        NODE_ENV: "production",
        DEPLOYMENT_MODE: "demo",
        DATABASE_URL: "postgres://user:pass@db.example.com:5432/app",
      }),
    );
  });

  it("never allows destructive reset in production or demo mode", () => {
    assert.throws(
      () =>
        assertDestructiveDemoResetAllowed({
          NODE_ENV: "production",
          DATABASE_URL: localUrl,
        }),
      DemoSeedSafetyError,
    );
    assert.throws(
      () =>
        assertDestructiveDemoResetAllowed({
          NODE_ENV: "development",
          DEPLOYMENT_MODE: "demo",
          DATABASE_URL: localUrl,
        }),
      DemoSeedSafetyError,
    );
    assert.doesNotThrow(() =>
      assertDestructiveDemoResetAllowed({
        NODE_ENV: "development",
        DATABASE_URL: localUrl,
      }),
    );
  });
});

describe("dev bootstrap constants", () => {
  it("keeps the shared demo password and canonical names stable", () => {
    assert.equal(DEMO_PASSWORD, "ControlFreakDemo123!");
    assert.equal(ORGS.cgds.slug, "canadian-goose-defence-system");
    assert.equal(ORGS.contoso.slug, "contoso-industries");
    assert.equal(
      PROJECT_NAMES.flagship,
      CANONICAL_PROJECTS.flagship.name,
    );
    assert.equal(
      PROJECT_NAMES.flagship,
      "Strategic Goose Operations Platform (Demo)",
    );
  });

  it("uses the local default password unless DEMO_BOOTSTRAP_PASSWORD is set", () => {
    assert.equal(
      resolveDemoBootstrapPassword({ NODE_ENV: "development" }),
      DEMO_PASSWORD,
    );
    assert.equal(
      resolveDemoBootstrapPassword({
        NODE_ENV: "development",
        DEMO_BOOTSTRAP_PASSWORD: "OverridePassword123!",
      }),
      "OverridePassword123!",
    );
    assert.throws(
      () =>
        resolveDemoBootstrapPassword({
          NODE_ENV: "production",
        }),
      DemoSeedSafetyError,
    );
    assert.throws(
      () =>
        resolveDemoBootstrapPassword({
          DEPLOYMENT_MODE: "demo",
        }),
      DemoSeedSafetyError,
    );
  });

  it("round-trips demo seed markers", () => {
    const body = `Hello${demoSeedMarker("x")}`;
    assert.equal(hasDemoSeedMarker(body, "x"), true);
    assert.equal(hasDemoSeedMarker(body, "y"), false);
  });
});

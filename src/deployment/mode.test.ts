import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DeploymentConfigError } from "./errors";
import {
  isTruthyEnvFlag,
  resolveProductionDeploymentMode,
  warnOrRejectLegacySeedDemoProject,
} from "./mode";

describe("resolveProductionDeploymentMode", () => {
  it("selects normal when DEPLOYMENT_MODE=normal", () => {
    assert.deepEqual(
      resolveProductionDeploymentMode({ DEPLOYMENT_MODE: "normal" }),
      { mode: "normal", explicit: true },
    );
  });

  it("selects demo when DEPLOYMENT_MODE=demo", () => {
    assert.deepEqual(
      resolveProductionDeploymentMode({ DEPLOYMENT_MODE: "DEMO" }),
      { mode: "demo", explicit: true },
    );
  });

  it("defaults omitted mode to normal", () => {
    assert.deepEqual(resolveProductionDeploymentMode({}), {
      mode: "normal",
      explicit: false,
    });
    assert.deepEqual(
      resolveProductionDeploymentMode({ DEPLOYMENT_MODE: "  " }),
      { mode: "normal", explicit: false },
    );
  });

  it("rejects invalid deployment modes", () => {
    assert.throws(
      () => resolveProductionDeploymentMode({ DEPLOYMENT_MODE: "staging" }),
      (error: unknown) => {
        assert.ok(error instanceof DeploymentConfigError);
        assert.match(error.message, /must be "normal" or "demo"/);
        assert.match(error.message, /staging/);
        return true;
      },
    );
  });
});

describe("legacy SEED_DEMO_PROJECT", () => {
  it("treats true/1/yes as enabled", () => {
    assert.equal(isTruthyEnvFlag("true"), true);
    assert.equal(isTruthyEnvFlag("1"), true);
    assert.equal(isTruthyEnvFlag("yes"), true);
    assert.equal(isTruthyEnvFlag("false"), false);
    assert.equal(isTruthyEnvFlag(undefined), false);
  });

  it("refuses SEED_DEMO_PROJECT in normal mode", () => {
    assert.throws(
      () =>
        warnOrRejectLegacySeedDemoProject("normal", {
          SEED_DEMO_PROJECT: "true",
        }),
      DeploymentConfigError,
    );
  });

  it("warns and ignores SEED_DEMO_PROJECT in demo mode", () => {
    const warnings: string[] = [];
    warnOrRejectLegacySeedDemoProject(
      "demo",
      { SEED_DEMO_PROJECT: "true" },
      (message) => warnings.push(message),
    );
    assert.equal(warnings.length, 1);
    assert.match(warnings[0]!, /deprecated/);
  });
});

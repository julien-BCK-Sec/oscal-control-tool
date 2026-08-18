import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DeploymentConfigError } from "./errors";
import {
  resolveBootstrapAdminConfig,
  validateProductionDeploymentEnv,
} from "./validate";

const productionBase = {
  NODE_ENV: "production",
  DATABASE_URL: "postgres://user:pass@db.example.com:5432/app",
  BETTER_AUTH_SECRET: "a-long-random-secret-value",
  BETTER_AUTH_URL: "https://app.example.com",
  EVIDENCE_S3_BUCKET: "evidence",
  EVIDENCE_S3_ACCESS_KEY_ID: "key",
  EVIDENCE_S3_SECRET_ACCESS_KEY: "secret",
} as const;

describe("validateProductionDeploymentEnv", () => {
  it("accepts a complete normal production configuration", () => {
    const config = validateProductionDeploymentEnv(
      { ...productionBase, DEPLOYMENT_MODE: "normal" },
      () => undefined,
    );
    assert.equal(config.mode, "normal");
    assert.equal(config.bootstrapAdmin, null);
    assert.equal(config.publicUrl, "https://app.example.com");
  });

  it("defaults omitted mode to normal without demo credentials", () => {
    const config = validateProductionDeploymentEnv(
      { ...productionBase },
      () => undefined,
    );
    assert.equal(config.mode, "normal");
    assert.equal(config.modeExplicit, false);
  });

  it("requires an explicit demo password in demo mode", () => {
    assert.throws(
      () =>
        validateProductionDeploymentEnv(
          { ...productionBase, DEPLOYMENT_MODE: "demo" },
          () => undefined,
        ),
      (error: unknown) => {
        assert.ok(error instanceof DeploymentConfigError);
        assert.match(error.message, /DEMO_BOOTSTRAP_PASSWORD/);
        return true;
      },
    );
  });

  it("accepts demo mode when DEMO_BOOTSTRAP_PASSWORD is set", () => {
    const config = validateProductionDeploymentEnv(
      {
        ...productionBase,
        DEPLOYMENT_MODE: "demo",
        DEMO_BOOTSTRAP_PASSWORD: "DeployedDemoPassword1!",
      },
      () => undefined,
    );
    assert.equal(config.mode, "demo");
    assert.equal(config.bootstrapAdmin, null);
  });

  it("rejects invalid deployment mode before other work", () => {
    assert.throws(
      () =>
        validateProductionDeploymentEnv(
          { ...productionBase, DEPLOYMENT_MODE: "render" },
          () => undefined,
        ),
      /must be "normal" or "demo"/,
    );
  });

  it("rejects SEED_DEMO_PROJECT in normal mode", () => {
    assert.throws(
      () =>
        validateProductionDeploymentEnv(
          {
            ...productionBase,
            DEPLOYMENT_MODE: "normal",
            SEED_DEMO_PROJECT: "true",
          },
          () => undefined,
        ),
      /SEED_DEMO_PROJECT is deprecated/,
    );
  });

  it("rejects SEED_DEMO_PROJECT when mode is omitted (defaults to normal)", () => {
    assert.throws(
      () =>
        validateProductionDeploymentEnv(
          {
            ...productionBase,
            SEED_DEMO_PROJECT: "true",
          },
          () => undefined,
        ),
      /SEED_DEMO_PROJECT is deprecated/,
    );
  });

  it("requires BETTER_AUTH_SECRET in production", () => {
    assert.throws(
      () =>
        validateProductionDeploymentEnv(
          {
            NODE_ENV: "production",
            DATABASE_URL: productionBase.DATABASE_URL,
            BETTER_AUTH_URL: productionBase.BETTER_AUTH_URL,
            EVIDENCE_S3_BUCKET: "evidence",
            EVIDENCE_S3_ACCESS_KEY_ID: "key",
            EVIDENCE_S3_SECRET_ACCESS_KEY: "secret",
          },
          () => undefined,
        ),
      /BETTER_AUTH_SECRET/,
    );
  });

  it("requires a public application URL in production", () => {
    assert.throws(
      () =>
        validateProductionDeploymentEnv(
          {
            NODE_ENV: "production",
            DATABASE_URL: productionBase.DATABASE_URL,
            BETTER_AUTH_SECRET: productionBase.BETTER_AUTH_SECRET,
            EVIDENCE_S3_BUCKET: "evidence",
            EVIDENCE_S3_ACCESS_KEY_ID: "key",
            EVIDENCE_S3_SECRET_ACCESS_KEY: "secret",
          },
          () => undefined,
        ),
      /BETTER_AUTH_URL or NEXT_PUBLIC_APP_URL/,
    );
  });

  it("requires S3 evidence storage in production", () => {
    assert.throws(
      () =>
        validateProductionDeploymentEnv(
          {
            NODE_ENV: "production",
            DATABASE_URL: productionBase.DATABASE_URL,
            BETTER_AUTH_SECRET: productionBase.BETTER_AUTH_SECRET,
            BETTER_AUTH_URL: productionBase.BETTER_AUTH_URL,
          },
          () => undefined,
        ),
      /Evidence storage/,
    );
  });

  it("does not require demo credentials in normal mode", () => {
    const config = validateProductionDeploymentEnv(
      { ...productionBase, DEPLOYMENT_MODE: "normal" },
      () => undefined,
    );
    assert.equal(config.mode, "normal");
  });
});

describe("resolveBootstrapAdminConfig", () => {
  it("returns null when bootstrap variables are omitted", () => {
    assert.equal(resolveBootstrapAdminConfig({}), null);
  });

  it("fails closed when only some bootstrap variables are set", () => {
    assert.throws(
      () =>
        resolveBootstrapAdminConfig({
          BOOTSTRAP_ADMIN_EMAIL: "admin@example.com",
        }),
      /incomplete/,
    );
  });

  it("accepts a complete bootstrap set", () => {
    const config = resolveBootstrapAdminConfig({
      BOOTSTRAP_ADMIN_EMAIL: "Admin@Example.com",
      BOOTSTRAP_ADMIN_PASSWORD: "a-long-unique-password",
      BOOTSTRAP_ORG_NAME: "Example Org",
      BOOTSTRAP_ORG_SLUG: "Example-Org",
    });
    assert.equal(config?.email, "admin@example.com");
    assert.equal(config?.orgSlug, "example-org");
    assert.equal(config?.name, "admin@example.com");
  });
});

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { closeDb, openTestDb, type AppDatabase } from "@/persistence/postgres/client";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { CANONICAL_ORGS, CANONICAL_PROJECTS } from "@/seed/demo/catalog";
import { ensureCanonicalDemoEnvironment } from "@/seed/canonical-demo";
import { resetActivityTimestampClock } from "@/persistence/activity-clock";
import type { CanonicalDemoResult } from "@/seed/canonical-demo";
import { DeploymentConfigError } from "./errors";
import { runProductionLifecycle } from "./lifecycle";
import type { EnvMap } from "./mode";
import type { BootstrapAdminResult } from "./normal-bootstrap";

afterEach(async () => {
  await closeDb();
  resetActivityTimestampClock();
});

function fakeDemoResult(): CanonicalDemoResult {
  return {
    identity: {
      orgs: {
        cgds: {
          id: "cgds",
          name: CANONICAL_ORGS.cgds.name,
          slug: CANONICAL_ORGS.cgds.slug,
          created: true,
        },
        contoso: {
          id: "contoso",
          name: CANONICAL_ORGS.contoso.name,
          slug: CANONICAL_ORGS.contoso.slug,
          created: true,
        },
        firstdoor: {
          id: "firstdoor",
          name: CANONICAL_ORGS.firstdoor.name,
          slug: CANONICAL_ORGS.firstdoor.slug,
          created: true,
        },
      },
      users: {},
    },
    projects: {
      created: [CANONICAL_PROJECTS.flagship.name],
    },
    commentsCreated: 0,
    assignmentsCreated: 0,
    evidenceCreated: 0,
  } as CanonicalDemoResult;
}

function pgliteDeps(db: AppDatabase) {
  return {
    openDatabase: async () => db,
    closeDatabase: async () => undefined,
    ensureDemo: (
      database: AppDatabase,
      options?: { env?: Record<string, string | undefined> },
    ) =>
      ensureCanonicalDemoEnvironment(database, {
        validateOscal: false,
        env: options?.env,
      }),
    log: () => undefined,
  };
}

function pgliteLifecycleEnv(extra: Record<string, string | undefined>): EnvMap {
  return {
    NODE_ENV: "test",
    DATABASE_URL: "postgres://lifecycle-test/unused",
    ...extra,
  };
}

describe("runProductionLifecycle mode selection", () => {
  it("invokes no demo bootstrap in normal mode", async () => {
    let demoCalls = 0;
    let adminCalls = 0;
    const result = await runProductionLifecycle(
      pgliteLifecycleEnv({ DEPLOYMENT_MODE: "normal" }),
      {
        openDatabase: async () => ({}) as AppDatabase,
        closeDatabase: async () => undefined,
        ensureDemo: async () => {
          demoCalls += 1;
          return fakeDemoResult();
        },
        ensureAdmin: async () => {
          adminCalls += 1;
          return {} as BootstrapAdminResult;
        },
        log: () => undefined,
      },
    );
    assert.equal(result.mode, "normal");
    assert.equal(demoCalls, 0);
    assert.equal(adminCalls, 0);
    assert.equal(result.demoBootstrap, null);
  });

  it("invokes the canonical demo path in demo mode", async () => {
    let demoCalls = 0;
    let adminCalls = 0;
    const result = await runProductionLifecycle(
      pgliteLifecycleEnv({
        DEPLOYMENT_MODE: "demo",
        DEMO_BOOTSTRAP_PASSWORD: "DeployedDemoPassword1!",
      }),
      {
        openDatabase: async () => ({}) as AppDatabase,
        closeDatabase: async () => undefined,
        ensureDemo: async () => {
          demoCalls += 1;
          return fakeDemoResult();
        },
        ensureAdmin: async () => {
          adminCalls += 1;
          return {} as BootstrapAdminResult;
        },
        log: () => undefined,
      },
    );
    assert.equal(result.mode, "demo");
    assert.equal(demoCalls, 1);
    assert.equal(adminCalls, 0);
    assert.ok(result.demoBootstrap);
    assert.ok(
      result.demoBootstrap.projects.created.includes(
        CANONICAL_PROJECTS.flagship.name,
      ),
    );
  });

  it("fails closed on invalid mode without opening the database", async () => {
    let opened = false;
    await assert.rejects(
      () =>
        runProductionLifecycle(pgliteLifecycleEnv({ DEPLOYMENT_MODE: "qa" }), {
          openDatabase: async () => {
            opened = true;
            return {} as AppDatabase;
          },
          closeDatabase: async () => undefined,
          log: () => undefined,
        }),
      DeploymentConfigError,
    );
    assert.equal(opened, false);
  });

  it("fails closed when demo mode omits DEMO_BOOTSTRAP_PASSWORD", async () => {
    let opened = false;
    await assert.rejects(
      () =>
        runProductionLifecycle(
          pgliteLifecycleEnv({ DEPLOYMENT_MODE: "demo" }),
          {
            openDatabase: async () => {
              opened = true;
              return {} as AppDatabase;
            },
            closeDatabase: async () => undefined,
            log: () => undefined,
          },
        ),
      /DEMO_BOOTSTRAP_PASSWORD/,
    );
    assert.equal(opened, false);
  });
});

describe("runProductionLifecycle with PGlite", () => {
  it("does not create canonical demo data in normal mode", async () => {
    const db = await openTestDb();
    await runProductionLifecycle(
      pgliteLifecycleEnv({ DEPLOYMENT_MODE: "normal" }),
      pgliteDeps(db),
    );

    const orgs = createPostgresOrganizationRepository(db);
    assert.equal(
      await orgs.getOrganizationBySlug(CANONICAL_ORGS.cgds.slug),
      null,
    );
    assert.equal(
      await orgs.getOrganizationBySlug(CANONICAL_ORGS.contoso.slug),
      null,
    );
    assert.equal(
      await orgs.getOrganizationBySlug(CANONICAL_ORGS.firstdoor.slug),
      null,
    );
  });

  it("seeds the full canonical demo and preserves edits on rerun", async () => {
    const db = await openTestDb();
    const env = pgliteLifecycleEnv({
      DEPLOYMENT_MODE: "demo",
      DEMO_BOOTSTRAP_PASSWORD: "DeployedDemoPassword1!",
    });
    const first = await runProductionLifecycle(env, pgliteDeps(db));
    assert.ok(first.demoBootstrap);
    const projects = first.demoBootstrap.projects;
    assert.equal(projects.flagship.name, CANONICAL_PROJECTS.flagship.name);
    assert.equal(projects.cmmc.name, CANONICAL_PROJECTS.cmmc.name);
    assert.equal(projects.early.name, CANONICAL_PROJECTS.early.name);
    assert.equal(projects.evidenceGap.name, CANONICAL_PROJECTS.evidenceGap.name);
    assert.equal(projects.high.name, CANONICAL_PROJECTS.high.name);
    assert.equal(projects.contosoCloud.name, CANONICAL_PROJECTS.contosoCloud.name);
    assert.equal(
      projects.firstdoorCloud.name,
      CANONICAL_PROJECTS.firstdoorCloud.name,
    );
    assert.equal(projects.il4.name, CANONICAL_PROJECTS.il4.name);
    assert.equal(projects.il4.frameworkId, CANONICAL_PROJECTS.il4.frameworkId);

    const repository = createPostgresProjectRepository(db);
    const loaded = await repository.load(projects.flagship.id);
    assert.equal(loaded.ok, true);
    if (!loaded.ok) {
      return;
    }
    const editedNarrative = "Lifecycle preservation narrative.";
    const saved = await repository.save({
      id: loaded.project.id,
      name: loaded.project.name,
      frameworkId: loaded.project.frameworkId,
      metadata: loaded.project.metadata,
      implementations: {
        ...loaded.project.implementations,
        "ac-1": { status: "in-progress", narrative: editedNarrative },
      },
      expectedRevision: loaded.project.revision,
    });
    assert.equal(saved.ok, true);

    const second = await runProductionLifecycle(env, pgliteDeps(db));
    assert.deepEqual(second.demoBootstrap?.projects.created, []);
    assert.equal(second.demoBootstrap?.identity.orgs.cgds.created, false);
    assert.equal(
      second.demoBootstrap?.projects.flagship.implementations["ac-1"]?.narrative,
      editedNarrative,
    );

    const listed = await repository.list(
      first.demoBootstrap.identity.orgs.cgds.id,
    );
    assert.equal(listed.length, 6);
  });
});

/**
 * Milestone 05B integration Tests A–F against clean PostgreSQL databases.
 *
 * Usage:
 *   npm run verify:deployment
 *
 * Requires reachable PostgreSQL (local Compose default). Creates and drops
 * temporary databases; does not start Next.js (lifecycle completion is the
 * start-server boundary).
 */
import assert from "node:assert/strict";
import { Pool } from "pg";
import {
  closeDb,
  getDb,
  type AppDatabase,
} from "../src/persistence/postgres/client";
import { createPostgresOrganizationRepository } from "../src/persistence/postgres/organization-repository";
import { createPostgresProjectRepository } from "../src/persistence/postgres/project-repository";
import { CANONICAL_ORGS, CANONICAL_PROJECTS } from "../src/seed/demo/catalog";
import { DEMO_USERS } from "../src/seed/dev-bootstrap/constants";
import { ensureCanonicalDemoEnvironment } from "../src/seed/canonical-demo";
import { runProductionLifecycle } from "../src/deployment/lifecycle";
import { DeploymentConfigError } from "../src/deployment/errors";
import { loadLocalEnv } from "./load-env";

const NORMAL_DB = "cf_05b_normal";
const DEMO_DB = "cf_05b_demo";
const INVALID_DB = "cf_05b_invalid";

function adminUrl(): string {
  const configured = process.env.DATABASE_URL?.trim();
  if (configured) {
    return configured.replace(
      /^(postgres(?:ql)?:\/\/[^/]+)\/[^?]*/i,
      `$1/postgres`,
    );
  }
  return "postgres://postgres:postgres@localhost:5432/postgres";
}

function databaseUrlFor(name: string): string {
  const base =
    process.env.DATABASE_URL?.trim() ||
    "postgres://postgres:postgres@localhost:5432/oscal_control_tool";
  return base.replace(/^(postgres(?:ql)?:\/\/[^/]+)\/[^?]*/i, `$1/${name}`);
}

async function recreateDatabase(name: string): Promise<void> {
  const pool = new Pool({ connectionString: adminUrl(), max: 1 });
  try {
    await pool.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [name],
    );
    await pool.query(`DROP DATABASE IF EXISTS ${name}`);
    await pool.query(`CREATE DATABASE ${name}`);
  } finally {
    await pool.end();
  }
}

async function dropDatabase(name: string): Promise<void> {
  const pool = new Pool({ connectionString: adminUrl(), max: 1 });
  try {
    await pool.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [name],
    );
    await pool.query(`DROP DATABASE IF EXISTS ${name}`);
  } finally {
    await pool.end();
  }
}

function demoDeps() {
  return {
    ensureDemo: (
      db: AppDatabase,
      options?: { env?: Record<string, string | undefined> },
    ) =>
      ensureCanonicalDemoEnvironment(db, {
        validateOscal: false,
        env: options?.env,
      }),
  };
}

async function orgProjectCounts(db: AppDatabase): Promise<{
  cgds: number;
  contoso: number;
  firstdoor: number;
}> {
  const orgs = createPostgresOrganizationRepository(db);
  const projects = createPostgresProjectRepository(db);
  const cgds = await orgs.getOrganizationBySlug(CANONICAL_ORGS.cgds.slug);
  const contoso = await orgs.getOrganizationBySlug(CANONICAL_ORGS.contoso.slug);
  const firstdoor = await orgs.getOrganizationBySlug(
    CANONICAL_ORGS.firstdoor.slug,
  );
  return {
    cgds: cgds ? (await projects.list(cgds.id)).length : 0,
    contoso: contoso ? (await projects.list(contoso.id)).length : 0,
    firstdoor: firstdoor ? (await projects.list(firstdoor.id)).length : 0,
  };
}

async function run(): Promise<void> {
  loadLocalEnv();
  const logs: string[] = [];
  const log = (message: string) => logs.push(message);

  console.log("Test A — clean normal deployment");
  await recreateDatabase(NORMAL_DB);
  const normalUrl = databaseUrlFor(NORMAL_DB);
  const normalEnv: NodeJS.ProcessEnv = {
    NODE_ENV: "test",
    DEPLOYMENT_MODE: "normal",
    DATABASE_URL: normalUrl,
    BOOTSTRAP_ADMIN_EMAIL: "admin@example.com",
    BOOTSTRAP_ADMIN_PASSWORD: "NormalAdminPass1!",
    BOOTSTRAP_ADMIN_NAME: "Normal Admin",
    BOOTSTRAP_ORG_NAME: "Example Organization",
    BOOTSTRAP_ORG_SLUG: "example-organization",
  };
  const a = await runProductionLifecycle(normalEnv, { log });
  assert.equal(a.mode, "normal");
  assert.equal(a.migrated, true);
  assert.equal(a.demoBootstrap, null);
  assert.equal(a.adminBootstrap?.createdUser, true);
  const normalDb = await getDb(normalUrl);
  const normalOrgs = createPostgresOrganizationRepository(normalDb);
  assert.equal(
    await normalOrgs.getOrganizationBySlug(CANONICAL_ORGS.cgds.slug),
    null,
  );
  const exampleOrg = await normalOrgs.getOrganizationBySlug(
    "example-organization",
  );
  assert.ok(exampleOrg);
  const exampleProjects = await createPostgresProjectRepository(normalDb).list(
    exampleOrg.id,
  );
  assert.equal(exampleProjects.length, 0);
  await closeDb();
  console.log("  PASS");

  console.log("Test B — normal redeploy");
  const b = await runProductionLifecycle(normalEnv, { log });
  assert.equal(b.adminBootstrap?.createdUser, false);
  const normalDb2 = await getDb(normalUrl);
  const exampleOrg2 = await createPostgresOrganizationRepository(
    normalDb2,
  ).getOrganizationBySlug("example-organization");
  assert.ok(exampleOrg2);
  assert.equal(exampleOrg2.id, exampleOrg.id);
  assert.equal(
    await createPostgresOrganizationRepository(normalDb2).getOrganizationBySlug(
      CANONICAL_ORGS.cgds.slug,
    ),
    null,
  );
  await closeDb();
  console.log("  PASS");

  console.log("Test C — clean demo deployment");
  await recreateDatabase(DEMO_DB);
  const demoUrl = databaseUrlFor(DEMO_DB);
  const demoEnv: NodeJS.ProcessEnv = {
    NODE_ENV: "test",
    DEPLOYMENT_MODE: "demo",
    DATABASE_URL: demoUrl,
    DEMO_BOOTSTRAP_PASSWORD: "DeployedDemoPassword1!",
  };
  const c = await runProductionLifecycle(demoEnv, {
    log,
    ...demoDeps(),
  });
  assert.equal(c.mode, "demo");
  assert.ok(c.demoBootstrap);
  const demoDb = await getDb(demoUrl);
  const demoOrgs = createPostgresOrganizationRepository(demoDb);
  const cgds = await demoOrgs.getOrganizationBySlug(CANONICAL_ORGS.cgds.slug);
  const contoso = await demoOrgs.getOrganizationBySlug(
    CANONICAL_ORGS.contoso.slug,
  );
  const firstdoor = await demoOrgs.getOrganizationBySlug(
    CANONICAL_ORGS.firstdoor.slug,
  );
  assert.ok(cgds);
  assert.equal(cgds.name, CANONICAL_ORGS.cgds.name);
  assert.ok(contoso);
  assert.ok(firstdoor);
  const demoProjects = createPostgresProjectRepository(demoDb);
  const cgdsProjects = await demoProjects.list(cgds.id);
  const contosoProjects = await demoProjects.list(contoso.id);
  const firstdoorProjects = await demoProjects.list(firstdoor.id);
  assert.equal(cgdsProjects.length, 5);
  assert.equal(contosoProjects.length, 1);
  assert.equal(firstdoorProjects.length, 1);
  assert.ok(
    cgdsProjects.some((p) => p.name === CANONICAL_PROJECTS.flagship.name),
  );
  assert.ok(cgdsProjects.some((p) => p.name === CANONICAL_PROJECTS.cmmc.name));
  assert.ok(cgdsProjects.some((p) => p.name === CANONICAL_PROJECTS.early.name));
  assert.ok(
    cgdsProjects.some((p) => p.name === CANONICAL_PROJECTS.evidenceGap.name),
  );
  assert.ok(cgdsProjects.some((p) => p.name === CANONICAL_PROJECTS.high.name));
  assert.ok(
    firstdoorProjects.some(
      (p) => p.name === CANONICAL_PROJECTS.firstdoorCloud.name,
    ),
  );
  const members = await demoOrgs.listMembers(cgds.id);
  for (const spec of DEMO_USERS.filter((u) => u.org === "cgds")) {
    assert.ok(members.some((m) => m.email === spec.email));
  }
  const firstdoorMembers = await demoOrgs.listMembers(firstdoor.id);
  for (const spec of DEMO_USERS.filter((u) => u.org === "firstdoor")) {
    assert.ok(firstdoorMembers.some((m) => m.email === spec.email));
  }
  assert.ok(
    firstdoorMembers.every((m) => m.role === "organization_admin"),
  );
  await closeDb();
  console.log("  PASS");

  console.log("Test D — demo redeploy");
  const d = await runProductionLifecycle(demoEnv, {
    log,
    ...demoDeps(),
  });
  assert.deepEqual(d.demoBootstrap?.projects.created, []);
  const demoDb2 = await getDb(demoUrl);
  const counts = await orgProjectCounts(demoDb2);
  assert.equal(counts.cgds, 5);
  assert.equal(counts.contoso, 1);
  assert.equal(counts.firstdoor, 1);
  await closeDb();
  console.log("  PASS");

  console.log("Test E — preserve demo edits");
  const demoDb3 = await getDb(demoUrl);
  const cgds3 = await createPostgresOrganizationRepository(
    demoDb3,
  ).getOrganizationBySlug(CANONICAL_ORGS.cgds.slug);
  assert.ok(cgds3);
  const repo = createPostgresProjectRepository(demoDb3);
  const flagshipSummary = (await repo.list(cgds3.id)).find(
    (p) => p.name === CANONICAL_PROJECTS.flagship.name,
  );
  assert.ok(flagshipSummary);
  const loaded = await repo.load(flagshipSummary.id);
  assert.equal(loaded.ok, true);
  if (!loaded.ok) {
    throw new Error("Failed to load flagship");
  }
  const editedNarrative = "05B Test E preserved narrative.";
  const saved = await repo.save({
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
  await closeDb();

  const e = await runProductionLifecycle(demoEnv, {
    log,
    ...demoDeps(),
  });
  assert.equal(
    e.demoBootstrap?.projects.flagship.implementations["ac-1"]?.narrative,
    editedNarrative,
  );
  console.log("  PASS");

  console.log("Test F — invalid deployment mode");
  await recreateDatabase(INVALID_DB);
  const invalidUrl = databaseUrlFor(INVALID_DB);
  let opened = false;
  await assert.rejects(
    () =>
      runProductionLifecycle(
        {
          NODE_ENV: "test",
          DEPLOYMENT_MODE: "staging",
          DATABASE_URL: invalidUrl,
        },
        {
          log,
          openDatabase: async () => {
            opened = true;
            return getDb(invalidUrl);
          },
        },
      ),
    DeploymentConfigError,
  );
  assert.equal(opened, false);
  const invalidDb = await getDb(invalidUrl);
  assert.equal(
    await createPostgresOrganizationRepository(invalidDb).getOrganizationBySlug(
      CANONICAL_ORGS.cgds.slug,
    ),
    null,
  );
  await closeDb();
  console.log("  PASS");

  await dropDatabase(NORMAL_DB);
  await dropDatabase(DEMO_DB);
  await dropDatabase(INVALID_DB);
  console.log("All Tests A–F passed.");
}

run().catch(async (error) => {
  console.error(error);
  await closeDb();
  process.exit(1);
});

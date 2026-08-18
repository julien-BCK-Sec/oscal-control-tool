/**
 * Production startup: migrate → optional idempotent demo seed → Next.js server.
 *
 * Never passes --reset to the demo seed. Exits non-zero if migrate/seed fails.
 *
 * Usage: npm start
 * Env:
 *   DATABASE_URL      required when NODE_ENV=production
 *   SEED_DEMO_PROJECT set to "true" to run the idempotent demo seed
 *   PORT              listen port (default 3000; Render supplies this)
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  closeDb,
  getDb,
  resolveDatabaseUrl,
} from "../src/persistence/postgres/client";
import { createPostgresProjectRepository } from "../src/persistence/postgres/project-repository";
import { createPostgresOrganizationRepository } from "../src/persistence/postgres/organization-repository";
import {
  formatSeedDemoSummary,
  seedDemoProject,
} from "../src/seed/demo";
import { loadLocalEnv } from "./load-env";

function shouldSeedDemo(env: NodeJS.ProcessEnv): boolean {
  const raw = env.SEED_DEMO_PROJECT?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

function resolveListenPort(env: NodeJS.ProcessEnv): string {
  const port = env.PORT?.trim();
  return port && port.length > 0 ? port : "3000";
}

async function migrate(): Promise<string> {
  loadLocalEnv();
  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required in production. Set it before starting the application.",
    );
  }
  console.log("Migrating PostgreSQL database...");
  await getDb(databaseUrl);
  await closeDb();
  console.log("Migrations applied.");
  return databaseUrl;
}

async function seedDemoIfRequested(databaseUrl: string): Promise<void> {
  if (!shouldSeedDemo(process.env)) {
    console.log("SEED_DEMO_PROJECT not enabled; skipping demo seed.");
    return;
  }

  console.log(
    "SEED_DEMO_PROJECT enabled; seeding demo (idempotent, no --reset)...",
  );
  const db = await getDb(databaseUrl);
  const orgSlug = process.env.SEED_DEMO_ORG_SLUG?.trim().toLowerCase();
  if (!orgSlug) {
    throw new Error(
      "SEED_DEMO_ORG_SLUG is required when SEED_DEMO_PROJECT is enabled.",
    );
  }
  const organization = await createPostgresOrganizationRepository(
    db,
  ).getOrganizationBySlug(orgSlug);
  if (!organization) {
    throw new Error(
      `SEED_DEMO_ORG_SLUG "${orgSlug}" does not match an existing organization.`,
    );
  }
  const repository = createPostgresProjectRepository(db);
  const result = await seedDemoProject(
    repository,
    { reset: false, validateOscal: true, organizationId: organization.id },
    { databasePathHint: databaseUrl },
  );
  console.log(formatSeedDemoSummary(result));
  await closeDb();
}

function startNextServer(): void {
  const port = resolveListenPort(process.env);
  const nextBin = path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    "node_modules",
    "next",
    "dist",
    "bin",
    "next",
  );

  if (!fs.existsSync(nextBin)) {
    throw new Error(`Next.js binary not found at ${nextBin}`);
  }

  console.log(`Starting Next.js on 0.0.0.0:${port}`);
  const child = spawn(
    process.execPath,
    [nextBin, "start", "-H", "0.0.0.0", "-p", port],
    {
      stdio: "inherit",
      env: process.env,
    },
  );

  const forwardSignal = (signal: NodeJS.Signals): void => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on("SIGINT", () => forwardSignal("SIGINT"));
  process.on("SIGTERM", () => forwardSignal("SIGTERM"));

  child.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.exit(1);
    }
    process.exit(code ?? 1);
  });
}

async function main(): Promise<void> {
  const databaseUrl = await migrate();
  await seedDemoIfRequested(databaseUrl);
  startNextServer();
}

main().catch(async (error) => {
  console.error(error);
  await closeDb();
  process.exit(1);
});

import { spawnSync } from "node:child_process";
import { Pool } from "pg";
import {
  closeDb,
  getDb,
  resolveDatabaseUrl,
} from "@/persistence/postgres/client";
import { loadLocalEnv } from "../../../scripts/load-env";
import {
  canonicalDemoOrgNames,
  canonicalDemoUserEmails,
  ensureCanonicalDemoEnvironment,
} from "@/seed/canonical-demo";
import { CANONICAL_ORGS, CANONICAL_PROJECTS } from "@/seed/demo/catalog";
import { DEMO_USERS } from "./constants";
import { ensureDevEnvLocal } from "./env";
import { assertDevBootstrapAllowed, BootstrapSafetyError } from "./safety";
import { resolveDemoBootstrapPassword } from "./password";

export type BootstrapDemoResult = {
  envStatus: "created" | "updated" | "unchanged";
  migrationsOk: boolean;
  orgsCreated: string[];
  usersCreated: string[];
  projectsCreated: string[];
  commentsCreated: number;
  assignmentsCreated: number;
  evidenceCreated: number;
};

function runMigrations(cwd: string): void {
  const result = spawnSync("npm", ["run", "db:migrate"], {
    cwd,
    env: process.env,
    encoding: "utf8",
    shell: true,
  });
  if (result.status !== 0) {
    const detail = [result.stderr, result.stdout].filter(Boolean).join("\n");
    throw new Error(`Database migrations failed.\n${detail}`);
  }
}

async function verifyDatabaseConnectivity(databaseUrl: string): Promise<void> {
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  try {
    const client = await pool.connect();
    client.release();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `PostgreSQL is not reachable at DATABASE_URL.\n` +
        `Start local Compose with: docker compose up -d\n` +
        `Then confirm DATABASE_URL in .env.local matches compose.yaml.\n` +
        `Underlying error: ${detail}`,
    );
  } finally {
    await pool.end();
  }
}

/**
 * Canonical demo bootstrap. Idempotent. Never truncates.
 * Local-development orchestrator (env + migrate + seed).
 */
export async function bootstrapDemo(
  cwd: string = process.cwd(),
): Promise<BootstrapDemoResult> {
  const envResult = ensureDevEnvLocal(cwd);
  loadLocalEnv({ cwd });

  assertDevBootstrapAllowed(process.env);

  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) {
    throw new BootstrapSafetyError("DATABASE_URL is required.");
  }

  await verifyDatabaseConnectivity(databaseUrl);
  runMigrations(cwd);

  const db = await getDb(databaseUrl);
  const canonical = await ensureCanonicalDemoEnvironment(db);
  await closeDb();

  return {
    envStatus:
      envResult.status === "created"
        ? "created"
        : envResult.status === "updated"
          ? "updated"
          : "unchanged",
    migrationsOk: true,
    orgsCreated: canonicalDemoOrgNames(canonical),
    usersCreated: canonicalDemoUserEmails(canonical),
    projectsCreated: canonical.projects.created,
    commentsCreated: canonical.commentsCreated,
    assignmentsCreated: canonical.assignmentsCreated,
    evidenceCreated: canonical.evidenceCreated,
  };
}

export function formatBootstrapSummary(result: BootstrapDemoResult): string {
  const envLabel =
    result.envStatus === "created"
      ? "Created"
      : result.envStatus === "updated"
        ? "Updated (missing keys only)"
        : "Existing";

  const password = resolveDemoBootstrapPassword();

  const lines = [
    "Control Freak demo environment is ready.",
    "",
    "Environment",
    "-----------",
    `.env.local ............ ${envLabel}`,
    "Database .............. Connected",
    `Migrations ............ ${result.migrationsOk ? "Up to date" : "Failed"}`,
    "",
    "Organizations",
    "-------------",
    CANONICAL_ORGS.cgds.name,
    CANONICAL_ORGS.contoso.name,
    CANONICAL_ORGS.firstdoor.name,
    "",
    "Projects",
    "--------",
    CANONICAL_PROJECTS.flagship.name,
    CANONICAL_PROJECTS.cmmc.name,
    CANONICAL_PROJECTS.early.name,
    CANONICAL_PROJECTS.evidenceGap.name,
    CANONICAL_PROJECTS.high.name,
    CANONICAL_PROJECTS.il4.name,
    CANONICAL_PROJECTS.contosoCloud.name,
    CANONICAL_PROJECTS.firstdoorCloud.name,
    "",
    "Users",
    "-----",
    ...DEMO_USERS.map((u) => u.email),
    "",
    "Demo Password",
    "-------------",
    password,
    "",
    "See docs/demo-data.md for the purpose of each sample project.",
    "",
    "Start the application:",
    "",
    "  npm run dev",
    "",
  ];
  return lines.join("\n");
}

export { BootstrapSafetyError };

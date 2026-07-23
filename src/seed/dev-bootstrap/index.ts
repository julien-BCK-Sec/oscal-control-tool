import { spawnSync } from "node:child_process";
import { Pool } from "pg";
import {
  closeDb,
  getDb,
  resolveDatabaseUrl,
} from "@/persistence/postgres/client";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { loadLocalEnv } from "../../../scripts/load-env";
import { ensureDevEnvLocal } from "./env";
import { assertDevBootstrapAllowed, BootstrapSafetyError } from "./safety";
import { ensureDemoIdentity } from "./identity";
import { ensureDemoProjects } from "./projects";
import { ensureDemoCollaboration } from "./collaboration";
import { DEMO_PASSWORD, DEMO_USERS, ORGS, PROJECT_NAMES } from "./constants";

export type BootstrapDemoResult = {
  envStatus: "created" | "updated" | "unchanged";
  migrationsOk: boolean;
  orgsCreated: string[];
  usersCreated: string[];
  projectsCreated: string[];
  commentsCreated: number;
  assignmentsCreated: number;
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
 * Full developer demo bootstrap. Idempotent and development-only.
 */
export async function bootstrapDemo(
  cwd: string = process.cwd(),
): Promise<BootstrapDemoResult> {
  // 1) Ensure env before loading / connecting.
  const envResult = ensureDevEnvLocal(cwd);
  loadLocalEnv({ cwd });

  // 2) Safety
  assertDevBootstrapAllowed(process.env);

  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) {
    throw new BootstrapSafetyError("DATABASE_URL is required.");
  }

  // 3) Connectivity + migrations
  await verifyDatabaseConnectivity(databaseUrl);
  runMigrations(cwd);

  const db = await getDb(databaseUrl);

  // 4) Identity
  const identity = await ensureDemoIdentity(db);
  const orgsCreated: string[] = [];
  if (identity.orgs.acme.created) orgsCreated.push(ORGS.acme.name);
  if (identity.orgs.contoso.created) orgsCreated.push(ORGS.contoso.name);
  const usersCreated = Object.values(identity.users)
    .filter((u) => u.created)
    .map((u) => u.email);

  // 5) Projects
  const projects = await ensureDemoProjects(
    createPostgresProjectRepository(db),
    {
      acme: identity.orgs.acme.id,
      contoso: identity.orgs.contoso.id,
    },
  );

  // 6) Collaboration
  const collab = await ensureDemoCollaboration({
    db,
    users: identity.users,
    acmeOrgId: identity.orgs.acme.id,
    contosoOrgId: identity.orgs.contoso.id,
    goose: projects.goose,
    customerA: projects.customerA,
    lab: projects.lab,
    contosoCloud: projects.contosoCloud,
  });

  // 7) Tenant isolation smoke check
  const orgRepo = createPostgresOrganizationRepository(db);
  const acmeMembers = await orgRepo.listMembers(identity.orgs.acme.id);
  const contosoMembers = await orgRepo.listMembers(identity.orgs.contoso.id);
  const acmeEmails = new Set(acmeMembers.map((m) => m.email.toLowerCase()));
  const contosoEmails = new Set(
    contosoMembers.map((m) => m.email.toLowerCase()),
  );
  for (const user of DEMO_USERS) {
    const email = user.email.toLowerCase();
    if (user.org === "acme") {
      if (!acmeEmails.has(email) || contosoEmails.has(email)) {
        throw new Error(`Tenant isolation failed for Acme user ${email}.`);
      }
    } else if (!contosoEmails.has(email) || acmeEmails.has(email)) {
      throw new Error(`Tenant isolation failed for Contoso user ${email}.`);
    }
  }

  await closeDb();

  return {
    envStatus:
      envResult.status === "created"
        ? "created"
        : envResult.status === "updated"
          ? "updated"
          : "unchanged",
    migrationsOk: true,
    orgsCreated,
    usersCreated,
    projectsCreated: projects.created,
    commentsCreated: collab.commentsCreated,
    assignmentsCreated: collab.assignmentsCreated,
  };
}

export function formatBootstrapSummary(result: BootstrapDemoResult): string {
  const envLabel =
    result.envStatus === "created"
      ? "Created"
      : result.envStatus === "updated"
        ? "Updated (missing keys only)"
        : "Existing";

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
    ORGS.acme.name,
    ORGS.contoso.name,
    "",
    "Projects",
    "--------",
    PROJECT_NAMES.goose,
    PROJECT_NAMES.customerA,
    PROJECT_NAMES.lab,
    PROJECT_NAMES.contosoCloud,
    "",
    "Users",
    "-----",
    ...DEMO_USERS.map((u) => u.email),
    "",
    "Demo Password",
    "-------------",
    DEMO_PASSWORD,
    "",
    "Start the application:",
    "",
    "  npm run dev",
    "",
  ];
  return lines.join("\n");
}

export { BootstrapSafetyError };

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
import { ensureCanonicalDemoEvidence } from "@/seed/demo/evidence-seed";
import { CANONICAL_ORGS, CANONICAL_PROJECTS } from "@/seed/demo/catalog";
import { DEMO_USERS, ORGS } from "./constants";
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

  const identity = await ensureDemoIdentity(db);
  const orgsCreated: string[] = [];
  if (identity.orgs.cgds.created) orgsCreated.push(ORGS.cgds.name);
  if (identity.orgs.contoso.created) orgsCreated.push(ORGS.contoso.name);
  const usersCreated = Object.values(identity.users)
    .filter((u) => u.created)
    .map((u) => u.email);

  const projects = await ensureDemoProjects(
    createPostgresProjectRepository(db),
    {
      cgds: identity.orgs.cgds.id,
      contoso: identity.orgs.contoso.id,
    },
  );

  const collab = await ensureDemoCollaboration({
    db,
    users: identity.users,
    cgdsOrgId: identity.orgs.cgds.id,
    contosoOrgId: identity.orgs.contoso.id,
    flagship: projects.flagship,
    cmmc: projects.cmmc,
    early: projects.early,
    evidenceGap: projects.evidenceGap,
    high: projects.high,
    contosoCloud: projects.contosoCloud,
  });

  const bob = identity.users["bob@example.com"];
  const evidence = await ensureCanonicalDemoEvidence({
    db,
    projects: {
      flagshipId: projects.flagship.id,
      cmmcId: projects.cmmc.id,
      earlyId: projects.early.id,
      evidenceGapId: projects.evidenceGap.id,
      highId: projects.high.id,
    },
    actor: bob
      ? { actorId: bob.id, actorDisplayName: bob.name }
      : { actorId: null, actorDisplayName: "System" },
  });

  const orgRepo = createPostgresOrganizationRepository(db);
  const cgdsMembers = await orgRepo.listMembers(identity.orgs.cgds.id);
  const contosoMembers = await orgRepo.listMembers(identity.orgs.contoso.id);
  const cgdsEmails = new Set(cgdsMembers.map((m) => m.email.toLowerCase()));
  const contosoEmails = new Set(
    contosoMembers.map((m) => m.email.toLowerCase()),
  );
  for (const demoUser of DEMO_USERS) {
    const email = demoUser.email.toLowerCase();
    if (demoUser.org === "cgds") {
      if (!cgdsEmails.has(email) || contosoEmails.has(email)) {
        throw new Error(`Tenant isolation failed for CGDS user ${email}.`);
      }
    } else if (!contosoEmails.has(email) || cgdsEmails.has(email)) {
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
    evidenceCreated: evidence.created,
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
    "",
    "Projects",
    "--------",
    CANONICAL_PROJECTS.flagship.name,
    CANONICAL_PROJECTS.cmmc.name,
    CANONICAL_PROJECTS.early.name,
    CANONICAL_PROJECTS.evidenceGap.name,
    CANONICAL_PROJECTS.high.name,
    CANONICAL_PROJECTS.contosoCloud.name,
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

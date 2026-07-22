/**
 * Seed the canonical CGDS / SGOP demo project into DATABASE_URL.
 *
 * Usage:
 *   npm run db:seed:demo
 *   npm run db:seed:demo -- --reset
 */
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

function parseArgs(argv: string[]): { reset: boolean } {
  return {
    reset: argv.includes("--reset"),
  };
}

async function main(): Promise<void> {
  loadLocalEnv();
  const { reset } = parseArgs(process.argv.slice(2));
  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required to seed the demo project. Set it before running db:seed:demo.",
    );
  }

  const orgSlug = process.env.SEED_DEMO_ORG_SLUG?.trim().toLowerCase();
  if (!orgSlug) {
    throw new Error(
      "SEED_DEMO_ORG_SLUG is required. Every project is organization-owned (WP3). " +
        "Run `npm run bootstrap:admin` first, then set SEED_DEMO_ORG_SLUG to that organization's slug.",
    );
  }

  const db = await getDb(databaseUrl);
  const orgRepo = createPostgresOrganizationRepository(db);
  const organization = await orgRepo.getOrganizationBySlug(orgSlug);
  if (!organization) {
    throw new Error(
      `No organization with slug "${orgSlug}". Bootstrap it first (npm run bootstrap:admin).`,
    );
  }

  const repository = createPostgresProjectRepository(db);

  const result = await seedDemoProject(
    repository,
    { reset, validateOscal: true, organizationId: organization.id },
    { databasePathHint: databaseUrl },
  );

  console.log(formatSeedDemoSummary(result));
  await closeDb();
}

main().catch(async (error) => {
  console.error(error);
  await closeDb();
  process.exit(1);
});

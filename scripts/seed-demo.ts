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
import {
  formatSeedDemoSummary,
  seedDemoProject,
} from "../src/seed/demo";

function parseArgs(argv: string[]): { reset: boolean } {
  return {
    reset: argv.includes("--reset"),
  };
}

async function main(): Promise<void> {
  const { reset } = parseArgs(process.argv.slice(2));
  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required to seed the demo project. Set it before running db:seed:demo.",
    );
  }

  const db = await getDb(databaseUrl);
  const repository = createPostgresProjectRepository(db);

  const result = await seedDemoProject(
    repository,
    { reset, validateOscal: true },
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

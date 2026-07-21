/**
 * Seed the canonical CGDS / SGOP demo project into DATABASE_PATH.
 *
 * Usage:
 *   npm run db:seed:demo
 *   npm run db:seed:demo -- --reset
 */
import { closeDb, getDb, resolveDatabasePath } from "../src/persistence/sqlite/client";
import { createSqliteProjectRepository } from "../src/persistence/sqlite/project-repository";
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
  const databasePath = resolveDatabasePath();
  const repository = createSqliteProjectRepository(getDb(databasePath));

  const result = await seedDemoProject(
    repository,
    { reset, validateOscal: true },
    { databasePathHint: databasePath },
  );

  console.log(formatSeedDemoSummary(result));
  closeDb();
}

main().catch((error) => {
  console.error(error);
  closeDb();
  process.exit(1);
});

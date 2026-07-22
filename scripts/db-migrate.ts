import {
  closeDb,
  getDb,
  resolveDatabaseUrl,
} from "../src/persistence/postgres/client";
import { loadLocalEnv } from "./load-env";

/**
 * Apply Drizzle PostgreSQL migrations to DATABASE_URL.
 * Usage: npm run db:migrate
 *
 * SQLite migration tooling remains under `drizzle/` + `src/persistence/sqlite/`
 * for the one-shot cutover path (ADR-016).
 */
async function main(): Promise<void> {
  loadLocalEnv();
  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required to run migrations. Set it in the environment.",
    );
  }
  console.log("Migrating PostgreSQL database…");
  await getDb(databaseUrl);
  await closeDb();
  console.log("Migrations applied.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { resolveDatabasePath, getDb, closeDb } from "../src/persistence/sqlite/client";

/**
 * Apply Drizzle migrations to DATABASE_PATH (or the default local file).
 * Usage: npm run db:migrate
 */
function main(): void {
  const databasePath = resolveDatabasePath();
  console.log(`Migrating database at ${databasePath}`);
  getDb(databasePath);
  closeDb();
  console.log("Migrations applied.");
}

main();

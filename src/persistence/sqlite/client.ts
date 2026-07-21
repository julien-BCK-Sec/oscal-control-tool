import "server-only";

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

export type AppDatabase = ReturnType<typeof drizzle<typeof schema>>;

let cached: { db: AppDatabase; sqlite: Database.Database; path: string } | null =
  null;

/**
 * Resolve SQLite file path. Server-only; never use NEXT_PUBLIC_*.
 *
 * - Development / test: default `<cwd>/data/oscal-control-tool.sqlite`
 * - Production runtime: DATABASE_PATH is required (no silent local fallback)
 * - `next build` (NODE_ENV=production + NEXT_PHASE=phase-production-build):
 *   default is allowed so the build can complete without opening the DB
 */
export function resolveDatabasePath(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const configured = env.DATABASE_PATH?.trim();
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.resolve(/* turbopackIgnore: true */ process.cwd(), configured);
  }

  const isProductionRuntime =
    env.NODE_ENV === "production" &&
    env.NEXT_PHASE !== "phase-production-build";

  if (isProductionRuntime) {
    throw new Error(
      "DATABASE_PATH must be set in production (e.g. /var/data/oscal-author.db). Refusing to use a repository-local default.",
    );
  }

  return path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    "data",
    "oscal-control-tool.sqlite",
  );
}

function migrationsFolder(): string {
  return path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    "drizzle",
  );
}

/**
 * Open (or reuse) the application database and apply migrations.
 * Safe to call from Server Actions on the Node.js runtime.
 */
export function getDb(databasePath = resolveDatabasePath()): AppDatabase {
  if (cached && cached.path === databasePath) {
    return cached.db;
  }

  if (cached) {
    cached.sqlite.close();
    cached = null;
  }

  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: migrationsFolder() });

  cached = { db, sqlite, path: databasePath };
  return db;
}

/** Test helper: close and clear the cached connection. */
export function closeDb(): void {
  if (cached) {
    cached.sqlite.close();
    cached = null;
  }
}

/** Test helper: open a fresh database at an explicit path. */
export function openDbAt(databasePath: string): AppDatabase {
  closeDb();
  return getDb(databasePath);
}

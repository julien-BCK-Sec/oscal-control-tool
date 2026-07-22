import "server-only";

import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { migrate as migrateNodePostgres } from "drizzle-orm/node-postgres/migrator";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./schema";

/**
 * Application database handle used by repositories.
 *
 * Repositories are written against the `pg` / `drizzle-orm/node-postgres`
 * shape. `openTestDb()` (PGlite) is a structural stand-in for tests: both
 * drivers implement the same `drizzle-orm/pg-core` query builder API
 * (select/insert/update/delete/transaction), so the PGlite database is safe
 * to use anywhere an `AppDatabase` is expected. A single concrete type
 * (rather than a union of both driver types) is used deliberately — unioning
 * `NodePgDatabase` and `PgliteDatabase` breaks TypeScript's resolution of
 * overloaded builder methods such as `.returning()`.
 */
export type AppDatabase = NodePgDatabase<typeof schema>;

type PooledCacheEntry = {
  db: NodePgDatabase<typeof schema>;
  pool: Pool;
  url: string;
};

type TestCacheEntry = {
  db: PgliteDatabase<typeof schema>;
  client: PGlite;
};

let pooledCachePromise: Promise<PooledCacheEntry> | null = null;
let testCachePromise: Promise<TestCacheEntry> | null = null;

/**
 * Resolve the PostgreSQL connection string. Server-only; never use
 * NEXT_PUBLIC_*.
 *
 * - `DATABASE_URL` is always used when set.
 * - Production runtime (NODE_ENV=production and not `next build`): required.
 *   Refuses a silent local/default connection (fail closed).
 * - `next build` or non-production: unset is allowed (returns undefined) so
 *   the caller can decide whether a connection is actually needed. Building
 *   the app must not require a live database.
 */
export function resolveDatabaseUrl(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const configured = env.DATABASE_URL?.trim();
  if (configured) {
    return configured;
  }

  const isProductionRuntime =
    env.NODE_ENV === "production" && env.NEXT_PHASE !== "phase-production-build";

  if (isProductionRuntime) {
    throw new Error(
      "DATABASE_URL must be set in production (e.g. a Render PostgreSQL connection string). Refusing to use a silent local default.",
    );
  }

  return undefined;
}

function migrationsFolder(): string {
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), "drizzle-pg");
}

/**
 * Render's external PostgreSQL connection strings advertise
 * `sslmode=require`. Internal connections do not require TLS. `DATABASE_SSL`
 * allows an explicit override for other providers.
 */
function shouldUseSsl(
  databaseUrl: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.DATABASE_SSL === "true") {
    return true;
  }
  return /sslmode=require/i.test(databaseUrl);
}

async function createPooledDb(databaseUrl: string): Promise<PooledCacheEntry> {
  const pool = new Pool({
    connectionString: databaseUrl,
    // Bounded pool: avoid unbounded connections against a shared PostgreSQL
    // instance under Next.js Server Action concurrency.
    max: 10,
    ssl: shouldUseSsl(databaseUrl) ? { rejectUnauthorized: true } : undefined,
  });

  const db = drizzleNodePostgres(pool, { schema });
  await migrateNodePostgres(db, { migrationsFolder: migrationsFolder() });

  return { db, pool, url: databaseUrl };
}

/**
 * Open (or reuse) the pooled application database and apply migrations.
 * Safe to call from Server Actions on the Node.js runtime.
 */
export async function getDb(
  databaseUrl = resolveDatabaseUrl(),
): Promise<AppDatabase> {
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required to connect to PostgreSQL. Set it before calling getDb().",
    );
  }

  if (pooledCachePromise) {
    const cached = await pooledCachePromise;
    if (cached.url === databaseUrl) {
      return cached.db;
    }
    pooledCachePromise = null;
    await cached.pool.end();
  }

  pooledCachePromise = createPooledDb(databaseUrl);
  const created = await pooledCachePromise;
  return created.db;
}

/** Test helper: open a fresh pooled connection at an explicit URL. */
export async function openDbWithUrl(url: string): Promise<AppDatabase> {
  await closePooledDb();
  return getDb(url);
}

async function closePooledDb(): Promise<void> {
  if (!pooledCachePromise) {
    return;
  }
  const promise = pooledCachePromise;
  pooledCachePromise = null;
  const cached = await promise.catch(() => null);
  if (cached) {
    await cached.pool.end();
  }
}

async function createTestDb(): Promise<TestCacheEntry> {
  const client = new PGlite();
  const db = drizzlePglite(client, { schema });
  await migratePglite(db, { migrationsFolder: migrationsFolder() });
  return { db, client };
}

/**
 * Test helper: open a fresh in-memory PGlite database (PostgreSQL dialect)
 * and apply the same PostgreSQL migrations. Closes any previously opened
 * test database first. Cached independently from the pooled `pg` connection
 * so tests never touch a real PostgreSQL server.
 */
export async function openTestDb(): Promise<AppDatabase> {
  await closeTestDb();
  testCachePromise = createTestDb();
  const created = await testCachePromise;
  // Safe structural cast: see the `AppDatabase` comment above. PGlite's
  // drizzle database implements the same pg-core query builder API as
  // node-postgres; only the underlying driver/client differs.
  return created.db as unknown as AppDatabase;
}

async function closeTestDb(): Promise<void> {
  if (!testCachePromise) {
    return;
  }
  const promise = testCachePromise;
  testCachePromise = null;
  const cached = await promise.catch(() => null);
  if (cached) {
    await cached.client.close();
  }
}

/** Test helper: close and clear both cached connections (pooled + test). */
export async function closeDb(): Promise<void> {
  await closePooledDb();
  await closeTestDb();
}

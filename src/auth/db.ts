import "server-only";

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@/persistence/postgres/auth-schema";
import { resolveDatabaseUrl } from "@/persistence/postgres/client";

/**
 * Dedicated synchronous Drizzle handle for Better Auth.
 *
 * Better Auth builds its configuration at module load and needs a Drizzle
 * instance immediately, so this cannot use the async pooled `getDb()` (which
 * also applies migrations). Migrations are owned by `npm run db:migrate` /
 * production startup; this pool only issues queries. `DATABASE_URL` resolution
 * fails closed in production (never a silent local default) and is permitted to
 * be unset during `next build`.
 */
let cachedDb: NodePgDatabase<typeof schema> | null = null;

function shouldUseSsl(url: string): boolean {
  if (process.env.DATABASE_SSL === "true") {
    return true;
  }
  return /sslmode=require/i.test(url);
}

export function getAuthDb(): NodePgDatabase<typeof schema> {
  if (cachedDb) {
    return cachedDb;
  }
  const url = resolveDatabaseUrl();
  const pool = new Pool({
    connectionString: url,
    max: 5,
    ssl: url && shouldUseSsl(url) ? { rejectUnauthorized: true } : undefined,
  });
  cachedDb = drizzle(pool, { schema });
  return cachedDb;
}

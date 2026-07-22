import { defineConfig } from "drizzle-kit";

/**
 * PostgreSQL counterpart to `drizzle.config.ts` (SQLite). Generates
 * migrations for `src/persistence/postgres/schema.ts` into `drizzle-pg/`,
 * applied by `src/persistence/postgres/client.ts` (`getDb` / `openTestDb`).
 */
export default defineConfig({
  schema: "./src/persistence/postgres/schema.ts",
  out: "./drizzle-pg",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://localhost:5432/oscal-control-tool",
  },
});

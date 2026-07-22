/**
 * One-shot offline SQLite -> PostgreSQL data migration (ADR-016).
 *
 * Usage:
 *   npm run db:migrate:sqlite-to-pg -- \
 *     --sqlite ./data/oscal-control-tool.sqlite \
 *     --postgres postgres://user:pass@host:5432/db \
 *     --organization-id <uuid> \
 *     [--dry-run] [--strict]
 *
 * Or via environment variables:
 *   DATABASE_PATH=./data/oscal-control-tool.sqlite \
 *   DATABASE_URL=postgres://user:pass@host:5432/db \
 *   npm run db:migrate:sqlite-to-pg -- --organization-id <uuid>
 *
 * See docs/playbooks/sqlite-to-postgres-cutover.md for the full cutover
 * procedure. Does not implement dual-write; run exactly once per
 * environment. Safe to re-run — inserts are skipped for ids that already
 * exist in the target (idempotent by primary key).
 */
import path from "node:path";
import {
  closeDb as closePostgresDb,
  openDbWithUrl,
} from "../src/persistence/postgres/client";
import { closeDb as closeSqliteDb, openDbAt } from "../src/persistence/sqlite/client";
import {
  formatMigrationReport,
  migrateSqliteToPostgres,
} from "../src/persistence/migrate/sqlite-to-postgres";
import { loadLocalEnv } from "./load-env";

type CliArgs = {
  sqlitePath?: string;
  postgresUrl?: string;
  organizationId?: string;
  dryRun: boolean;
  strict: boolean;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { dryRun: false, strict: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--sqlite":
        args.sqlitePath = argv[(i += 1)];
        break;
      case "--postgres":
        args.postgresUrl = argv[(i += 1)];
        break;
      case "--organization-id":
        args.organizationId = argv[(i += 1)];
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--strict":
        args.strict = true;
        break;
      default:
        throw new Error(
          `Unrecognized argument: ${arg}. Supported: --sqlite, --postgres, --organization-id, --dry-run, --strict.`,
        );
    }
  }
  return args;
}

/** Never log connection secrets. */
function redactConnectionString(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = "***";
    }
    return parsed.toString();
  } catch {
    return "(unparseable connection string)";
  }
}

async function main(): Promise<void> {
  loadLocalEnv();
  const args = parseArgs(process.argv.slice(2));

  const sqlitePath = args.sqlitePath?.trim() || process.env.DATABASE_PATH?.trim();
  const postgresUrl = args.postgresUrl?.trim() || process.env.DATABASE_URL?.trim();
  const organizationId = args.organizationId?.trim();

  if (!sqlitePath) {
    throw new Error(
      "Source SQLite path is required. Set DATABASE_PATH or pass --sqlite <path>.",
    );
  }
  if (!postgresUrl) {
    throw new Error(
      "Target PostgreSQL connection string is required. Set DATABASE_URL or pass --postgres <url>.",
    );
  }
  if (!organizationId) {
    throw new Error(
      "--organization-id <id> is required. Every migrated project is assigned to this organization (ADR-016). Better Auth organization bootstrap comes in a later work package — supply an id created out of band for now.",
    );
  }

  console.log("=".repeat(72));
  console.log("SQLite -> PostgreSQL one-shot migration (ADR-016)");
  console.log("=".repeat(72));
  console.log(
    "STOP CONDITION: application writes to the source SQLite database must " +
      "be stopped before running this against a production cutover. This " +
      "tool does not dual-write, does not lock the source file, and does " +
      "not sync PostgreSQL back to SQLite.",
  );
  console.log("");
  console.log(`Source SQLite path: ${path.resolve(sqlitePath)}`);
  console.log(`Target PostgreSQL:  ${redactConnectionString(postgresUrl)}`);
  console.log(`Organization id:    ${organizationId}`);
  console.log(
    `Mode:               ${args.dryRun ? "dry run (count and validate only, no writes)" : "write"}${args.strict ? " + strict" : ""}`,
  );
  console.log("");

  const sqliteDb = openDbAt(sqlitePath);
  const pgDb = await openDbWithUrl(postgresUrl);

  try {
    const report = await migrateSqliteToPostgres(sqliteDb, pgDb, {
      organizationId,
      dryRun: args.dryRun,
      strict: args.strict,
    });

    console.log(formatMigrationReport(report));

    const hasOrphans = report.orphanChecks.some((check) => check.orphanCount > 0);
    const hasRevisionMismatch = report.sampleProjectRevisionChecks.some(
      (check) => !check.match,
    );
    if (hasOrphans || hasRevisionMismatch) {
      console.error(
        "\nVerification found issues above. Do not switch the application to " +
          "PostgreSQL until they are understood and resolved.",
      );
      process.exitCode = 1;
    } else if (!report.dryRun) {
      console.log(
        "\nMigration complete. Verify representative projects and OSCAL " +
          "export before switching DATABASE_URL in the application " +
          "environment.",
      );
    }
  } finally {
    closeSqliteDb();
    await closePostgresDb();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

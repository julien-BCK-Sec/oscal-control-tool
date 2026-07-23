import "server-only";

import { inArray } from "drizzle-orm";
import {
  DEFAULT_EVIDENCE_REQUIREMENT,
  isEvidenceRequirement,
} from "@/data/evidence";
import type { AppDatabase as SqliteDatabase } from "../sqlite/client";
import {
  controlActivities as sqliteControlActivities,
  controlRecords as sqliteControlRecords,
  projectSnapshots as sqliteProjectSnapshots,
  projects as sqliteProjects,
  type ControlActivityRow,
  type ControlRecordRow,
  type ProjectRow,
  type ProjectSnapshotRow,
} from "../sqlite/schema";
import type { AppDatabase as PostgresDatabase } from "../postgres/client";
import {
  controlActivities as pgControlActivities,
  controlRecords as pgControlRecords,
  projectSnapshots as pgProjectSnapshots,
  projects as pgProjects,
} from "../postgres/schema";

/**
 * One-shot offline SQLite -> PostgreSQL data migration (ADR-016).
 *
 * Migration order matters: `projects` (with `organizationId` assigned) must
 * be inserted before `project_snapshots` and `control_records` (both carry a
 * `project_id` foreign key), and `control_records` must be inserted before
 * `control_activities` (`control_record_id` foreign key).
 *
 * Idempotent by primary key: rows whose id already exists in the target are
 * skipped (never duplicated, never overwritten). This module never dual
 * writes — it is intended to run exactly once per environment as part of the
 * documented cutover in `docs/playbooks/sqlite-to-postgres-cutover.md`.
 */

/**
 * Read/write surface this module needs from a Postgres database or
 * transaction. Deliberately narrow (not the full `AppDatabase`/transaction
 * type) so both the pooled `pg` connection and a `db.transaction()` callback
 * satisfy it structurally.
 */
type PgReadWriter = Pick<PostgresDatabase, "select" | "insert">;

export type SqliteToPostgresMigrationOptions = {
  /**
   * Organization to assign to every migrated project. Required — Milestone 1
   * Work Package 3 will require `organizationId` on every project, and this
   * migrator is the one place existing SQLite projects gain that value.
   */
  organizationId: string;
  /** Count and validate only; never write to the target database. */
  dryRun?: boolean;
  /**
   * When true, throw if a row id already exists in the target with content
   * that differs from the source row. When false (default), log a warning
   * and skip — matching the "insert only missing ids" idempotency contract.
   */
  strict?: boolean;
};

export type TableMigrationCounts = {
  /** Row count read from the SQLite source table. */
  sourceCount: number;
  /** Row count in the PostgreSQL target table before this run. */
  targetCountBefore: number;
  /** Row count in the PostgreSQL target table after this run (or the count that would result, under `dryRun`). */
  targetCountAfter: number;
  /** Rows inserted this run (or that would be inserted, under `dryRun`). */
  inserted: number;
  /** Rows whose id already existed in the target and were left untouched. */
  skippedExisting: number;
};

export type OrphanCheckResult = {
  label: string;
  orphanCount: number;
  /** A small sample of orphaned row ids for investigation (never row content). */
  sampleIds: string[];
};

export type ProjectRevisionCheck = {
  projectId: string;
  sourceRevision: number;
  targetRevision: number | null;
  match: boolean;
};

export type SqliteToPostgresMigrationReport = {
  dryRun: boolean;
  organizationId: string;
  startedAt: string;
  finishedAt: string;
  tables: {
    projects: TableMigrationCounts;
    projectSnapshots: TableMigrationCounts;
    controlRecords: TableMigrationCounts;
    controlActivities: TableMigrationCounts;
  };
  orphanChecks: OrphanCheckResult[];
  sampleProjectRevisionChecks: ProjectRevisionCheck[];
  activityOrderingNote: string;
  /** Non-fatal issues encountered (e.g. non-strict content conflicts). */
  warnings: string[];
};

const ID_CHUNK_SIZE = 500;
const REVISION_SAMPLE_SIZE = 5;
const ORPHAN_SAMPLE_SIZE = 5;

function nowIso(): string {
  return new Date().toISOString();
}

function mapEvidenceRequirement(
  value: string | null | undefined,
): string {
  return isEvidenceRequirement(value) ? value : DEFAULT_EVIDENCE_REQUIREMENT;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function partitionExisting<T extends { id: string }>(
  rows: T[],
  existingIds: ReadonlySet<string>,
): { toInsert: T[]; existing: T[] } {
  const toInsert: T[] = [];
  const existing: T[] = [];
  for (const row of rows) {
    (existingIds.has(row.id) ? existing : toInsert).push(row);
  }
  return { toInsert, existing };
}

/** Runs `selectChunk` once per batch of ids to stay under driver parameter limits. */
async function selectInChunks<T>(
  ids: string[],
  selectChunk: (idsChunk: string[]) => Promise<T[]>,
): Promise<T[]> {
  if (ids.length === 0) {
    return [];
  }
  const results: T[] = [];
  for (const idsChunk of chunk(ids, ID_CHUNK_SIZE)) {
    results.push(...(await selectChunk(idsChunk)));
  }
  return results;
}

function conflictMessage(table: string, id: string): string {
  return `Conflicting content for existing ${table} row id ${id}: target does not match source. Skipping (non-strict mode).`;
}

// ---------------------------------------------------------------------------
// projects
// ---------------------------------------------------------------------------

async function migrateProjectsTable(
  sourceRows: ProjectRow[],
  db: PgReadWriter,
  organizationId: string,
  options: { dryRun: boolean; strict: boolean; warnings: string[] },
): Promise<TableMigrationCounts> {
  const targetCountBefore = (
    await db.select({ id: pgProjects.id }).from(pgProjects)
  ).length;

  if (sourceRows.length === 0) {
    return {
      sourceCount: 0,
      targetCountBefore,
      targetCountAfter: targetCountBefore,
      inserted: 0,
      skippedExisting: 0,
    };
  }

  const ids = sourceRows.map((row) => row.id);
  const existingRows = await selectInChunks(ids, (idsChunk) =>
    db.select().from(pgProjects).where(inArray(pgProjects.id, idsChunk)),
  );
  const existingById = new Map(existingRows.map((row) => [row.id, row]));
  const { toInsert, existing } = partitionExisting(
    sourceRows,
    new Set(existingById.keys()),
  );

  for (const row of existing) {
    const existingRow = existingById.get(row.id);
    if (!existingRow) {
      continue;
    }
    const matches =
      existingRow.projectJson === row.projectJson &&
      existingRow.revision === row.revision &&
      existingRow.createdAt === row.createdAt;
    if (!matches) {
      const message = conflictMessage("projects", row.id);
      if (options.strict) {
        throw new Error(message);
      }
      options.warnings.push(message);
    }
  }

  if (!options.dryRun && toInsert.length > 0) {
    for (const batch of chunk(toInsert, ID_CHUNK_SIZE)) {
      await db.insert(pgProjects).values(
        batch.map((row) => ({
          id: row.id,
          name: row.name,
          organizationName: row.organizationName,
          organizationId,
          frameworkId: row.frameworkId,
          schemaVersion: row.schemaVersion,
          revision: row.revision,
          projectJson: row.projectJson,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        })),
      );
    }
  }

  return {
    sourceCount: sourceRows.length,
    targetCountBefore,
    targetCountAfter: options.dryRun
      ? targetCountBefore
      : targetCountBefore + toInsert.length,
    inserted: toInsert.length,
    skippedExisting: existing.length,
  };
}

// ---------------------------------------------------------------------------
// project_snapshots
// ---------------------------------------------------------------------------

async function migrateProjectSnapshotsTable(
  sourceRows: ProjectSnapshotRow[],
  db: PgReadWriter,
  options: { dryRun: boolean; strict: boolean; warnings: string[] },
): Promise<TableMigrationCounts> {
  const targetCountBefore = (
    await db.select({ id: pgProjectSnapshots.id }).from(pgProjectSnapshots)
  ).length;

  if (sourceRows.length === 0) {
    return {
      sourceCount: 0,
      targetCountBefore,
      targetCountAfter: targetCountBefore,
      inserted: 0,
      skippedExisting: 0,
    };
  }

  const ids = sourceRows.map((row) => row.id);
  const existingRows = await selectInChunks(ids, (idsChunk) =>
    db
      .select()
      .from(pgProjectSnapshots)
      .where(inArray(pgProjectSnapshots.id, idsChunk)),
  );
  const existingById = new Map(existingRows.map((row) => [row.id, row]));
  const { toInsert, existing } = partitionExisting(
    sourceRows,
    new Set(existingById.keys()),
  );

  for (const row of existing) {
    const existingRow = existingById.get(row.id);
    if (!existingRow) {
      continue;
    }
    const matches =
      existingRow.projectJson === row.projectJson &&
      existingRow.projectRevision === row.projectRevision &&
      existingRow.contentFingerprint === row.contentFingerprint &&
      existingRow.createdAt === row.createdAt;
    if (!matches) {
      const message = conflictMessage("project_snapshots", row.id);
      if (options.strict) {
        throw new Error(message);
      }
      options.warnings.push(message);
    }
  }

  if (!options.dryRun && toInsert.length > 0) {
    for (const batch of chunk(toInsert, ID_CHUNK_SIZE)) {
      await db.insert(pgProjectSnapshots).values(
        batch.map((row) => ({
          id: row.id,
          projectId: row.projectId,
          snapshotType: row.snapshotType,
          name: row.name,
          projectJson: row.projectJson,
          projectRevision: row.projectRevision,
          contentFingerprint: row.contentFingerprint,
          createdAt: row.createdAt,
        })),
      );
    }
  }

  return {
    sourceCount: sourceRows.length,
    targetCountBefore,
    targetCountAfter: options.dryRun
      ? targetCountBefore
      : targetCountBefore + toInsert.length,
    inserted: toInsert.length,
    skippedExisting: existing.length,
  };
}

// ---------------------------------------------------------------------------
// control_records
// ---------------------------------------------------------------------------

async function migrateControlRecordsTable(
  sourceRows: ControlRecordRow[],
  db: PgReadWriter,
  options: { dryRun: boolean; strict: boolean; warnings: string[] },
): Promise<TableMigrationCounts> {
  const targetCountBefore = (
    await db.select({ id: pgControlRecords.id }).from(pgControlRecords)
  ).length;

  if (sourceRows.length === 0) {
    return {
      sourceCount: 0,
      targetCountBefore,
      targetCountAfter: targetCountBefore,
      inserted: 0,
      skippedExisting: 0,
    };
  }

  const ids = sourceRows.map((row) => row.id);
  const existingRows = await selectInChunks(ids, (idsChunk) =>
    db
      .select()
      .from(pgControlRecords)
      .where(inArray(pgControlRecords.id, idsChunk)),
  );
  const existingById = new Map(existingRows.map((row) => [row.id, row]));
  const { toInsert, existing } = partitionExisting(
    sourceRows,
    new Set(existingById.keys()),
  );

  for (const row of existing) {
    const existingRow = existingById.get(row.id);
    if (!existingRow) {
      continue;
    }
    const matches =
      existingRow.owner === row.owner &&
      existingRow.coOwner === row.coOwner &&
      existingRow.businessUnit === row.businessUnit &&
      existingRow.implementationStatus === row.implementationStatus &&
      existingRow.reviewStatus === row.reviewStatus &&
      existingRow.reviewDueDate === row.reviewDueDate &&
      existingRow.evidenceRequirement ===
        mapEvidenceRequirement(row.evidenceRequirement) &&
      existingRow.createdAt === row.createdAt &&
      existingRow.updatedAt === row.updatedAt;
    if (!matches) {
      const message = conflictMessage("control_records", row.id);
      if (options.strict) {
        throw new Error(message);
      }
      options.warnings.push(message);
    }
  }

  if (!options.dryRun && toInsert.length > 0) {
    for (const batch of chunk(toInsert, ID_CHUNK_SIZE)) {
      await db.insert(pgControlRecords).values(
        batch.map((row) => ({
          id: row.id,
          projectId: row.projectId,
          controlId: row.controlId,
          owner: row.owner,
          coOwner: row.coOwner,
          businessUnit: row.businessUnit,
          implementationStatus: row.implementationStatus,
          reviewStatus: row.reviewStatus,
          reviewDueDate: row.reviewDueDate,
          evidenceRequirement: mapEvidenceRequirement(row.evidenceRequirement),
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        })),
      );
    }
  }

  return {
    sourceCount: sourceRows.length,
    targetCountBefore,
    targetCountAfter: options.dryRun
      ? targetCountBefore
      : targetCountBefore + toInsert.length,
    inserted: toInsert.length,
    skippedExisting: existing.length,
  };
}

// ---------------------------------------------------------------------------
// control_activities
// ---------------------------------------------------------------------------

async function migrateControlActivitiesTable(
  sourceRows: ControlActivityRow[],
  db: PgReadWriter,
  options: { dryRun: boolean; strict: boolean; warnings: string[] },
): Promise<TableMigrationCounts> {
  const targetCountBefore = (
    await db.select({ id: pgControlActivities.id }).from(pgControlActivities)
  ).length;

  if (sourceRows.length === 0) {
    return {
      sourceCount: 0,
      targetCountBefore,
      targetCountAfter: targetCountBefore,
      inserted: 0,
      skippedExisting: 0,
    };
  }

  const ids = sourceRows.map((row) => row.id);
  const existingRows = await selectInChunks(ids, (idsChunk) =>
    db
      .select()
      .from(pgControlActivities)
      .where(inArray(pgControlActivities.id, idsChunk)),
  );
  const existingById = new Map(existingRows.map((row) => [row.id, row]));
  const { toInsert, existing } = partitionExisting(
    sourceRows,
    new Set(existingById.keys()),
  );

  for (const row of existing) {
    const existingRow = existingById.get(row.id);
    if (!existingRow) {
      continue;
    }
    const matches =
      existingRow.activityType === row.activityType &&
      existingRow.actorId === row.actorId &&
      existingRow.actorDisplayName === row.actorDisplayName &&
      existingRow.fieldName === row.fieldName &&
      existingRow.previousValue === row.previousValue &&
      existingRow.newValue === row.newValue &&
      existingRow.metadataJson === row.metadataJson &&
      existingRow.createdAt === row.createdAt;
    if (!matches) {
      const message = conflictMessage("control_activities", row.id);
      if (options.strict) {
        throw new Error(message);
      }
      options.warnings.push(message);
    }
  }

  if (!options.dryRun && toInsert.length > 0) {
    for (const batch of chunk(toInsert, ID_CHUNK_SIZE)) {
      await db.insert(pgControlActivities).values(
        batch.map((row) => ({
          id: row.id,
          controlRecordId: row.controlRecordId,
          activityType: row.activityType,
          actorId: row.actorId,
          actorDisplayName: row.actorDisplayName,
          fieldName: row.fieldName,
          previousValue: row.previousValue,
          newValue: row.newValue,
          metadataJson: row.metadataJson,
          createdAt: row.createdAt,
        })),
      );
    }
  }

  return {
    sourceCount: sourceRows.length,
    targetCountBefore,
    targetCountAfter: options.dryRun
      ? targetCountBefore
      : targetCountBefore + toInsert.length,
    inserted: toInsert.length,
    skippedExisting: existing.length,
  };
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

async function computeOrphanChecks(
  db: PgReadWriter,
): Promise<OrphanCheckResult[]> {
  const projectIds = new Set(
    (await db.select({ id: pgProjects.id }).from(pgProjects)).map(
      (row) => row.id,
    ),
  );
  const controlRecordIds = new Set(
    (
      await db.select({ id: pgControlRecords.id }).from(pgControlRecords)
    ).map((row) => row.id),
  );

  const snapshots = await db
    .select({
      id: pgProjectSnapshots.id,
      projectId: pgProjectSnapshots.projectId,
    })
    .from(pgProjectSnapshots);
  const orphanSnapshots = snapshots.filter(
    (row) => !projectIds.has(row.projectId),
  );

  const controlRecords = await db
    .select({ id: pgControlRecords.id, projectId: pgControlRecords.projectId })
    .from(pgControlRecords);
  const orphanControlRecords = controlRecords.filter(
    (row) => !projectIds.has(row.projectId),
  );

  const activities = await db
    .select({
      id: pgControlActivities.id,
      controlRecordId: pgControlActivities.controlRecordId,
    })
    .from(pgControlActivities);
  const orphanActivities = activities.filter(
    (row) => !controlRecordIds.has(row.controlRecordId),
  );

  return [
    {
      label: "project_snapshots without a matching project",
      orphanCount: orphanSnapshots.length,
      sampleIds: orphanSnapshots.slice(0, ORPHAN_SAMPLE_SIZE).map((r) => r.id),
    },
    {
      label: "control_records without a matching project",
      orphanCount: orphanControlRecords.length,
      sampleIds: orphanControlRecords
        .slice(0, ORPHAN_SAMPLE_SIZE)
        .map((r) => r.id),
    },
    {
      label: "control_activities without a matching control_record",
      orphanCount: orphanActivities.length,
      sampleIds: orphanActivities
        .slice(0, ORPHAN_SAMPLE_SIZE)
        .map((r) => r.id),
    },
  ];
}

async function computeSampleProjectRevisionChecks(
  sourceRows: ProjectRow[],
  db: PgReadWriter,
  sampleSize = REVISION_SAMPLE_SIZE,
): Promise<ProjectRevisionCheck[]> {
  const sample = sourceRows.slice(0, sampleSize);
  if (sample.length === 0) {
    return [];
  }

  const targetRows = await db
    .select({ id: pgProjects.id, revision: pgProjects.revision })
    .from(pgProjects)
    .where(inArray(pgProjects.id, sample.map((row) => row.id)));
  const targetRevisionById = new Map(
    targetRows.map((row) => [row.id, row.revision]),
  );

  return sample.map((row) => {
    const targetRevision = targetRevisionById.get(row.id) ?? null;
    return {
      projectId: row.id,
      sourceRevision: row.revision,
      targetRevision,
      match: targetRevision === row.revision,
    };
  });
}

const ACTIVITY_ORDERING_NOTE =
  "control_activities.created_at values are copied verbatim from SQLite " +
  "(ISO-8601 text). Activity reads always order by created_at (see " +
  "postgres/control-activity-repository.ts), so chronological ordering is " +
  "preserved regardless of physical insertion order.";

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

/**
 * Run the one-shot SQLite -> PostgreSQL migration and return a verification
 * report. Never dual-writes; safe to re-run (idempotent by row id). Callers
 * are responsible for stopping application writes before invoking this in a
 * production cutover (see `docs/playbooks/sqlite-to-postgres-cutover.md`).
 */
export async function migrateSqliteToPostgres(
  sqliteDb: SqliteDatabase,
  pgDb: PostgresDatabase,
  options: SqliteToPostgresMigrationOptions,
): Promise<SqliteToPostgresMigrationReport> {
  const organizationId = options.organizationId.trim();
  if (!organizationId) {
    throw new Error(
      "organizationId is required to migrate SQLite projects to PostgreSQL (ADR-016).",
    );
  }
  const dryRun = options.dryRun ?? false;
  const strict = options.strict ?? false;
  const warnings: string[] = [];
  const startedAt = nowIso();

  // Read all source rows up-front. Order of migration below (not this read
  // order) is what matters for foreign keys.
  const sourceProjects = await sqliteDb.select().from(sqliteProjects);
  const sourceSnapshots = await sqliteDb
    .select()
    .from(sqliteProjectSnapshots);
  const sourceControlRecords = await sqliteDb
    .select()
    .from(sqliteControlRecords);
  const sourceControlActivities = await sqliteDb
    .select()
    .from(sqliteControlActivities);

  const runWrites = async (db: PgReadWriter) => {
    const projectsCounts = await migrateProjectsTable(
      sourceProjects,
      db,
      organizationId,
      { dryRun, strict, warnings },
    );
    const snapshotsCounts = await migrateProjectSnapshotsTable(
      sourceSnapshots,
      db,
      { dryRun, strict, warnings },
    );
    const controlRecordsCounts = await migrateControlRecordsTable(
      sourceControlRecords,
      db,
      { dryRun, strict, warnings },
    );
    const controlActivitiesCounts = await migrateControlActivitiesTable(
      sourceControlActivities,
      db,
      { dryRun, strict, warnings },
    );
    return {
      projectsCounts,
      snapshotsCounts,
      controlRecordsCounts,
      controlActivitiesCounts,
    };
  };

  const { projectsCounts, snapshotsCounts, controlRecordsCounts, controlActivitiesCounts } =
    dryRun ? await runWrites(pgDb) : await pgDb.transaction((tx) => runWrites(tx));

  const orphanChecks = await computeOrphanChecks(pgDb);
  const sampleProjectRevisionChecks = await computeSampleProjectRevisionChecks(
    sourceProjects,
    pgDb,
  );

  return {
    dryRun,
    organizationId,
    startedAt,
    finishedAt: nowIso(),
    tables: {
      projects: projectsCounts,
      projectSnapshots: snapshotsCounts,
      controlRecords: controlRecordsCounts,
      controlActivities: controlActivitiesCounts,
    },
    orphanChecks,
    sampleProjectRevisionChecks,
    activityOrderingNote: ACTIVITY_ORDERING_NOTE,
    warnings,
  };
}

/**
 * Render a migration report as human-readable text. Never includes
 * `project_json` bodies or authored narrative content — counts and
 * identifiers only.
 */
export function formatMigrationReport(
  report: SqliteToPostgresMigrationReport,
): string {
  const lines: string[] = [];
  lines.push(
    `SQLite -> PostgreSQL migration ${report.dryRun ? "(dry run — no writes)" : "report"}`,
  );
  lines.push(`Organization: ${report.organizationId}`);
  lines.push(`Started: ${report.startedAt}`);
  lines.push(`Finished: ${report.finishedAt}`);
  lines.push("");
  lines.push("Table counts (source -> target before -> target after | inserted / skipped):");

  const tableRows: Array<[string, TableMigrationCounts]> = [
    ["projects", report.tables.projects],
    ["project_snapshots", report.tables.projectSnapshots],
    ["control_records", report.tables.controlRecords],
    ["control_activities", report.tables.controlActivities],
  ];
  for (const [label, counts] of tableRows) {
    lines.push(
      `  ${label}: ${counts.sourceCount} -> ${counts.targetCountBefore} -> ${counts.targetCountAfter} | inserted ${counts.inserted}, skipped ${counts.skippedExisting}`,
    );
  }

  lines.push("");
  lines.push("Orphan checks:");
  for (const check of report.orphanChecks) {
    lines.push(
      `  ${check.label}: ${check.orphanCount}${
        check.orphanCount > 0 ? ` (sample ids: ${check.sampleIds.join(", ")})` : ""
      }`,
    );
  }

  lines.push("");
  lines.push("Sample project revision checks:");
  if (report.sampleProjectRevisionChecks.length === 0) {
    lines.push("  (no projects to sample)");
  }
  for (const check of report.sampleProjectRevisionChecks) {
    lines.push(
      `  ${check.projectId}: source rev ${check.sourceRevision}, target rev ${check.targetRevision ?? "missing"} — ${check.match ? "match" : "MISMATCH"}`,
    );
  }

  lines.push("");
  lines.push(`Activity ordering: ${report.activityOrderingNote}`);

  if (report.warnings.length > 0) {
    lines.push("");
    lines.push("Warnings:");
    for (const warning of report.warnings) {
      lines.push(`  - ${warning}`);
    }
  }

  return lines.join("\n");
}

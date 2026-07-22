import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";
import { eq } from "drizzle-orm";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import { DEFAULT_CONTROL_RECORD_FIELDS } from "@/data/control-record";
import { SYSTEM_ACTOR } from "@/persistence/actor";
import {
  migrateSqliteToPostgres,
  type SqliteToPostgresMigrationReport,
} from "@/persistence/migrate/sqlite-to-postgres";
import {
  closeDb as closePostgresDb,
  openTestDb,
} from "@/persistence/postgres/client";
import {
  controlActivities as pgControlActivities,
  controlRecords as pgControlRecords,
  projectSnapshots as pgProjectSnapshots,
  projects as pgProjects,
} from "@/persistence/postgres/schema";
import { closeDb as closeSqliteDb, openDbAt } from "@/persistence/sqlite/client";
import { createSqliteControlRecordService } from "@/persistence/sqlite/control-record-service";
import { createSqliteProjectRepository } from "@/persistence/sqlite/project-repository";

const dirs: string[] = [];

function tempSqliteStack() {
  const dir = mkdtempSync(join(tmpdir(), "oscal-migrate-"));
  dirs.push(dir);
  const dbPath = join(dir, "test.sqlite");
  const db = openDbAt(dbPath);
  return {
    db,
    projects: createSqliteProjectRepository(db),
    controlRecordService: createSqliteControlRecordService(db),
  };
}

async function buildFixture() {
  const { db, projects, controlRecordService } = tempSqliteStack();

  const project = await projects.create({
    name: "Migrate Me",
    frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    metadata: {
      systemName: "Migrate Me",
      organizationName: "Legacy Org",
      systemDescription: "Pre-cutover system",
    },
    implementations: {
      "ac-1": { status: "implemented", narrative: "policy narrative" },
    },
  });

  const namedVersion = await projects.createNamedVersion({
    projectId: project.id,
    name: "Initial Authorization Package",
    expectedRevision: project.revision,
  });
  assert.equal(namedVersion.ok, true);
  if (!namedVersion.ok) {
    throw new Error("expected named version to succeed");
  }

  const { record } = await controlRecordService.upsertWithActivity(
    project.id,
    {
      controlId: "ac-1",
      ...DEFAULT_CONTROL_RECORD_FIELDS,
      owner: "Priya Sharma",
      implementationStatus: "in_review",
    },
    SYSTEM_ACTOR,
  );

  return { sqliteDb: db, project, namedVersion, record };
}

afterEach(async () => {
  closeSqliteDb();
  await closePostgresDb();
  while (dirs.length > 0) {
    const dir = dirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("migrateSqliteToPostgres", () => {
  it("migrates projects, snapshots, control records, and activities with organizationId assigned", async () => {
    const { sqliteDb, project, namedVersion, record } = await buildFixture();
    const organizationId = randomUUID();
    const pgDb = await openTestDb();

    const report = await migrateSqliteToPostgres(sqliteDb, pgDb, {
      organizationId,
    });

    assert.equal(report.dryRun, false);
    assert.equal(report.organizationId, organizationId);

    assert.equal(report.tables.projects.sourceCount, 1);
    assert.equal(report.tables.projects.inserted, 1);
    assert.equal(report.tables.projects.skippedExisting, 0);

    assert.equal(report.tables.projectSnapshots.sourceCount, 1);
    assert.equal(report.tables.projectSnapshots.inserted, 1);

    assert.equal(report.tables.controlRecords.sourceCount, 1);
    assert.equal(report.tables.controlRecords.inserted, 1);

    // Exactly one `control_record_created` activity from the fixture setup.
    assert.equal(report.tables.controlActivities.sourceCount, 1);
    assert.equal(report.tables.controlActivities.inserted, 1);

    assert.deepEqual(
      report.orphanChecks.map((check) => check.orphanCount),
      [0, 0, 0],
    );

    assert.equal(report.sampleProjectRevisionChecks.length, 1);
    assert.equal(report.sampleProjectRevisionChecks[0]?.projectId, project.id);
    assert.equal(report.sampleProjectRevisionChecks[0]?.match, true);

    // Verify migrated project row: id, revision, timestamps, organizationId.
    const migratedProjects = await pgDb
      .select()
      .from(pgProjects)
      .where(eq(pgProjects.id, project.id));
    assert.equal(migratedProjects.length, 1);
    const migratedProject = migratedProjects[0];
    assert.equal(migratedProject.id, project.id);
    assert.equal(migratedProject.organizationId, organizationId);
    assert.equal(migratedProject.revision, project.revision);
    assert.equal(migratedProject.createdAt, project.createdAt);
    assert.ok(migratedProject.projectJson.includes("policy narrative"));

    // Verify snapshot preserved (named version, project_json, revision).
    const migratedSnapshots = await pgDb
      .select()
      .from(pgProjectSnapshots)
      .where(eq(pgProjectSnapshots.projectId, project.id));
    assert.equal(migratedSnapshots.length, 1);
    assert.equal(migratedSnapshots[0].id, namedVersion.snapshot.id);
    assert.equal(migratedSnapshots[0].snapshotType, "named");
    assert.equal(migratedSnapshots[0].name, "Initial Authorization Package");

    // Verify control record preserved (owner, implementationStatus, id).
    const migratedControlRecords = await pgDb
      .select()
      .from(pgControlRecords)
      .where(eq(pgControlRecords.id, record.id));
    assert.equal(migratedControlRecords.length, 1);
    assert.equal(migratedControlRecords[0].owner, "Priya Sharma");
    assert.equal(migratedControlRecords[0].implementationStatus, "in_review");
    assert.equal(migratedControlRecords[0].projectId, project.id);

    // Verify activity preserved (ordering / actor / type).
    const migratedActivities = await pgDb
      .select()
      .from(pgControlActivities)
      .where(eq(pgControlActivities.controlRecordId, record.id));
    assert.equal(migratedActivities.length, 1);
    assert.equal(migratedActivities[0].activityType, "control_record_created");

    // Re-running the migrator must not duplicate any row.
    const secondReport = await migrateSqliteToPostgres(sqliteDb, pgDb, {
      organizationId,
    });
    assertNoInserts(secondReport);
    assertSkippedEqualsSource(secondReport);

    const projectsAfterRerun = await pgDb.select().from(pgProjects);
    assert.equal(projectsAfterRerun.length, 1);
    const snapshotsAfterRerun = await pgDb.select().from(pgProjectSnapshots);
    assert.equal(snapshotsAfterRerun.length, 1);
    const controlRecordsAfterRerun = await pgDb.select().from(pgControlRecords);
    assert.equal(controlRecordsAfterRerun.length, 1);
    const activitiesAfterRerun = await pgDb.select().from(pgControlActivities);
    assert.equal(activitiesAfterRerun.length, 1);
  });

  it("dry run reports counts without writing any rows", async () => {
    const { sqliteDb } = await buildFixture();
    const organizationId = randomUUID();
    const pgDb = await openTestDb();

    const report = await migrateSqliteToPostgres(sqliteDb, pgDb, {
      organizationId,
      dryRun: true,
    });

    assert.equal(report.dryRun, true);
    assert.equal(report.tables.projects.inserted, 1);
    assert.equal(report.tables.projects.targetCountBefore, 0);
    assert.equal(report.tables.projects.targetCountAfter, 0);

    const projectRows = await pgDb.select().from(pgProjects);
    assert.equal(projectRows.length, 0);
    const snapshotRows = await pgDb.select().from(pgProjectSnapshots);
    assert.equal(snapshotRows.length, 0);
    const controlRecordRows = await pgDb.select().from(pgControlRecords);
    assert.equal(controlRecordRows.length, 0);
    const activityRows = await pgDb.select().from(pgControlActivities);
    assert.equal(activityRows.length, 0);
  });

  it("requires a non-empty organizationId", async () => {
    const { sqliteDb } = await buildFixture();
    const pgDb = await openTestDb();

    await assert.rejects(
      () => migrateSqliteToPostgres(sqliteDb, pgDb, { organizationId: "  " }),
      /organizationId is required/,
    );
  });
});

function assertNoInserts(report: SqliteToPostgresMigrationReport): void {
  assert.equal(report.tables.projects.inserted, 0);
  assert.equal(report.tables.projectSnapshots.inserted, 0);
  assert.equal(report.tables.controlRecords.inserted, 0);
  assert.equal(report.tables.controlActivities.inserted, 0);
}

function assertSkippedEqualsSource(
  report: SqliteToPostgresMigrationReport,
): void {
  assert.equal(
    report.tables.projects.skippedExisting,
    report.tables.projects.sourceCount,
  );
  assert.equal(
    report.tables.projectSnapshots.skippedExisting,
    report.tables.projectSnapshots.sourceCount,
  );
  assert.equal(
    report.tables.controlRecords.skippedExisting,
    report.tables.controlRecords.sourceCount,
  );
  assert.equal(
    report.tables.controlActivities.skippedExisting,
    report.tables.controlActivities.sourceCount,
  );
}

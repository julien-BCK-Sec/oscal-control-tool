import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";
import { eq } from "drizzle-orm";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import { DEFAULT_CONTROL_RECORD_FIELDS } from "@/data/control-record";
import { detectControlRecordFieldChanges } from "@/data/control-activity";
import { SYSTEM_ACTOR } from "@/persistence/actor";
import { closeDb, openDbAt } from "@/persistence/sqlite/client";
import { createSqliteControlActivityRepository } from "@/persistence/sqlite/control-activity-repository";
import { createSqliteControlRecordService } from "@/persistence/sqlite/control-record-service";
import { createSqliteProjectRepository } from "@/persistence/sqlite/project-repository";
import { controlActivities, controlRecords } from "@/persistence/sqlite/schema";

const dirs: string[] = [];

function tempStack() {
  const dir = mkdtempSync(join(tmpdir(), "oscal-act-"));
  dirs.push(dir);
  const dbPath = join(dir, "test.sqlite");
  const db = openDbAt(dbPath);
  return {
    db,
    projects: createSqliteProjectRepository(db),
    service: createSqliteControlRecordService(db),
    activities: createSqliteControlActivityRepository(db),
  };
}

afterEach(() => {
  closeDb();
  while (dirs.length > 0) {
    const dir = dirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("ControlActivity", () => {
  it("creates a ControlActivity row via append", async () => {
    const { projects, service, activities } = tempStack();
    const project = await projects.create({
      name: "Act",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });
    const { record } = await service.upsertWithActivity(
      project.id,
      { controlId: "ac-2", ...DEFAULT_CONTROL_RECORD_FIELDS },
      SYSTEM_ACTOR,
    );

    const appended = await activities.append({
      controlRecordId: record.id,
      activityType: "comment_added",
      actorDisplayName: "Tester",
      newValue: "note",
    });
    assert.equal(appended.controlRecordId, record.id);
    assert.equal(appended.activityType, "comment_added");
    assert.ok(appended.id.length > 0);
  });

  it("records control_record_created on first metadata save", async () => {
    const { projects, service, activities } = tempStack();
    const project = await projects.create({
      name: "Create",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    const { record, activityCount } = await service.upsertWithActivity(
      project.id,
      {
        controlId: "ac-1",
        owner: "Julien",
        coOwner: "",
        businessUnit: "",
        implementationStatus: "draft",
        reviewDueDate: null,
      },
      { actorId: null, actorDisplayName: "Julien" },
    );

    assert.equal(activityCount, 1);
    const list = await activities.listByControlRecordId(record.id);
    assert.equal(list.length, 1);
    assert.equal(list[0].activityType, "control_record_created");
    assert.equal(list[0].actorDisplayName, "Julien");
    assert.equal(
      list.some((row) => row.activityType === "owner_changed"),
      false,
    );
  });

  it("records only fields that changed", async () => {
    const { projects, service, activities } = tempStack();
    const project = await projects.create({
      name: "Diff",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    await service.upsertWithActivity(
      project.id,
      {
        controlId: "ac-2",
        owner: "",
        coOwner: "",
        businessUnit: "",
        implementationStatus: "draft",
        reviewDueDate: null,
      },
      SYSTEM_ACTOR,
    );

    const updated = await service.upsertWithActivity(
      project.id,
      {
        controlId: "ac-2",
        owner: "Blake Hodder",
        coOwner: "",
        businessUnit: "",
        implementationStatus: "in_review",
        reviewDueDate: null,
      },
      { actorId: null, actorDisplayName: "Julien" },
    );

    assert.equal(updated.changed, true);
    assert.equal(updated.activityCount, 2);
    const list = await activities.listByControlRecordId(updated.record.id);
    const changeTypes = list
      .filter((row) => row.activityType !== "control_record_created")
      .map((row) => row.activityType)
      .sort();
    assert.deepEqual(changeTypes, [
      "implementation_status_changed",
      "owner_changed",
    ]);
  });

  it("creates no activity on no-op autosave", async () => {
    const { projects, service, activities } = tempStack();
    const project = await projects.create({
      name: "Noop",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    const first = await service.upsertWithActivity(
      project.id,
      {
        controlId: "ac-3",
        owner: "A",
        coOwner: "",
        businessUnit: "",
        implementationStatus: "draft",
        reviewDueDate: null,
      },
      SYSTEM_ACTOR,
    );
    const before = await activities.listByControlRecordId(first.record.id);

    const second = await service.upsertWithActivity(
      project.id,
      {
        controlId: "ac-3",
        owner: "A",
        coOwner: "",
        businessUnit: "",
        implementationStatus: "draft",
        reviewDueDate: null,
      },
      SYSTEM_ACTOR,
    );

    assert.equal(second.changed, false);
    assert.equal(second.activityCount, 0);
    const after = await activities.listByControlRecordId(first.record.id);
    assert.equal(after.length, before.length);
  });

  it("records previous and new values for implementationStatus and owner changes", async () => {
    const { projects, service, activities } = tempStack();
    const project = await projects.create({
      name: "Values",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    await service.upsertWithActivity(
      project.id,
      {
        controlId: "ac-2",
        ...DEFAULT_CONTROL_RECORD_FIELDS,
      },
      SYSTEM_ACTOR,
    );

    const updated = await service.upsertWithActivity(
      project.id,
      {
        controlId: "ac-2",
        owner: "Julien",
        coOwner: "",
        businessUnit: "",
        implementationStatus: "in_review",
        reviewDueDate: null,
      },
      SYSTEM_ACTOR,
    );

    const list = await activities.listByControlRecordId(updated.record.id);
    const implementationStatusEvent = list.find((row) => row.activityType === "implementation_status_changed");
    const ownerEvent = list.find((row) => row.activityType === "owner_changed");
    assert.ok(implementationStatusEvent);
    assert.equal(implementationStatusEvent?.previousValue, "draft");
    assert.equal(implementationStatusEvent?.newValue, "in_review");
    assert.ok(ownerEvent);
    assert.equal(ownerEvent?.previousValue, null);
    assert.equal(ownerEvent?.newValue, "Julien");
  });

  it("rolls back ControlRecord and activity together on transaction failure", async () => {
    const { db, projects, activities } = tempStack();
    const project = await projects.create({
      name: "Tx",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    assert.throws(() => {
      db.transaction((tx) => {
        tx.insert(controlRecords)
          .values({
            id: "cr-tx-fail",
            projectId: project.id,
            controlId: "ac-9",
            owner: "",
            coOwner: "",
            businessUnit: "",
            implementationStatus: "draft",
            reviewDueDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .run();
        tx.insert(controlActivities)
          .values({
            id: "act-tx-fail",
            controlRecordId: "cr-tx-fail",
            activityType: "control_record_created",
            actorId: null,
            actorDisplayName: "System",
            fieldName: null,
            previousValue: null,
            newValue: null,
            metadataJson: null,
            createdAt: new Date().toISOString(),
          })
          .run();
        throw new Error("force rollback");
      });
    });

    const records = db
      .select()
      .from(controlRecords)
      .where(eq(controlRecords.id, "cr-tx-fail"))
      .all();
    assert.equal(records.length, 0);
    const listed = await activities.listByControlRecordId("cr-tx-fail");
    assert.equal(listed.length, 0);
  });

  it("lists activity newest first", async () => {
    const { projects, service, activities } = tempStack();
    const project = await projects.create({
      name: "Order",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    const created = await service.upsertWithActivity(
      project.id,
      { controlId: "ac-2", ...DEFAULT_CONTROL_RECORD_FIELDS },
      SYSTEM_ACTOR,
    );
    await service.upsertWithActivity(
      project.id,
      {
        controlId: "ac-2",
        owner: "A",
        coOwner: "",
        businessUnit: "",
        implementationStatus: "draft",
        reviewDueDate: null,
      },
      SYSTEM_ACTOR,
    );
    await service.upsertWithActivity(
      project.id,
      {
        controlId: "ac-2",
        owner: "A",
        coOwner: "",
        businessUnit: "",
        implementationStatus: "approved",
        reviewDueDate: null,
      },
      SYSTEM_ACTOR,
    );

    const list = await activities.listByControlRecordId(created.record.id);
    assert.ok(list.length >= 3);
    for (let i = 1; i < list.length; i++) {
      assert.ok(list[i - 1].createdAt >= list[i].createdAt);
    }
    assert.equal(list[0].activityType, "implementation_status_changed");
  });

  it("keeps activity after project_json version restore", async () => {
    const { projects, service, activities } = tempStack();
    const project = await projects.create({
      name: "Restore",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      implementations: {
        "ac-1": { status: "not-started", narrative: "v1" },
      },
    });

    const meta = await service.upsertWithActivity(
      project.id,
      {
        controlId: "ac-1",
        owner: "Priya",
        coOwner: "",
        businessUnit: "",
        implementationStatus: "in_review",
        reviewDueDate: null,
      },
      SYSTEM_ACTOR,
    );

    const named = await projects.createNamedVersion({
      projectId: project.id,
      name: "Milestone",
      expectedRevision: project.revision,
    });
    assert.equal(named.ok, true);
    if (!named.ok) {
      return;
    }

    const loaded = await projects.load(project.id);
    assert.equal(loaded.ok, true);
    if (!loaded.ok) {
      return;
    }

    const afterEdit = await projects.save({
      id: project.id,
      name: loaded.project.name,
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      metadata: loaded.project.metadata,
      implementations: {
        "ac-1": { status: "implemented", narrative: "v2 changed" },
      },
      expectedRevision: loaded.project.revision,
    });
    assert.equal(afterEdit.ok, true);
    if (!afterEdit.ok) {
      return;
    }

    const restored = await projects.restoreSnapshot({
      projectId: project.id,
      snapshotId: named.snapshot.id,
      expectedRevision: afterEdit.project.revision,
    });
    assert.equal(restored.ok, true);
    if (!restored.ok) {
      return;
    }
    assert.equal(restored.project.implementations["ac-1"]?.narrative, "v1");

    const still = await activities.listByControlRecordId(meta.record.id);
    assert.ok(still.length >= 1);
    assert.equal(
      still.some((row) => row.activityType === "control_record_created"),
      true,
    );

    const records = await service.listByProject(project.id);
    assert.equal(records[0]?.owner, "Priya");
    assert.equal(records[0]?.implementationStatus, "in_review");
  });

  it("cascades deletion when a ControlRecord is deleted", async () => {
    const { db, projects, service, activities } = tempStack();
    const project = await projects.create({
      name: "Cascade",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });
    const { record } = await service.upsertWithActivity(
      project.id,
      { controlId: "ac-4", ...DEFAULT_CONTROL_RECORD_FIELDS },
      SYSTEM_ACTOR,
    );
    assert.equal((await activities.listByControlRecordId(record.id)).length, 1);

    db.delete(controlRecords).where(eq(controlRecords.id, record.id)).run();

    const after = await activities.listByControlRecordId(record.id);
    assert.equal(after.length, 0);
  });

  it("emits implementation_status_changed when implementationStatus changes", async () => {
    const { projects, service, activities } = tempStack();
    const project = await projects.create({
      name: "ImplStatus",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    await service.upsertWithActivity(
      project.id,
      { controlId: "ac-5", ...DEFAULT_CONTROL_RECORD_FIELDS },
      SYSTEM_ACTOR,
    );

    const updated = await service.upsertWithActivity(
      project.id,
      {
        controlId: "ac-5",
        owner: "",
        coOwner: "",
        businessUnit: "",
        implementationStatus: "implemented",
        reviewDueDate: null,
      },
      SYSTEM_ACTOR,
    );

    const list = await activities.listByControlRecordId(updated.record.id);
    const event = list.find(
      (row) => row.activityType === "implementation_status_changed",
    );
    assert.ok(event);
    assert.equal(event?.fieldName, "implementationStatus");
    assert.equal(event?.previousValue, "draft");
    assert.equal(event?.newValue, "implemented");
    assert.equal(
      list.some((row) => (row.activityType as string) === "status_changed"),
      false,
    );
  });
});

describe("detectControlRecordFieldChanges", () => {
  it("ignores whitespace-only owner differences as empty", () => {
    const changes = detectControlRecordFieldChanges(
      { ...DEFAULT_CONTROL_RECORD_FIELDS, owner: "" },
      { ...DEFAULT_CONTROL_RECORD_FIELDS, owner: "   " },
    );
    assert.equal(changes.length, 0);
  });
});

import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";
import { eq } from "drizzle-orm";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import {
  CONTROL_REVIEW_TRANSITIONS,
  type ControlReviewAction,
} from "@/data/control-review";
import {
  DEFAULT_CONTROL_RECORD_FIELDS,
  DEFAULT_CONTROL_REVIEW_STATUS,
  controlRecordsToReviewStatusMap,
  resolveControlReviewStatus,
  type ControlReviewStatus,
} from "@/data/control-record";
import { SYSTEM_ACTOR } from "@/persistence/actor";
import { closeDb, openDbAt } from "@/persistence/sqlite/client";
import { createSqliteControlActivityRepository } from "@/persistence/sqlite/control-activity-repository";
import { createSqliteControlRecordRepository } from "@/persistence/sqlite/control-record-repository";
import { createSqliteControlRecordService } from "@/persistence/sqlite/control-record-service";
import { createSqliteProjectRepository } from "@/persistence/sqlite/project-repository";
import { controlActivities, controlRecords } from "@/persistence/sqlite/schema";

const dirs: string[] = [];

function tempStack() {
  const dir = mkdtempSync(join(tmpdir(), "oscal-review-"));
  dirs.push(dir);
  const dbPath = join(dir, "test.sqlite");
  const db = openDbAt(dbPath);
  return {
    db,
    projects: createSqliteProjectRepository(db),
    service: createSqliteControlRecordService(db),
    records: createSqliteControlRecordRepository(db),
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

describe("reviewStatus defaults", () => {
  it("defaults reviewStatus to not_reviewed for new persisted rows", async () => {
    const { projects, service } = tempStack();
    const project = await projects.create({
      name: "Defaults",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });
    const { record } = await service.upsertWithActivity(
      project.id,
      { controlId: "ac-1", ...DEFAULT_CONTROL_RECORD_FIELDS },
      SYSTEM_ACTOR,
    );
    assert.equal(record.reviewStatus, "not_reviewed");
    assert.equal(record.reviewStatus, DEFAULT_CONTROL_REVIEW_STATUS);
  });

  it("defaults reviewStatus to not_reviewed when no ControlRecord exists", () => {
    assert.equal(resolveControlReviewStatus({}, "ac-99"), "not_reviewed");
    assert.deepEqual(controlRecordsToReviewStatusMap([]), {});
  });

  it("migrated existing-style rows read as not_reviewed via schema default", async () => {
    const { db, projects, records } = tempStack();
    const project = await projects.create({
      name: "Legacy",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });
    // Insert omitting review_status so SQLite applies the column default.
    db.insert(controlRecords)
      .values({
        id: "legacy-cr",
        projectId: project.id,
        controlId: "ac-2",
        owner: "Priya",
        coOwner: "",
        businessUnit: "",
        implementationStatus: "draft",
        reviewDueDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .run();

    const loaded = await records.getByProjectAndControl(project.id, "ac-2");
    assert.ok(loaded);
    assert.equal(loaded?.reviewStatus, "not_reviewed");
  });
});

describe("review workflow transitions", () => {
  async function advance(
    service: ReturnType<typeof createSqliteControlRecordService>,
    projectId: string,
    controlId: string,
    actions: readonly ControlReviewAction[],
  ) {
    let expected = DEFAULT_CONTROL_REVIEW_STATUS;
    let last: Awaited<ReturnType<typeof service.transitionReviewStatus>> | null =
      null;
    for (const action of actions) {
      last = await service.transitionReviewStatus(
        {
          projectId,
          controlId,
          action,
          expectedCurrentStatus: expected,
        },
        SYSTEM_ACTOR,
      );
      assert.equal(last.ok, true, `failed on ${action}`);
      if (!last.ok) {
        return last;
      }
      expected = last.record.reviewStatus;
    }
    assert.ok(last);
    return last!;
  }

  it("applies every legal transition with correct activity payload", async () => {
    const { projects, service, activities } = tempStack();
    const project = await projects.create({
      name: "Happy path",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    const cases: Array<{
      controlId: string;
      seed: ControlReviewAction[];
      action: ControlReviewAction;
      from: string;
      to: string;
      activityType: string;
    }> = [
      {
        controlId: "ac-submit",
        seed: [],
        action: "submit_for_review",
        from: "not_reviewed",
        to: "ready_for_review",
        activityType: "review_requested",
      },
      {
        controlId: "ac-start",
        seed: ["submit_for_review"],
        action: "start_review",
        from: "ready_for_review",
        to: "under_review",
        activityType: "review_started",
      },
      {
        controlId: "ac-approve",
        seed: ["submit_for_review", "start_review"],
        action: "approve_review",
        from: "under_review",
        to: "approved",
        activityType: "review_approved",
      },
      {
        controlId: "ac-changes",
        seed: ["submit_for_review", "start_review"],
        action: "request_changes",
        from: "under_review",
        to: "changes_requested",
        activityType: "changes_requested",
      },
      {
        controlId: "ac-resubmit",
        seed: ["submit_for_review", "start_review", "request_changes"],
        action: "resubmit_for_review",
        from: "changes_requested",
        to: "ready_for_review",
        activityType: "review_resubmitted",
      },
      {
        controlId: "ac-reopen",
        seed: ["submit_for_review", "start_review", "approve_review"],
        action: "reopen_review",
        from: "approved",
        to: "ready_for_review",
        activityType: "review_reopened",
      },
    ];

    assert.equal(cases.length, CONTROL_REVIEW_TRANSITIONS.length);

    for (const testCase of cases) {
      if (testCase.seed.length > 0) {
        await advance(service, project.id, testCase.controlId, testCase.seed);
      }
      const result = await service.transitionReviewStatus(
        {
          projectId: project.id,
          controlId: testCase.controlId,
          action: testCase.action,
          expectedCurrentStatus: testCase.from as ControlReviewStatus,
        },
        SYSTEM_ACTOR,
      );
      assert.equal(result.ok, true, testCase.action);
      if (!result.ok) {
        return;
      }
      assert.equal(result.record.reviewStatus, testCase.to);
      assert.equal(result.activity.activityType, testCase.activityType);
      assert.equal(result.activity.fieldName, "reviewStatus");
      assert.equal(result.activity.previousValue, testCase.from);
      assert.equal(result.activity.newValue, testCase.to);

      const list = await activities.listByControlRecordId(result.record.id);
      assert.equal(list[0].activityType, testCase.activityType);
    }
  });

  it("supports approved → ready_for_review reopening", async () => {
    const { projects, service } = tempStack();
    const project = await projects.create({
      name: "Reopen",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    const reopened = await advance(service, project.id, "ac-3", [
      "submit_for_review",
      "start_review",
      "approve_review",
      "reopen_review",
    ]);
    assert.equal(reopened.ok, true);
    if (!reopened.ok) {
      return;
    }
    assert.equal(reopened.record.reviewStatus, "ready_for_review");
    assert.equal(reopened.activity.activityType, "review_reopened");
  });

  it("rejects illegal transitions without writing activity", async () => {
    const { projects, service, activities } = tempStack();
    const project = await projects.create({
      name: "Illegal",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });
    const created = await service.upsertWithActivity(
      project.id,
      { controlId: "ac-4", ...DEFAULT_CONTROL_RECORD_FIELDS },
      SYSTEM_ACTOR,
    );
    const before = await activities.listByControlRecordId(created.record.id);

    const rejected = await service.transitionReviewStatus(
      {
        projectId: project.id,
        controlId: "ac-4",
        action: "approve_review",
        expectedCurrentStatus: "not_reviewed",
      },
      SYSTEM_ACTOR,
    );
    assert.equal(rejected.ok, false);
    if (rejected.ok) {
      return;
    }
    assert.equal(rejected.reason, "invalid-transition");
    assert.equal(rejected.currentReviewStatus, "not_reviewed");

    const after = await activities.listByControlRecordId(created.record.id);
    assert.equal(after.length, before.length);
  });

  it("rejects stale expectedCurrentStatus without writing activity", async () => {
    const { projects, service, activities } = tempStack();
    const project = await projects.create({
      name: "Stale",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });
    await service.transitionReviewStatus(
      {
        projectId: project.id,
        controlId: "ac-5",
        action: "submit_for_review",
        expectedCurrentStatus: "not_reviewed",
      },
      SYSTEM_ACTOR,
    );
    const record = (await service.listByProject(project.id))[0];
    const before = await activities.listByControlRecordId(record.id);

    const conflict = await service.transitionReviewStatus(
      {
        projectId: project.id,
        controlId: "ac-5",
        action: "start_review",
        expectedCurrentStatus: "not_reviewed",
      },
      SYSTEM_ACTOR,
    );
    assert.equal(conflict.ok, false);
    if (conflict.ok) {
      return;
    }
    assert.equal(conflict.reason, "conflict");
    assert.equal(conflict.currentReviewStatus, "ready_for_review");

    const after = await activities.listByControlRecordId(record.id);
    assert.equal(after.length, before.length);
  });

  it("creates a missing ControlRecord on first transition with ordered activities", async () => {
    const { projects, service, activities } = tempStack();
    const project = await projects.create({
      name: "Lazy",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    const result = await service.transitionReviewStatus(
      {
        projectId: project.id,
        controlId: "ac-6",
        action: "submit_for_review",
        expectedCurrentStatus: "not_reviewed",
      },
      SYSTEM_ACTOR,
    );
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.created, true);
    assert.equal(result.record.implementationStatus, "draft");
    assert.equal(result.record.owner, "");
    assert.equal(result.record.reviewStatus, "ready_for_review");

    const list = await activities.listByControlRecordId(result.record.id);
    assert.equal(list.length, 2);
    // Newest first.
    assert.equal(list[0].activityType, "review_requested");
    assert.equal(list[1].activityType, "control_record_created");
    assert.equal(
      list.some((row) => row.activityType === "owner_changed"),
      false,
    );
    assert.equal(
      list.some((row) => row.activityType === "implementation_status_changed"),
      false,
    );
  });

  it("rolls back ControlRecord and activity if append fails mid-transition", async () => {
    const { db, projects, activities } = tempStack();
    const project = await projects.create({
      name: "Tx fail",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    assert.throws(() => {
      db.transaction((tx) => {
        tx.insert(controlRecords)
          .values({
            id: "cr-review-tx",
            projectId: project.id,
            controlId: "ac-7",
            owner: "",
            coOwner: "",
            businessUnit: "",
            implementationStatus: "draft",
            reviewStatus: "ready_for_review",
            reviewDueDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .run();
        tx.insert(controlActivities)
          .values({
            id: "act-review-tx",
            controlRecordId: "cr-review-tx",
            activityType: "review_started",
            actorId: null,
            actorDisplayName: "System",
            fieldName: "reviewStatus",
            previousValue: "ready_for_review",
            newValue: "under_review",
            metadataJson: null,
            createdAt: new Date().toISOString(),
          })
          .run();
        throw new Error("force rollback");
      });
    });

    const rows = db
      .select()
      .from(controlRecords)
      .where(eq(controlRecords.id, "cr-review-tx"))
      .all();
    assert.equal(rows.length, 0);
    assert.equal((await activities.listByControlRecordId("cr-review-tx")).length, 0);
  });

  it("keeps reviewStatus and activity after named version restore", async () => {
    const { projects, service, activities } = tempStack();
    const project = await projects.create({
      name: "Restore review",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      implementations: {
        "ac-1": { status: "not-started", narrative: "v1" },
      },
    });

    const submitted = await service.transitionReviewStatus(
      {
        projectId: project.id,
        controlId: "ac-1",
        action: "submit_for_review",
        expectedCurrentStatus: "not_reviewed",
      },
      SYSTEM_ACTOR,
    );
    assert.equal(submitted.ok, true);
    if (!submitted.ok) {
      return;
    }

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
        "ac-1": { status: "implemented", narrative: "v2" },
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

    const records = await service.listByProject(project.id);
    assert.equal(records[0]?.reviewStatus, "ready_for_review");
    const still = await activities.listByControlRecordId(submitted.record.id);
    assert.ok(still.some((row) => row.activityType === "review_requested"));
    assert.ok(still.some((row) => row.activityType === "control_record_created"));
  });
});

describe("review query helpers", () => {
  it("counts and lists by review status including missing records", async () => {
    const { projects, service } = tempStack();
    const project = await projects.create({
      name: "Queries",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    await service.transitionReviewStatus(
      {
        projectId: project.id,
        controlId: "ac-1",
        action: "submit_for_review",
        expectedCurrentStatus: "not_reviewed",
      },
      SYSTEM_ACTOR,
    );
    await service.transitionReviewStatus(
      {
        projectId: project.id,
        controlId: "ac-2",
        action: "submit_for_review",
        expectedCurrentStatus: "not_reviewed",
      },
      SYSTEM_ACTOR,
    );
    await service.transitionReviewStatus(
      {
        projectId: project.id,
        controlId: "ac-2",
        action: "start_review",
        expectedCurrentStatus: "ready_for_review",
      },
      SYSTEM_ACTOR,
    );

    const ready = await service.listByReviewStatus(
      project.id,
      "ready_for_review",
    );
    assert.equal(ready.length, 1);
    assert.equal(ready[0].controlId, "ac-1");

    const under = await service.listByReviewStatus(project.id, "under_review");
    assert.equal(under.length, 1);
    assert.equal(under[0].controlId, "ac-2");

    const counts = await service.countByReviewStatus(project.id, [
      "ac-1",
      "ac-2",
      "ac-3",
    ]);
    assert.equal(counts.ready_for_review, 1);
    assert.equal(counts.under_review, 1);
    assert.equal(counts.not_reviewed, 1);
  });

  it("lists overdue reviewDueDate controls that are not approved", async () => {
    const { projects, service } = tempStack();
    const project = await projects.create({
      name: "Overdue",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    await service.upsertWithActivity(
      project.id,
      {
        controlId: "ac-1",
        ...DEFAULT_CONTROL_RECORD_FIELDS,
        reviewDueDate: "2026-01-01",
      },
      SYSTEM_ACTOR,
    );
    await service.upsertWithActivity(
      project.id,
      {
        controlId: "ac-2",
        ...DEFAULT_CONTROL_RECORD_FIELDS,
        reviewDueDate: "2026-01-01",
      },
      SYSTEM_ACTOR,
    );
    await service.transitionReviewStatus(
      {
        projectId: project.id,
        controlId: "ac-2",
        action: "submit_for_review",
        expectedCurrentStatus: "not_reviewed",
      },
      SYSTEM_ACTOR,
    );
    await service.transitionReviewStatus(
      {
        projectId: project.id,
        controlId: "ac-2",
        action: "start_review",
        expectedCurrentStatus: "ready_for_review",
      },
      SYSTEM_ACTOR,
    );
    await service.transitionReviewStatus(
      {
        projectId: project.id,
        controlId: "ac-2",
        action: "approve_review",
        expectedCurrentStatus: "under_review",
      },
      SYSTEM_ACTOR,
    );

    const overdue = await service.listOverdueForReview(project.id, "2026-07-22");
    assert.equal(overdue.length, 1);
    assert.equal(overdue[0].controlId, "ac-1");
  });
});

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresControlActivityRepository } from "@/persistence/postgres/control-activity-repository";
import { createPostgresDiscussionService } from "@/persistence/postgres/discussion-service";
import { createTestProjectRepository } from "@/persistence/postgres/testing";
import { resetActivityTimestampClock } from "@/persistence/activity-clock";

afterEach(async () => {
  await closeDb();
  resetActivityTimestampClock();
});

describe("collaboration activity history (WP6)", () => {
  it("preserves newest-first order and paginates with beforeCreatedAt", async () => {
    const db = await openTestDb();
    const projects = createTestProjectRepository(db);
    const discussions = createPostgresDiscussionService(db);
    const activities = createPostgresControlActivityRepository(db);
    const project = await projects.create({
      name: "Paginate",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });
    const actor = { actorId: "u1", actorDisplayName: "User" };

    const first = await discussions.createComment(
      {
        organizationId: project.organizationId!,
        projectId: project.id,
        controlId: "ac-2",
        body: "One",
      },
      actor,
    );
    const second = await discussions.createComment(
      {
        organizationId: project.organizationId!,
        projectId: project.id,
        controlId: "ac-2",
        body: "Two",
      },
      actor,
    );
    const third = await discussions.createComment(
      {
        organizationId: project.organizationId!,
        projectId: project.id,
        controlId: "ac-2",
        body: "Three",
      },
      actor,
    );

    const controlRecordId = first.activity.controlRecordId;
    const page1 = await activities.listByControlRecordId(controlRecordId, {
      limit: 2,
    });
    assert.equal(page1.length, 2);
    // Newest first among comment_added (control_record_created may also appear).
    const commentEvents = (
      await activities.listByControlRecordId(controlRecordId)
    ).filter((row) => row.activityType === "comment_added");
    assert.equal(commentEvents.length, 3);
    assert.equal(commentEvents[0].id, third.activity.id);
    assert.equal(commentEvents[1].id, second.activity.id);
    assert.equal(commentEvents[2].id, first.activity.id);

    const page2 = await activities.listByControlRecordId(controlRecordId, {
      limit: 10,
      beforeCreatedAt: page1[page1.length - 1].createdAt,
    });
    assert.ok(page2.length >= 1);
    assert.ok(
      page2.every((row) => row.createdAt < page1[page1.length - 1].createdAt),
    );
  });
});

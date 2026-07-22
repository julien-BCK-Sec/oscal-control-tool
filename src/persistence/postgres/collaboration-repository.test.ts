import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresAssignmentRepository } from "@/persistence/postgres/assignment-repository";
import { createPostgresCommentRepository } from "@/persistence/postgres/comment-repository";
import { createPostgresNotificationRepository } from "@/persistence/postgres/notification-repository";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createTestProjectRepository } from "@/persistence/postgres/testing";

afterEach(async () => {
  await closeDb();
});

async function setup() {
  const db = await openTestDb();
  const orgs = createPostgresOrganizationRepository(db);
  const orgA = await orgs.createOrganization({ name: "Org A", slug: "org-a" });
  const orgB = await orgs.createOrganization({ name: "Org B", slug: "org-b" });
  const projects = createTestProjectRepository(db);
  const projectA = await projects.create({
    name: "Project A",
    organizationId: orgA.id,
    frameworkId: NIST_MODERATE_FRAMEWORK_ID,
  });
  const projectB = await projects.create({
    name: "Project B",
    organizationId: orgB.id,
    frameworkId: NIST_MODERATE_FRAMEWORK_ID,
  });
  return {
    db,
    orgs,
    orgA,
    orgB,
    projects,
    projectA,
    projectB,
    comments: createPostgresCommentRepository(db),
    assignments: createPostgresAssignmentRepository(db),
    notifications: createPostgresNotificationRepository(db),
  };
}

describe("collaboration repositories (WP1)", () => {
  it("creates and lists comments scoped to organization + control", async () => {
    const { orgA, projectA, comments } = await setup();
    const created = await comments.create({
      organizationId: orgA.id,
      projectId: projectA.id,
      controlId: "ac-2",
      authorId: "user-1",
      body: "First note",
    });
    assert.equal(created.controlId, "ac-2");
    assert.equal(created.resolved, false);
    assert.equal(created.deletedAt, null);

    const reply = await comments.create({
      organizationId: orgA.id,
      projectId: projectA.id,
      controlId: "ac-2",
      parentCommentId: created.id,
      authorId: "user-2",
      body: "Reply",
    });
    assert.equal(reply.parentCommentId, created.id);

    const listed = await comments.listByControl(orgA.id, projectA.id, "ac-2");
    assert.equal(listed.length, 2);
    assert.equal(listed[0].id, created.id);
    assert.equal(listed[1].id, reply.id);
  });

  it("soft-deletes comments and hides them from default lists", async () => {
    const { orgA, projectA, comments } = await setup();
    const created = await comments.create({
      organizationId: orgA.id,
      projectId: projectA.id,
      controlId: "ac-1",
      authorId: "user-1",
      body: "To delete",
    });
    const deleted = await comments.softDelete(orgA.id, created.id);
    assert.ok(deleted?.deletedAt);

    const listed = await comments.listByControl(orgA.id, projectA.id, "ac-1");
    assert.equal(listed.length, 0);

    const withDeleted = await comments.listByControl(
      orgA.id,
      projectA.id,
      "ac-1",
      { includeDeleted: true },
    );
    assert.equal(withDeleted.length, 1);

    const restored = await comments.restore(orgA.id, created.id);
    assert.equal(restored?.deletedAt, null);
    assert.equal(
      (await comments.listByControl(orgA.id, projectA.id, "ac-1")).length,
      1,
    );
  });

  it("denies cross-tenant comment reads by organization id", async () => {
    const { orgA, orgB, projectA, comments } = await setup();
    const created = await comments.create({
      organizationId: orgA.id,
      projectId: projectA.id,
      controlId: "ac-2",
      authorId: "user-1",
      body: "Secret",
    });

    assert.equal(await comments.getById(orgB.id, created.id), null);
    assert.deepEqual(
      await comments.listByControl(orgB.id, projectA.id, "ac-2"),
      [],
    );
    assert.equal(await comments.softDelete(orgB.id, created.id), null);
  });

  it("rejects comments for projects outside the organization", async () => {
    const { orgA, projectB, comments } = await setup();
    await assert.rejects(
      () =>
        comments.create({
          organizationId: orgA.id,
          projectId: projectB.id,
          controlId: "ac-2",
          authorId: "user-1",
          body: "Cross tenant",
        }),
      /Project not found in organization/,
    );
  });

  it("creates, reassigns, and removes assignments with tenant isolation", async () => {
    const { orgA, orgB, projectA, assignments } = await setup();
    const created = await assignments.create({
      organizationId: orgA.id,
      projectId: projectA.id,
      controlId: "ac-2",
      assigneeUserId: "assignee-1",
      assignmentRole: "owner",
      assignedByUserId: "manager-1",
    });
    assert.equal(created.assignmentRole, "owner");
    assert.equal(created.completedAt, null);

    const reassigned = await assignments.reassign(
      orgA.id,
      created.id,
      "assignee-2",
      "manager-2",
    );
    assert.equal(reassigned?.assigneeUserId, "assignee-2");

    assert.equal(await assignments.getById(orgB.id, created.id), null);
    assert.equal(await assignments.remove(orgB.id, created.id), false);
    assert.equal(await assignments.remove(orgA.id, created.id), true);
  });

  it("deduplicates active notifications and allows recreate after soft delete", async () => {
    const { orgA, projectA, notifications } = await setup();
    const input = {
      organizationId: orgA.id,
      recipientUserId: "user-1",
      actorUserId: "user-2",
      eventType: "comment_mention" as const,
      relatedObjectType: "comment" as const,
      relatedObjectId: "comment-1",
      projectId: projectA.id,
      controlId: "ac-2",
      summary: "You were mentioned",
    };
    const first = await notifications.create(input);
    const second = await notifications.create(input);
    assert.equal(first.id, second.id);
    assert.equal(await notifications.countUnread("user-1"), 1);

    await notifications.softDelete("user-1", first.id);
    assert.equal(await notifications.countUnread("user-1"), 0);

    const third = await notifications.create(input);
    assert.notEqual(third.id, first.id);
    assert.equal(await notifications.countUnread("user-1"), 1);
  });

  it("marks notifications read without leaking across recipients", async () => {
    const { orgA, notifications } = await setup();
    const note = await notifications.create({
      organizationId: orgA.id,
      recipientUserId: "user-a",
      eventType: "assignment_created",
      relatedObjectType: "assignment",
      relatedObjectId: "assign-1",
      summary: "Assigned",
    });

    assert.equal(await notifications.markRead("user-b", note.id), null);
    const read = await notifications.markRead("user-a", note.id);
    assert.ok(read?.readAt);
    assert.equal(await notifications.countUnread("user-a"), 0);
  });
});

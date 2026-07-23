import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterEach, describe, it } from "node:test";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresControlActivityRepository } from "@/persistence/postgres/control-activity-repository";
import { createPostgresDiscussionService } from "@/persistence/postgres/discussion-service";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { listMentionsForComment } from "@/persistence/postgres/comment-mentions";
import { createPostgresNotificationRepository } from "@/persistence/postgres/notification-repository";
import { createNotificationService } from "@/persistence/notification-service";
import { user as userTable } from "@/persistence/postgres/auth-schema";
import { resetActivityTimestampClock } from "@/persistence/activity-clock";
import { AuthorizationError, type OrgContext } from "@/authz/authorize";
import type { OrgRole } from "@/authz/permissions";
import {
  createDiscussionForOrg,
  deleteDiscussionForOrg,
  editDiscussionForOrg,
  listDiscussionsForOrg,
  resolveDiscussionForOrg,
} from "@/server/authorized-collaboration";

afterEach(async () => {
  await closeDb();
  resetActivityTimestampClock();
});

function ctx(
  organizationId: string,
  role: OrgRole,
  userId: string,
): OrgContext {
  return { userId, organizationId, role };
}

async function setup() {
  const db = await openTestDb();
  const orgs = createPostgresOrganizationRepository(db);
  const orgA = await orgs.createOrganization({ name: "Org A", slug: "org-a" });
  const orgB = await orgs.createOrganization({ name: "Org B", slug: "org-b" });
  const projects = createPostgresProjectRepository(db);
  const projectA = await projects.create({
    name: "Project A",
    organizationId: orgA.id,
    frameworkId: NIST_MODERATE_FRAMEWORK_ID,
  });
  const discussions = createPostgresDiscussionService(db);
  const activities = createPostgresControlActivityRepository(db);
  const notifications = createNotificationService(
    createPostgresNotificationRepository(db),
  );

  async function makeMember(
    organizationId: string,
    email: string,
    role: OrgRole = "author",
    name?: string,
  ) {
    const id = randomUUID();
    const now = new Date();
    await db.insert(userTable).values({
      id,
      name: name ?? email,
      email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    await orgs.upsertMembership({ organizationId, userId: id, role });
    return { id, email, name: name ?? email };
  }

  return {
    db,
    orgs,
    orgA,
    orgB,
    projects,
    projectA,
    discussions,
    activities,
    notifications,
    makeMember,
  };
}

const actor = (userId: string, name: string) => ({
  actorId: userId,
  actorDisplayName: name,
});

describe("threaded discussions (WP2)", () => {
  it("creates nested replies and records comment_added activity", async () => {
    const { orgA, orgs, projects, projectA, discussions, activities, notifications } =
      await setup();
    const author = ctx(orgA.id, "author", "author-1");

    const root = await createDiscussionForOrg(
      projects,
      discussions,
      orgs,
      notifications,
      author,
      { projectId: projectA.id, controlId: "ac-2", body: "Root question" },
      actor("author-1", "Author One"),
    );
    assert.equal(root.ok, true);
    if (!root.ok) return;

    const reply = await createDiscussionForOrg(
      projects,
      discussions,
      orgs,
      notifications,
      author,
      {
        projectId: projectA.id,
        controlId: "ac-2",
        parentCommentId: root.comment.id,
        body: "Nested reply",
      },
      actor("author-1", "Author One"),
    );
    assert.equal(reply.ok, true);
    if (!reply.ok) return;
    assert.equal(reply.comment.parentCommentId, root.comment.id);

    const listed = await listDiscussionsForOrg(
      projects,
      discussions,
      author,
      projectA.id,
      "ac-2",
    );
    assert.equal(listed.length, 2);

    const stream = await activities.listByControlRecordId(
      root.activity.controlRecordId,
    );
    assert.ok(stream.some((row) => row.activityType === "comment_added"));
  });

  it("edits and soft-deletes own comments with audit events", async () => {
    const { orgA, orgs, projects, projectA, discussions, activities, notifications } =
      await setup();
    const author = ctx(orgA.id, "author", "author-1");
    const created = await createDiscussionForOrg(
      projects,
      discussions,
      orgs,
      notifications,
      author,
      { projectId: projectA.id, controlId: "ac-1", body: "Draft" },
      actor("author-1", "Author"),
    );
    assert.equal(created.ok, true);
    if (!created.ok) return;

    const edited = await editDiscussionForOrg(
      projects,
      discussions,
      orgs,
      notifications,
      author,
      created.comment.id,
      "Edited body",
      actor("author-1", "Author"),
    );
    assert.equal(edited.ok, true);
    if (!edited.ok) return;
    assert.equal(edited.comment.body, "Edited body");
    assert.equal(edited.activity.activityType, "comment_edited");

    const deleted = await deleteDiscussionForOrg(
      projects,
      discussions,
      author,
      created.comment.id,
      actor("author-1", "Author"),
    );
    assert.equal(deleted.ok, true);
    if (!deleted.ok) return;
    assert.ok(deleted.comment.deletedAt);
    assert.equal(deleted.activity.activityType, "comment_deleted");

    const listed = await listDiscussionsForOrg(
      projects,
      discussions,
      author,
      projectA.id,
      "ac-1",
    );
    assert.equal(listed.length, 0);

    const stream = await activities.listByControlRecordId(
      created.activity.controlRecordId,
    );
    assert.ok(stream.some((row) => row.activityType === "comment_edited"));
    assert.ok(stream.some((row) => row.activityType === "comment_deleted"));
  });

  it("resolves owned discussions and denies other authors", async () => {
    const { orgA, orgs, projects, projectA, discussions, notifications } = await setup();
    const author = ctx(orgA.id, "author", "author-1");
    const other = ctx(orgA.id, "author", "author-2");

    const created = await createDiscussionForOrg(
      projects,
      discussions,
      orgs,
      notifications,
      author,
      { projectId: projectA.id, controlId: "ac-3", body: "Please review" },
      actor("author-1", "Author"),
    );
    assert.equal(created.ok, true);
    if (!created.ok) return;

    await assert.rejects(
      () =>
        resolveDiscussionForOrg(
          projects,
          discussions,
          notifications,
          other,
          created.comment.id,
          actor("author-2", "Other"),
        ),
      (e: unknown) =>
        e instanceof AuthorizationError && e.code === "forbidden",
    );

    const resolved = await resolveDiscussionForOrg(
          projects,
          discussions,
          notifications,
          author,
      created.comment.id,
      actor("author-1", "Author"),
    );
    assert.equal(resolved.ok, true);
    if (!resolved.ok) return;
    assert.equal(resolved.comment.resolved, true);
    assert.equal(resolved.activity.activityType, "comment_resolved");
  });

  it("denies cross-tenant discussion access", async () => {
    const { orgA, orgB, orgs, projects, projectA, discussions, notifications } = await setup();
    const authorA = ctx(orgA.id, "author", "a1");
    const authorB = ctx(orgB.id, "author", "b1");

    const created = await createDiscussionForOrg(
      projects,
      discussions,
      orgs,
      notifications,
      authorA,
      { projectId: projectA.id, controlId: "ac-2", body: "Tenant secret" },
      actor("a1", "A"),
    );
    assert.equal(created.ok, true);
    if (!created.ok) return;

    const listed = await listDiscussionsForOrg(
      projects,
      discussions,
      authorB,
      projectA.id,
      "ac-2",
    );
    assert.deepEqual(listed, []);

    const edited = await editDiscussionForOrg(
      projects,
      discussions,
      orgs,
      notifications,
      authorB,
      created.comment.id,
      "Hijack",
      actor("b1", "B"),
    );
    assert.equal(edited.ok, false);
  });

  it("denies viewers from creating discussions", async () => {
    const { orgA, orgs, projects, projectA, discussions, notifications } = await setup();
    await assert.rejects(
      () =>
        createDiscussionForOrg(
      projects,
      discussions,
      orgs,
      notifications,
      ctx(orgA.id, "viewer", "v1"),
          { projectId: projectA.id, controlId: "ac-2", body: "Nope" },
          actor("v1", "Viewer"),
        ),
      (e: unknown) =>
        e instanceof AuthorizationError && e.code === "forbidden",
    );
  });
});

describe("mentions (WP3)", () => {
  it("resolves org member mentions and ignores outsiders", async () => {
    const { db, orgA, orgs, projects, projectA, discussions, notifications, makeMember } =
      await setup();
    const alice = await makeMember(
      orgA.id,
      "alice@example.com",
      "author",
      "Alice",
    );
    await makeMember(orgA.id, "bob@example.com", "reviewer", "Bob");

    const author = ctx(orgA.id, "author", alice.id);
    const created = await createDiscussionForOrg(
      projects,
      discussions,
      orgs,
      notifications,
      author,
      {
        projectId: projectA.id,
        controlId: "ac-2",
        body: "Hey @alice and @outsider please look",
      },
      actor(alice.id, "Alice"),
    );
    assert.equal(created.ok, true);
    if (!created.ok) return;
    assert.deepEqual(created.mentionedUserIds, [alice.id]);

    const stored = await listMentionsForComment(db, created.comment.id);
    assert.equal(stored.length, 1);
    assert.equal(stored[0].mentionedUserId, alice.id);
  });

  it("does not resolve mentions across organizations", async () => {
    const { orgA, orgB, orgs, projects, projectA, discussions, notifications, makeMember } =
      await setup();
    const aliceA = await makeMember(orgA.id, "alice@example.com");
    const bobB = await makeMember(orgB.id, "bob@example.com");

    const author = ctx(orgA.id, "author", aliceA.id);
    const created = await createDiscussionForOrg(
      projects,
      discussions,
      orgs,
      notifications,
      author,
      {
        projectId: projectA.id,
        controlId: "ac-2",
        body: `Ping @bob for review`,
      },
      actor(aliceA.id, "Alice"),
    );
    assert.equal(created.ok, true);
    if (!created.ok) return;
    assert.deepEqual(created.mentionedUserIds, []);
    void bobB;
  });
});

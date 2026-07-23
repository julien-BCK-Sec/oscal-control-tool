import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterEach, describe, it } from "node:test";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresDiscussionService } from "@/persistence/postgres/discussion-service";
import { createPostgresNotificationRepository } from "@/persistence/postgres/notification-repository";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { createNotificationService } from "@/persistence/notification-service";
import { user as userTable } from "@/persistence/postgres/auth-schema";
import { resetActivityTimestampClock } from "@/persistence/activity-clock";
import type { OrgContext } from "@/authz/authorize";
import type { OrgRole } from "@/authz/permissions";
import { createDiscussionForOrg } from "@/server/authorized-collaboration";
import {
  listNotificationsForUser,
  markNotificationReadForUser,
} from "@/server/authorized-notifications";

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
  const org = await orgs.createOrganization({ name: "Org", slug: "org" });
  const projects = createPostgresProjectRepository(db);
  const project = await projects.create({
    name: "Project",
    organizationId: org.id,
    frameworkId: NIST_MODERATE_FRAMEWORK_ID,
  });
  const discussions = createPostgresDiscussionService(db);
  const notifications = createNotificationService(
    createPostgresNotificationRepository(db),
  );

  async function makeMember(email: string, role: OrgRole = "author") {
    const id = randomUUID();
    const now = new Date();
    await db.insert(userTable).values({
      id,
      name: email,
      email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    await orgs.upsertMembership({ organizationId: org.id, userId: id, role });
    return { id, email };
  }

  return { orgs, org, projects, project, discussions, notifications, makeMember };
}

describe("notification center (WP4)", () => {
  it("notifies mentioned users and supports read + dedupe", async () => {
    const { orgs, org, projects, project, discussions, notifications, makeMember } =
      await setup();
    const alice = await makeMember("alice@example.com");
    const bob = await makeMember("bob@example.com");

    const first = await createDiscussionForOrg(
      projects,
      discussions,
      orgs,
      notifications,
      ctx(org.id, "author", alice.id),
      {
        projectId: project.id,
        controlId: "ac-2",
        body: "Please review @bob",
      },
      { actorId: alice.id, actorDisplayName: "Alice" },
    );
    assert.equal(first.ok, true);

    const bobCtx = ctx(org.id, "author", bob.id);
    let list = await listNotificationsForUser(notifications, bobCtx);
    assert.equal(list.length, 1);
    assert.equal(list[0].eventType, "comment_mention");
    assert.equal(list[0].readAt, null);

    // Duplicate create of the same mention target should not add a second
    // active notification for the same related object id after soft-path
    // recreation — editing with the same mention reuses relatedObjectId of
    // the new comment, so a second comment creates a new related object.
    // Re-emitting for the same comment id must dedupe:
    await notifications.notify({
      organizationId: org.id,
      recipientUserId: bob.id,
      actorUserId: alice.id,
      eventType: "comment_mention",
      relatedObjectType: "comment",
      relatedObjectId: first.ok ? first.comment.id : "",
      summary: "You were mentioned on control ac-2",
    });
    list = await listNotificationsForUser(notifications, bobCtx);
    assert.equal(list.length, 1);

    const marked = await markNotificationReadForUser(
      notifications,
      bobCtx,
      list[0].id,
    );
    assert.ok(marked?.readAt);

    const aliceList = await listNotificationsForUser(
      notifications,
      ctx(org.id, "author", alice.id),
    );
    assert.equal(aliceList.length, 0);
  });

  it("notifies parent authors on replies", async () => {
    const { orgs, org, projects, project, discussions, notifications, makeMember } =
      await setup();
    const alice = await makeMember("alice@example.com");
    const bob = await makeMember("bob@example.com");

    const root = await createDiscussionForOrg(
      projects,
      discussions,
      orgs,
      notifications,
      ctx(org.id, "author", alice.id),
      { projectId: project.id, controlId: "ac-1", body: "Question" },
      { actorId: alice.id, actorDisplayName: "Alice" },
    );
    assert.equal(root.ok, true);
    if (!root.ok) return;

    await createDiscussionForOrg(
      projects,
      discussions,
      orgs,
      notifications,
      ctx(org.id, "author", bob.id),
      {
        projectId: project.id,
        controlId: "ac-1",
        parentCommentId: root.comment.id,
        body: "Answer",
      },
      { actorId: bob.id, actorDisplayName: "Bob" },
    );

    const aliceNotes = await listNotificationsForUser(
      notifications,
      ctx(org.id, "author", alice.id),
    );
    assert.equal(aliceNotes.length, 1);
    assert.equal(aliceNotes[0].eventType, "comment_reply");
  });
});

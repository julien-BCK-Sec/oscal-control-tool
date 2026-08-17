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
import { AuthorizationError, type OrgContext } from "@/authz/authorize";
import type { OrgRole } from "@/authz/permissions";
import { createDiscussionForOrg } from "@/server/authorized-collaboration";
import {
  deleteNotificationForUser,
  listNotificationsForUser,
  markAllNotificationsReadForUser,
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

describe("notification authorization organization context", () => {
  async function setupMultiOrg() {
    const db = await openTestDb();
    const orgs = createPostgresOrganizationRepository(db);
    const orgA = await orgs.createOrganization({ name: "Org A", slug: "org-a" });
    const orgB = await orgs.createOrganization({ name: "Org B", slug: "org-b" });
    const notifications = createNotificationService(
      createPostgresNotificationRepository(db),
    );

    async function makeUser(email: string) {
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
      return { id, email };
    }

    async function addMembership(
      organizationId: string,
      userId: string,
      role: OrgRole,
    ) {
      await orgs.upsertMembership({ organizationId, userId, role });
    }

    async function notify(
      organizationId: string,
      recipientUserId: string,
      actorUserId: string,
    ) {
      return notifications.notify({
        organizationId,
        recipientUserId,
        actorUserId,
        eventType: "comment_mention",
        relatedObjectType: "comment",
        relatedObjectId: randomUUID(),
        summary: "You were mentioned",
      });
    }

    return { orgs, orgA, orgB, notifications, makeUser, addMembership, notify };
  }

  it("does not grant org B notification management from org A author permission", async () => {
    const { orgA, orgB, notifications, makeUser, addMembership, notify } =
      await setupMultiOrg();
    const user = await makeUser("multi@example.com");
    const actor = await makeUser("actor@example.com");
    await addMembership(orgA.id, user.id, "author");
    await addMembership(orgB.id, user.id, "viewer");
    await addMembership(orgA.id, actor.id, "author");
    await addMembership(orgB.id, actor.id, "author");

    const noteB = await notify(orgB.id, user.id, actor.id);

    await assert.rejects(
      () =>
        markNotificationReadForUser(
          notifications,
          ctx(orgA.id, "author", user.id),
          noteB.id,
        ),
      (e: unknown) =>
        e instanceof AuthorizationError && e.code === "wrong-organization",
    );
    await assert.rejects(
      () =>
        deleteNotificationForUser(
          notifications,
          ctx(orgA.id, "author", user.id),
          noteB.id,
        ),
      (e: unknown) =>
        e instanceof AuthorizationError && e.code === "wrong-organization",
    );

    const stillUnread = await notifications.getById(user.id, noteB.id);
    assert.equal(stillUnread?.readAt, null);
    assert.equal(stillUnread?.deletedAt, null);
  });

  it("denies management when the notification org role lacks manage_own", async () => {
    const { orgB, notifications, makeUser, addMembership, notify } =
      await setupMultiOrg();
    const user = await makeUser("viewer-b@example.com");
    const actor = await makeUser("actor-b@example.com");
    await addMembership(orgB.id, user.id, "viewer");
    await addMembership(orgB.id, actor.id, "author");
    const noteB = await notify(orgB.id, user.id, actor.id);

    await assert.rejects(
      () =>
        markNotificationReadForUser(
          notifications,
          ctx(orgB.id, "viewer", user.id),
          noteB.id,
        ),
      (e: unknown) => e instanceof AuthorizationError && e.code === "forbidden",
    );
  });

  it("membership ordering does not change authorization outcomes", async () => {
    const { orgA, orgB, notifications, makeUser, addMembership, notify } =
      await setupMultiOrg();
    const actor = await makeUser("actor-order@example.com");
    await addMembership(orgA.id, actor.id, "author");
    await addMembership(orgB.id, actor.id, "author");

    const firstA = await makeUser("first-a@example.com");
    await addMembership(orgA.id, firstA.id, "author");
    await addMembership(orgB.id, firstA.id, "viewer");
    const noteBForFirstA = await notify(orgB.id, firstA.id, actor.id);
    const noteAForFirstA = await notify(orgA.id, firstA.id, actor.id);

    const firstB = await makeUser("first-b@example.com");
    await addMembership(orgB.id, firstB.id, "viewer");
    await addMembership(orgA.id, firstB.id, "author");
    const noteBForFirstB = await notify(orgB.id, firstB.id, actor.id);
    const noteAForFirstB = await notify(orgA.id, firstB.id, actor.id);

    for (const [userId, noteA, noteB] of [
      [firstA.id, noteAForFirstA.id, noteBForFirstA.id],
      [firstB.id, noteAForFirstB.id, noteBForFirstB.id],
    ] as const) {
      const markedA = await markNotificationReadForUser(
        notifications,
        ctx(orgA.id, "author", userId),
        noteA,
      );
      assert.ok(markedA?.readAt);

      await assert.rejects(
        () =>
          markNotificationReadForUser(
            notifications,
            ctx(orgA.id, "author", userId),
            noteB,
          ),
        (e: unknown) =>
          e instanceof AuthorizationError && e.code === "wrong-organization",
      );
      await assert.rejects(
        () =>
          markNotificationReadForUser(
            notifications,
            ctx(orgB.id, "viewer", userId),
            noteB,
          ),
        (e: unknown) =>
          e instanceof AuthorizationError && e.code === "forbidden",
      );
    }
  });

  it("allows legitimate notification management in the owning organization", async () => {
    const { orgA, notifications, makeUser, addMembership, notify } =
      await setupMultiOrg();
    const user = await makeUser("author-a@example.com");
    const actor = await makeUser("actor-legit@example.com");
    await addMembership(orgA.id, user.id, "author");
    await addMembership(orgA.id, actor.id, "author");
    const note = await notify(orgA.id, user.id, actor.id);

    const marked = await markNotificationReadForUser(
      notifications,
      ctx(orgA.id, "author", user.id),
      note.id,
    );
    assert.ok(marked?.readAt);

    const second = await notify(orgA.id, user.id, actor.id);
    const deleted = await deleteNotificationForUser(
      notifications,
      ctx(orgA.id, "author", user.id),
      second.id,
    );
    assert.ok(deleted?.deletedAt);
  });

  it("does not allow another user to access or mutate a notification", async () => {
    const { orgA, notifications, makeUser, addMembership, notify } =
      await setupMultiOrg();
    const owner = await makeUser("owner@example.com");
    const other = await makeUser("other@example.com");
    const actor = await makeUser("actor-other@example.com");
    await addMembership(orgA.id, owner.id, "author");
    await addMembership(orgA.id, other.id, "organization_admin");
    await addMembership(orgA.id, actor.id, "author");
    const note = await notify(orgA.id, owner.id, actor.id);

    assert.equal(
      await markNotificationReadForUser(
        notifications,
        ctx(orgA.id, "organization_admin", other.id),
        note.id,
      ),
      null,
    );
    assert.equal(
      await deleteNotificationForUser(
        notifications,
        ctx(orgA.id, "organization_admin", other.id),
        note.id,
      ),
      null,
    );
    const unchanged = await notifications.getById(owner.id, note.id);
    assert.equal(unchanged?.readAt, null);
    assert.equal(unchanged?.deletedAt, null);
  });

  it("keeps cross-org isolation intact for mark-all and by-id mutations", async () => {
    const { orgA, orgB, notifications, makeUser, addMembership, notify } =
      await setupMultiOrg();
    const user = await makeUser("isolated@example.com");
    const outsider = await makeUser("outsider@example.com");
    const actor = await makeUser("actor-iso@example.com");
    await addMembership(orgA.id, user.id, "author");
    await addMembership(orgB.id, user.id, "viewer");
    await addMembership(orgB.id, outsider.id, "organization_admin");
    await addMembership(orgA.id, actor.id, "author");
    await addMembership(orgB.id, actor.id, "author");

    const noteA = await notify(orgA.id, user.id, actor.id);
    const noteB = await notify(orgB.id, user.id, actor.id);

    const markedCount = await markAllNotificationsReadForUser(
      notifications,
      ctx(orgA.id, "author", user.id),
    );
    assert.equal(markedCount, 1);
    assert.ok((await notifications.getById(user.id, noteA.id))?.readAt);
    assert.equal((await notifications.getById(user.id, noteB.id))?.readAt, null);

    await assert.rejects(
      () =>
        markAllNotificationsReadForUser(
          notifications,
          ctx(orgB.id, "viewer", user.id),
        ),
      (e: unknown) => e instanceof AuthorizationError && e.code === "forbidden",
    );

    assert.equal(
      await markNotificationReadForUser(
        notifications,
        ctx(orgB.id, "organization_admin", outsider.id),
        noteB.id,
      ),
      null,
    );
    assert.equal((await notifications.getById(user.id, noteB.id))?.readAt, null);
  });
});

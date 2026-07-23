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
import { loadProjectForOrg } from "@/server/authorized-projects";
import {
  enrichNotifications,
  listNotificationViewsForUser,
} from "@/server/notification-views";
import { buildNotificationHref } from "@/components/collaboration/notification-presentation";

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
    name: "Goose Flagship",
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

  return {
    db,
    orgs,
    org,
    projects,
    project,
    discussions,
    notifications,
    makeMember,
    makeUser,
  };
}

describe("notification views and deep links", () => {
  it("enriches notifications with project name, control id, and comment preview", async () => {
    const { orgs, org, projects, project, discussions, notifications, makeMember } =
      await setup();
    const alice = await makeMember("alice@example.com");
    const bob = await makeMember("bob@example.com");

    const created = await createDiscussionForOrg(
      projects,
      discussions,
      orgs,
      notifications,
      ctx(org.id, "author", alice.id),
      {
        projectId: project.id,
        controlId: "ac-2",
        body: "Please review account management @bob",
      },
      { actorId: alice.id, actorDisplayName: "Alice" },
    );
    assert.equal(created.ok, true);
    if (!created.ok) return;

    const views = await listNotificationViewsForUser(
      notifications,
      projects,
      discussions,
      ctx(org.id, "author", bob.id),
    );
    assert.equal(views.length, 1);
    assert.equal(views[0].projectName, "Goose Flagship");
    assert.equal(views[0].controlIdDisplay, "AC-2");
    assert.ok(views[0].controlTitle);
    assert.equal(views[0].eventTypeLabel, "Mention");
    assert.match(views[0].preview ?? "", /Please review account management/);
    assert.equal(
      views[0].href,
      `/projects/${project.id}?view=controls&control=ac-2&comment=${created.comment.id}`,
    );
  });

  it("shows a deleted-comment preview and withholds cross-tenant project names", async () => {
    const {
      orgs,
      org,
      projects,
      project,
      discussions,
      notifications,
      makeMember,
    } = await setup();
    const alice = await makeMember("alice@example.com");
    const bob = await makeMember("bob@example.com");

    const otherOrg = await orgs.createOrganization({
      name: "Other",
      slug: "other",
    });
    const otherProject = await projects.create({
      name: "Secret Project",
      organizationId: otherOrg.id,
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    const created = await createDiscussionForOrg(
      projects,
      discussions,
      orgs,
      notifications,
      ctx(org.id, "author", alice.id),
      {
        projectId: project.id,
        controlId: "ac-1",
        body: "Temporary note @bob",
      },
      { actorId: alice.id, actorDisplayName: "Alice" },
    );
    assert.equal(created.ok, true);
    if (!created.ok) return;

    await discussions.softDeleteComment(org.id, created.comment.id, {
      actorId: alice.id,
      actorDisplayName: "Alice",
    });

    const bobViews = await listNotificationViewsForUser(
      notifications,
      projects,
      discussions,
      ctx(org.id, "author", bob.id),
    );
    assert.equal(bobViews.length, 1);
    assert.equal(bobViews[0].preview, "Comment deleted");
    assert.equal(bobViews[0].projectName, "Goose Flagship");

    const forged = await enrichNotifications(
      [
        {
          id: bobViews[0].id,
          organizationId: org.id,
          recipientUserId: bob.id,
          actorUserId: alice.id,
          eventType: "comment_mention",
          relatedObjectType: "comment",
          relatedObjectId: created.comment.id,
          projectId: otherProject.id,
          controlId: "ac-1",
          summary: "forged",
          readAt: null,
          deletedAt: null,
          createdAt: bobViews[0].createdAt,
        },
      ],
      projects,
      discussions,
    );
    assert.equal(forged[0].projectName, null);

    const denied = await loadProjectForOrg(
      projects,
      ctx(org.id, "author", bob.id),
      otherProject.id,
    );
    assert.equal(denied.ok, false);
    if (!denied.ok) {
      assert.equal(denied.error.kind, "not-found");
    }
  });

  it("does not allow outsiders to open a notification deep-link project", async () => {
    const {
      orgs,
      org,
      projects,
      project,
      discussions,
      notifications,
      makeMember,
      makeUser,
    } = await setup();
    const alice = await makeMember("alice@example.com");
    const outsider = await makeUser("outsider@example.com");
    const outsiderOrg = await orgs.createOrganization({
      name: "Outsider Org",
      slug: "outsider-org",
    });
    await orgs.upsertMembership({
      organizationId: outsiderOrg.id,
      userId: outsider.id,
      role: "viewer",
    });

    const created = await createDiscussionForOrg(
      projects,
      discussions,
      orgs,
      notifications,
      ctx(org.id, "author", alice.id),
      {
        projectId: project.id,
        controlId: "ac-2",
        body: "hello",
      },
      { actorId: alice.id, actorDisplayName: "Alice" },
    );
    assert.equal(created.ok, true);
    if (!created.ok) return;

    const href = buildNotificationHref({
      projectId: project.id,
      controlId: "ac-2",
      relatedObjectType: "comment",
      relatedObjectId: created.comment.id,
    });
    assert.ok(href?.startsWith(`/projects/${project.id}`));

    const load = await loadProjectForOrg(
      projects,
      ctx(outsiderOrg.id, "viewer", outsider.id),
      project.id,
    );
    assert.equal(load.ok, false);
    if (!load.ok) {
      assert.equal(load.error.kind, "not-found");
    }
  });
});

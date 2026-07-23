import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterEach, describe, it } from "node:test";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresAssignmentService } from "@/persistence/postgres/assignment-service";
import { createPostgresControlActivityRepository } from "@/persistence/postgres/control-activity-repository";
import { createPostgresNotificationRepository } from "@/persistence/postgres/notification-repository";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { createNotificationService } from "@/persistence/notification-service";
import { user as userTable } from "@/persistence/postgres/auth-schema";
import { resetActivityTimestampClock } from "@/persistence/activity-clock";
import { AuthorizationError, type OrgContext } from "@/authz/authorize";
import type { OrgRole } from "@/authz/permissions";
import {
  createAssignmentForOrg,
  listAssignmentsForOrg,
  reassignAssignmentForOrg,
  removeAssignmentForOrg,
} from "@/server/authorized-assignments";
import { listNotificationsForUser } from "@/server/authorized-notifications";

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
  const assignments = createPostgresAssignmentService(db);
  const notifications = createNotificationService(
    createPostgresNotificationRepository(db),
  );
  const activities = createPostgresControlActivityRepository(db);

  async function makeMember(
    organizationId: string,
    email: string,
    role: OrgRole = "author",
  ) {
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
    await orgs.upsertMembership({ organizationId, userId: id, role });
    return { id, email };
  }

  return {
    orgs,
    orgA,
    orgB,
    projects,
    projectA,
    assignments,
    notifications,
    activities,
    makeMember,
  };
}

describe("assignments (WP5)", () => {
  it("assigns, reassigns, and removes with activity and notifications", async () => {
    const {
      orgs,
      orgA,
      projects,
      projectA,
      assignments,
      notifications,
      activities,
      makeMember,
    } = await setup();
    const manager = await makeMember(orgA.id, "pm@example.com", "project_manager");
    const alice = await makeMember(orgA.id, "alice@example.com");
    const bob = await makeMember(orgA.id, "bob@example.com");
    const managerCtx = ctx(orgA.id, "project_manager", manager.id);

    const created = await createAssignmentForOrg(
      projects,
      assignments,
      orgs,
      notifications,
      managerCtx,
      {
        projectId: projectA.id,
        controlId: "ac-2",
        assigneeUserId: alice.id,
        assignmentRole: "owner",
      },
      { actorId: manager.id, actorDisplayName: "PM" },
    );
    assert.equal(created.ok, true);
    if (!created.ok) return;
    assert.equal(created.activity.activityType, "assignment_changed");

    const aliceNotes = await listNotificationsForUser(
      notifications,
      ctx(orgA.id, "author", alice.id),
    );
    assert.equal(aliceNotes.length, 1);
    assert.equal(aliceNotes[0].eventType, "assignment_created");

    const reassigned = await reassignAssignmentForOrg(
      projects,
      assignments,
      orgs,
      notifications,
      managerCtx,
      created.assignment.id,
      bob.id,
      { actorId: manager.id, actorDisplayName: "PM" },
    );
    assert.equal(reassigned.ok, true);
    if (!reassigned.ok) return;
    assert.equal(reassigned.assignment.assigneeUserId, bob.id);

    const listed = await listAssignmentsForOrg(
      projects,
      assignments,
      managerCtx,
      projectA.id,
      "ac-2",
    );
    assert.equal(listed.length, 1);

    const removed = await removeAssignmentForOrg(
      projects,
      assignments,
      notifications,
      managerCtx,
      created.assignment.id,
      { actorId: manager.id, actorDisplayName: "PM" },
    );
    assert.equal(removed.ok, true);
    if (!removed.ok) return;
    assert.equal(removed.activity.activityType, "assignment_removed");

    const stream = await activities.listByControlRecordId(
      created.activity.controlRecordId,
    );
    assert.ok(stream.some((row) => row.activityType === "assignment_changed"));
    assert.ok(stream.some((row) => row.activityType === "assignment_removed"));
  });

  it("rejects non-member assignees and denies authors from managing", async () => {
    const { orgs, orgA, orgB, projects, projectA, assignments, notifications, makeMember } =
      await setup();
    const author = await makeMember(orgA.id, "author@example.com", "author");
    const outsider = await makeMember(orgB.id, "out@example.com");
    const manager = await makeMember(orgA.id, "pm@example.com", "project_manager");

    await assert.rejects(
      () =>
        createAssignmentForOrg(
          projects,
          assignments,
          orgs,
          notifications,
          ctx(orgA.id, "author", author.id),
          {
            projectId: projectA.id,
            controlId: "ac-2",
            assigneeUserId: author.id,
            assignmentRole: "owner",
          },
          { actorId: author.id, actorDisplayName: "Author" },
        ),
      (e: unknown) =>
        e instanceof AuthorizationError && e.code === "forbidden",
    );

    const bad = await createAssignmentForOrg(
      projects,
      assignments,
      orgs,
      notifications,
      ctx(orgA.id, "project_manager", manager.id),
      {
        projectId: projectA.id,
        controlId: "ac-2",
        assigneeUserId: outsider.id,
        assignmentRole: "reviewer",
      },
      { actorId: manager.id, actorDisplayName: "PM" },
    );
    assert.equal(bad.ok, false);
    if (!bad.ok) {
      assert.equal(bad.reason, "validation");
    }
  });
});

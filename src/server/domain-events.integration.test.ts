import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterEach, describe, it } from "node:test";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import {
  createDomainEventRuntime,
  setSharedDomainEventRuntime,
  type DomainEvent,
} from "@/domain/events";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresDiscussionService } from "@/persistence/postgres/discussion-service";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { createPostgresNotificationRepository } from "@/persistence/postgres/notification-repository";
import { createPostgresAssignmentService } from "@/persistence/postgres/assignment-service";
import { createPostgresControlRecordService } from "@/persistence/postgres/control-record-service";
import { createNotificationService } from "@/persistence/notification-service";
import { user as userTable } from "@/persistence/postgres/auth-schema";
import { resetActivityTimestampClock } from "@/persistence/activity-clock";
import type { OrgContext } from "@/authz/authorize";
import type { OrgRole } from "@/authz/permissions";
import { createProjectForOrg } from "@/server/authorized-projects";
import { createDiscussionForOrg } from "@/server/authorized-collaboration";
import { createAssignmentForOrg } from "@/server/authorized-assignments";
import { upsertControlRecordsForOrg } from "@/server/authorized-controls";

afterEach(async () => {
  await closeDb();
  resetActivityTimestampClock();
  setSharedDomainEventRuntime(null);
});

function ctx(
  organizationId: string,
  role: OrgRole,
  userId: string,
): OrgContext {
  return { userId, organizationId, role };
}

async function setup() {
  const runtime = createDomainEventRuntime();
  setSharedDomainEventRuntime(runtime);
  const db = await openTestDb();
  const orgs = createPostgresOrganizationRepository(db);
  const org = await orgs.createOrganization({ name: "Org", slug: "org" });
  const projects = createPostgresProjectRepository(db);
  const discussions = createPostgresDiscussionService(db);
  const notifications = createNotificationService(
    createPostgresNotificationRepository(db),
  );
  const assignments = createPostgresAssignmentService(db);
  const controls = createPostgresControlRecordService(db);

  async function makeMember(
    email: string,
    role: OrgRole = "project_manager",
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
    await orgs.upsertMembership({
      organizationId: org.id,
      userId: id,
      role,
    });
    return { id, email };
  }

  return {
    runtime,
    orgs,
    org,
    projects,
    discussions,
    notifications,
    assignments,
    controls,
    makeMember,
  };
}

function eventTypes(events: readonly DomainEvent[]): string[] {
  return events.map((event) => event.eventType);
}

describe("domain event integration", () => {
  it("publishes project, discussion, assignment, and control events after success", async () => {
    const env = await setup();
    const manager = await env.makeMember("pm@example.com", "project_manager");
    const author = await env.makeMember("author@example.com", "author");
    const managerCtx = ctx(env.org.id, "project_manager", manager.id);

    const project = await createProjectForOrg(env.projects, managerCtx, {
      name: "Events Project",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    const controlResult = await upsertControlRecordsForOrg(
      env.projects,
      env.controls,
      managerCtx,
      project.id,
      [{ controlId: "ac-1", owner: author.id }],
      { actorId: manager.id, actorDisplayName: manager.email },
    );
    assert.equal(controlResult.ok, true);

    const discussion = await createDiscussionForOrg(
      env.projects,
      env.discussions,
      env.orgs,
      env.notifications,
      managerCtx,
      {
        projectId: project.id,
        controlId: "ac-1",
        body: `Hello @${author.email}`,
      },
      { actorId: manager.id, actorDisplayName: manager.email },
    );
    assert.equal(discussion.ok, true);

    const assignment = await createAssignmentForOrg(
      env.projects,
      env.assignments,
      env.orgs,
      env.notifications,
      managerCtx,
      {
        projectId: project.id,
        controlId: "ac-1",
        assigneeUserId: author.id,
        assignmentRole: "owner",
      },
      { actorId: manager.id, actorDisplayName: manager.email },
    );
    assert.equal(assignment.ok, true);

    const published = env.runtime.diagnostics.listRecentEvents(env.org.id, 50);
    const types = eventTypes(published.map((row) => row.event));

    assert.ok(types.includes("ProjectCreated"));
    assert.ok(types.includes("ControlCreated"));
    assert.ok(types.includes("DiscussionCreated"));
    assert.ok(types.includes("AssignmentCreated"));
    assert.ok(types.includes("ControlAssigned"));
    assert.ok(types.includes("NotificationCreated"));

    for (const row of published) {
      assert.equal(row.event.metadata.organizationId, env.org.id);
    }
  });

  it("keeps direct notifications working while publishing events", async () => {
    const env = await setup();
    const manager = await env.makeMember("pm@example.com", "project_manager");
    const author = await env.makeMember("author@example.com", "author");
    const managerCtx = ctx(env.org.id, "project_manager", manager.id);

    const project = await createProjectForOrg(env.projects, managerCtx, {
      name: "Notify Project",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
    });

    await createDiscussionForOrg(
      env.projects,
      env.discussions,
      env.orgs,
      env.notifications,
      managerCtx,
      {
        projectId: project.id,
        controlId: "ac-2",
        body: `Ping @${author.email}`,
      },
      { actorId: manager.id, actorDisplayName: manager.email },
    );

    const inbox = await env.notifications.listForRecipient(author.id);
    assert.ok(inbox.length >= 1);
    assert.equal(inbox[0]!.eventType, "comment_mention");

    const notificationEvents = env.runtime.diagnostics
      .listRecentEvents(env.org.id)
      .filter((row) => row.event.eventType === "NotificationCreated");
    assert.ok(notificationEvents.length >= 1);
  });
});

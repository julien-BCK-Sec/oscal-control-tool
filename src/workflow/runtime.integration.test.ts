import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterEach, describe, it } from "node:test";
import { NIST_MODERATE_FRAMEWORK_ID } from "@/framework/nist-moderate/derive";
import {
  controlAssignedEvent,
  createDomainEventRuntime,
  setSharedDomainEventRuntime,
} from "@/domain/events";
import { resetActivityTimestampClock } from "@/persistence/activity-clock";
import { createNotificationService } from "@/persistence/notification-service";
import { user as userTable } from "@/persistence/postgres/auth-schema";
import { closeDb, openTestDb } from "@/persistence/postgres/client";
import { createPostgresAssignmentService } from "@/persistence/postgres/assignment-service";
import { createPostgresControlRecordRepository } from "@/persistence/postgres/control-record-repository";
import { createPostgresControlRecordService } from "@/persistence/postgres/control-record-service";
import { createPostgresNotificationRepository } from "@/persistence/postgres/notification-repository";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { createPostgresWorkflowRepository } from "@/persistence/postgres/workflow-repository";
import { createTestProjectRepository } from "@/persistence/postgres/testing";
import {
  processWorkflowDomainEvent,
  resetWorkflowEngineSubscriptionForTests,
  type WorkflowRuntimeDeps,
} from "@/workflow/runtime";
import { runWithWorkflowCascadeGuard } from "@/workflow/loop-guard";

afterEach(async () => {
  await closeDb();
  resetActivityTimestampClock();
  setSharedDomainEventRuntime(null);
  resetWorkflowEngineSubscriptionForTests();
});

async function setup() {
  const runtime = createDomainEventRuntime();
  setSharedDomainEventRuntime(runtime);
  const db = await openTestDb();
  const orgs = createPostgresOrganizationRepository(db);
  const org = await orgs.createOrganization({
    name: "Workflow Org",
    slug: `wf-${randomUUID().slice(0, 8)}`,
  });
  const projects = createTestProjectRepository(db, org.id);
  const controlRecords = createPostgresControlRecordRepository(db);
  const controlRecordService = createPostgresControlRecordService(db);
  const assignments = createPostgresAssignmentService(db);
  const notifications = createNotificationService(
    createPostgresNotificationRepository(db),
  );
  const workflowRepo = createPostgresWorkflowRepository(db);

  async function makeMember(email: string, role: "organization_admin" | "author" = "author") {
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

  const deps: WorkflowRuntimeDeps = {
    workflowRepo,
    projects: createPostgresProjectRepository(db),
    controlRecords,
    controlRecordService,
    assignments,
    notifications,
    organizations: orgs,
  };

  return {
    runtime,
    org,
    projects,
    workflowRepo,
    notifications,
    assignments,
    controlRecords,
    deps,
    makeMember,
  };
}

describe("workflow domain event integration", () => {
  it("runs matching enabled rules, records history, and notifies users", async () => {
    const env = await setup();
    const admin = await env.makeMember("admin@example.com", "organization_admin");
    const author = await env.makeMember("author@example.com", "author");

    const project = await env.projects.create({
      name: "WF Project",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      organizationId: env.org.id,
    });

    const rule = await env.workflowRepo.createRule({
      organizationId: env.org.id,
      name: "Notify on assign",
      triggerType: "control_assigned",
      conditions: [{ type: "assigned_role", op: "eq", value: "owner" }],
      actions: [
        {
          type: "notify_user",
          userId: admin.id,
          summary: "Control was assigned",
        },
      ],
      createdByUserId: admin.id,
    });

    await env.assignments.assign(
      {
        organizationId: env.org.id,
        projectId: project.id,
        controlId: "ac-2",
        assigneeUserId: author.id,
        assignmentRole: "owner",
        assignedByUserId: admin.id,
      },
      { actorId: admin.id, actorDisplayName: admin.email },
    );

    const event = controlAssignedEvent({
      organizationId: env.org.id,
      actorId: admin.id,
      projectId: project.id,
      controlId: "ac-2",
      assignmentId: "asg-1",
      assigneeUserId: author.id,
      assignmentRole: "owner",
    });

    await processWorkflowDomainEvent(event, env.deps);

    const executions = await env.workflowRepo.listExecutions(env.org.id, {
      workflowRuleId: rule.id,
    });
    assert.equal(executions.length, 1);
    assert.equal(executions[0]?.status, "succeeded");
    assert.equal(executions[0]?.conditionsMatched, true);
    assert.equal(executions[0]?.detail.actionResults[0]?.status, "executed");

    const notes = await env.notifications.listForRecipient(admin.id);
    assert.equal(notes.length, 1);
    assert.equal(notes[0]?.eventType, "workflow_triggered");
    assert.match(notes[0]?.summary ?? "", /Control was assigned/);
  });

  it("ignores disabled rules and skips when conditions do not match", async () => {
    const env = await setup();
    const admin = await env.makeMember("admin2@example.com", "organization_admin");
    const author = await env.makeMember("author2@example.com", "author");
    const project = await env.projects.create({
      name: "WF Project 2",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      organizationId: env.org.id,
    });

    await env.workflowRepo.createRule({
      organizationId: env.org.id,
      name: "Disabled",
      enabled: false,
      triggerType: "control_assigned",
      conditions: [],
      actions: [{ type: "notify_user", userId: admin.id }],
      createdByUserId: admin.id,
    });
    await env.workflowRepo.createRule({
      organizationId: env.org.id,
      name: "Wrong role",
      triggerType: "control_assigned",
      conditions: [{ type: "assigned_role", op: "eq", value: "reviewer" }],
      actions: [{ type: "notify_user", userId: admin.id }],
      createdByUserId: admin.id,
    });

    await env.assignments.assign(
      {
        organizationId: env.org.id,
        projectId: project.id,
        controlId: "ac-3",
        assigneeUserId: author.id,
        assignmentRole: "owner",
        assignedByUserId: admin.id,
      },
      { actorId: admin.id, actorDisplayName: admin.email },
    );

    const event = controlAssignedEvent({
      organizationId: env.org.id,
      actorId: admin.id,
      projectId: project.id,
      controlId: "ac-3",
      assignmentId: "asg-2",
      assigneeUserId: author.id,
      assignmentRole: "owner",
    });

    await processWorkflowDomainEvent(event, env.deps);

    const executions = await env.workflowRepo.listExecutions(env.org.id);
    assert.equal(executions.length, 1);
    assert.equal(executions[0]?.status, "skipped");
    assert.equal(
      (await env.notifications.listForRecipient(admin.id)).length,
      0,
    );
  });

  it("does not re-enter workflow processing while cascade suppression is active", async () => {
    const env = await setup();
    const admin = await env.makeMember("admin3@example.com", "organization_admin");
    const author = await env.makeMember("author3@example.com", "author");
    const project = await env.projects.create({
      name: "WF Project 3",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      organizationId: env.org.id,
    });

    await env.workflowRepo.createRule({
      organizationId: env.org.id,
      name: "Assign reviewer",
      triggerType: "control_assigned",
      conditions: [],
      actions: [
        {
          type: "assign_user",
          userId: admin.id,
          assignmentRole: "reviewer",
        },
      ],
      createdByUserId: admin.id,
    });

    await env.assignments.assign(
      {
        organizationId: env.org.id,
        projectId: project.id,
        controlId: "ac-4",
        assigneeUserId: author.id,
        assignmentRole: "owner",
        assignedByUserId: admin.id,
      },
      { actorId: admin.id, actorDisplayName: admin.email },
    );

    const event = controlAssignedEvent({
      organizationId: env.org.id,
      actorId: admin.id,
      projectId: project.id,
      controlId: "ac-4",
      assignmentId: "asg-3",
      assigneeUserId: author.id,
      assignmentRole: "owner",
    });

    await processWorkflowDomainEvent(event, env.deps);

    const executions = await env.workflowRepo.listExecutions(env.org.id);
    assert.equal(executions.length, 1);
    assert.equal(executions[0]?.status, "succeeded");

    // Nested event published by assign_user must not create another run.
    await runWithWorkflowCascadeGuard(async () => {
      await processWorkflowDomainEvent(
        controlAssignedEvent({
          organizationId: env.org.id,
          actorId: null,
          projectId: project.id,
          controlId: "ac-4",
          assignmentId: "asg-nested",
          assigneeUserId: admin.id,
          assignmentRole: "reviewer",
        }),
        env.deps,
      );
    });

    assert.equal(
      (await env.workflowRepo.listExecutions(env.org.id)).length,
      1,
    );

    const assigned = await env.assignments.listByControl(
      env.org.id,
      project.id,
      "ac-4",
    );
    assert.ok(
      assigned.some(
        (a) =>
          a.assigneeUserId === admin.id &&
          a.assignmentRole === "reviewer" &&
          a.completedAt == null,
      ),
    );
  });

  it("prevents duplicate execution for the same event and rule", async () => {
    const env = await setup();
    const admin = await env.makeMember("admin4@example.com", "organization_admin");
    const project = await env.projects.create({
      name: "WF Project 4",
      frameworkId: NIST_MODERATE_FRAMEWORK_ID,
      organizationId: env.org.id,
    });

    await env.workflowRepo.createRule({
      organizationId: env.org.id,
      name: "Once",
      triggerType: "control_assigned",
      conditions: [],
      actions: [{ type: "notify_user", userId: admin.id }],
      createdByUserId: admin.id,
    });

    const event = controlAssignedEvent({
      organizationId: env.org.id,
      actorId: admin.id,
      projectId: project.id,
      controlId: "ac-5",
      assignmentId: "asg-4",
      assigneeUserId: admin.id,
      assignmentRole: "owner",
    });

    await processWorkflowDomainEvent(event, env.deps);
    await processWorkflowDomainEvent(event, env.deps);

    const executions = await env.workflowRepo.listExecutions(env.org.id);
    assert.equal(executions.length, 1);
    assert.equal(
      (await env.notifications.listForRecipient(admin.id)).length,
      1,
    );
  });
});

import type { ActorIdentity } from "@/persistence/actor";
import type { ProjectRepository } from "@/persistence/repository";
import type { AssignmentService } from "@/persistence/assignment-service";
import type { NotificationService } from "@/persistence/notification-service";
import type { OrganizationRepository } from "@/persistence/postgres/organization-repository";
import type { Assignment, AssignmentRole } from "@/data/collaboration";
import type { ControlActivity } from "@/data/control-activity";
import {
  requirePermission,
  type OrgContext,
} from "@/authz/authorize";
import { isAssignmentRole } from "@/data/collaboration";
import {
  assignmentCompletedEvent,
  assignmentCreatedEvent,
  controlAssignedEvent,
  notificationCreatedEvent,
} from "@/domain/events";
import { publishDomainEvent, publishDomainEvents } from "./publish-domain-event";

async function projectBelongsToOrg(
  projectRepo: ProjectRepository,
  ctx: OrgContext,
  projectId: string,
): Promise<boolean> {
  const loaded = await projectRepo.load(projectId);
  return loaded.ok && loaded.project.organizationId === ctx.organizationId;
}

export type AssignmentActionResult =
  | { ok: true; assignment: Assignment; activity: ControlActivity }
  | { ok: false; reason: "not-found" | "validation"; message: string };

async function assertAssigneeInOrg(
  orgRepo: OrganizationRepository,
  organizationId: string,
  assigneeUserId: string,
): Promise<boolean> {
  const membership = await orgRepo.getMembership(
    organizationId,
    assigneeUserId,
  );
  return membership !== null;
}

async function notifyAssignee(
  notificationService: NotificationService,
  ctx: OrgContext,
  assignment: Assignment,
  eventType:
    | "assignment_created"
    | "assignment_reassigned"
    | "assignment_completed"
    | "assignment_removed",
  summary: string,
): Promise<void> {
  if (assignment.assigneeUserId === ctx.userId) {
    return;
  }
  const notification = await notificationService.notify({
    organizationId: ctx.organizationId,
    recipientUserId: assignment.assigneeUserId,
    actorUserId: ctx.userId,
    eventType,
    relatedObjectType: "assignment",
    relatedObjectId: `${assignment.id}:${eventType}`,
    projectId: assignment.projectId,
    controlId: assignment.controlId,
    summary,
  });
  await publishDomainEvent(
    notificationCreatedEvent({
      organizationId: notification.organizationId,
      actorId: ctx.userId,
      notificationId: notification.id,
      recipientUserId: notification.recipientUserId,
      notificationEventType: notification.eventType,
      relatedObjectType: notification.relatedObjectType,
      relatedObjectId: notification.relatedObjectId,
      projectId: notification.projectId,
      controlId: notification.controlId,
    }),
  );
}

export async function listAssignmentsForOrg(
  projectRepo: ProjectRepository,
  assignmentService: AssignmentService,
  ctx: OrgContext,
  projectId: string,
  controlId: string,
): Promise<Assignment[]> {
  requirePermission(ctx, ctx.organizationId, "assignment.read");
  if (!(await projectBelongsToOrg(projectRepo, ctx, projectId))) {
    return [];
  }
  return assignmentService.listByControl(
    ctx.organizationId,
    projectId,
    controlId,
  );
}

export async function createAssignmentForOrg(
  projectRepo: ProjectRepository,
  assignmentService: AssignmentService,
  orgRepo: OrganizationRepository,
  notificationService: NotificationService,
  ctx: OrgContext,
  input: {
    projectId: string;
    controlId: string;
    assigneeUserId: string;
    assignmentRole: AssignmentRole;
  },
  actor: ActorIdentity,
): Promise<AssignmentActionResult> {
  requirePermission(ctx, ctx.organizationId, "assignment.manage");
  if (!(await projectBelongsToOrg(projectRepo, ctx, input.projectId))) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  if (!isAssignmentRole(input.assignmentRole)) {
    return {
      ok: false,
      reason: "validation",
      message: "Invalid assignment role.",
    };
  }
  if (
    !(await assertAssigneeInOrg(
      orgRepo,
      ctx.organizationId,
      input.assigneeUserId,
    ))
  ) {
    return {
      ok: false,
      reason: "validation",
      message: "Assignee must be an organization member.",
    };
  }
  const result = await assignmentService.assign(
    {
      organizationId: ctx.organizationId,
      projectId: input.projectId,
      controlId: input.controlId,
      assigneeUserId: input.assigneeUserId,
      assignmentRole: input.assignmentRole,
      assignedByUserId: ctx.userId,
    },
    { ...actor, actorId: ctx.userId },
  );
  await notifyAssignee(
    notificationService,
    ctx,
    result.assignment,
    "assignment_created",
    `Assigned as ${result.assignment.assignmentRole} on ${result.assignment.controlId}`,
  );
  await publishDomainEvents([
    assignmentCreatedEvent({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      projectId: result.assignment.projectId,
      controlId: result.assignment.controlId,
      assignmentId: result.assignment.id,
      assigneeUserId: result.assignment.assigneeUserId,
      assignmentRole: result.assignment.assignmentRole,
    }),
    controlAssignedEvent({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      projectId: result.assignment.projectId,
      controlId: result.assignment.controlId,
      assignmentId: result.assignment.id,
      assigneeUserId: result.assignment.assigneeUserId,
      assignmentRole: result.assignment.assignmentRole,
    }),
  ]);
  return {
    ok: true,
    assignment: result.assignment,
    activity: result.activity,
  };
}

export async function reassignAssignmentForOrg(
  projectRepo: ProjectRepository,
  assignmentService: AssignmentService,
  orgRepo: OrganizationRepository,
  notificationService: NotificationService,
  ctx: OrgContext,
  assignmentId: string,
  assigneeUserId: string,
  actor: ActorIdentity,
): Promise<AssignmentActionResult> {
  requirePermission(ctx, ctx.organizationId, "assignment.manage");
  const existing = await assignmentService.getById(
    ctx.organizationId,
    assignmentId,
  );
  if (!existing) {
    return { ok: false, reason: "not-found", message: "Assignment not found." };
  }
  if (!(await projectBelongsToOrg(projectRepo, ctx, existing.projectId))) {
    return { ok: false, reason: "not-found", message: "Assignment not found." };
  }
  if (
    !(await assertAssigneeInOrg(orgRepo, ctx.organizationId, assigneeUserId))
  ) {
    return {
      ok: false,
      reason: "validation",
      message: "Assignee must be an organization member.",
    };
  }
  const result = await assignmentService.reassign(
    ctx.organizationId,
    assignmentId,
    assigneeUserId,
    { ...actor, actorId: ctx.userId },
  );
  if (!result) {
    return { ok: false, reason: "not-found", message: "Assignment not found." };
  }
  await notifyAssignee(
    notificationService,
    ctx,
    result.assignment,
    "assignment_reassigned",
    `Reassigned as ${result.assignment.assignmentRole} on ${result.assignment.controlId}`,
  );
  await publishDomainEvent(
    controlAssignedEvent({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      projectId: result.assignment.projectId,
      controlId: result.assignment.controlId,
      assignmentId: result.assignment.id,
      assigneeUserId: result.assignment.assigneeUserId,
      assignmentRole: result.assignment.assignmentRole,
    }),
  );
  return {
    ok: true,
    assignment: result.assignment,
    activity: result.activity,
  };
}

export async function completeAssignmentForOrg(
  projectRepo: ProjectRepository,
  assignmentService: AssignmentService,
  notificationService: NotificationService,
  ctx: OrgContext,
  assignmentId: string,
  actor: ActorIdentity,
): Promise<AssignmentActionResult> {
  requirePermission(ctx, ctx.organizationId, "assignment.manage");
  const result = await assignmentService.complete(
    ctx.organizationId,
    assignmentId,
    { ...actor, actorId: ctx.userId },
  );
  if (!result) {
    return { ok: false, reason: "not-found", message: "Assignment not found." };
  }
  if (!(await projectBelongsToOrg(projectRepo, ctx, result.assignment.projectId))) {
    return { ok: false, reason: "not-found", message: "Assignment not found." };
  }
  await notifyAssignee(
    notificationService,
    ctx,
    result.assignment,
    "assignment_completed",
    `Assignment completed on ${result.assignment.controlId}`,
  );
  await publishDomainEvent(
    assignmentCompletedEvent({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      projectId: result.assignment.projectId,
      controlId: result.assignment.controlId,
      assignmentId: result.assignment.id,
      assigneeUserId: result.assignment.assigneeUserId,
      assignmentRole: result.assignment.assignmentRole,
    }),
  );
  return {
    ok: true,
    assignment: result.assignment,
    activity: result.activity,
  };
}

export async function removeAssignmentForOrg(
  projectRepo: ProjectRepository,
  assignmentService: AssignmentService,
  notificationService: NotificationService,
  ctx: OrgContext,
  assignmentId: string,
  actor: ActorIdentity,
): Promise<AssignmentActionResult> {
  requirePermission(ctx, ctx.organizationId, "assignment.manage");
  const result = await assignmentService.remove(
    ctx.organizationId,
    assignmentId,
    { ...actor, actorId: ctx.userId },
  );
  if (!result) {
    return { ok: false, reason: "not-found", message: "Assignment not found." };
  }
  if (!(await projectBelongsToOrg(projectRepo, ctx, result.assignment.projectId))) {
    return { ok: false, reason: "not-found", message: "Assignment not found." };
  }
  await notifyAssignee(
    notificationService,
    ctx,
    result.assignment,
    "assignment_removed",
    `Assignment removed on ${result.assignment.controlId}`,
  );
  return {
    ok: true,
    assignment: result.assignment,
    activity: result.activity,
  };
}

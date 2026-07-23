/**
 * Real workflow action side effects (Milestone 02C WP5).
 *
 * Mutates via application services with the System actor. Domain events may
 * still be published afterward for audit; cascade suppression prevents those
 * events from re-entering the Workflow Engine.
 */

import type { OrgRole } from "@/authz/permissions";
import type { AssignmentRole } from "@/data/collaboration";
import { DEFAULT_EVIDENCE_REQUIREMENT } from "@/data/evidence";
import {
  assignmentCreatedEvent,
  controlAssignedEvent,
  controlCreatedEvent,
  controlUpdatedEvent,
  notificationCreatedEvent,
} from "@/domain/events";
import { SYSTEM_ACTOR } from "@/persistence/actor";
import type { AssignmentService } from "@/persistence/assignment-service";
import type { ControlRecordRepository } from "@/persistence/control-record-repository";
import type { ControlRecordService } from "@/persistence/control-record-service";
import type { NotificationService } from "@/persistence/notification-service";
import type { OrganizationRepository } from "@/persistence/postgres/organization-repository";
import { publishDomainEvent } from "@/server/publish-domain-event";
import type { ActionExecutorMap, WorkflowActionContext } from "./registries";
import type { ActionExecutionResult } from "./types";

export type WorkflowActionDeps = {
  notifications: NotificationService;
  assignments: AssignmentService;
  controlRecords: ControlRecordRepository;
  controlRecordService: ControlRecordService;
  organizations: OrganizationRepository;
};

function ok(type: ActionExecutionResult["type"]): ActionExecutionResult {
  return { type, status: "executed", errorMessage: null };
}

function fail(
  type: ActionExecutionResult["type"],
  message: string,
): ActionExecutionResult {
  return { type, status: "failed", errorMessage: message };
}

function requireProjectControl(
  ctx: WorkflowActionContext,
  actionType: ActionExecutionResult["type"],
): { projectId: string; controlId: string } | ActionExecutionResult {
  const projectId = ctx.evaluation.projectId;
  const controlId = ctx.evaluation.controlId;
  if (!projectId || !controlId) {
    return fail(
      actionType,
      "Action requires a project and control on the triggering event.",
    );
  }
  return { projectId, controlId };
}

function dueDateFromOffset(occurredAt: string, offsetDays: number): string {
  const base = new Date(occurredAt);
  if (Number.isNaN(base.getTime())) {
    throw new Error("Invalid event occurredAt timestamp.");
  }
  base.setUTCDate(base.getUTCDate() + offsetDays);
  return base.toISOString().slice(0, 10);
}

async function ensureAssignment(
  deps: WorkflowActionDeps,
  input: {
    organizationId: string;
    projectId: string;
    controlId: string;
    assigneeUserId: string;
    assignmentRole: AssignmentRole;
    ruleId: string;
  },
): Promise<void> {
  const existing = await deps.assignments.listByControl(
    input.organizationId,
    input.projectId,
    input.controlId,
  );
  const already = existing.some(
    (a) =>
      a.completedAt == null &&
      a.assigneeUserId === input.assigneeUserId &&
      a.assignmentRole === input.assignmentRole,
  );
  if (already) {
    return;
  }

  const { assignment } = await deps.assignments.assign(
    {
      organizationId: input.organizationId,
      projectId: input.projectId,
      controlId: input.controlId,
      assigneeUserId: input.assigneeUserId,
      assignmentRole: input.assignmentRole,
      assignedByUserId: "system",
    },
    SYSTEM_ACTOR,
  );

  await publishDomainEvent(
    assignmentCreatedEvent({
      organizationId: input.organizationId,
      actorId: null,
      projectId: assignment.projectId,
      controlId: assignment.controlId,
      assignmentId: assignment.id,
      assigneeUserId: assignment.assigneeUserId,
      assignmentRole: assignment.assignmentRole,
    }),
  );
  await publishDomainEvent(
    controlAssignedEvent({
      organizationId: input.organizationId,
      actorId: null,
      projectId: assignment.projectId,
      controlId: assignment.controlId,
      assignmentId: assignment.id,
      assigneeUserId: assignment.assigneeUserId,
      assignmentRole: assignment.assignmentRole,
    }),
  );
}

export function createWorkflowActionExecutors(
  deps: WorkflowActionDeps,
): ActionExecutorMap {
  return {
    async notify_user(ctx, config) {
      const organizationId = ctx.evaluation.organizationId;
      const summary =
        config.summary?.trim() ||
        `Workflow “${ctx.ruleName}” ran.`;
      const notification = await deps.notifications.notify({
        organizationId,
        recipientUserId: config.userId,
        actorUserId: null,
        eventType: "workflow_triggered",
        relatedObjectType: "workflow_rule",
        relatedObjectId: `${ctx.ruleId}:${ctx.evaluation.event.metadata.id}`,
        projectId: ctx.evaluation.projectId,
        controlId: ctx.evaluation.controlId,
        summary,
      });
      await publishDomainEvent(
        notificationCreatedEvent({
          organizationId: notification.organizationId,
          actorId: null,
          notificationId: notification.id,
          recipientUserId: notification.recipientUserId,
          notificationEventType: notification.eventType,
          relatedObjectType: notification.relatedObjectType,
          relatedObjectId: notification.relatedObjectId,
          projectId: notification.projectId,
          controlId: notification.controlId,
        }),
      );
      return ok("notify_user");
    },

    async notify_role(ctx, config) {
      const organizationId = ctx.evaluation.organizationId;
      const members = await deps.organizations.listMembers(organizationId);
      const recipients = members.filter(
        (m) => m.role === (config.orgRole as OrgRole),
      );
      const summary =
        config.summary?.trim() ||
        `Workflow “${ctx.ruleName}” ran.`;
      for (const member of recipients) {
        const notification = await deps.notifications.notify({
          organizationId,
          recipientUserId: member.userId,
          actorUserId: null,
          eventType: "workflow_triggered",
          relatedObjectType: "workflow_rule",
          relatedObjectId: `${ctx.ruleId}:${ctx.evaluation.event.metadata.id}:${member.userId}`,
          projectId: ctx.evaluation.projectId,
          controlId: ctx.evaluation.controlId,
          summary,
        });
        await publishDomainEvent(
          notificationCreatedEvent({
            organizationId: notification.organizationId,
            actorId: null,
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
      return ok("notify_role");
    },

    async assign_user(ctx, config) {
      const ids = requireProjectControl(ctx, "assign_user");
      if ("status" in ids) {
        return ids;
      }
      const membership = await deps.organizations.getMembership(
        ctx.evaluation.organizationId,
        config.userId,
      );
      if (!membership) {
        return fail("assign_user", "Assignee is not a member of the organization.");
      }
      await ensureAssignment(deps, {
        organizationId: ctx.evaluation.organizationId,
        projectId: ids.projectId,
        controlId: ids.controlId,
        assigneeUserId: config.userId,
        assignmentRole: config.assignmentRole,
        ruleId: ctx.ruleId,
      });
      return ok("assign_user");
    },

    async assign_role(ctx, config) {
      const ids = requireProjectControl(ctx, "assign_role");
      if ("status" in ids) {
        return ids;
      }
      const members = await deps.organizations.listMembers(
        ctx.evaluation.organizationId,
      );
      const recipients = members.filter(
        (m) => m.role === (config.orgRole as OrgRole),
      );
      for (const member of recipients) {
        await ensureAssignment(deps, {
          organizationId: ctx.evaluation.organizationId,
          projectId: ids.projectId,
          controlId: ids.controlId,
          assigneeUserId: member.userId,
          assignmentRole: config.assignmentRole,
          ruleId: ctx.ruleId,
        });
      }
      return ok("assign_role");
    },

    async set_due_date(ctx, config) {
      const ids = requireProjectControl(ctx, "set_due_date");
      if ("status" in ids) {
        return ids;
      }
      const existing = await deps.controlRecords.getByProjectAndControl(
        ids.projectId,
        ids.controlId,
      );
      const reviewDueDate = dueDateFromOffset(
        ctx.evaluation.event.metadata.occurredAt,
        config.offsetDays,
      );
      const fields = {
        owner: existing?.owner ?? "",
        coOwner: existing?.coOwner ?? "",
        businessUnit: existing?.businessUnit ?? "",
        implementationStatus: existing?.implementationStatus ?? "draft",
        reviewDueDate,
        evidenceRequirement:
          existing?.evidenceRequirement ?? DEFAULT_EVIDENCE_REQUIREMENT,
      };
      const result = await deps.controlRecordService.upsertWithActivity(
        ids.projectId,
        { controlId: ids.controlId, ...fields },
        SYSTEM_ACTOR,
      );
      if (result.changed) {
        await publishDomainEvent(
          result.created
            ? controlCreatedEvent({
                organizationId: ctx.evaluation.organizationId,
                actorId: null,
                projectId: ids.projectId,
                controlId: ids.controlId,
                controlRecordId: result.record.id,
              })
            : controlUpdatedEvent({
                organizationId: ctx.evaluation.organizationId,
                actorId: null,
                projectId: ids.projectId,
                controlId: ids.controlId,
                controlRecordId: result.record.id,
              }),
        );
      }
      return ok("set_due_date");
    },

    async change_status(ctx, config) {
      const ids = requireProjectControl(ctx, "change_status");
      if ("status" in ids) {
        return ids;
      }
      const existing = await deps.controlRecords.getByProjectAndControl(
        ids.projectId,
        ids.controlId,
      );
      const fields = {
        owner: existing?.owner ?? "",
        coOwner: existing?.coOwner ?? "",
        businessUnit: existing?.businessUnit ?? "",
        implementationStatus: config.implementationStatus,
        reviewDueDate: existing?.reviewDueDate ?? null,
        evidenceRequirement:
          existing?.evidenceRequirement ?? DEFAULT_EVIDENCE_REQUIREMENT,
      };
      const result = await deps.controlRecordService.upsertWithActivity(
        ids.projectId,
        { controlId: ids.controlId, ...fields },
        SYSTEM_ACTOR,
      );
      if (result.changed) {
        await publishDomainEvent(
          result.created
            ? controlCreatedEvent({
                organizationId: ctx.evaluation.organizationId,
                actorId: null,
                projectId: ids.projectId,
                controlId: ids.controlId,
                controlRecordId: result.record.id,
              })
            : controlUpdatedEvent({
                organizationId: ctx.evaluation.organizationId,
                actorId: null,
                projectId: ids.projectId,
                controlId: ids.controlId,
                controlRecordId: result.record.id,
              }),
        );
      }
      return ok("change_status");
    },
  };
}

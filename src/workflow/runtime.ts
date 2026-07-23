/**
 * Subscribe the Workflow Engine to the shared DomainEventBus (Milestone 02C WP5).
 *
 * Business services remain unaware of workflows; they only publish domain events.
 */

import "server-only";

import {
  defineDomainEventHandler,
  getSharedDomainEventRuntime,
  type DomainEvent,
  type DomainEventBus,
} from "@/domain/events";
import { createNotificationService } from "@/persistence/notification-service";
import type { AssignmentService } from "@/persistence/assignment-service";
import type { ControlRecordRepository } from "@/persistence/control-record-repository";
import type { ControlRecordService } from "@/persistence/control-record-service";
import type { NotificationService } from "@/persistence/notification-service";
import type { OrganizationRepository } from "@/persistence/postgres/organization-repository";
import type { ProjectRepository } from "@/persistence/repository";
import type { WorkflowRepository } from "@/persistence/workflow-repository";
import { getDb } from "@/persistence/postgres/client";
import { createPostgresAssignmentService } from "@/persistence/postgres/assignment-service";
import { createPostgresControlRecordRepository } from "@/persistence/postgres/control-record-repository";
import { createPostgresControlRecordService } from "@/persistence/postgres/control-record-service";
import { createPostgresNotificationRepository } from "@/persistence/postgres/notification-repository";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresProjectRepository } from "@/persistence/postgres/project-repository";
import { createPostgresWorkflowRepository } from "@/persistence/postgres/workflow-repository";
import { createWorkflowActionExecutors } from "./action-executors";
import { createWorkflowEngine } from "./engine";
import { buildWorkflowEvaluationContext } from "./evaluation-context";
import { isWorkflowCascadeSuppressed } from "./loop-guard";
import { createWorkflowRegistries } from "./registries";

export const WORKFLOW_ENGINE_HANDLER_ID = "workflow-engine";

export type WorkflowRuntimeDeps = {
  workflowRepo: WorkflowRepository;
  projects: ProjectRepository;
  controlRecords: ControlRecordRepository;
  controlRecordService: ControlRecordService;
  assignments: AssignmentService;
  notifications: NotificationService;
  organizations: OrganizationRepository;
};

let subscribedBus: DomainEventBus | null = null;

async function resolveWorkflowDeps(): Promise<WorkflowRuntimeDeps> {
  const db = await getDb();
  return {
    workflowRepo: createPostgresWorkflowRepository(db),
    projects: createPostgresProjectRepository(db),
    controlRecords: createPostgresControlRecordRepository(db),
    controlRecordService: createPostgresControlRecordService(db),
    assignments: createPostgresAssignmentService(db),
    notifications: createNotificationService(
      createPostgresNotificationRepository(db),
    ),
    organizations: createPostgresOrganizationRepository(db),
  };
}

/**
 * Evaluate matching workflow rules for a domain event and persist executions.
 * Used by the bus handler and by integration tests with injected dependencies.
 */
export async function processWorkflowDomainEvent(
  event: DomainEvent,
  deps: WorkflowRuntimeDeps,
): Promise<void> {
  if (isWorkflowCascadeSuppressed()) {
    return;
  }

  const registries = createWorkflowRegistries({
    actionExecutors: createWorkflowActionExecutors({
      notifications: deps.notifications,
      assignments: deps.assignments,
      controlRecords: deps.controlRecords,
      controlRecordService: deps.controlRecordService,
      organizations: deps.organizations,
    }),
  });

  const triggerType = registries.triggers.resolveTriggerType(event);
  if (!triggerType) {
    return;
  }

  const rules = await deps.workflowRepo.listEnabledRulesByTrigger(
    event.metadata.organizationId,
    triggerType,
  );
  if (rules.length === 0) {
    return;
  }

  const context = await buildWorkflowEvaluationContext(event, {
    projects: deps.projects,
    controlRecords: deps.controlRecords,
    assignments: deps.assignments,
  });

  const engine = createWorkflowEngine({
    registries,
    hasExecuted: (eventId, ruleId) =>
      deps.workflowRepo.hasExecution(eventId, ruleId),
    async markExecuted() {
      // Durable uniqueness is enforced when recording the execution row.
    },
  });

  const results = await engine.handleEvent(event, rules, context);
  const finishedAt = new Date().toISOString();

  for (const result of results) {
    if (result.status === "duplicate") {
      continue;
    }
    const startedMs = Date.parse(finishedAt) - result.durationMs;
    const startedAt = Number.isFinite(startedMs)
      ? new Date(startedMs).toISOString()
      : finishedAt;
    await deps.workflowRepo.recordExecution({
      organizationId: event.metadata.organizationId,
      workflowRuleId: result.ruleId,
      triggeringEventId: result.detail.triggeringEventId,
      triggeringEventType: result.detail.triggeringEventType,
      correlationId: result.detail.correlationId,
      projectId: result.detail.projectId,
      controlId: result.detail.controlId,
      status: result.status,
      conditionsMatched: result.detail.conditionsMatched,
      durationMs: result.durationMs,
      errorMessage: result.errorMessage,
      detail: result.detail,
      startedAt,
      finishedAt,
    });
  }
}

async function handleWorkflowDomainEvent(event: DomainEvent): Promise<void> {
  // Check cascade before resolving DB deps — action-published events must not
  // open connections (and must not re-enter rule evaluation).
  if (isWorkflowCascadeSuppressed()) {
    return;
  }
  await processWorkflowDomainEvent(event, await resolveWorkflowDeps());
}

/**
 * Ensure the workflow engine is subscribed to the given bus (defaults to shared).
 * Safe to call repeatedly; re-subscribes only when the bus instance changes.
 */
export function ensureWorkflowEngineSubscribed(
  bus: DomainEventBus = getSharedDomainEventRuntime().bus,
): void {
  if (subscribedBus === bus) {
    return;
  }
  if (subscribedBus) {
    subscribedBus.unsubscribe(WORKFLOW_ENGINE_HANDLER_ID);
  }

  const registries = createWorkflowRegistries();
  bus.subscribe(
    defineDomainEventHandler({
      handlerId: WORKFLOW_ENGINE_HANDLER_ID,
      eventTypes: registries.triggers.allEventTypes(),
      handle: handleWorkflowDomainEvent,
    }),
  );
  subscribedBus = bus;
}

/** Test helper: clear subscription tracking. */
export function resetWorkflowEngineSubscriptionForTests(): void {
  subscribedBus = null;
}

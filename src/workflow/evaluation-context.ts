/**
 * Build a workflow evaluation snapshot from a domain event and live data.
 */

import type { DomainEvent } from "@/domain/events";
import { FRAMEWORK_CONTROLS } from "@/data/framework";
import type { AssignmentService } from "@/persistence/assignment-service";
import type { ControlRecordRepository } from "@/persistence/control-record-repository";
import type { ProjectRepository } from "@/persistence/repository";
import type { WorkflowEvaluationContext } from "./types";

export type EvaluationContextDeps = {
  projects: ProjectRepository;
  controlRecords: ControlRecordRepository;
  assignments: AssignmentService;
};

function payloadString(
  payload: object,
  key: string,
): string | null {
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function extractProjectAndControlIds(event: DomainEvent): {
  projectId: string | null;
  controlId: string | null;
} {
  return {
    projectId: payloadString(event.payload, "projectId"),
    controlId: payloadString(event.payload, "controlId"),
  };
}

export async function buildWorkflowEvaluationContext(
  event: DomainEvent,
  deps: EvaluationContextDeps,
): Promise<WorkflowEvaluationContext> {
  const { projectId, controlId } = extractProjectAndControlIds(event);

  let frameworkId: string | null = null;
  let controlFamily: string | null = null;
  let implementationStatus: WorkflowEvaluationContext["implementationStatus"] =
    null;
  let activeAssignments: WorkflowEvaluationContext["activeAssignments"] = [];

  if (projectId) {
    const loaded = await deps.projects.load(projectId);
    if (loaded.ok && loaded.project.organizationId === event.metadata.organizationId) {
      frameworkId = loaded.project.frameworkId;
    }
  }

  if (controlId) {
    const control = FRAMEWORK_CONTROLS.find((c) => c.id === controlId);
    controlFamily = control?.family ?? null;
  }

  if (projectId && controlId) {
    const record = await deps.controlRecords.getByProjectAndControl(
      projectId,
      controlId,
    );
    if (record) {
      implementationStatus = record.implementationStatus;
    }

    const assignments = await deps.assignments.listByControl(
      event.metadata.organizationId,
      projectId,
      controlId,
    );
    activeAssignments = assignments
      .filter((a) => a.completedAt == null)
      .map((a) => ({
        assigneeUserId: a.assigneeUserId,
        assignmentRole: a.assignmentRole,
      }));
  }

  return {
    organizationId: event.metadata.organizationId,
    event,
    projectId,
    controlId,
    frameworkId,
    controlFamily,
    implementationStatus,
    activeAssignments,
  };
}

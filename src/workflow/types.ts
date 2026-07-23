/**
 * Workflow automation domain types (Milestone 02C).
 *
 * Strongly typed models for the engine. Persistence may store conditions/actions
 * and execution details as validated JSON; the engine never works on opaque blobs.
 */

import type { AssignmentRole } from "@/data/collaboration";
import type { ControlImplementationStatus } from "@/data/control-record";
import type { OrgRole } from "@/authz/permissions";
import type { DomainEvent } from "@/domain/events";

/** Trigger catalog — maps to domain event types via the trigger registry. */
export const WORKFLOW_TRIGGER_TYPES = [
  "control_created",
  "control_updated",
  "control_assigned",
  "assignment_completed",
  "discussion_created",
  "discussion_resolved",
] as const;

export type WorkflowTriggerType = (typeof WORKFLOW_TRIGGER_TYPES)[number];

export function isWorkflowTriggerType(
  value: unknown,
): value is WorkflowTriggerType {
  return (
    typeof value === "string" &&
    (WORKFLOW_TRIGGER_TYPES as readonly string[]).includes(value)
  );
}

/** Condition catalog (some types are registered but unavailable until data model exists). */
export const WORKFLOW_CONDITION_TYPES = [
  "control_status",
  "control_category",
  "framework",
  "assigned_user",
  "assigned_role",
  "severity",
  "priority",
] as const;

export type WorkflowConditionType = (typeof WORKFLOW_CONDITION_TYPES)[number];

/** Action catalog (tag actions are unavailable until tags exist on ControlRecord). */
export const WORKFLOW_ACTION_TYPES = [
  "notify_user",
  "notify_role",
  "assign_user",
  "assign_role",
  "add_tag",
  "remove_tag",
  "set_due_date",
  "change_status",
] as const;

export type WorkflowActionType = (typeof WORKFLOW_ACTION_TYPES)[number];

export type WorkflowCondition =
  | { type: "control_status"; op: "eq"; value: ControlImplementationStatus }
  | { type: "control_category"; op: "eq"; value: string }
  | { type: "framework"; op: "eq"; value: string }
  | { type: "assigned_user"; op: "eq"; value: string }
  | { type: "assigned_role"; op: "eq"; value: AssignmentRole }
  | { type: "severity"; op: "eq"; value: string }
  | { type: "priority"; op: "eq"; value: string };

export type WorkflowAction =
  | { type: "notify_user"; userId: string; summary?: string }
  | { type: "notify_role"; orgRole: OrgRole; summary?: string }
  | { type: "assign_user"; userId: string; assignmentRole: AssignmentRole }
  | { type: "assign_role"; orgRole: OrgRole; assignmentRole: AssignmentRole }
  | { type: "add_tag"; tag: string }
  | { type: "remove_tag"; tag: string }
  | { type: "set_due_date"; offsetDays: number }
  | {
      type: "change_status";
      implementationStatus: ControlImplementationStatus;
    };

/**
 * In-memory rule definition used by the engine.
 * Persistence maps onto this shape after JSON validation (WP2).
 */
export type WorkflowRule = {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly description: string | null;
  readonly enabled: boolean;
  readonly triggerType: WorkflowTriggerType;
  readonly conditions: readonly WorkflowCondition[];
  readonly actions: readonly WorkflowAction[];
};

/** Active assignment snapshot for condition evaluation. */
export type WorkflowAssignmentSnapshot = {
  readonly assigneeUserId: string;
  readonly assignmentRole: AssignmentRole;
};

/**
 * Fresh evaluation snapshot loaded at handle time (not from event payload).
 * Priority, severity, and tags are intentionally absent until a future model.
 */
export type WorkflowEvaluationContext = {
  readonly organizationId: string;
  readonly event: DomainEvent;
  readonly projectId: string | null;
  readonly controlId: string | null;
  readonly frameworkId: string | null;
  readonly controlFamily: string | null;
  readonly implementationStatus: ControlImplementationStatus | null;
  readonly activeAssignments: readonly WorkflowAssignmentSnapshot[];
};

export type ConditionEvaluationStatus =
  | "matched"
  | "not_matched"
  | "unavailable"
  | "error";

export type ConditionEvaluationResult = {
  readonly type: WorkflowConditionType;
  readonly status: ConditionEvaluationStatus;
  readonly matched: boolean;
  readonly errorMessage: string | null;
};

export type ActionExecutionStatus =
  | "executed"
  | "failed"
  | "unavailable"
  | "skipped";

export type ActionExecutionResult = {
  readonly type: WorkflowActionType;
  readonly status: ActionExecutionStatus;
  readonly errorMessage: string | null;
};

export type WorkflowRunStatus =
  | "succeeded"
  | "failed"
  | "skipped"
  | "duplicate";

/**
 * Practical diagnostics payload for one rule evaluation against one event.
 * Persisted as structured JSON on workflow_executions (WP2).
 */
export type WorkflowExecutionDetail = {
  readonly triggeringEventId: string;
  readonly triggeringEventType: string;
  readonly correlationId: string;
  readonly projectId: string | null;
  readonly controlId: string | null;
  readonly conditionsMatched: boolean;
  readonly conditionResults: readonly ConditionEvaluationResult[];
  readonly actionResults: readonly ActionExecutionResult[];
};

export type WorkflowRuleRunResult = {
  readonly ruleId: string;
  readonly ruleName: string;
  readonly status: WorkflowRunStatus;
  readonly durationMs: number;
  readonly errorMessage: string | null;
  readonly detail: WorkflowExecutionDetail;
};

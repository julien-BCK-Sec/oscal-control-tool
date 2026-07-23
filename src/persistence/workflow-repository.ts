import type {
  WorkflowAction,
  WorkflowCondition,
  WorkflowExecutionDetail,
  WorkflowRule,
  WorkflowRunStatus,
  WorkflowTriggerType,
} from "@/workflow/types";
import type {
  CreateWorkflowRuleInput,
  UpdateWorkflowRuleInput,
} from "@/workflow/validation";

/**
 * Durable workflow execution row (practical diagnostics; structured detail JSON).
 */
export type WorkflowExecution = {
  readonly id: string;
  readonly organizationId: string;
  readonly workflowRuleId: string;
  readonly triggeringEventId: string;
  readonly triggeringEventType: string;
  readonly correlationId: string;
  readonly projectId: string | null;
  readonly controlId: string | null;
  readonly status: WorkflowRunStatus;
  readonly conditionsMatched: boolean;
  readonly durationMs: number;
  readonly errorMessage: string | null;
  readonly detail: WorkflowExecutionDetail;
  readonly startedAt: string;
  readonly finishedAt: string;
};

export type RecordWorkflowExecutionInput = {
  organizationId: string;
  workflowRuleId: string;
  triggeringEventId: string;
  triggeringEventType: string;
  correlationId: string;
  projectId: string | null;
  controlId: string | null;
  status: WorkflowRunStatus;
  conditionsMatched: boolean;
  durationMs: number;
  errorMessage: string | null;
  detail: WorkflowExecutionDetail;
  startedAt: string;
  finishedAt: string;
};

export type ListWorkflowExecutionsOptions = {
  workflowRuleId?: string;
  limit?: number;
};

/**
 * Application-facing workflow persistence (no Drizzle types).
 */
export interface WorkflowRepository {
  listRules(organizationId: string): Promise<WorkflowRule[]>;
  listEnabledRulesByTrigger(
    organizationId: string,
    triggerType: WorkflowTriggerType,
  ): Promise<WorkflowRule[]>;
  getRule(
    organizationId: string,
    ruleId: string,
  ): Promise<WorkflowRule | null>;
  createRule(input: CreateWorkflowRuleInput): Promise<WorkflowRule>;
  updateRule(
    organizationId: string,
    ruleId: string,
    input: UpdateWorkflowRuleInput,
  ): Promise<WorkflowRule | null>;
  setEnabled(
    organizationId: string,
    ruleId: string,
    enabled: boolean,
  ): Promise<WorkflowRule | null>;
  deleteRule(organizationId: string, ruleId: string): Promise<boolean>;

  /**
   * Insert an execution. Returns null when the (eventId, ruleId) unique
   * constraint already exists (duplicate protection).
   */
  recordExecution(
    input: RecordWorkflowExecutionInput,
  ): Promise<WorkflowExecution | null>;
  hasExecution(eventId: string, ruleId: string): Promise<boolean>;
  listExecutions(
    organizationId: string,
    options?: ListWorkflowExecutionsOptions,
  ): Promise<WorkflowExecution[]>;
  getExecution(
    organizationId: string,
    executionId: string,
  ): Promise<WorkflowExecution | null>;
}

/** Re-export rule shape helpers for callers that map DTOs. */
export type {
  WorkflowRule,
  WorkflowCondition,
  WorkflowAction,
  WorkflowTriggerType,
};

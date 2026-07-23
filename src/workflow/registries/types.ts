/**
 * Pluggable workflow registry contracts (Milestone 02C).
 *
 * Favor registration and composition over switch statements in the engine.
 */

import type { DomainEvent } from "@/domain/events";
import type {
  ActionExecutionResult,
  WorkflowAction,
  WorkflowActionType,
  WorkflowCondition,
  WorkflowConditionType,
  WorkflowEvaluationContext,
  ConditionEvaluationResult,
  WorkflowTriggerType,
} from "../types";

export type WorkflowTriggerDefinition = {
  readonly type: WorkflowTriggerType;
  readonly label: string;
  /** Domain event types that activate this trigger. */
  readonly eventTypes: readonly string[];
};

export type WorkflowConditionDefinition<
  C extends WorkflowCondition = WorkflowCondition,
> = {
  readonly type: C["type"];
  readonly label: string;
  readonly available: boolean;
  readonly unavailableReason?: string;
  evaluate(
    ctx: WorkflowEvaluationContext,
    config: C,
  ): ConditionEvaluationResult | Promise<ConditionEvaluationResult>;
};

export type WorkflowActionContext = {
  readonly evaluation: WorkflowEvaluationContext;
  readonly ruleId: string;
  readonly ruleName: string;
};

export type WorkflowActionDefinition<
  A extends WorkflowAction = WorkflowAction,
> = {
  readonly type: A["type"];
  readonly label: string;
  readonly available: boolean;
  readonly unavailableReason?: string;
  execute(
    ctx: WorkflowActionContext,
    config: A,
  ): Promise<ActionExecutionResult>;
};

export interface WorkflowTriggerRegistry {
  register(definition: WorkflowTriggerDefinition): void;
  get(type: WorkflowTriggerType): WorkflowTriggerDefinition | undefined;
  list(): readonly WorkflowTriggerDefinition[];
  /** Resolve trigger type for a domain event, if any. */
  resolveTriggerType(event: DomainEvent): WorkflowTriggerType | null;
  /** All domain event types covered by registered triggers. */
  allEventTypes(): readonly string[];
}

export interface WorkflowConditionRegistry {
  register<C extends WorkflowCondition>(
    definition: WorkflowConditionDefinition<C>,
  ): void;
  get(
    type: WorkflowConditionType,
  ): WorkflowConditionDefinition | undefined;
  list(): readonly WorkflowConditionDefinition[];
  evaluate(
    ctx: WorkflowEvaluationContext,
    condition: WorkflowCondition,
  ): Promise<ConditionEvaluationResult>;
}

export interface WorkflowActionRegistry {
  register<A extends WorkflowAction>(
    definition: WorkflowActionDefinition<A>,
  ): void;
  get(type: WorkflowActionType): WorkflowActionDefinition | undefined;
  list(): readonly WorkflowActionDefinition[];
  execute(
    ctx: WorkflowActionContext,
    action: WorkflowAction,
  ): Promise<ActionExecutionResult>;
}

export type WorkflowRegistries = {
  triggers: WorkflowTriggerRegistry;
  conditions: WorkflowConditionRegistry;
  actions: WorkflowActionRegistry;
};

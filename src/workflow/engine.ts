/**
 * Workflow engine core (Milestone 02C WP1).
 *
 * Evaluates enabled rules for a domain event using pluggable registries.
 * Does not load rules from the database (WP2) or subscribe to the bus (WP5).
 */

import type { DomainEvent } from "@/domain/events";
import {
  isWorkflowCascadeSuppressed,
  runWithWorkflowCascadeGuard,
} from "./loop-guard";
import type { WorkflowRegistries } from "./registries";
import type {
  ActionExecutionResult,
  ConditionEvaluationResult,
  WorkflowEvaluationContext,
  WorkflowExecutionDetail,
  WorkflowRule,
  WorkflowRuleRunResult,
  WorkflowRunStatus,
} from "./types";

export type WorkflowEngineOptions = {
  registries: WorkflowRegistries;
  /**
   * Optional hook when a (eventId, ruleId) pair was already processed.
   * WP5 can use a durable unique constraint; WP1 uses an in-memory set.
   */
  hasExecuted?: (eventId: string, ruleId: string) => boolean | Promise<boolean>;
  markExecuted?: (
    eventId: string,
    ruleId: string,
  ) => void | Promise<void>;
};

export type WorkflowEngine = {
  /** Domain event types the engine cares about (for bus subscription). */
  subscribedEventTypes(): readonly string[];
  /**
   * Evaluate matching enabled rules for an event.
   * Returns immediately (no rule runs) when cascade suppression is active.
   */
  handleEvent(
    event: DomainEvent,
    rules: readonly WorkflowRule[],
    context: WorkflowEvaluationContext,
  ): Promise<readonly WorkflowRuleRunResult[]>;
};

function nowMs(): number {
  return Date.now();
}

export function createWorkflowEngine(
  options: WorkflowEngineOptions,
): WorkflowEngine {
  const { registries } = options;
  const localExecuted = new Set<string>();

  async function alreadyExecuted(
    eventId: string,
    ruleId: string,
  ): Promise<boolean> {
    const key = `${eventId}:${ruleId}`;
    if (options.hasExecuted) {
      return options.hasExecuted(eventId, ruleId);
    }
    return localExecuted.has(key);
  }

  async function rememberExecuted(
    eventId: string,
    ruleId: string,
  ): Promise<void> {
    const key = `${eventId}:${ruleId}`;
    if (options.markExecuted) {
      await options.markExecuted(eventId, ruleId);
      return;
    }
    localExecuted.add(key);
  }

  async function evaluateConditions(
    context: WorkflowEvaluationContext,
    rule: WorkflowRule,
  ): Promise<{
    matched: boolean;
    results: ConditionEvaluationResult[];
  }> {
    const results: ConditionEvaluationResult[] = [];
    for (const condition of rule.conditions) {
      const evaluation = await registries.conditions.evaluate(
        context,
        condition,
      );
      results.push(evaluation);
      if (
        evaluation.status === "unavailable" ||
        evaluation.status === "error" ||
        !evaluation.matched
      ) {
        return { matched: false, results };
      }
    }
    return { matched: true, results };
  }

  async function executeActions(
    context: WorkflowEvaluationContext,
    rule: WorkflowRule,
  ): Promise<ActionExecutionResult[]> {
    const results: ActionExecutionResult[] = [];
    await runWithWorkflowCascadeGuard(async () => {
      for (const action of rule.actions) {
        const result = await registries.actions.execute(
          {
            evaluation: context,
            ruleId: rule.id,
            ruleName: rule.name,
          },
          action,
        );
        results.push(result);
        if (
          result.status === "failed" ||
          result.status === "unavailable"
        ) {
          // Stop remaining actions for this rule; other rules still run.
          break;
        }
      }
    });
    return results;
  }

  async function runRule(
    event: DomainEvent,
    rule: WorkflowRule,
    context: WorkflowEvaluationContext,
  ): Promise<WorkflowRuleRunResult> {
    const started = nowMs();
    const baseDetail = (): Omit<
      WorkflowExecutionDetail,
      "conditionsMatched" | "conditionResults" | "actionResults"
    > => ({
      triggeringEventId: event.metadata.id,
      triggeringEventType: event.eventType,
      correlationId: event.metadata.correlationId,
      projectId: context.projectId,
      controlId: context.controlId,
    });

    if (await alreadyExecuted(event.metadata.id, rule.id)) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        status: "duplicate",
        durationMs: nowMs() - started,
        errorMessage: "Rule already executed for this event.",
        detail: {
          ...baseDetail(),
          conditionsMatched: false,
          conditionResults: [],
          actionResults: [],
        },
      };
    }

    await rememberExecuted(event.metadata.id, rule.id);

    try {
      const { matched, results: conditionResults } = await evaluateConditions(
        context,
        rule,
      );

      if (!matched) {
        const unavailableOrError = conditionResults.find(
          (r) => r.status === "unavailable" || r.status === "error",
        );
        const status: WorkflowRunStatus = unavailableOrError
          ? "failed"
          : "skipped";
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          status,
          durationMs: nowMs() - started,
          errorMessage: unavailableOrError?.errorMessage ?? null,
          detail: {
            ...baseDetail(),
            conditionsMatched: false,
            conditionResults,
            actionResults: [],
          },
        };
      }

      if (rule.actions.length === 0) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          status: "succeeded",
          durationMs: nowMs() - started,
          errorMessage: null,
          detail: {
            ...baseDetail(),
            conditionsMatched: true,
            conditionResults,
            actionResults: [],
          },
        };
      }

      const actionResults = await executeActions(context, rule);
      const failed = actionResults.find(
        (r) => r.status === "failed" || r.status === "unavailable",
      );
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        status: failed ? "failed" : "succeeded",
        durationMs: nowMs() - started,
        errorMessage: failed?.errorMessage ?? null,
        detail: {
          ...baseDetail(),
          conditionsMatched: true,
          conditionResults,
          actionResults,
        },
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Workflow rule evaluation failed.";
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        status: "failed",
        durationMs: nowMs() - started,
        errorMessage: message,
        detail: {
          ...baseDetail(),
          conditionsMatched: false,
          conditionResults: [],
          actionResults: [],
        },
      };
    }
  }

  return {
    subscribedEventTypes() {
      return registries.triggers.allEventTypes();
    },

    async handleEvent(event, rules, context) {
      if (isWorkflowCascadeSuppressed()) {
        return [];
      }

      if (context.organizationId !== event.metadata.organizationId) {
        throw new Error(
          "Workflow evaluation context organizationId must match the event.",
        );
      }

      const triggerType = registries.triggers.resolveTriggerType(event);
      if (!triggerType) {
        return [];
      }

      const matching = rules.filter(
        (rule) =>
          rule.enabled &&
          rule.organizationId === event.metadata.organizationId &&
          rule.triggerType === triggerType,
      );

      const results: WorkflowRuleRunResult[] = [];
      for (const rule of matching) {
        results.push(await runRule(event, rule, context));
      }
      return results;
    },
  };
}

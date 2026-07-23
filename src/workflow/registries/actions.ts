import type {
  ActionExecutionResult,
  WorkflowAction,
  WorkflowActionType,
} from "../types";
import type {
  WorkflowActionContext,
  WorkflowActionDefinition,
  WorkflowActionRegistry,
} from "./types";

const TAGS_UNAVAILABLE =
  "Tags are not stored on ControlRecord yet; this action is a future extension point.";

function actionResult(
  type: WorkflowActionType,
  status: ActionExecutionResult["status"],
  errorMessage: string | null = null,
): ActionExecutionResult {
  return { type, status, errorMessage };
}

/**
 * Default action definitions.
 *
 * Available actions use injectable executors when provided; otherwise they
 * return a successful stub result so the engine can be unit-tested without
 * persistence (real side effects are wired in WP5).
 */
export type ActionExecutorMap = {
  [K in WorkflowAction as K["type"]]?: (
    ctx: WorkflowActionContext,
    config: Extract<WorkflowAction, { type: K["type"] }>,
  ) => Promise<ActionExecutionResult>;
};

export function createDefaultActionDefinitions(
  executors: ActionExecutorMap = {},
): WorkflowActionDefinition[] {
  function availableAction<A extends WorkflowAction>(
    type: A["type"],
    label: string,
  ): WorkflowActionDefinition<A> {
    return {
      type,
      label,
      available: true,
      async execute(ctx, config) {
        const executor = executors[type] as
          | ((
              c: WorkflowActionContext,
              cfg: A,
            ) => Promise<ActionExecutionResult>)
          | undefined;
        if (executor) {
          return executor(ctx, config as A);
        }
        return actionResult(type, "executed");
      },
    };
  }

  const addTag: WorkflowActionDefinition<
    Extract<WorkflowAction, { type: "add_tag" }>
  > = {
    type: "add_tag",
    label: "Add tag",
    available: false,
    unavailableReason: TAGS_UNAVAILABLE,
    async execute() {
      return actionResult("add_tag", "unavailable", TAGS_UNAVAILABLE);
    },
  };

  const removeTag: WorkflowActionDefinition<
    Extract<WorkflowAction, { type: "remove_tag" }>
  > = {
    type: "remove_tag",
    label: "Remove tag",
    available: false,
    unavailableReason: TAGS_UNAVAILABLE,
    async execute() {
      return actionResult("remove_tag", "unavailable", TAGS_UNAVAILABLE);
    },
  };

  return [
    availableAction("notify_user", "Notify user"),
    availableAction("notify_role", "Notify role"),
    availableAction("assign_user", "Assign user"),
    availableAction("assign_role", "Assign role"),
    addTag,
    removeTag,
    availableAction("set_due_date", "Set due date"),
    availableAction("change_status", "Change status"),
  ];
}

export function createWorkflowActionRegistry(
  initial: readonly WorkflowActionDefinition[] = createDefaultActionDefinitions(),
): WorkflowActionRegistry {
  const byType = new Map<WorkflowActionType, WorkflowActionDefinition>();

  for (const definition of initial) {
    byType.set(definition.type, definition as WorkflowActionDefinition);
  }

  return {
    register(definition) {
      byType.set(definition.type, definition as WorkflowActionDefinition);
    },
    get(type) {
      return byType.get(type);
    },
    list() {
      return [...byType.values()];
    },
    async execute(ctx, action) {
      const definition = byType.get(action.type);
      if (!definition) {
        return actionResult(
          action.type,
          "failed",
          `No action handler registered for "${action.type}".`,
        );
      }
      if (!definition.available) {
        return actionResult(
          action.type,
          "unavailable",
          definition.unavailableReason ??
            `Action "${action.type}" is unavailable.`,
        );
      }
      try {
        return await definition.execute(ctx, action as never);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Action execution failed.";
        return actionResult(action.type, "failed", message);
      }
    },
  };
}

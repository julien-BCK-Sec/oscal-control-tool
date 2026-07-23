import { createDefaultActionDefinitions } from "./actions";
import { createDefaultConditionDefinitions } from "./conditions";
import { createWorkflowActionRegistry } from "./actions";
import { createWorkflowConditionRegistry } from "./conditions";
import { createWorkflowTriggerRegistry } from "./triggers";
import type { ActionExecutorMap } from "./actions";
import type { WorkflowRegistries } from "./types";

export type CreateWorkflowRegistriesOptions = {
  /** Optional real or test action side-effect implementations. */
  actionExecutors?: ActionExecutorMap;
};

/** Build the default trigger / condition / action registries. */
export function createWorkflowRegistries(
  options: CreateWorkflowRegistriesOptions = {},
): WorkflowRegistries {
  return {
    triggers: createWorkflowTriggerRegistry(),
    conditions: createWorkflowConditionRegistry(
      createDefaultConditionDefinitions(),
    ),
    actions: createWorkflowActionRegistry(
      createDefaultActionDefinitions(options.actionExecutors ?? {}),
    ),
  };
}

export {
  createWorkflowTriggerRegistry,
  createWorkflowConditionRegistry,
  createWorkflowActionRegistry,
  createDefaultConditionDefinitions,
  createDefaultActionDefinitions,
};
export type { ActionExecutorMap, WorkflowRegistries };
export type {
  WorkflowTriggerDefinition,
  WorkflowConditionDefinition,
  WorkflowActionDefinition,
  WorkflowTriggerRegistry,
  WorkflowConditionRegistry,
  WorkflowActionRegistry,
  WorkflowActionContext,
} from "./types";

import type { DomainEvent } from "@/domain/events";
import type { WorkflowTriggerType } from "../types";
import { WORKFLOW_TRIGGER_TYPES } from "../types";
import type {
  WorkflowTriggerDefinition,
  WorkflowTriggerRegistry,
} from "./types";

const DEFAULT_TRIGGERS: readonly WorkflowTriggerDefinition[] = [
  {
    type: "control_created",
    label: "Control created",
    eventTypes: ["ControlCreated"],
  },
  {
    type: "control_updated",
    label: "Control updated",
    eventTypes: ["ControlUpdated"],
  },
  {
    type: "control_assigned",
    label: "Control assigned",
    eventTypes: ["ControlAssigned"],
  },
  {
    type: "assignment_completed",
    label: "Assignment completed",
    eventTypes: ["AssignmentCompleted"],
  },
  {
    type: "discussion_created",
    label: "Discussion created",
    eventTypes: ["DiscussionCreated"],
  },
  {
    type: "discussion_resolved",
    label: "Discussion resolved",
    eventTypes: ["DiscussionResolved"],
  },
];

export function createWorkflowTriggerRegistry(
  initial: readonly WorkflowTriggerDefinition[] = DEFAULT_TRIGGERS,
): WorkflowTriggerRegistry {
  const byType = new Map<WorkflowTriggerType, WorkflowTriggerDefinition>();
  const eventToTrigger = new Map<string, WorkflowTriggerType>();

  function index(definition: WorkflowTriggerDefinition): void {
    byType.set(definition.type, definition);
    for (const eventType of definition.eventTypes) {
      const existing = eventToTrigger.get(eventType);
      if (existing && existing !== definition.type) {
        throw new Error(
          `Domain event "${eventType}" already mapped to trigger "${existing}".`,
        );
      }
      eventToTrigger.set(eventType, definition.type);
    }
  }

  for (const definition of initial) {
    index(definition);
  }

  return {
    register(definition) {
      index(definition);
    },
    get(type) {
      return byType.get(type);
    },
    list() {
      return WORKFLOW_TRIGGER_TYPES.map((type) => byType.get(type)).filter(
        (d): d is WorkflowTriggerDefinition => d !== undefined,
      );
    },
    resolveTriggerType(event: DomainEvent) {
      return eventToTrigger.get(event.eventType) ?? null;
    },
    allEventTypes() {
      return Object.freeze([...eventToTrigger.keys()]);
    },
  };
}

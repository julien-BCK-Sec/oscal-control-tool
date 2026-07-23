import type { ControlImplementationStatus } from "@/data/control-record";
import { ASSIGNMENT_ROLES } from "@/data/collaboration";
import type {
  ConditionEvaluationResult,
  WorkflowCondition,
  WorkflowConditionType,
} from "../types";
import type {
  WorkflowConditionDefinition,
  WorkflowConditionRegistry,
} from "./types";

const IMPLEMENTATION_STATUSES: readonly ControlImplementationStatus[] = [
  "draft",
  "in_review",
  "approved",
  "implemented",
  "deprecated",
];

function result(
  type: WorkflowConditionType,
  status: ConditionEvaluationResult["status"],
  matched: boolean,
  errorMessage: string | null = null,
): ConditionEvaluationResult {
  return { type, status, matched, errorMessage };
}

function unavailable(
  type: WorkflowConditionType,
  reason: string,
): ConditionEvaluationResult {
  return result(type, "unavailable", false, reason);
}

function eqString(
  type: WorkflowConditionType,
  actual: string | null | undefined,
  expected: string,
): ConditionEvaluationResult {
  if (actual == null || actual === "") {
    return result(type, "not_matched", false);
  }
  const matched = actual === expected;
  return result(type, matched ? "matched" : "not_matched", matched);
}

const SEVERITY_UNAVAILABLE =
  "Severity is not stored on ControlRecord yet; this condition is a future extension point.";
const PRIORITY_UNAVAILABLE =
  "Priority is not stored on ControlRecord yet; this condition is a future extension point.";

export function createDefaultConditionDefinitions(): WorkflowConditionDefinition[] {
  const controlStatus: WorkflowConditionDefinition<
    Extract<WorkflowCondition, { type: "control_status" }>
  > = {
    type: "control_status",
    label: "Control status",
    available: true,
    evaluate(ctx, config) {
      if (
        !(IMPLEMENTATION_STATUSES as readonly string[]).includes(config.value)
      ) {
        return result(
          "control_status",
          "error",
          false,
          `Unknown implementation status: ${config.value}`,
        );
      }
      return eqString(
        "control_status",
        ctx.implementationStatus,
        config.value,
      );
    },
  };

  const controlCategory: WorkflowConditionDefinition<
    Extract<WorkflowCondition, { type: "control_category" }>
  > = {
    type: "control_category",
    label: "Control category",
    available: true,
    evaluate(ctx, config) {
      const expected = config.value.trim();
      if (!expected) {
        return result(
          "control_category",
          "error",
          false,
          "Control category value is required.",
        );
      }
      return eqString("control_category", ctx.controlFamily, expected);
    },
  };

  const framework: WorkflowConditionDefinition<
    Extract<WorkflowCondition, { type: "framework" }>
  > = {
    type: "framework",
    label: "Framework",
    available: true,
    evaluate(ctx, config) {
      const expected = config.value.trim();
      if (!expected) {
        return result(
          "framework",
          "error",
          false,
          "Framework value is required.",
        );
      }
      return eqString("framework", ctx.frameworkId, expected);
    },
  };

  const assignedUser: WorkflowConditionDefinition<
    Extract<WorkflowCondition, { type: "assigned_user" }>
  > = {
    type: "assigned_user",
    label: "Assigned user",
    available: true,
    evaluate(ctx, config) {
      const expected = config.value.trim();
      if (!expected) {
        return result(
          "assigned_user",
          "error",
          false,
          "Assigned user id is required.",
        );
      }
      const matched = ctx.activeAssignments.some(
        (a) => a.assigneeUserId === expected,
      );
      return result(
        "assigned_user",
        matched ? "matched" : "not_matched",
        matched,
      );
    },
  };

  const assignedRole: WorkflowConditionDefinition<
    Extract<WorkflowCondition, { type: "assigned_role" }>
  > = {
    type: "assigned_role",
    label: "Assigned role",
    available: true,
    evaluate(ctx, config) {
      if (
        !(ASSIGNMENT_ROLES as readonly string[]).includes(config.value)
      ) {
        return result(
          "assigned_role",
          "error",
          false,
          `Unknown assignment role: ${config.value}`,
        );
      }
      const matched = ctx.activeAssignments.some(
        (a) => a.assignmentRole === config.value,
      );
      return result(
        "assigned_role",
        matched ? "matched" : "not_matched",
        matched,
      );
    },
  };

  const severity: WorkflowConditionDefinition<
    Extract<WorkflowCondition, { type: "severity" }>
  > = {
    type: "severity",
    label: "Severity",
    available: false,
    unavailableReason: SEVERITY_UNAVAILABLE,
    evaluate() {
      return unavailable("severity", SEVERITY_UNAVAILABLE);
    },
  };

  const priority: WorkflowConditionDefinition<
    Extract<WorkflowCondition, { type: "priority" }>
  > = {
    type: "priority",
    label: "Priority",
    available: false,
    unavailableReason: PRIORITY_UNAVAILABLE,
    evaluate() {
      return unavailable("priority", PRIORITY_UNAVAILABLE);
    },
  };

  return [
    controlStatus,
    controlCategory,
    framework,
    assignedUser,
    assignedRole,
    severity,
    priority,
  ];
}

export function createWorkflowConditionRegistry(
  initial: readonly WorkflowConditionDefinition[] = createDefaultConditionDefinitions(),
): WorkflowConditionRegistry {
  const byType = new Map<
    WorkflowConditionType,
    WorkflowConditionDefinition
  >();

  for (const definition of initial) {
    byType.set(definition.type, definition as WorkflowConditionDefinition);
  }

  return {
    register(definition) {
      byType.set(
        definition.type,
        definition as WorkflowConditionDefinition,
      );
    },
    get(type) {
      return byType.get(type);
    },
    list() {
      return [...byType.values()];
    },
    async evaluate(ctx, condition) {
      const definition = byType.get(condition.type);
      if (!definition) {
        return result(
          condition.type,
          "error",
          false,
          `No condition handler registered for "${condition.type}".`,
        );
      }
      if (!definition.available) {
        return unavailable(
          condition.type,
          definition.unavailableReason ??
            `Condition "${condition.type}" is unavailable.`,
        );
      }
      try {
        return await definition.evaluate(
          ctx,
          condition as never,
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Condition evaluation failed.";
        return result(condition.type, "error", false, message);
      }
    },
  };
}

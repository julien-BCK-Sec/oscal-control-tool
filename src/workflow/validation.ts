/**
 * Validate workflow rule condition/action JSON into strongly typed models.
 * Rejects unavailable catalog entries at write time (extension points only).
 */

import { ORG_ROLES, type OrgRole } from "@/authz/permissions";
import {
  ASSIGNMENT_ROLES,
  type AssignmentRole,
  isAssignmentRole,
} from "@/data/collaboration";
import {
  isControlImplementationStatus,
  type ControlImplementationStatus,
} from "@/data/control-record";
import {
  WORKFLOW_ACTION_TYPES,
  WORKFLOW_CONDITION_TYPES,
  isWorkflowTriggerType,
  type WorkflowAction,
  type WorkflowCondition,
  type WorkflowTriggerType,
} from "./types";
import {
  createDefaultActionDefinitions,
  createDefaultConditionDefinitions,
} from "./registries";

export class WorkflowValidationError extends Error {
  readonly code = "workflow_validation_error" as const;

  constructor(message: string) {
    super(message);
    this.name = "WorkflowValidationError";
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new WorkflowValidationError(`${label} is required.`);
  }
  return value.trim();
}

function isOrgRole(value: unknown): value is OrgRole {
  return typeof value === "string" && (ORG_ROLES as readonly string[]).includes(value);
}

const conditionAvailability = new Map(
  createDefaultConditionDefinitions().map((d) => [
    d.type,
    { available: d.available, reason: d.unavailableReason },
  ]),
);

const actionAvailability = new Map(
  createDefaultActionDefinitions().map((d) => [
    d.type,
    { available: d.available, reason: d.unavailableReason },
  ]),
);

export function parseWorkflowTriggerType(value: unknown): WorkflowTriggerType {
  if (!isWorkflowTriggerType(value)) {
    throw new WorkflowValidationError(
      `Unknown workflow trigger type: ${String(value)}`,
    );
  }
  return value;
}

export function parseWorkflowCondition(raw: unknown): WorkflowCondition {
  if (!isPlainObject(raw) || typeof raw.type !== "string") {
    throw new WorkflowValidationError("Each condition must be an object with a type.");
  }

  const type = raw.type;
  if (!(WORKFLOW_CONDITION_TYPES as readonly string[]).includes(type)) {
    throw new WorkflowValidationError(`Unknown condition type: ${type}`);
  }

  const availability = conditionAvailability.get(
    type as WorkflowCondition["type"],
  );
  if (availability && !availability.available) {
    throw new WorkflowValidationError(
      availability.reason ??
        `Condition "${type}" is not available in this milestone.`,
    );
  }

  if (raw.op !== "eq") {
    throw new WorkflowValidationError(
      `Condition "${type}" only supports op "eq".`,
    );
  }

  switch (type) {
    case "control_status": {
      if (!isControlImplementationStatus(raw.value)) {
        throw new WorkflowValidationError(
          "control_status.value must be a valid implementation status.",
        );
      }
      return {
        type: "control_status",
        op: "eq",
        value: raw.value as ControlImplementationStatus,
      };
    }
    case "control_category":
      return {
        type: "control_category",
        op: "eq",
        value: requireNonEmptyString(raw.value, "control_category.value"),
      };
    case "framework":
      return {
        type: "framework",
        op: "eq",
        value: requireNonEmptyString(raw.value, "framework.value"),
      };
    case "assigned_user":
      return {
        type: "assigned_user",
        op: "eq",
        value: requireNonEmptyString(raw.value, "assigned_user.value"),
      };
    case "assigned_role": {
      if (!isAssignmentRole(raw.value)) {
        throw new WorkflowValidationError(
          `assigned_role.value must be one of: ${ASSIGNMENT_ROLES.join(", ")}`,
        );
      }
      return {
        type: "assigned_role",
        op: "eq",
        value: raw.value as AssignmentRole,
      };
    }
    case "severity":
    case "priority":
      throw new WorkflowValidationError(
        `Condition "${type}" is not available in this milestone.`,
      );
    default:
      throw new WorkflowValidationError(`Unhandled condition type: ${type}`);
  }
}

export function parseWorkflowAction(raw: unknown): WorkflowAction {
  if (!isPlainObject(raw) || typeof raw.type !== "string") {
    throw new WorkflowValidationError("Each action must be an object with a type.");
  }

  const type = raw.type;
  if (!(WORKFLOW_ACTION_TYPES as readonly string[]).includes(type)) {
    throw new WorkflowValidationError(`Unknown action type: ${type}`);
  }

  const availability = actionAvailability.get(type as WorkflowAction["type"]);
  if (availability && !availability.available) {
    throw new WorkflowValidationError(
      availability.reason ??
        `Action "${type}" is not available in this milestone.`,
    );
  }

  switch (type) {
    case "notify_user": {
      const userId = requireNonEmptyString(raw.userId, "notify_user.userId");
      const summary =
        raw.summary === undefined
          ? undefined
          : requireNonEmptyString(raw.summary, "notify_user.summary");
      return summary
        ? { type: "notify_user", userId, summary }
        : { type: "notify_user", userId };
    }
    case "notify_role": {
      if (!isOrgRole(raw.orgRole)) {
        throw new WorkflowValidationError(
          `notify_role.orgRole must be one of: ${ORG_ROLES.join(", ")}`,
        );
      }
      const summary =
        raw.summary === undefined
          ? undefined
          : requireNonEmptyString(raw.summary, "notify_role.summary");
      return summary
        ? { type: "notify_role", orgRole: raw.orgRole, summary }
        : { type: "notify_role", orgRole: raw.orgRole };
    }
    case "assign_user": {
      const userId = requireNonEmptyString(raw.userId, "assign_user.userId");
      if (!isAssignmentRole(raw.assignmentRole)) {
        throw new WorkflowValidationError(
          `assign_user.assignmentRole must be one of: ${ASSIGNMENT_ROLES.join(", ")}`,
        );
      }
      return {
        type: "assign_user",
        userId,
        assignmentRole: raw.assignmentRole,
      };
    }
    case "assign_role": {
      if (!isOrgRole(raw.orgRole)) {
        throw new WorkflowValidationError(
          `assign_role.orgRole must be one of: ${ORG_ROLES.join(", ")}`,
        );
      }
      if (!isAssignmentRole(raw.assignmentRole)) {
        throw new WorkflowValidationError(
          `assign_role.assignmentRole must be one of: ${ASSIGNMENT_ROLES.join(", ")}`,
        );
      }
      return {
        type: "assign_role",
        orgRole: raw.orgRole,
        assignmentRole: raw.assignmentRole,
      };
    }
    case "set_due_date": {
      if (typeof raw.offsetDays !== "number" || !Number.isInteger(raw.offsetDays)) {
        throw new WorkflowValidationError(
          "set_due_date.offsetDays must be an integer.",
        );
      }
      if (raw.offsetDays < 0 || raw.offsetDays > 3650) {
        throw new WorkflowValidationError(
          "set_due_date.offsetDays must be between 0 and 3650.",
        );
      }
      return { type: "set_due_date", offsetDays: raw.offsetDays };
    }
    case "change_status": {
      if (!isControlImplementationStatus(raw.implementationStatus)) {
        throw new WorkflowValidationError(
          "change_status.implementationStatus must be a valid implementation status.",
        );
      }
      return {
        type: "change_status",
        implementationStatus: raw.implementationStatus,
      };
    }
    case "add_tag":
    case "remove_tag":
      throw new WorkflowValidationError(
        `Action "${type}" is not available in this milestone.`,
      );
    default:
      throw new WorkflowValidationError(`Unhandled action type: ${type}`);
  }
}

export function parseWorkflowConditions(raw: unknown): WorkflowCondition[] {
  if (!Array.isArray(raw)) {
    throw new WorkflowValidationError("conditions must be an array.");
  }
  return raw.map((item, index) => {
    try {
      return parseWorkflowCondition(item);
    } catch (err) {
      if (err instanceof WorkflowValidationError) {
        throw new WorkflowValidationError(
          `conditions[${index}]: ${err.message}`,
        );
      }
      throw err;
    }
  });
}

export function parseWorkflowActions(raw: unknown): WorkflowAction[] {
  if (!Array.isArray(raw)) {
    throw new WorkflowValidationError("actions must be an array.");
  }
  if (raw.length === 0) {
    throw new WorkflowValidationError("actions must include at least one action.");
  }
  return raw.map((item, index) => {
    try {
      return parseWorkflowAction(item);
    } catch (err) {
      if (err instanceof WorkflowValidationError) {
        throw new WorkflowValidationError(`actions[${index}]: ${err.message}`);
      }
      throw err;
    }
  });
}

export type CreateWorkflowRuleInput = {
  organizationId: string;
  name: string;
  description?: string | null;
  enabled?: boolean;
  triggerType: unknown;
  conditions: unknown;
  actions: unknown;
  createdByUserId: string;
};

export type ParsedCreateWorkflowRule = {
  organizationId: string;
  name: string;
  description: string | null;
  enabled: boolean;
  triggerType: WorkflowTriggerType;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  createdByUserId: string;
};

export function parseCreateWorkflowRuleInput(
  input: CreateWorkflowRuleInput,
): ParsedCreateWorkflowRule {
  const organizationId = requireNonEmptyString(
    input.organizationId,
    "organizationId",
  );
  const name = requireNonEmptyString(input.name, "name");
  if (name.length > 200) {
    throw new WorkflowValidationError("name must be at most 200 characters.");
  }
  const description =
    input.description == null || input.description === ""
      ? null
      : requireNonEmptyString(input.description, "description");
  if (description && description.length > 2000) {
    throw new WorkflowValidationError(
      "description must be at most 2000 characters.",
    );
  }
  const createdByUserId = requireNonEmptyString(
    input.createdByUserId,
    "createdByUserId",
  );

  return {
    organizationId,
    name,
    description,
    enabled: input.enabled !== false,
    triggerType: parseWorkflowTriggerType(input.triggerType),
    conditions: parseWorkflowConditions(input.conditions),
    actions: parseWorkflowActions(input.actions),
    createdByUserId,
  };
}

export type UpdateWorkflowRuleInput = {
  name?: string;
  description?: string | null;
  enabled?: boolean;
  triggerType?: unknown;
  conditions?: unknown;
  actions?: unknown;
};

export type ParsedUpdateWorkflowRule = {
  name?: string;
  description?: string | null;
  enabled?: boolean;
  triggerType?: WorkflowTriggerType;
  conditions?: WorkflowCondition[];
  actions?: WorkflowAction[];
};

export function parseUpdateWorkflowRuleInput(
  input: UpdateWorkflowRuleInput,
): ParsedUpdateWorkflowRule {
  const parsed: ParsedUpdateWorkflowRule = {};
  if (input.name !== undefined) {
    parsed.name = requireNonEmptyString(input.name, "name");
    if (parsed.name.length > 200) {
      throw new WorkflowValidationError("name must be at most 200 characters.");
    }
  }
  if (input.description !== undefined) {
    parsed.description =
      input.description == null || input.description === ""
        ? null
        : requireNonEmptyString(input.description, "description");
    if (parsed.description && parsed.description.length > 2000) {
      throw new WorkflowValidationError(
        "description must be at most 2000 characters.",
      );
    }
  }
  if (input.enabled !== undefined) {
    if (typeof input.enabled !== "boolean") {
      throw new WorkflowValidationError("enabled must be a boolean.");
    }
    parsed.enabled = input.enabled;
  }
  if (input.triggerType !== undefined) {
    parsed.triggerType = parseWorkflowTriggerType(input.triggerType);
  }
  if (input.conditions !== undefined) {
    parsed.conditions = parseWorkflowConditions(input.conditions);
  }
  if (input.actions !== undefined) {
    parsed.actions = parseWorkflowActions(input.actions);
  }
  return parsed;
}

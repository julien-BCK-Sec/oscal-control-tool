import type { OrgRole } from "@/authz/permissions";
import { CONTROL_IMPLEMENTATION_STATUS_LABELS } from "@/data/control-record";
import type {
  WorkflowActionType,
  WorkflowConditionType,
  WorkflowTriggerType,
} from "@/workflow/types";
import { WORKFLOW_TRIGGER_TYPES } from "@/workflow/types";

export const WORKFLOW_TRIGGER_LABELS: Record<WorkflowTriggerType, string> = {
  control_created: "Control created",
  control_updated: "Control updated",
  control_assigned: "Control assigned",
  assignment_completed: "Assignment completed",
  discussion_created: "Discussion created",
  discussion_resolved: "Discussion resolved",
};

/** Condition types available for admin forms in this milestone. */
export const AVAILABLE_CONDITION_TYPES = [
  "control_status",
  "control_category",
  "framework",
  "assigned_user",
  "assigned_role",
] as const satisfies readonly WorkflowConditionType[];

export type AvailableConditionType = (typeof AVAILABLE_CONDITION_TYPES)[number];

export const WORKFLOW_CONDITION_LABELS: Record<AvailableConditionType, string> =
  {
    control_status: "Control status",
    control_category: "Control category",
    framework: "Framework",
    assigned_user: "Assigned user",
    assigned_role: "Assigned role",
  };

/** Action types available for admin forms in this milestone. */
export const AVAILABLE_ACTION_TYPES = [
  "notify_user",
  "notify_role",
  "assign_user",
  "assign_role",
  "set_due_date",
  "change_status",
] as const satisfies readonly WorkflowActionType[];

export type AvailableActionType = (typeof AVAILABLE_ACTION_TYPES)[number];

export const WORKFLOW_ACTION_LABELS: Record<AvailableActionType, string> = {
  notify_user: "Notify user",
  notify_role: "Notify role",
  assign_user: "Assign user",
  assign_role: "Assign role",
  set_due_date: "Set due date",
  change_status: "Change status",
};

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  organization_admin: "Organization admin",
  project_manager: "Project manager",
  author: "Author",
  reviewer: "Reviewer",
  viewer: "Viewer",
};

export const ASSIGNMENT_ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "reviewer", label: "Reviewer" },
] as const;

export const IMPLEMENTATION_STATUS_OPTIONS = Object.entries(
  CONTROL_IMPLEMENTATION_STATUS_LABELS,
).map(([value, label]) => ({ value, label }));

export const TRIGGER_OPTIONS = WORKFLOW_TRIGGER_TYPES.map((value) => ({
  value,
  label: WORKFLOW_TRIGGER_LABELS[value],
}));

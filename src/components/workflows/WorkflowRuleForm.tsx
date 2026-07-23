"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import {
  createWorkflowRuleAction,
  updateWorkflowRuleAction,
} from "@/app/actions/workflows";
import { ORG_ROLES } from "@/authz/permissions";
import { Button } from "@/components/design-system/button/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/design-system/card/Card";
import { WorkflowBackLink } from "@/components/workflows/WorkflowBackLink";
import type { WorkflowAction, WorkflowCondition, WorkflowRule } from "@/workflow/types";
import {
  ASSIGNMENT_ROLE_OPTIONS,
  AVAILABLE_ACTION_TYPES,
  AVAILABLE_CONDITION_TYPES,
  IMPLEMENTATION_STATUS_OPTIONS,
  ORG_ROLE_LABELS,
  TRIGGER_OPTIONS,
  WORKFLOW_ACTION_LABELS,
  WORKFLOW_CONDITION_LABELS,
  type AvailableActionType,
  type AvailableConditionType,
} from "./catalog-labels";

export type WorkflowRuleFormProps = {
  organizationId: string;
  mode: "create" | "edit";
  initial?: WorkflowRule;
};

type ConditionDraft = {
  type: AvailableConditionType;
  value: string;
};

type ActionDraft = {
  type: AvailableActionType;
  userId: string;
  orgRole: string;
  assignmentRole: string;
  offsetDays: string;
  implementationStatus: string;
  summary: string;
};

function conditionToDraft(condition: WorkflowCondition): ConditionDraft | null {
  switch (condition.type) {
    case "control_status":
    case "control_category":
    case "framework":
    case "assigned_user":
    case "assigned_role":
      return { type: condition.type, value: condition.value };
    default:
      return null;
  }
}

function actionToDraft(action: WorkflowAction): ActionDraft | null {
  const base: ActionDraft = {
    type: "notify_user",
    userId: "",
    orgRole: "organization_admin",
    assignmentRole: "owner",
    offsetDays: "7",
    implementationStatus: "in_review",
    summary: "",
  };
  switch (action.type) {
    case "notify_user":
      return {
        ...base,
        type: "notify_user",
        userId: action.userId,
        summary: action.summary ?? "",
      };
    case "notify_role":
      return {
        ...base,
        type: "notify_role",
        orgRole: action.orgRole,
        summary: action.summary ?? "",
      };
    case "assign_user":
      return {
        ...base,
        type: "assign_user",
        userId: action.userId,
        assignmentRole: action.assignmentRole,
      };
    case "assign_role":
      return {
        ...base,
        type: "assign_role",
        orgRole: action.orgRole,
        assignmentRole: action.assignmentRole,
      };
    case "set_due_date":
      return {
        ...base,
        type: "set_due_date",
        offsetDays: String(action.offsetDays),
      };
    case "change_status":
      return {
        ...base,
        type: "change_status",
        implementationStatus: action.implementationStatus,
      };
    default:
      return null;
  }
}

function draftToCondition(draft: ConditionDraft): Record<string, unknown> {
  return {
    type: draft.type,
    op: "eq",
    value: draft.value,
  };
}

function draftToAction(draft: ActionDraft): Record<string, unknown> {
  switch (draft.type) {
    case "notify_user":
      return {
        type: "notify_user",
        userId: draft.userId,
        ...(draft.summary.trim() ? { summary: draft.summary.trim() } : {}),
      };
    case "notify_role":
      return {
        type: "notify_role",
        orgRole: draft.orgRole,
        ...(draft.summary.trim() ? { summary: draft.summary.trim() } : {}),
      };
    case "assign_user":
      return {
        type: "assign_user",
        userId: draft.userId,
        assignmentRole: draft.assignmentRole,
      };
    case "assign_role":
      return {
        type: "assign_role",
        orgRole: draft.orgRole,
        assignmentRole: draft.assignmentRole,
      };
    case "set_due_date":
      return {
        type: "set_due_date",
        offsetDays: Number.parseInt(draft.offsetDays, 10),
      };
    case "change_status":
      return {
        type: "change_status",
        implementationStatus: draft.implementationStatus,
      };
  }
}

function emptyCondition(): ConditionDraft {
  return { type: "control_status", value: "draft" };
}

function emptyAction(): ActionDraft {
  return {
    type: "notify_user",
    userId: "",
    orgRole: "organization_admin",
    assignmentRole: "owner",
    offsetDays: "7",
    implementationStatus: "in_review",
    summary: "",
  };
}

export function WorkflowRuleForm({
  organizationId,
  mode,
  initial,
}: WorkflowRuleFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [triggerType, setTriggerType] = useState(
    initial?.triggerType ?? "control_assigned",
  );
  const [conditions, setConditions] = useState<ConditionDraft[]>(
    () =>
      initial?.conditions
        .map(conditionToDraft)
        .filter((c): c is ConditionDraft => c !== null) ?? [],
  );
  const [actions, setActions] = useState<ActionDraft[]>(
    () =>
      initial?.actions
        .map(actionToDraft)
        .filter((a): a is ActionDraft => a !== null) ?? [emptyAction()],
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const payload = {
      name,
      description: description.trim() || null,
      enabled,
      triggerType,
      conditions: conditions.map(draftToCondition),
      actions: actions.map(draftToAction),
    };
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createWorkflowRuleAction({
              organizationId,
              ...payload,
            })
          : await updateWorkflowRuleAction({
              organizationId,
              ruleId: initial!.id,
              ...payload,
            });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      const notice = mode === "create" ? "created" : "updated";
      setSuccess(
        mode === "create"
          ? "Workflow created successfully."
          : "Workflow saved successfully.",
      );
      // Prefer hard navigation so the list always loads fresh server data.
      window.location.assign(
        `/organizations/${organizationId}/workflows?notice=${notice}`,
      );
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header>
        <WorkflowBackLink organizationId={organizationId} />
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          {mode === "create" ? "Create workflow" : "Edit workflow"}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Conditions use AND logic. Priority, severity, and tag actions are not
          available until those fields exist on controls.
        </p>
      </header>

      {success ? (
        <p role="status" className="text-sm text-success">
          {success}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <form onSubmit={submit} className="flex flex-col gap-6">
        <Card prominent aria-labelledby="workflow-basics">
          <CardHeader>
            <CardTitle id="workflow-basics">Basics</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <label htmlFor="workflow-name" className="label">
                Name
              </label>
              <input
                id="workflow-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="workflow-description" className="label">
                Description
              </label>
              <textarea
                id="workflow-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="field mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="workflow-trigger" className="label">
                Trigger
              </label>
              <select
                id="workflow-trigger"
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as typeof triggerType)}
                className="field mt-1.5"
              >
                {TRIGGER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Enabled
            </label>
          </CardContent>
        </Card>

        <Card aria-labelledby="workflow-conditions">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle id="workflow-conditions">Conditions</CardTitle>
            <Button
              type="button"
              size="sm"
              onClick={() => setConditions((prev) => [...prev, emptyCondition()])}
            >
              Add condition
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {conditions.length === 0 ? (
              <p className="text-sm text-text-secondary">
                No conditions — the rule runs for every matching trigger event.
              </p>
            ) : (
              conditions.map((condition, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-[12rem_1fr_auto]"
                >
                  <div>
                    <label className="label" htmlFor={`condition-type-${index}`}>
                      Type
                    </label>
                    <select
                      id={`condition-type-${index}`}
                      className="field mt-1.5"
                      value={condition.type}
                      onChange={(e) => {
                        const type = e.target.value as AvailableConditionType;
                        setConditions((prev) =>
                          prev.map((item, i) =>
                            i === index
                              ? {
                                  type,
                                  value:
                                    type === "control_status"
                                      ? "draft"
                                      : type === "assigned_role"
                                        ? "owner"
                                        : "",
                                }
                              : item,
                          ),
                        );
                      }}
                    >
                      {AVAILABLE_CONDITION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {WORKFLOW_CONDITION_LABELS[type]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor={`condition-value-${index}`}>
                      Equals
                    </label>
                    {condition.type === "control_status" ? (
                      <select
                        id={`condition-value-${index}`}
                        className="field mt-1.5"
                        value={condition.value}
                        onChange={(e) =>
                          setConditions((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? { ...item, value: e.target.value }
                                : item,
                            ),
                          )
                        }
                      >
                        {IMPLEMENTATION_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : condition.type === "assigned_role" ? (
                      <select
                        id={`condition-value-${index}`}
                        className="field mt-1.5"
                        value={condition.value}
                        onChange={(e) =>
                          setConditions((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? { ...item, value: e.target.value }
                                : item,
                            ),
                          )
                        }
                      >
                        {ASSIGNMENT_ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`condition-value-${index}`}
                        className="field mt-1.5"
                        value={condition.value}
                        onChange={(e) =>
                          setConditions((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? { ...item, value: e.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder={
                          condition.type === "assigned_user"
                            ? "User id"
                            : condition.type === "framework"
                              ? "Framework id"
                              : "Category / family"
                        }
                        required
                      />
                    )}
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() =>
                        setConditions((prev) =>
                          prev.filter((_, i) => i !== index),
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card aria-labelledby="workflow-actions">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle id="workflow-actions">Actions</CardTitle>
            <Button
              type="button"
              size="sm"
              onClick={() => setActions((prev) => [...prev, emptyAction()])}
            >
              Add action
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {actions.map((action, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-md border border-border p-3"
              >
                <div className="grid gap-3 sm:grid-cols-[12rem_1fr_auto]">
                  <div>
                    <label className="label" htmlFor={`action-type-${index}`}>
                      Type
                    </label>
                    <select
                      id={`action-type-${index}`}
                      className="field mt-1.5"
                      value={action.type}
                      onChange={(e) => {
                        const type = e.target.value as AvailableActionType;
                        setActions((prev) =>
                          prev.map((item, i) =>
                            i === index ? { ...item, type } : item,
                          ),
                        );
                      }}
                    >
                      {AVAILABLE_ACTION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {WORKFLOW_ACTION_LABELS[type]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {action.type === "notify_user" ||
                    action.type === "assign_user" ? (
                      <div>
                        <label
                          className="label"
                          htmlFor={`action-user-${index}`}
                        >
                          User id
                        </label>
                        <input
                          id={`action-user-${index}`}
                          className="field mt-1.5"
                          required
                          value={action.userId}
                          onChange={(e) =>
                            setActions((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? { ...item, userId: e.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                    ) : null}
                    {action.type === "notify_role" ||
                    action.type === "assign_role" ? (
                      <div>
                        <label
                          className="label"
                          htmlFor={`action-org-role-${index}`}
                        >
                          Organization role
                        </label>
                        <select
                          id={`action-org-role-${index}`}
                          className="field mt-1.5"
                          value={action.orgRole}
                          onChange={(e) =>
                            setActions((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? { ...item, orgRole: e.target.value }
                                  : item,
                              ),
                            )
                          }
                        >
                          {ORG_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {ORG_ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    {action.type === "assign_user" ||
                    action.type === "assign_role" ? (
                      <div>
                        <label
                          className="label"
                          htmlFor={`action-asg-role-${index}`}
                        >
                          Assignment role
                        </label>
                        <select
                          id={`action-asg-role-${index}`}
                          className="field mt-1.5"
                          value={action.assignmentRole}
                          onChange={(e) =>
                            setActions((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      assignmentRole: e.target.value,
                                    }
                                  : item,
                              ),
                            )
                          }
                        >
                          {ASSIGNMENT_ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    {action.type === "set_due_date" ? (
                      <div>
                        <label
                          className="label"
                          htmlFor={`action-offset-${index}`}
                        >
                          Offset days
                        </label>
                        <input
                          id={`action-offset-${index}`}
                          type="number"
                          min={0}
                          max={3650}
                          required
                          className="field mt-1.5"
                          value={action.offsetDays}
                          onChange={(e) =>
                            setActions((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? { ...item, offsetDays: e.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                    ) : null}
                    {action.type === "change_status" ? (
                      <div>
                        <label
                          className="label"
                          htmlFor={`action-status-${index}`}
                        >
                          Implementation status
                        </label>
                        <select
                          id={`action-status-${index}`}
                          className="field mt-1.5"
                          value={action.implementationStatus}
                          onChange={(e) =>
                            setActions((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      implementationStatus: e.target.value,
                                    }
                                  : item,
                              ),
                            )
                          }
                        >
                          {IMPLEMENTATION_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    {action.type === "notify_user" ||
                    action.type === "notify_role" ? (
                      <div>
                        <label
                          className="label"
                          htmlFor={`action-summary-${index}`}
                        >
                          Summary (optional)
                        </label>
                        <input
                          id={`action-summary-${index}`}
                          className="field mt-1.5"
                          value={action.summary}
                          onChange={(e) =>
                            setActions((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? { ...item, summary: e.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      disabled={actions.length === 1}
                      onClick={() =>
                        setActions((prev) =>
                          prev.filter((_, i) => i !== index),
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="primary" disabled={pending}>
            {mode === "create" ? "Create workflow" : "Save changes"}
          </Button>
          <Link
            href={`/organizations/${organizationId}/workflows`}
            className="btn"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

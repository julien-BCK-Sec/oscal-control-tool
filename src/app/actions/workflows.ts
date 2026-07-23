"use server";

import { getSessionUser, resolveOrgContext } from "@/auth/context";
import type { OrgContext } from "@/authz/authorize";
import { getWorkflowRepository } from "@/persistence/server";
import {
  createWorkflowRuleForOrg,
  deleteWorkflowRuleForOrg,
  getWorkflowExecutionForOrg,
  getWorkflowRuleForOrg,
  listWorkflowExecutionsForOrg,
  listWorkflowRulesForOrg,
  setWorkflowRuleEnabledForOrg,
  updateWorkflowRuleForOrg,
} from "@/server/authorized-workflows";
import { revalidateWorkflowAdmin } from "@/server/revalidate-views";
import type { WorkflowExecution } from "@/persistence/workflow-repository";
import type { WorkflowRule } from "@/workflow/types";

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required.`);
  }
  return value.trim();
}

async function resolveContext(organizationId: string): Promise<
  | { ok: true; ctx: OrgContext }
  | { ok: false; message: string }
> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Authentication is required." };
  }
  const ctx = await resolveOrgContext(user.id, organizationId);
  if (!ctx) {
    return { ok: false, message: "No membership in this organization." };
  }
  return { ok: true, ctx };
}

export type WorkflowActionResult =
  | { ok: true; rule?: WorkflowRule }
  | { ok: false; message: string };

export type WorkflowListResult =
  | { ok: true; rules: WorkflowRule[] }
  | { ok: false; message: string };

export type WorkflowGetResult =
  | { ok: true; rule: WorkflowRule | null }
  | { ok: false; message: string };

export type WorkflowExecutionsResult =
  | { ok: true; executions: WorkflowExecution[] }
  | { ok: false; message: string };

export type WorkflowExecutionGetResult =
  | { ok: true; execution: WorkflowExecution | null }
  | { ok: false; message: string };

export async function listWorkflowRulesAction(input: {
  organizationId: string;
}): Promise<WorkflowListResult> {
  let organizationId: string;
  try {
    organizationId = requireNonEmptyString(
      input.organizationId,
      "organizationId",
    );
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid input.",
    };
  }
  const resolved = await resolveContext(organizationId);
  if (!resolved.ok) {
    return { ok: false, message: resolved.message };
  }
  try {
    const repo = await getWorkflowRepository();
    const rules = await listWorkflowRulesForOrg(repo, resolved.ctx);
    return { ok: true, rules };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to list rules.",
    };
  }
}

export async function getWorkflowRuleAction(input: {
  organizationId: string;
  ruleId: string;
}): Promise<WorkflowGetResult> {
  let organizationId: string;
  let ruleId: string;
  try {
    organizationId = requireNonEmptyString(
      input.organizationId,
      "organizationId",
    );
    ruleId = requireNonEmptyString(input.ruleId, "ruleId");
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid input.",
    };
  }
  const resolved = await resolveContext(organizationId);
  if (!resolved.ok) {
    return { ok: false, message: resolved.message };
  }
  try {
    const repo = await getWorkflowRepository();
    const rule = await getWorkflowRuleForOrg(repo, resolved.ctx, ruleId);
    return { ok: true, rule };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to load rule.",
    };
  }
}

export async function createWorkflowRuleAction(input: {
  organizationId: string;
  name: string;
  description?: string | null;
  enabled?: boolean;
  triggerType: string;
  conditions: unknown;
  actions: unknown;
}): Promise<WorkflowActionResult> {
  let organizationId: string;
  try {
    organizationId = requireNonEmptyString(
      input.organizationId,
      "organizationId",
    );
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid input.",
    };
  }
  const resolved = await resolveContext(organizationId);
  if (!resolved.ok) {
    return { ok: false, message: resolved.message };
  }
  const repo = await getWorkflowRepository();
  const result = await createWorkflowRuleForOrg(repo, resolved.ctx, {
    name: input.name,
    description: input.description,
    enabled: input.enabled,
    triggerType: input.triggerType,
    conditions: input.conditions,
    actions: input.actions,
  });
  if (result.ok) {
    revalidateWorkflowAdmin(organizationId);
    return { ok: true, rule: result.rule };
  }
  return { ok: false, message: result.message };
}

export async function updateWorkflowRuleAction(input: {
  organizationId: string;
  ruleId: string;
  name?: string;
  description?: string | null;
  enabled?: boolean;
  triggerType?: string;
  conditions?: unknown;
  actions?: unknown;
}): Promise<WorkflowActionResult> {
  let organizationId: string;
  let ruleId: string;
  try {
    organizationId = requireNonEmptyString(
      input.organizationId,
      "organizationId",
    );
    ruleId = requireNonEmptyString(input.ruleId, "ruleId");
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid input.",
    };
  }
  const resolved = await resolveContext(organizationId);
  if (!resolved.ok) {
    return { ok: false, message: resolved.message };
  }
  const repo = await getWorkflowRepository();
  const result = await updateWorkflowRuleForOrg(repo, resolved.ctx, ruleId, {
    name: input.name,
    description: input.description,
    enabled: input.enabled,
    triggerType: input.triggerType,
    conditions: input.conditions,
    actions: input.actions,
  });
  if (result.ok) {
    revalidateWorkflowAdmin(organizationId);
    return { ok: true, rule: result.rule };
  }
  return { ok: false, message: result.message };
}

export async function setWorkflowRuleEnabledAction(input: {
  organizationId: string;
  ruleId: string;
  enabled: boolean;
}): Promise<WorkflowActionResult> {
  let organizationId: string;
  let ruleId: string;
  try {
    organizationId = requireNonEmptyString(
      input.organizationId,
      "organizationId",
    );
    ruleId = requireNonEmptyString(input.ruleId, "ruleId");
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid input.",
    };
  }
  if (typeof input.enabled !== "boolean") {
    return { ok: false, message: "enabled must be a boolean." };
  }
  const resolved = await resolveContext(organizationId);
  if (!resolved.ok) {
    return { ok: false, message: resolved.message };
  }
  const repo = await getWorkflowRepository();
  const result = await setWorkflowRuleEnabledForOrg(
    repo,
    resolved.ctx,
    ruleId,
    input.enabled,
  );
  if (result.ok) {
    revalidateWorkflowAdmin(organizationId);
    return { ok: true, rule: result.rule };
  }
  return { ok: false, message: result.message };
}

export async function deleteWorkflowRuleAction(input: {
  organizationId: string;
  ruleId: string;
}): Promise<WorkflowActionResult> {
  let organizationId: string;
  let ruleId: string;
  try {
    organizationId = requireNonEmptyString(
      input.organizationId,
      "organizationId",
    );
    ruleId = requireNonEmptyString(input.ruleId, "ruleId");
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid input.",
    };
  }
  const resolved = await resolveContext(organizationId);
  if (!resolved.ok) {
    return { ok: false, message: resolved.message };
  }
  const repo = await getWorkflowRepository();
  const result = await deleteWorkflowRuleForOrg(repo, resolved.ctx, ruleId);
  if (result.ok) {
    revalidateWorkflowAdmin(organizationId);
    return { ok: true };
  }
  return { ok: false, message: result.message };
}

export async function listWorkflowExecutionsAction(input: {
  organizationId: string;
  workflowRuleId?: string;
  limit?: number;
}): Promise<WorkflowExecutionsResult> {
  let organizationId: string;
  try {
    organizationId = requireNonEmptyString(
      input.organizationId,
      "organizationId",
    );
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid input.",
    };
  }
  const resolved = await resolveContext(organizationId);
  if (!resolved.ok) {
    return { ok: false, message: resolved.message };
  }
  try {
    const repo = await getWorkflowRepository();
    const executions = await listWorkflowExecutionsForOrg(repo, resolved.ctx, {
      workflowRuleId: input.workflowRuleId,
      limit: input.limit,
    });
    return { ok: true, executions };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to list executions.",
    };
  }
}

export async function getWorkflowExecutionAction(input: {
  organizationId: string;
  executionId: string;
}): Promise<WorkflowExecutionGetResult> {
  let organizationId: string;
  let executionId: string;
  try {
    organizationId = requireNonEmptyString(
      input.organizationId,
      "organizationId",
    );
    executionId = requireNonEmptyString(input.executionId, "executionId");
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid input.",
    };
  }
  const resolved = await resolveContext(organizationId);
  if (!resolved.ok) {
    return { ok: false, message: resolved.message };
  }
  try {
    const repo = await getWorkflowRepository();
    const execution = await getWorkflowExecutionForOrg(
      repo,
      resolved.ctx,
      executionId,
    );
    return { ok: true, execution };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to load execution.",
    };
  }
}

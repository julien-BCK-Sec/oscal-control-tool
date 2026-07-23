/**
 * Authorized workflow automation APIs (Milestone 02C WP3).
 *
 * Organization-scoped CRUD and execution diagnostics. Business services never
 * call these; UI and Server Actions go through this boundary.
 */

import {
  AuthorizationError,
  requirePermission,
  type OrgContext,
} from "@/authz/authorize";
import type {
  ListWorkflowExecutionsOptions,
  WorkflowExecution,
  WorkflowRepository,
} from "@/persistence/workflow-repository";
import type { WorkflowRule } from "@/workflow/types";
import {
  WorkflowValidationError,
  type CreateWorkflowRuleInput,
  type UpdateWorkflowRuleInput,
} from "@/workflow/validation";

export type WorkflowMutationResult =
  | { ok: true; rule: WorkflowRule }
  | { ok: false; message: string };

export type WorkflowDeleteResult =
  | { ok: true }
  | { ok: false; message: string };

function mapError(err: unknown): WorkflowMutationResult {
  if (err instanceof AuthorizationError) {
    return { ok: false, message: err.message };
  }
  if (err instanceof WorkflowValidationError) {
    return { ok: false, message: err.message };
  }
  return {
    ok: false,
    message: err instanceof Error ? err.message : "Workflow operation failed.",
  };
}

export async function listWorkflowRulesForOrg(
  repo: WorkflowRepository,
  ctx: OrgContext,
): Promise<WorkflowRule[]> {
  requirePermission(ctx, ctx.organizationId, "workflow.read");
  return repo.listRules(ctx.organizationId);
}

export async function getWorkflowRuleForOrg(
  repo: WorkflowRepository,
  ctx: OrgContext,
  ruleId: string,
): Promise<WorkflowRule | null> {
  requirePermission(ctx, ctx.organizationId, "workflow.read");
  return repo.getRule(ctx.organizationId, ruleId);
}

export async function createWorkflowRuleForOrg(
  repo: WorkflowRepository,
  ctx: OrgContext,
  input: Omit<CreateWorkflowRuleInput, "organizationId" | "createdByUserId">,
): Promise<WorkflowMutationResult> {
  try {
    requirePermission(ctx, ctx.organizationId, "workflow.manage");
    const rule = await repo.createRule({
      ...input,
      organizationId: ctx.organizationId,
      createdByUserId: ctx.userId,
    });
    return { ok: true, rule };
  } catch (err) {
    return mapError(err);
  }
}

export async function updateWorkflowRuleForOrg(
  repo: WorkflowRepository,
  ctx: OrgContext,
  ruleId: string,
  input: UpdateWorkflowRuleInput,
): Promise<WorkflowMutationResult> {
  try {
    requirePermission(ctx, ctx.organizationId, "workflow.manage");
    const rule = await repo.updateRule(ctx.organizationId, ruleId, input);
    if (!rule) {
      return { ok: false, message: "Workflow rule not found." };
    }
    return { ok: true, rule };
  } catch (err) {
    return mapError(err);
  }
}

export async function setWorkflowRuleEnabledForOrg(
  repo: WorkflowRepository,
  ctx: OrgContext,
  ruleId: string,
  enabled: boolean,
): Promise<WorkflowMutationResult> {
  try {
    requirePermission(ctx, ctx.organizationId, "workflow.manage");
    const rule = await repo.setEnabled(ctx.organizationId, ruleId, enabled);
    if (!rule) {
      return { ok: false, message: "Workflow rule not found." };
    }
    return { ok: true, rule };
  } catch (err) {
    return mapError(err);
  }
}

export async function deleteWorkflowRuleForOrg(
  repo: WorkflowRepository,
  ctx: OrgContext,
  ruleId: string,
): Promise<WorkflowDeleteResult> {
  try {
    requirePermission(ctx, ctx.organizationId, "workflow.manage");
    const deleted = await repo.deleteRule(ctx.organizationId, ruleId);
    if (!deleted) {
      return { ok: false, message: "Workflow rule not found." };
    }
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return { ok: false, message: err.message };
    }
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Delete failed.",
    };
  }
}

export async function listWorkflowExecutionsForOrg(
  repo: WorkflowRepository,
  ctx: OrgContext,
  options?: ListWorkflowExecutionsOptions,
): Promise<WorkflowExecution[]> {
  requirePermission(ctx, ctx.organizationId, "workflow.read");
  return repo.listExecutions(ctx.organizationId, options);
}

export async function getWorkflowExecutionForOrg(
  repo: WorkflowRepository,
  ctx: OrgContext,
  executionId: string,
): Promise<WorkflowExecution | null> {
  requirePermission(ctx, ctx.organizationId, "workflow.read");
  return repo.getExecution(ctx.organizationId, executionId);
}

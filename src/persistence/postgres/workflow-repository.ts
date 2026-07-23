import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type {
  WorkflowExecutionDetail,
  WorkflowRule,
  WorkflowRunStatus,
} from "@/workflow/types";
import { isWorkflowTriggerType } from "@/workflow/types";
import {
  parseCreateWorkflowRuleInput,
  parseUpdateWorkflowRuleInput,
  parseWorkflowActions,
  parseWorkflowConditions,
  WorkflowValidationError,
} from "@/workflow/validation";
import type {
  ListWorkflowExecutionsOptions,
  RecordWorkflowExecutionInput,
  WorkflowExecution,
  WorkflowRepository,
} from "../workflow-repository";
import type { AppDatabase } from "./client";
import { workflowExecutions, workflowRules } from "./schema";

function nowIso(): string {
  return new Date().toISOString();
}

function isUniqueViolation(err: unknown): boolean {
  let current: unknown = err;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (typeof current === "object" && current !== null) {
      const code =
        "code" in current ? String((current as { code?: unknown }).code) : "";
      if (code === "23505") {
        return true;
      }
      const message =
        "message" in current
          ? String((current as { message?: unknown }).message)
          : "";
      if (
        /duplicate key value violates unique constraint/i.test(message) ||
        /unique constraint/i.test(message)
      ) {
        return true;
      }
      current =
        "cause" in current ? (current as { cause?: unknown }).cause : undefined;
      continue;
    }
    break;
  }
  return false;
}

function toRule(row: typeof workflowRules.$inferSelect): WorkflowRule {
  if (!isWorkflowTriggerType(row.triggerType)) {
    throw new Error(
      `Corrupt workflow_rules.trigger_type for rule ${row.id}: ${row.triggerType}`,
    );
  }
  let conditionsRaw: unknown;
  let actionsRaw: unknown;
  try {
    conditionsRaw = JSON.parse(row.conditionsJson) as unknown;
    actionsRaw = JSON.parse(row.actionsJson) as unknown;
  } catch {
    throw new Error(`Corrupt workflow rule JSON for rule ${row.id}`);
  }
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    description: row.description,
    enabled: row.enabled,
    triggerType: row.triggerType,
    conditions: parseWorkflowConditions(conditionsRaw),
    actions: parseWorkflowActions(actionsRaw),
  };
}

function isWorkflowRunStatus(value: unknown): value is WorkflowRunStatus {
  return (
    value === "succeeded" ||
    value === "failed" ||
    value === "skipped" ||
    value === "duplicate"
  );
}

function toExecution(
  row: typeof workflowExecutions.$inferSelect,
): WorkflowExecution {
  if (!isWorkflowRunStatus(row.status)) {
    throw new Error(
      `Corrupt workflow_executions.status for ${row.id}: ${row.status}`,
    );
  }
  let detail: WorkflowExecutionDetail;
  try {
    detail = JSON.parse(row.detailJson) as WorkflowExecutionDetail;
  } catch {
    throw new Error(`Corrupt workflow execution detail JSON for ${row.id}`);
  }
  return {
    id: row.id,
    organizationId: row.organizationId,
    workflowRuleId: row.workflowRuleId,
    triggeringEventId: row.triggeringEventId,
    triggeringEventType: row.triggeringEventType,
    correlationId: row.correlationId,
    projectId: row.projectId,
    controlId: row.controlId,
    status: row.status,
    conditionsMatched: row.conditionsMatched,
    durationMs: row.durationMs,
    errorMessage: row.errorMessage,
    detail,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
  };
}

export function createPostgresWorkflowRepository(
  db: AppDatabase,
): WorkflowRepository {
  const repo: WorkflowRepository = {
    async listRules(organizationId) {
      const orgId = organizationId.trim();
      const rows = await db
        .select()
        .from(workflowRules)
        .where(eq(workflowRules.organizationId, orgId))
        .orderBy(desc(workflowRules.updatedAt));
      return rows.map(toRule);
    },

    async listEnabledRulesByTrigger(organizationId, triggerType) {
      const orgId = organizationId.trim();
      const rows = await db
        .select()
        .from(workflowRules)
        .where(
          and(
            eq(workflowRules.organizationId, orgId),
            eq(workflowRules.enabled, true),
            eq(workflowRules.triggerType, triggerType),
          ),
        )
        .orderBy(desc(workflowRules.updatedAt));
      return rows.map(toRule);
    },

    async getRule(organizationId, ruleId) {
      const rows = await db
        .select()
        .from(workflowRules)
        .where(
          and(
            eq(workflowRules.organizationId, organizationId.trim()),
            eq(workflowRules.id, ruleId.trim()),
          ),
        )
        .limit(1);
      const row = rows[0];
      return row ? toRule(row) : null;
    },

    async createRule(input) {
      const parsed = parseCreateWorkflowRuleInput(input);
      const id = randomUUID();
      const now = nowIso();
      await db.insert(workflowRules).values({
        id,
        organizationId: parsed.organizationId,
        name: parsed.name,
        description: parsed.description,
        enabled: parsed.enabled,
        triggerType: parsed.triggerType,
        conditionsJson: JSON.stringify(parsed.conditions),
        actionsJson: JSON.stringify(parsed.actions),
        createdByUserId: parsed.createdByUserId,
        createdAt: now,
        updatedAt: now,
      });
      const created = await repo.getRule(parsed.organizationId, id);
      if (!created) {
        throw new Error("Failed to load workflow rule after create.");
      }
      return created;
    },

    async updateRule(organizationId, ruleId, input) {
      const orgId = organizationId.trim();
      const id = ruleId.trim();
      const existing = await repo.getRule(orgId, id);
      if (!existing) {
        return null;
      }
      const parsed = parseUpdateWorkflowRuleInput(input);
      if (Object.keys(parsed).length === 0) {
        return existing;
      }
      await db
        .update(workflowRules)
        .set({
          ...(parsed.name !== undefined ? { name: parsed.name } : {}),
          ...(parsed.description !== undefined
            ? { description: parsed.description }
            : {}),
          ...(parsed.enabled !== undefined ? { enabled: parsed.enabled } : {}),
          ...(parsed.triggerType !== undefined
            ? { triggerType: parsed.triggerType }
            : {}),
          ...(parsed.conditions !== undefined
            ? { conditionsJson: JSON.stringify(parsed.conditions) }
            : {}),
          ...(parsed.actions !== undefined
            ? { actionsJson: JSON.stringify(parsed.actions) }
            : {}),
          updatedAt: nowIso(),
        })
        .where(
          and(
            eq(workflowRules.organizationId, orgId),
            eq(workflowRules.id, id),
          ),
        );
      return repo.getRule(orgId, id);
    },

    async setEnabled(organizationId, ruleId, enabled) {
      return repo.updateRule(organizationId, ruleId, { enabled });
    },

    async deleteRule(organizationId, ruleId) {
      const deleted = await db
        .delete(workflowRules)
        .where(
          and(
            eq(workflowRules.organizationId, organizationId.trim()),
            eq(workflowRules.id, ruleId.trim()),
          ),
        )
        .returning({ id: workflowRules.id });
      return deleted.length > 0;
    },

    async recordExecution(input: RecordWorkflowExecutionInput) {
      const id = randomUUID();
      try {
        await db.insert(workflowExecutions).values({
          id,
          organizationId: input.organizationId.trim(),
          workflowRuleId: input.workflowRuleId.trim(),
          triggeringEventId: input.triggeringEventId.trim(),
          triggeringEventType: input.triggeringEventType.trim(),
          correlationId: input.correlationId.trim(),
          projectId: input.projectId,
          controlId: input.controlId,
          status: input.status,
          conditionsMatched: input.conditionsMatched,
          durationMs: input.durationMs,
          errorMessage: input.errorMessage,
          detailJson: JSON.stringify(input.detail),
          startedAt: input.startedAt,
          finishedAt: input.finishedAt,
        });
      } catch (err) {
        if (isUniqueViolation(err)) {
          return null;
        }
        throw err;
      }
      const rows = await db
        .select()
        .from(workflowExecutions)
        .where(eq(workflowExecutions.id, id))
        .limit(1);
      const row = rows[0];
      return row ? toExecution(row) : null;
    },

    async hasExecution(eventId, ruleId) {
      const rows = await db
        .select({ id: workflowExecutions.id })
        .from(workflowExecutions)
        .where(
          and(
            eq(workflowExecutions.triggeringEventId, eventId.trim()),
            eq(workflowExecutions.workflowRuleId, ruleId.trim()),
          ),
        )
        .limit(1);
      return rows.length > 0;
    },

    async listExecutions(
      organizationId,
      options: ListWorkflowExecutionsOptions = {},
    ) {
      const orgId = organizationId.trim();
      const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
      const conditions = [eq(workflowExecutions.organizationId, orgId)];
      if (options.workflowRuleId) {
        conditions.push(
          eq(workflowExecutions.workflowRuleId, options.workflowRuleId.trim()),
        );
      }
      const rows = await db
        .select()
        .from(workflowExecutions)
        .where(and(...conditions))
        .orderBy(desc(workflowExecutions.startedAt))
        .limit(limit);
      return rows.map(toExecution);
    },

    async getExecution(organizationId, executionId) {
      const rows = await db
        .select()
        .from(workflowExecutions)
        .where(
          and(
            eq(workflowExecutions.organizationId, organizationId.trim()),
            eq(workflowExecutions.id, executionId.trim()),
          ),
        )
        .limit(1);
      const row = rows[0];
      return row ? toExecution(row) : null;
    },
  };

  return repo;
}

export { WorkflowValidationError };

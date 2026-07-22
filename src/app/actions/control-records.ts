"use server";

import {
  isControlReviewStatus,
  parseUpsertControlRecordInput,
  type ControlRecord,
  type ControlReviewStatus,
  type UpsertControlRecordInput,
} from "@/data/control-record";
import type { ControlActivity } from "@/data/control-activity";
import {
  isControlReviewAction,
  type ControlReviewAction,
} from "@/data/control-review";
import { SYSTEM_ACTOR } from "@/persistence/actor";
import {
  getControlActivityRepository,
  getControlRecordRepository,
  getControlRecordService,
} from "@/persistence/server";
import { getProjectRepository } from "@/persistence/server";
import type { TransitionReviewStatusResult } from "@/persistence/control-record-service";
import type { ProjectRepository } from "@/persistence/repository";
import type { OrgContext } from "@/authz/authorize";
import { getSessionUser, resolveOrgContext, sessionActor } from "@/auth/context";
import {
  listControlActivitiesForOrg,
  listControlRecordsForOrg,
  transitionReviewForOrg,
  upsertControlRecordsForOrg,
} from "@/server/authorized-controls";

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required.`);
  }
  return value.trim();
}

export type UpsertControlRecordsResult =
  | { ok: true; records: ControlRecord[] }
  | { ok: false; reason: "validation" | "not-found"; message: string };

export type TransitionReviewStatusActionResult = TransitionReviewStatusResult;

/**
 * Resolve the org context for the organization owning `projectId`, plus the
 * session actor identity. Returns null (fail closed) when unauthenticated, the
 * project is missing/cross-tenant, or the user is not a member.
 */
async function resolveProjectContext(
  projectRepo: ProjectRepository,
  projectId: string,
): Promise<{ ctx: OrgContext; actor: ReturnType<typeof sessionActor> } | null> {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }
  const loaded = await projectRepo.load(projectId);
  if (!loaded.ok || !loaded.project.organizationId) {
    return null;
  }
  const ctx = await resolveOrgContext(user.id, loaded.project.organizationId);
  if (!ctx) {
    return null;
  }
  return { ctx, actor: sessionActor(user) };
}

export async function listControlRecordsAction(
  projectId: string,
): Promise<ControlRecord[]> {
  const id = requireNonEmptyString(projectId, "projectId");
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, id);
  if (!resolved) {
    return [];
  }
  return listControlRecordsForOrg(
    projectRepo,
    await getControlRecordRepository(),
    resolved.ctx,
    id,
  );
}

/**
 * Lazy-create or update ControlRecords and append ControlActivity rows.
 * Does not modify project_json / OSCAL. Does not change reviewStatus.
 */
export async function upsertControlRecordsAction(input: {
  projectId: string;
  records: unknown;
}): Promise<UpsertControlRecordsResult> {
  let projectId: string;
  try {
    projectId = requireNonEmptyString(input.projectId, "projectId");
  } catch (error) {
    return {
      ok: false,
      reason: "validation",
      message: error instanceof Error ? error.message : "Invalid projectId.",
    };
  }

  if (!Array.isArray(input.records)) {
    return {
      ok: false,
      reason: "validation",
      message: "records must be an array.",
    };
  }

  const parsed: UpsertControlRecordInput[] = [];
  for (const entry of input.records) {
    const record = parseUpsertControlRecordInput(entry);
    if (!record) {
      return {
        ok: false,
        reason: "validation",
        message: "Invalid control record entry.",
      };
    }
    parsed.push(record);
  }

  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, projectId);
  if (!resolved) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }

  try {
    return await upsertControlRecordsForOrg(
      projectRepo,
      await getControlRecordService(),
      resolved.ctx,
      projectId,
      parsed,
      resolved.actor ?? SYSTEM_ACTOR,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save control records.";
    if (message === "Project not found.") {
      return { ok: false, reason: "not-found", message };
    }
    return { ok: false, reason: "validation", message };
  }
}

/**
 * Apply a legal review workflow transition. Rejects arbitrary status writes and
 * stale expectedCurrentStatus conflicts. Authorization is gated per action.
 */
export async function transitionReviewStatusAction(input: {
  projectId: string;
  controlId: string;
  action: unknown;
  expectedCurrentStatus: unknown;
}): Promise<TransitionReviewStatusActionResult> {
  let projectId: string;
  let controlId: string;
  try {
    projectId = requireNonEmptyString(input.projectId, "projectId");
    controlId = requireNonEmptyString(input.controlId, "controlId");
  } catch (error) {
    return {
      ok: false,
      reason: "not-found",
      message: error instanceof Error ? error.message : "Invalid identifiers.",
    };
  }

  if (!isControlReviewAction(input.action)) {
    return {
      ok: false,
      reason: "invalid-transition",
      message: "Invalid review action.",
      currentReviewStatus: isControlReviewStatus(input.expectedCurrentStatus)
        ? input.expectedCurrentStatus
        : "not_reviewed",
    };
  }

  if (!isControlReviewStatus(input.expectedCurrentStatus)) {
    return {
      ok: false,
      reason: "invalid-transition",
      message: "Invalid expectedCurrentStatus.",
      currentReviewStatus: "not_reviewed",
    };
  }

  const action = input.action as ControlReviewAction;
  const expectedCurrentStatus =
    input.expectedCurrentStatus as ControlReviewStatus;

  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, projectId);
  if (!resolved) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }

  return transitionReviewForOrg(
    projectRepo,
    await getControlRecordService(),
    resolved.ctx,
    { projectId, controlId, action, expectedCurrentStatus },
    resolved.actor ?? SYSTEM_ACTOR,
  );
}

/**
 * Activity stream for one control in a project (newest first).
 * Returns [] when no ControlRecord exists yet or access is denied.
 */
export async function listControlActivitiesAction(
  projectId: string,
  controlId: string,
): Promise<ControlActivity[]> {
  const pid = requireNonEmptyString(projectId, "projectId");
  const cid = requireNonEmptyString(controlId, "controlId");
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, pid);
  if (!resolved) {
    return [];
  }
  return listControlActivitiesForOrg(
    projectRepo,
    await getControlRecordRepository(),
    await getControlActivityRepository(),
    resolved.ctx,
    pid,
    cid,
  );
}

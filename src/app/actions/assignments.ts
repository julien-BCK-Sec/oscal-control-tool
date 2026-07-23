"use server";

import type { Assignment, AssignmentRole } from "@/data/collaboration";
import { isAssignmentRole } from "@/data/collaboration";
import type { OrgContext } from "@/authz/authorize";
import { AuthorizationError } from "@/authz/authorize";
import { getSessionUser, resolveOrgContext, sessionActor } from "@/auth/context";
import type { ProjectRepository } from "@/persistence/repository";
import { getProjectRepository } from "@/persistence/server";
import { SYSTEM_ACTOR } from "@/persistence/actor";
import { getDb } from "@/persistence/postgres/client";
import { createPostgresAssignmentService } from "@/persistence/postgres/assignment-service";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresNotificationRepository } from "@/persistence/postgres/notification-repository";
import { createNotificationService } from "@/persistence/notification-service";
import {
  completeAssignmentForOrg,
  createAssignmentForOrg,
  listAssignmentsForOrg,
  reassignAssignmentForOrg,
  removeAssignmentForOrg,
  type AssignmentActionResult,
} from "@/server/authorized-assignments";

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required.`);
  }
  return value.trim();
}

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

async function deps() {
  const db = await getDb();
  return {
    assignments: createPostgresAssignmentService(db),
    orgs: createPostgresOrganizationRepository(db),
    notifications: createNotificationService(
      createPostgresNotificationRepository(db),
    ),
  };
}

function mapAuth(error: unknown): AssignmentActionResult {
  if (error instanceof AuthorizationError) {
    return { ok: false, reason: "not-found", message: error.message };
  }
  throw error;
}

export async function listAssignmentsAction(
  projectId: string,
  controlId: string,
): Promise<Assignment[]> {
  const pid = requireNonEmptyString(projectId, "projectId");
  const cid = requireNonEmptyString(controlId, "controlId");
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, pid);
  if (!resolved) {
    return [];
  }
  try {
    const { assignments } = await deps();
    return await listAssignmentsForOrg(
      projectRepo,
      assignments,
      resolved.ctx,
      pid,
      cid,
    );
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return [];
    }
    throw error;
  }
}

export async function createAssignmentAction(input: {
  projectId: string;
  controlId: string;
  assigneeUserId: string;
  assignmentRole: AssignmentRole;
}): Promise<AssignmentActionResult> {
  const projectId = requireNonEmptyString(input.projectId, "projectId");
  const controlId = requireNonEmptyString(input.controlId, "controlId");
  const assigneeUserId = requireNonEmptyString(
    input.assigneeUserId,
    "assigneeUserId",
  );
  if (!isAssignmentRole(input.assignmentRole)) {
    return {
      ok: false,
      reason: "validation",
      message: "Invalid assignment role.",
    };
  }
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, projectId);
  if (!resolved) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  try {
    const { assignments, orgs, notifications } = await deps();
    return await createAssignmentForOrg(
      projectRepo,
      assignments,
      orgs,
      notifications,
      resolved.ctx,
      {
        projectId,
        controlId,
        assigneeUserId,
        assignmentRole: input.assignmentRole,
      },
      resolved.actor ?? SYSTEM_ACTOR,
    );
  } catch (error) {
    return mapAuth(error);
  }
}

export async function reassignAssignmentAction(input: {
  projectId: string;
  assignmentId: string;
  assigneeUserId: string;
}): Promise<AssignmentActionResult> {
  const projectId = requireNonEmptyString(input.projectId, "projectId");
  const assignmentId = requireNonEmptyString(input.assignmentId, "assignmentId");
  const assigneeUserId = requireNonEmptyString(
    input.assigneeUserId,
    "assigneeUserId",
  );
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, projectId);
  if (!resolved) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  try {
    const { assignments, orgs, notifications } = await deps();
    return await reassignAssignmentForOrg(
      projectRepo,
      assignments,
      orgs,
      notifications,
      resolved.ctx,
      assignmentId,
      assigneeUserId,
      resolved.actor ?? SYSTEM_ACTOR,
    );
  } catch (error) {
    return mapAuth(error);
  }
}

export async function completeAssignmentAction(input: {
  projectId: string;
  assignmentId: string;
}): Promise<AssignmentActionResult> {
  const projectId = requireNonEmptyString(input.projectId, "projectId");
  const assignmentId = requireNonEmptyString(input.assignmentId, "assignmentId");
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, projectId);
  if (!resolved) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  try {
    const { assignments, notifications } = await deps();
    return await completeAssignmentForOrg(
      projectRepo,
      assignments,
      notifications,
      resolved.ctx,
      assignmentId,
      resolved.actor ?? SYSTEM_ACTOR,
    );
  } catch (error) {
    return mapAuth(error);
  }
}

export async function removeAssignmentAction(input: {
  projectId: string;
  assignmentId: string;
}): Promise<AssignmentActionResult> {
  const projectId = requireNonEmptyString(input.projectId, "projectId");
  const assignmentId = requireNonEmptyString(input.assignmentId, "assignmentId");
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, projectId);
  if (!resolved) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  try {
    const { assignments, notifications } = await deps();
    return await removeAssignmentForOrg(
      projectRepo,
      assignments,
      notifications,
      resolved.ctx,
      assignmentId,
      resolved.actor ?? SYSTEM_ACTOR,
    );
  } catch (error) {
    return mapAuth(error);
  }
}

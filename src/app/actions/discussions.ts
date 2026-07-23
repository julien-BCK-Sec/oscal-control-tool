"use server";

import type { Comment } from "@/data/collaboration";
import type { OrgContext } from "@/authz/authorize";
import { AuthorizationError } from "@/authz/authorize";
import { getSessionUser, resolveOrgContext, sessionActor } from "@/auth/context";
import type { ProjectRepository } from "@/persistence/repository";
import { getProjectRepository } from "@/persistence/server";
import { SYSTEM_ACTOR } from "@/persistence/actor";
import { createPostgresDiscussionService } from "@/persistence/postgres/discussion-service";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { createPostgresNotificationRepository } from "@/persistence/postgres/notification-repository";
import { createNotificationService } from "@/persistence/notification-service";
import { getDb } from "@/persistence/postgres/client";
import {
  createDiscussionForOrg,
  deleteDiscussionForOrg,
  editDiscussionForOrg,
  listDiscussionsForOrg,
  reopenDiscussionForOrg,
  resolveDiscussionForOrg,
  restoreDiscussionForOrg,
  type DiscussionMutationResult,
} from "@/server/authorized-collaboration";

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

async function getDiscussionService() {
  return createPostgresDiscussionService(await getDb());
}

async function getOrgRepository() {
  return createPostgresOrganizationRepository(await getDb());
}

async function getNotificationService() {
  return createNotificationService(
    createPostgresNotificationRepository(await getDb()),
  );
}

function mapAuthError(error: unknown): DiscussionMutationResult {
  if (error instanceof AuthorizationError) {
    return {
      ok: false,
      reason: error.code === "forbidden" ? "forbidden" : "not-found",
      message: error.message,
    };
  }
  throw error;
}

export async function listDiscussionsAction(
  projectId: string,
  controlId: string,
): Promise<Comment[]> {
  const pid = requireNonEmptyString(projectId, "projectId");
  const cid = requireNonEmptyString(controlId, "controlId");
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, pid);
  if (!resolved) {
    return [];
  }
  try {
    return await listDiscussionsForOrg(
      projectRepo,
      await getDiscussionService(),
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

export async function createDiscussionAction(input: {
  projectId: string;
  controlId: string;
  parentCommentId?: string | null;
  body: string;
}): Promise<DiscussionMutationResult> {
  const projectId = requireNonEmptyString(input.projectId, "projectId");
  const controlId = requireNonEmptyString(input.controlId, "controlId");
  const body = requireNonEmptyString(input.body, "body");
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, projectId);
  if (!resolved) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  try {
    return await createDiscussionForOrg(
      projectRepo,
      await getDiscussionService(),
      await getOrgRepository(),
      await getNotificationService(),
      resolved.ctx,
      {
        projectId,
        controlId,
        parentCommentId: input.parentCommentId,
        body,
      },
      resolved.actor ?? SYSTEM_ACTOR,
    );
  } catch (error) {
    return mapAuthError(error);
  }
}

export async function editDiscussionAction(input: {
  projectId: string;
  commentId: string;
  body: string;
}): Promise<DiscussionMutationResult> {
  const projectId = requireNonEmptyString(input.projectId, "projectId");
  const commentId = requireNonEmptyString(input.commentId, "commentId");
  const body = requireNonEmptyString(input.body, "body");
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, projectId);
  if (!resolved) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  try {
    return await editDiscussionForOrg(
      projectRepo,
      await getDiscussionService(),
      await getOrgRepository(),
      await getNotificationService(),
      resolved.ctx,
      commentId,
      body,
      resolved.actor ?? SYSTEM_ACTOR,
    );
  } catch (error) {
    return mapAuthError(error);
  }
}

export async function deleteDiscussionAction(input: {
  projectId: string;
  commentId: string;
}): Promise<DiscussionMutationResult> {
  const projectId = requireNonEmptyString(input.projectId, "projectId");
  const commentId = requireNonEmptyString(input.commentId, "commentId");
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, projectId);
  if (!resolved) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  try {
    return await deleteDiscussionForOrg(
      projectRepo,
      await getDiscussionService(),
      resolved.ctx,
      commentId,
      resolved.actor ?? SYSTEM_ACTOR,
    );
  } catch (error) {
    return mapAuthError(error);
  }
}

export async function restoreDiscussionAction(input: {
  projectId: string;
  commentId: string;
}): Promise<DiscussionMutationResult> {
  const projectId = requireNonEmptyString(input.projectId, "projectId");
  const commentId = requireNonEmptyString(input.commentId, "commentId");
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, projectId);
  if (!resolved) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  try {
    return await restoreDiscussionForOrg(
      projectRepo,
      await getDiscussionService(),
      resolved.ctx,
      commentId,
      resolved.actor ?? SYSTEM_ACTOR,
    );
  } catch (error) {
    return mapAuthError(error);
  }
}

export async function resolveDiscussionAction(input: {
  projectId: string;
  commentId: string;
}): Promise<DiscussionMutationResult> {
  const projectId = requireNonEmptyString(input.projectId, "projectId");
  const commentId = requireNonEmptyString(input.commentId, "commentId");
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, projectId);
  if (!resolved) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  try {
    return await resolveDiscussionForOrg(
      projectRepo,
      await getDiscussionService(),
      await getNotificationService(),
      resolved.ctx,
      commentId,
      resolved.actor ?? SYSTEM_ACTOR,
    );
  } catch (error) {
    return mapAuthError(error);
  }
}

export async function reopenDiscussionAction(input: {
  projectId: string;
  commentId: string;
}): Promise<DiscussionMutationResult> {
  const projectId = requireNonEmptyString(input.projectId, "projectId");
  const commentId = requireNonEmptyString(input.commentId, "commentId");
  const projectRepo = await getProjectRepository();
  const resolved = await resolveProjectContext(projectRepo, projectId);
  if (!resolved) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  try {
    return await reopenDiscussionForOrg(
      projectRepo,
      await getDiscussionService(),
      resolved.ctx,
      commentId,
      resolved.actor ?? SYSTEM_ACTOR,
    );
  } catch (error) {
    return mapAuthError(error);
  }
}

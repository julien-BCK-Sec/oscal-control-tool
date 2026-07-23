import type { ActorIdentity } from "@/persistence/actor";
import type { ProjectRepository } from "@/persistence/repository";
import type { DiscussionService } from "@/persistence/discussion-service";
import type { NotificationService } from "@/persistence/notification-service";
import type { OrganizationRepository } from "@/persistence/postgres/organization-repository";
import type { Comment } from "@/data/collaboration";
import { resolveMentions } from "@/data/collaboration/resolve-mentions";
import type { ControlActivity } from "@/data/control-activity";
import {
  AuthorizationError,
  requirePermission,
  type OrgContext,
} from "@/authz/authorize";
import { roleHasPermission } from "@/authz/permissions";
import {
  discussionCreatedEvent,
  discussionResolvedEvent,
  discussionUpdatedEvent,
} from "@/domain/events";
import { emitDiscussionNotifications } from "./discussion-notifications";
import { publishDomainEvent } from "./publish-domain-event";

/**
 * Authorized, tenant-scoped discussion operations (Milestone 02A WP2/WP8).
 * Every function verifies the project belongs to the caller's organization
 * and enforces the role permission before touching the discussion service.
 */

async function projectBelongsToOrg(
  projectRepo: ProjectRepository,
  ctx: OrgContext,
  projectId: string,
): Promise<boolean> {
  const loaded = await projectRepo.load(projectId);
  return loaded.ok && loaded.project.organizationId === ctx.organizationId;
}

export type DiscussionMutationResult =
  | {
      ok: true;
      comment: Comment;
      activity: ControlActivity;
      mentionedUserIds: string[];
    }
  | { ok: false; reason: "not-found" | "forbidden"; message: string };

async function resolveBodyMentions(
  orgRepo: OrganizationRepository,
  organizationId: string,
  body: string,
): Promise<string[]> {
  const members = await orgRepo.listMembers(organizationId);
  return resolveMentions(body, members).map((m) => m.userId);
}

function assertOwnOrModerate(
  ctx: OrgContext,
  authorId: string,
  ownPermission: "discussion.edit_own" | "discussion.delete_own",
): void {
  if (roleHasPermission(ctx.role, "discussion.moderate")) {
    return;
  }
  if (ctx.userId !== authorId || !roleHasPermission(ctx.role, ownPermission)) {
    throw new AuthorizationError(
      "forbidden",
      `Role "${ctx.role}" is not permitted to modify this comment.`,
    );
  }
}

export async function listDiscussionsForOrg(
  projectRepo: ProjectRepository,
  discussionService: DiscussionService,
  ctx: OrgContext,
  projectId: string,
  controlId: string,
): Promise<Comment[]> {
  requirePermission(ctx, ctx.organizationId, "discussion.read");
  if (!(await projectBelongsToOrg(projectRepo, ctx, projectId))) {
    return [];
  }
  const includeDeleted = roleHasPermission(ctx.role, "discussion.moderate");
  return discussionService.listComments(
    ctx.organizationId,
    projectId,
    controlId,
    { includeDeleted },
  );
}

export async function createDiscussionForOrg(
  projectRepo: ProjectRepository,
  discussionService: DiscussionService,
  orgRepo: OrganizationRepository,
  notificationService: NotificationService,
  ctx: OrgContext,
  input: {
    projectId: string;
    controlId: string;
    parentCommentId?: string | null;
    body: string;
  },
  actor: ActorIdentity,
): Promise<DiscussionMutationResult> {
  const permission = input.parentCommentId
    ? "discussion.reply"
    : "discussion.create";
  requirePermission(ctx, ctx.organizationId, permission);
  if (!(await projectBelongsToOrg(projectRepo, ctx, input.projectId))) {
    return { ok: false, reason: "not-found", message: "Project not found." };
  }
  const mentionedUserIds = await resolveBodyMentions(
    orgRepo,
    ctx.organizationId,
    input.body,
  );
  const result = await discussionService.createComment(
    {
      organizationId: ctx.organizationId,
      projectId: input.projectId,
      controlId: input.controlId,
      parentCommentId: input.parentCommentId,
      body: input.body,
      mentionedUserIds,
    },
    { ...actor, actorId: ctx.userId },
  );
  await emitDiscussionNotifications({
    notificationService,
    discussionService,
    ctx,
    comment: result.comment,
    mentionedUserIds: result.mentionedUserIds,
    isNew: true,
  });
  await publishDomainEvent(
    discussionCreatedEvent({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      projectId: result.comment.projectId,
      controlId: result.comment.controlId,
      commentId: result.comment.id,
      parentCommentId: result.comment.parentCommentId,
      mentionedUserIds: result.mentionedUserIds,
    }),
  );
  return {
    ok: true,
    comment: result.comment,
    activity: result.activity,
    mentionedUserIds: result.mentionedUserIds,
  };
}

export async function editDiscussionForOrg(
  projectRepo: ProjectRepository,
  discussionService: DiscussionService,
  orgRepo: OrganizationRepository,
  notificationService: NotificationService,
  ctx: OrgContext,
  commentId: string,
  body: string,
  actor: ActorIdentity,
): Promise<DiscussionMutationResult> {
  const existing = await discussionService.getComment(
    ctx.organizationId,
    commentId,
  );
  if (!existing || existing.deletedAt) {
    return { ok: false, reason: "not-found", message: "Comment not found." };
  }
  if (!(await projectBelongsToOrg(projectRepo, ctx, existing.projectId))) {
    return { ok: false, reason: "not-found", message: "Comment not found." };
  }
  assertOwnOrModerate(ctx, existing.authorId, "discussion.edit_own");
  const mentionedUserIds = await resolveBodyMentions(
    orgRepo,
    ctx.organizationId,
    body,
  );
  const result = await discussionService.editComment(
    ctx.organizationId,
    commentId,
    body,
    { ...actor, actorId: ctx.userId },
    mentionedUserIds,
  );
  if (!result) {
    return { ok: false, reason: "not-found", message: "Comment not found." };
  }
  await emitDiscussionNotifications({
    notificationService,
    discussionService,
    ctx,
    comment: result.comment,
    mentionedUserIds: result.mentionedUserIds,
    isNew: false,
  });
  await publishDomainEvent(
    discussionUpdatedEvent({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      projectId: result.comment.projectId,
      controlId: result.comment.controlId,
      commentId: result.comment.id,
      mentionedUserIds: result.mentionedUserIds,
    }),
  );
  return {
    ok: true,
    comment: result.comment,
    activity: result.activity,
    mentionedUserIds: result.mentionedUserIds,
  };
}

export async function deleteDiscussionForOrg(
  projectRepo: ProjectRepository,
  discussionService: DiscussionService,
  ctx: OrgContext,
  commentId: string,
  actor: ActorIdentity,
): Promise<DiscussionMutationResult> {
  const existing = await discussionService.getComment(
    ctx.organizationId,
    commentId,
  );
  if (!existing || existing.deletedAt) {
    return { ok: false, reason: "not-found", message: "Comment not found." };
  }
  if (!(await projectBelongsToOrg(projectRepo, ctx, existing.projectId))) {
    return { ok: false, reason: "not-found", message: "Comment not found." };
  }
  assertOwnOrModerate(ctx, existing.authorId, "discussion.delete_own");
  const result = await discussionService.softDeleteComment(
    ctx.organizationId,
    commentId,
    { ...actor, actorId: ctx.userId },
  );
  if (!result) {
    return { ok: false, reason: "not-found", message: "Comment not found." };
  }
  return {
    ok: true,
    comment: result.comment,
    activity: result.activity,
    mentionedUserIds: result.mentionedUserIds,
  };
}

export async function restoreDiscussionForOrg(
  projectRepo: ProjectRepository,
  discussionService: DiscussionService,
  ctx: OrgContext,
  commentId: string,
  actor: ActorIdentity,
): Promise<DiscussionMutationResult> {
  requirePermission(ctx, ctx.organizationId, "discussion.moderate");
  const existing = await discussionService.getComment(
    ctx.organizationId,
    commentId,
  );
  if (!existing || !existing.deletedAt) {
    return { ok: false, reason: "not-found", message: "Comment not found." };
  }
  if (!(await projectBelongsToOrg(projectRepo, ctx, existing.projectId))) {
    return { ok: false, reason: "not-found", message: "Comment not found." };
  }
  const result = await discussionService.restoreComment(
    ctx.organizationId,
    commentId,
    { ...actor, actorId: ctx.userId },
  );
  if (!result) {
    return { ok: false, reason: "not-found", message: "Comment not found." };
  }
  return {
    ok: true,
    comment: result.comment,
    activity: result.activity,
    mentionedUserIds: result.mentionedUserIds,
  };
}

export async function resolveDiscussionForOrg(
  projectRepo: ProjectRepository,
  discussionService: DiscussionService,
  notificationService: NotificationService,
  ctx: OrgContext,
  commentId: string,
  actor: ActorIdentity,
): Promise<DiscussionMutationResult> {
  requirePermission(ctx, ctx.organizationId, "discussion.resolve");
  const existing = await discussionService.getComment(
    ctx.organizationId,
    commentId,
  );
  if (!existing || existing.deletedAt) {
    return { ok: false, reason: "not-found", message: "Comment not found." };
  }
  if (!(await projectBelongsToOrg(projectRepo, ctx, existing.projectId))) {
    return { ok: false, reason: "not-found", message: "Comment not found." };
  }
  if (!roleHasPermission(ctx.role, "discussion.moderate")) {
    let root = existing;
    while (root.parentCommentId) {
      const parent = await discussionService.getComment(
        ctx.organizationId,
        root.parentCommentId,
      );
      if (!parent) {
        break;
      }
      root = parent;
    }
    if (root.authorId !== ctx.userId) {
      throw new AuthorizationError(
        "forbidden",
        "Only the discussion author or a moderator may resolve this discussion.",
      );
    }
  }
  const result = await discussionService.resolveDiscussion(
    ctx.organizationId,
    commentId,
    { ...actor, actorId: ctx.userId },
  );
  if (!result) {
    return { ok: false, reason: "not-found", message: "Comment not found." };
  }
  await emitDiscussionNotifications({
    notificationService,
    discussionService,
    ctx,
    comment: result.comment,
    mentionedUserIds: [],
    isNew: false,
    resolved: true,
  });
  await publishDomainEvent(
    discussionResolvedEvent({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      projectId: result.comment.projectId,
      controlId: result.comment.controlId,
      commentId: result.comment.id,
      resolved: true,
    }),
  );
  return {
    ok: true,
    comment: result.comment,
    activity: result.activity,
    mentionedUserIds: result.mentionedUserIds,
  };
}

export async function reopenDiscussionForOrg(
  projectRepo: ProjectRepository,
  discussionService: DiscussionService,
  ctx: OrgContext,
  commentId: string,
  actor: ActorIdentity,
): Promise<DiscussionMutationResult> {
  requirePermission(ctx, ctx.organizationId, "discussion.resolve");
  const existing = await discussionService.getComment(
    ctx.organizationId,
    commentId,
  );
  if (!existing || existing.deletedAt || !existing.resolved) {
    return { ok: false, reason: "not-found", message: "Comment not found." };
  }
  if (!(await projectBelongsToOrg(projectRepo, ctx, existing.projectId))) {
    return { ok: false, reason: "not-found", message: "Comment not found." };
  }
  if (
    !roleHasPermission(ctx.role, "discussion.moderate") &&
    existing.authorId !== ctx.userId
  ) {
    throw new AuthorizationError(
      "forbidden",
      "Only the discussion author or a moderator may reopen this discussion.",
    );
  }
  const result = await discussionService.reopenDiscussion(
    ctx.organizationId,
    commentId,
    { ...actor, actorId: ctx.userId },
  );
  if (!result) {
    return { ok: false, reason: "not-found", message: "Comment not found." };
  }
  return {
    ok: true,
    comment: result.comment,
    activity: result.activity,
    mentionedUserIds: result.mentionedUserIds,
  };
}

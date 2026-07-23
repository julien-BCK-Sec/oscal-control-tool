import type { NotificationService } from "@/persistence/notification-service";
import type { DiscussionService } from "@/persistence/discussion-service";
import type { Comment } from "@/data/collaboration";
import type { OrgContext } from "@/authz/authorize";

/**
 * Emit in-app notifications for discussion events. Never notifies the actor.
 * Duplicate prevention is handled by the notification repository.
 */
export async function emitDiscussionNotifications(input: {
  notificationService: NotificationService;
  discussionService: DiscussionService;
  ctx: OrgContext;
  comment: Comment;
  mentionedUserIds: readonly string[];
  isNew: boolean;
  resolved?: boolean;
}): Promise<void> {
  const {
    notificationService,
    discussionService,
    ctx,
    comment,
    mentionedUserIds,
    isNew,
    resolved,
  } = input;
  const actorUserId = ctx.userId;
  const organizationId = ctx.organizationId;

  for (const recipientUserId of mentionedUserIds) {
    if (recipientUserId === actorUserId) {
      continue;
    }
    await notificationService.notify({
      organizationId,
      recipientUserId,
      actorUserId,
      eventType: "comment_mention",
      relatedObjectType: "comment",
      relatedObjectId: comment.id,
      projectId: comment.projectId,
      controlId: comment.controlId,
      summary: `You were mentioned on control ${comment.controlId}`,
    });
  }

  if (isNew && comment.parentCommentId) {
    const parent = await discussionService.getComment(
      organizationId,
      comment.parentCommentId,
    );
    if (parent && parent.authorId !== actorUserId) {
      await notificationService.notify({
        organizationId,
        recipientUserId: parent.authorId,
        actorUserId,
        eventType: "comment_reply",
        relatedObjectType: "comment",
        relatedObjectId: comment.id,
        projectId: comment.projectId,
        controlId: comment.controlId,
        summary: `New reply on control ${comment.controlId}`,
      });
    }
  }

  if (resolved) {
    let root = comment;
    while (root.parentCommentId) {
      const parent = await discussionService.getComment(
        organizationId,
        root.parentCommentId,
      );
      if (!parent) {
        break;
      }
      root = parent;
    }
    if (root.authorId !== actorUserId) {
      await notificationService.notify({
        organizationId,
        recipientUserId: root.authorId,
        actorUserId,
        eventType: "discussion_resolved",
        relatedObjectType: "comment",
        relatedObjectId: comment.id,
        projectId: comment.projectId,
        controlId: comment.controlId,
        summary: `Discussion resolved on control ${comment.controlId}`,
      });
    }
  }
}

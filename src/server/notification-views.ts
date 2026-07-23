import type { Notification } from "@/data/collaboration";
import type { DiscussionService } from "@/persistence/discussion-service";
import type { NotificationService } from "@/persistence/notification-service";
import type { ProjectRepository } from "@/persistence/repository";
import {
  toNotificationView,
  truncateNotificationPreview,
  type NotificationView,
} from "@/components/collaboration/notification-presentation";
import { listNotificationsForUser } from "@/server/authorized-notifications";
import { requirePermission, type OrgContext } from "@/authz/authorize";

/**
 * Enrich notifications for the notification center without N+1 UI queries.
 * Project names and comment previews are loaded once per unique id.
 * Cross-tenant names/previews are never attached.
 */
export async function listNotificationViewsForUser(
  notificationService: NotificationService,
  projectRepo: ProjectRepository,
  discussionService: DiscussionService,
  ctx: OrgContext,
  options?: { unreadOnly?: boolean; limit?: number },
): Promise<NotificationView[]> {
  requirePermission(ctx, ctx.organizationId, "notification.read");
  const notifications = await listNotificationsForUser(
    notificationService,
    ctx,
    options,
  );
  return enrichNotifications(notifications, projectRepo, discussionService);
}

export async function enrichNotifications(
  notifications: Notification[],
  projectRepo: ProjectRepository,
  discussionService: DiscussionService,
): Promise<NotificationView[]> {
  const projectMetaById = new Map<
    string,
    { name: string; organizationId: string }
  >();
  const uniqueProjectIds = [
    ...new Set(
      notifications
        .map((item) => item.projectId?.trim())
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  await Promise.all(
    uniqueProjectIds.map(async (projectId) => {
      const loaded = await projectRepo.load(projectId);
      if (loaded.ok && loaded.project.organizationId) {
        projectMetaById.set(projectId, {
          name: loaded.project.name,
          organizationId: loaded.project.organizationId,
        });
      }
    }),
  );

  const previewByCommentKey = new Map<string, string | null>();
  const commentLookups = new Map<
    string,
    { organizationId: string; commentId: string }
  >();
  for (const item of notifications) {
    if (item.relatedObjectType !== "comment") {
      continue;
    }
    const commentId = item.relatedObjectId.trim();
    if (!commentId) {
      continue;
    }
    const key = `${item.organizationId}:${commentId}`;
    if (!commentLookups.has(key)) {
      commentLookups.set(key, {
        organizationId: item.organizationId,
        commentId,
      });
    }
  }
  await Promise.all(
    [...commentLookups.entries()].map(async ([key, lookup]) => {
      const comment = await discussionService.getComment(
        lookup.organizationId,
        lookup.commentId,
      );
      if (!comment || comment.organizationId !== lookup.organizationId) {
        previewByCommentKey.set(key, null);
        return;
      }
      if (comment.deletedAt) {
        previewByCommentKey.set(key, "Comment deleted");
        return;
      }
      previewByCommentKey.set(key, truncateNotificationPreview(comment.body));
    }),
  );

  return notifications.map((notification) => {
    const projectId = notification.projectId?.trim();
    const meta = projectId ? projectMetaById.get(projectId) : undefined;
    const projectName =
      meta && meta.organizationId === notification.organizationId
        ? meta.name
        : null;

    const preview =
      notification.relatedObjectType === "comment"
        ? (previewByCommentKey.get(
            `${notification.organizationId}:${notification.relatedObjectId.trim()}`,
          ) ?? null)
        : null;

    return toNotificationView(notification, { projectName, preview });
  });
}

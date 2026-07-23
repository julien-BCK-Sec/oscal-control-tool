import type { Notification } from "@/data/collaboration";
import type { NotificationService } from "@/persistence/notification-service";
import {
  requirePermission,
  type OrgContext,
} from "@/authz/authorize";

/**
 * Authorized notification center operations (Milestone 02A WP4).
 * Recipients may only read/manage their own notifications.
 */

export async function listNotificationsForUser(
  notificationService: NotificationService,
  ctx: OrgContext,
  options?: { unreadOnly?: boolean; limit?: number },
): Promise<Notification[]> {
  requirePermission(ctx, ctx.organizationId, "notification.read");
  return notificationService.listForRecipient(ctx.userId, {
    unreadOnly: options?.unreadOnly,
    limit: options?.limit ?? 50,
  });
}

export async function countUnreadNotificationsForUser(
  notificationService: NotificationService,
  ctx: OrgContext,
): Promise<number> {
  requirePermission(ctx, ctx.organizationId, "notification.read");
  return notificationService.countUnread(ctx.userId);
}

export async function markNotificationReadForUser(
  notificationService: NotificationService,
  ctx: OrgContext,
  notificationId: string,
): Promise<Notification | null> {
  requirePermission(ctx, ctx.organizationId, "notification.manage_own");
  return notificationService.markRead(ctx.userId, notificationId);
}

export async function markAllNotificationsReadForUser(
  notificationService: NotificationService,
  ctx: OrgContext,
): Promise<number> {
  requirePermission(ctx, ctx.organizationId, "notification.manage_own");
  return notificationService.markAllRead(ctx.userId);
}

export async function deleteNotificationForUser(
  notificationService: NotificationService,
  ctx: OrgContext,
  notificationId: string,
): Promise<Notification | null> {
  requirePermission(ctx, ctx.organizationId, "notification.manage_own");
  return notificationService.softDelete(ctx.userId, notificationId);
}

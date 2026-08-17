"use server";

import type { NotificationView } from "@/components/collaboration/notification-presentation";
import { AuthorizationError, can } from "@/authz/authorize";
import { getSessionUser, resolveOrgContext } from "@/auth/context";
import { createPostgresNotificationRepository } from "@/persistence/postgres/notification-repository";
import { createPostgresDiscussionService } from "@/persistence/postgres/discussion-service";
import { createNotificationService } from "@/persistence/notification-service";
import { getDb } from "@/persistence/postgres/client";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { getProjectRepository } from "@/persistence/server";
import {
  countUnreadNotificationsForUser,
  deleteNotificationForUser,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
} from "@/server/authorized-notifications";
import { listNotificationViewsForUser } from "@/server/notification-views";

/**
 * Resolve org context from a notification's owning organization.
 * Recipient ownership is enforced by loading with the session user id.
 */
async function resolveNotificationOrgContext(notificationId: string) {
  const user = await getSessionUser();
  if (!user || typeof notificationId !== "string" || !notificationId.trim()) {
    return null;
  }
  const notifications = await getNotifications();
  const notification = await notifications.getById(
    user.id,
    notificationId.trim(),
  );
  if (!notification) {
    return null;
  }
  const ctx = await resolveOrgContext(user.id, notification.organizationId);
  if (!ctx) {
    return null;
  }
  return { ctx, notifications, notificationId: notification.id };
}

/**
 * Inbox reads are recipient-scoped. Require notification.read in at least
 * one membership rather than trusting memberships[0].
 */
async function resolveAnyNotificationReadContext() {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }
  const orgs = createPostgresOrganizationRepository(await getDb());
  const memberships = await orgs.listOrganizationsForUser(user.id);
  for (const membership of memberships) {
    const ctx = await resolveOrgContext(user.id, membership.organizationId);
    if (ctx && can(ctx, ctx.organizationId, "notification.read")) {
      return ctx;
    }
  }
  return null;
}

async function getNotifications() {
  return createNotificationService(
    createPostgresNotificationRepository(await getDb()),
  );
}

export async function listNotificationsAction(options?: {
  unreadOnly?: boolean;
  limit?: number;
}): Promise<NotificationView[]> {
  const ctx = await resolveAnyNotificationReadContext();
  if (!ctx) {
    return [];
  }
  try {
    return await listNotificationViewsForUser(
      await getNotifications(),
      await getProjectRepository(),
      createPostgresDiscussionService(await getDb()),
      ctx,
      options,
    );
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return [];
    }
    throw error;
  }
}

export async function countUnreadNotificationsAction(): Promise<number> {
  const ctx = await resolveAnyNotificationReadContext();
  if (!ctx) {
    return 0;
  }
  try {
    return await countUnreadNotificationsForUser(
      await getNotifications(),
      ctx,
    );
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return 0;
    }
    throw error;
  }
}

export async function markNotificationReadAction(
  notificationId: string,
): Promise<{ ok: boolean }> {
  const resolved = await resolveNotificationOrgContext(notificationId);
  if (!resolved) {
    return { ok: false };
  }
  try {
    const result = await markNotificationReadForUser(
      resolved.notifications,
      resolved.ctx,
      resolved.notificationId,
    );
    return { ok: Boolean(result) };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false };
    }
    throw error;
  }
}

export async function markAllNotificationsReadAction(): Promise<{
  ok: boolean;
  count: number;
}> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, count: 0 };
  }
  const orgs = createPostgresOrganizationRepository(await getDb());
  const memberships = await orgs.listOrganizationsForUser(user.id);
  const notifications = await getNotifications();
  let count = 0;
  let anyAuthorized = false;
  for (const membership of memberships) {
    const ctx = await resolveOrgContext(user.id, membership.organizationId);
    if (!ctx) {
      continue;
    }
    try {
      count += await markAllNotificationsReadForUser(notifications, ctx);
      anyAuthorized = true;
    } catch (error) {
      if (error instanceof AuthorizationError) {
        continue;
      }
      throw error;
    }
  }
  return { ok: anyAuthorized, count };
}

export async function deleteNotificationAction(
  notificationId: string,
): Promise<{ ok: boolean }> {
  const resolved = await resolveNotificationOrgContext(notificationId);
  if (!resolved) {
    return { ok: false };
  }
  try {
    const result = await deleteNotificationForUser(
      resolved.notifications,
      resolved.ctx,
      resolved.notificationId,
    );
    return { ok: Boolean(result) };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false };
    }
    throw error;
  }
}

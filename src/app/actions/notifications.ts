"use server";

import type { NotificationView } from "@/components/collaboration/notification-presentation";
import { AuthorizationError } from "@/authz/authorize";
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

async function resolveUserContext() {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }
  const orgs = createPostgresOrganizationRepository(await getDb());
  const memberships = await orgs.listOrganizationsForUser(user.id);
  const active = memberships[0];
  if (!active) {
    return null;
  }
  const ctx = await resolveOrgContext(user.id, active.organizationId);
  if (!ctx) {
    return null;
  }
  return ctx;
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
  const ctx = await resolveUserContext();
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
  const ctx = await resolveUserContext();
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
  const ctx = await resolveUserContext();
  if (!ctx || typeof notificationId !== "string" || !notificationId.trim()) {
    return { ok: false };
  }
  try {
    const result = await markNotificationReadForUser(
      await getNotifications(),
      ctx,
      notificationId.trim(),
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
  const ctx = await resolveUserContext();
  if (!ctx) {
    return { ok: false, count: 0 };
  }
  try {
    const count = await markAllNotificationsReadForUser(
      await getNotifications(),
      ctx,
    );
    return { ok: true, count };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, count: 0 };
    }
    throw error;
  }
}

export async function deleteNotificationAction(
  notificationId: string,
): Promise<{ ok: boolean }> {
  const ctx = await resolveUserContext();
  if (!ctx || typeof notificationId !== "string" || !notificationId.trim()) {
    return { ok: false };
  }
  try {
    const result = await deleteNotificationForUser(
      await getNotifications(),
      ctx,
      notificationId.trim(),
    );
    return { ok: Boolean(result) };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false };
    }
    throw error;
  }
}

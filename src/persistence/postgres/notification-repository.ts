import "server-only";

import { and, desc, eq, isNull, lt, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  isNotificationEventType,
  type CreateNotificationInput,
  type Notification,
  type NotificationRelatedObjectType,
} from "@/data/collaboration";
import type {
  ListNotificationsOptions,
  NotificationRepository,
} from "../notification-repository";
import type { AppDatabase } from "./client";
import { notifications } from "./schema";

function nowIso(): string {
  return new Date().toISOString();
}

function toNotification(
  row: typeof notifications.$inferSelect,
): Notification {
  const eventType = isNotificationEventType(row.eventType)
    ? row.eventType
    : "comment_mention";
  return {
    id: row.id,
    organizationId: row.organizationId,
    recipientUserId: row.recipientUserId,
    actorUserId: row.actorUserId,
    eventType,
    relatedObjectType: row.relatedObjectType as NotificationRelatedObjectType,
    relatedObjectId: row.relatedObjectId,
    projectId: row.projectId,
    controlId: row.controlId,
    summary: row.summary,
    readAt: row.readAt,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
  };
}

export function createPostgresNotificationRepository(
  db: AppDatabase,
): NotificationRepository {
  return {
    async create(input: CreateNotificationInput): Promise<Notification> {
      const organizationId = input.organizationId.trim();
      const recipientUserId = input.recipientUserId.trim();
      const relatedObjectId = input.relatedObjectId.trim();
      const summary = input.summary.trim();
      if (!organizationId || !recipientUserId || !relatedObjectId || !summary) {
        throw new Error(
          "organizationId, recipientUserId, relatedObjectId, and summary are required.",
        );
      }
      if (!isNotificationEventType(input.eventType)) {
        throw new Error("Invalid notification event type.");
      }

      const existing = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.recipientUserId, recipientUserId),
            eq(notifications.eventType, input.eventType),
            eq(notifications.relatedObjectId, relatedObjectId),
            isNull(notifications.deletedAt),
          ),
        )
        .limit(1);
      if (existing[0]) {
        return toNotification(existing[0]);
      }

      const id = randomUUID();
      const createdAt = nowIso();
      const row = {
        id,
        organizationId,
        recipientUserId,
        actorUserId: input.actorUserId ?? null,
        eventType: input.eventType,
        relatedObjectType: input.relatedObjectType,
        relatedObjectId,
        projectId: input.projectId ?? null,
        controlId: input.controlId ?? null,
        summary,
        readAt: null,
        deletedAt: null,
        createdAt,
      };

      try {
        await db.insert(notifications).values(row);
      } catch (error) {
        // Race: unique constraint hit — return the existing row.
        const raced = await db
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.recipientUserId, recipientUserId),
              eq(notifications.eventType, input.eventType),
              eq(notifications.relatedObjectId, relatedObjectId),
            ),
          )
          .limit(1);
        if (raced[0]) {
          return toNotification(raced[0]);
        }
        throw error;
      }
      return toNotification(row);
    },

    async getById(
      recipientUserId: string,
      notificationId: string,
    ): Promise<Notification | null> {
      const rows = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.recipientUserId, recipientUserId.trim()),
          ),
        )
        .limit(1);
      return rows[0] ? toNotification(rows[0]) : null;
    },

    async listForRecipient(
      recipientUserId: string,
      options?: ListNotificationsOptions,
    ): Promise<Notification[]> {
      const conditions = [
        eq(notifications.recipientUserId, recipientUserId.trim()),
      ];
      if (!options?.includeDeleted) {
        conditions.push(isNull(notifications.deletedAt));
      }
      if (options?.unreadOnly) {
        conditions.push(isNull(notifications.readAt));
      }
      if (options?.beforeCreatedAt) {
        conditions.push(lt(notifications.createdAt, options.beforeCreatedAt));
      }

      const rows = await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(options?.limit ?? 100);
      return rows.map(toNotification);
    },

    async countUnread(recipientUserId: string): Promise<number> {
      const rows = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(
          and(
            eq(notifications.recipientUserId, recipientUserId.trim()),
            isNull(notifications.deletedAt),
            isNull(notifications.readAt),
          ),
        );
      return rows[0]?.count ?? 0;
    },

    async markRead(
      recipientUserId: string,
      notificationId: string,
      readAt: string = nowIso(),
    ): Promise<Notification | null> {
      const existing = await this.getById(recipientUserId, notificationId);
      if (!existing || existing.deletedAt) {
        return null;
      }
      if (existing.readAt) {
        return existing;
      }
      await db
        .update(notifications)
        .set({ readAt })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.recipientUserId, recipientUserId.trim()),
          ),
        );
      return { ...existing, readAt };
    },

    async markAllRead(
      recipientUserId: string,
      readAt: string = nowIso(),
    ): Promise<number> {
      const unread = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.recipientUserId, recipientUserId.trim()),
            isNull(notifications.deletedAt),
            isNull(notifications.readAt),
          ),
        );
      if (unread.length === 0) {
        return 0;
      }
      await db
        .update(notifications)
        .set({ readAt })
        .where(
          and(
            eq(notifications.recipientUserId, recipientUserId.trim()),
            isNull(notifications.deletedAt),
            isNull(notifications.readAt),
          ),
        );
      return unread.length;
    },

    async softDelete(
      recipientUserId: string,
      notificationId: string,
      deletedAt: string = nowIso(),
    ): Promise<Notification | null> {
      const existing = await this.getById(recipientUserId, notificationId);
      if (!existing || existing.deletedAt) {
        return null;
      }
      await db
        .update(notifications)
        .set({ deletedAt })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.recipientUserId, recipientUserId.trim()),
          ),
        );
      return { ...existing, deletedAt };
    },
  };
}

export { toNotification };

import type {
  CreateNotificationInput,
  Notification,
} from "@/data/collaboration";

export type ListNotificationsOptions = {
  unreadOnly?: boolean;
  /** Defaults to excluding soft-deleted notifications. */
  includeDeleted?: boolean;
  limit?: number;
  /** ISO timestamp cursor: return notifications created strictly before this. */
  beforeCreatedAt?: string;
};

/**
 * Persistence boundary for in-app notifications.
 * Recipient-scoped; organizationId is retained for tenant audit.
 */
export interface NotificationRepository {
  /**
   * Insert a notification. Duplicate prevention: if an active notification
   * already exists for the same recipient + eventType + relatedObjectId,
   * returns the existing row without inserting.
   */
  create(input: CreateNotificationInput): Promise<Notification>;
  getById(
    recipientUserId: string,
    notificationId: string,
  ): Promise<Notification | null>;
  listForRecipient(
    recipientUserId: string,
    options?: ListNotificationsOptions,
  ): Promise<Notification[]>;
  countUnread(recipientUserId: string): Promise<number>;
  markRead(
    recipientUserId: string,
    notificationId: string,
    readAt?: string,
  ): Promise<Notification | null>;
  markAllRead(
    recipientUserId: string,
    readAt?: string,
  ): Promise<number>;
  softDelete(
    recipientUserId: string,
    notificationId: string,
    deletedAt?: string,
  ): Promise<Notification | null>;
}

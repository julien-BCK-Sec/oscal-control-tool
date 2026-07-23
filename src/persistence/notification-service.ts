import type {
  CreateNotificationInput,
  Notification,
} from "@/data/collaboration";
import type { NotificationRepository } from "./notification-repository";

/**
 * Creates in-app notifications with duplicate prevention delegated to the
 * repository. Callers supply already-authorized recipient ids.
 */
export interface NotificationService {
  notify(input: CreateNotificationInput): Promise<Notification>;
  notifyMany(inputs: CreateNotificationInput[]): Promise<Notification[]>;
  listForRecipient(
    recipientUserId: string,
    options?: { unreadOnly?: boolean; limit?: number; beforeCreatedAt?: string },
  ): Promise<Notification[]>;
  countUnread(recipientUserId: string): Promise<number>;
  markRead(
    recipientUserId: string,
    notificationId: string,
  ): Promise<Notification | null>;
  markAllRead(recipientUserId: string): Promise<number>;
  softDelete(
    recipientUserId: string,
    notificationId: string,
  ): Promise<Notification | null>;
}

export function createNotificationService(
  repo: NotificationRepository,
): NotificationService {
  return {
    notify(input) {
      return repo.create(input);
    },
    async notifyMany(inputs) {
      const created: Notification[] = [];
      for (const input of inputs) {
        created.push(await repo.create(input));
      }
      return created;
    },
    listForRecipient(recipientUserId, options) {
      return repo.listForRecipient(recipientUserId, options);
    },
    countUnread(recipientUserId) {
      return repo.countUnread(recipientUserId);
    },
    markRead(recipientUserId, notificationId) {
      return repo.markRead(recipientUserId, notificationId);
    },
    markAllRead(recipientUserId) {
      return repo.markAllRead(recipientUserId);
    },
    softDelete(recipientUserId, notificationId) {
      return repo.softDelete(recipientUserId, notificationId);
    },
  };
}

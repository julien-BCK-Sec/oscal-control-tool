/**
 * Client-side signal that in-app notifications may have changed
 * (e.g. after collaboration or workflow side effects).
 */

export const NOTIFICATIONS_CHANGED_EVENT = "cf:notifications-changed";

export function notifyNotificationsChanged(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

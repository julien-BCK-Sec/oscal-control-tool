"use client";

import { AuthenticatedAccountMenu } from "@/components/auth/AuthenticatedAccountMenu";
import { NotificationCenter } from "@/components/collaboration/NotificationCenter";

/**
 * Trailing actions for the authenticated product header. Keeps notifications
 * and the account menu consistent across every page that uses `ProductHeader`.
 */
export function AuthenticatedHeaderActions() {
  return (
    <>
      <NotificationCenter />
      <AuthenticatedAccountMenu />
    </>
  );
}

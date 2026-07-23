"use client";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { NotificationCenter } from "@/components/collaboration/NotificationCenter";

/**
 * Trailing actions for the authenticated product header. Keeps notifications
 * and sign-out consistent across every page that uses `ProductHeader`.
 */
export function AuthenticatedHeaderActions() {
  return (
    <>
      <NotificationCenter />
      <SignOutButton />
    </>
  );
}

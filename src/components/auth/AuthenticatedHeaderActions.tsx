"use client";

import Link from "next/link";
import { AuthenticatedAccountMenu } from "@/components/auth/AuthenticatedAccountMenu";
import { NotificationCenter } from "@/components/collaboration/NotificationCenter";

/**
 * Trailing actions for the authenticated product header. Keeps notifications,
 * Help, and the account menu consistent across every page that uses
 * `ProductHeader`.
 */
export function AuthenticatedHeaderActions() {
  return (
    <>
      <Link href="/help" className="btn btn-sm" aria-label="Open the user guide">
        Help
      </Link>
      <NotificationCenter />
      <AuthenticatedAccountMenu />
    </>
  );
}

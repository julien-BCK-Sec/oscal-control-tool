"use client";

import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

/**
 * Browser Better Auth client (ADR-015). Talks to the server `/api/auth/*`
 * routes; holds no secrets. The organization client enables session-scoped
 * organization queries and switching the active organization.
 */
export const authClient = createAuthClient({
  // Production images omit NEXT_PUBLIC_APP_URL so the client uses the current
  // origin. Local bootstrap inlines localhost; skip that in development so a
  // LAN host (allowedDevOrigins) can sign in same-origin.
  baseURL:
    process.env.NODE_ENV === "development"
      ? undefined
      : process.env.NEXT_PUBLIC_APP_URL,
  plugins: [organizationClient()],
});

export const { signIn, signOut, signUp, useSession, organization } = authClient;

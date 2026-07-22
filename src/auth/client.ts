"use client";

import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

/**
 * Browser Better Auth client (ADR-015). Talks to the server `/api/auth/*`
 * routes; holds no secrets. The organization client enables session-scoped
 * organization queries and switching the active organization.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [organizationClient()],
});

export const { signIn, signOut, signUp, useSession, organization } = authClient;

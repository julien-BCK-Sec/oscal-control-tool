import "server-only";

import { headers } from "next/headers";
import { getDb } from "@/persistence/postgres/client";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import type { ActorIdentity } from "@/persistence/actor";
import { AuthorizationError, type OrgContext } from "@/authz/authorize";
import { getAuth } from "./server";

export type AuthSession = Awaited<
  ReturnType<ReturnType<typeof getAuth>["api"]["getSession"]>
>;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
};

/** Read and validate the current server-side session (opaque cookie). */
export async function getAuthSession(): Promise<AuthSession> {
  return getAuth().api.getSession({ headers: await headers() });
}

/** Authenticated user, or null when there is no valid session. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getAuthSession();
  if (!session?.user) {
    return null;
  }
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    emailVerified: session.user.emailVerified,
  };
}

/** Actor identity for activity records (ADR-015). Null when unauthenticated. */
export function sessionActor(user: SessionUser | null): ActorIdentity | null {
  if (!user) {
    return null;
  }
  return {
    actorId: user.id,
    actorDisplayName: user.name?.trim() || user.email,
  };
}

/** Currently selected organization for the session, if any. */
export async function getActiveOrganizationId(): Promise<string | null> {
  const session = await getAuthSession();
  // `activeOrganizationId` is contributed by the organization plugin at
  // runtime; it is not part of the base session type inference, so read it
  // defensively without widening to `any`.
  const sessionRecord = session?.session as
    | { activeOrganizationId?: string | null }
    | undefined;
  const active = sessionRecord?.activeOrganizationId;
  return typeof active === "string" && active.length > 0 ? active : null;
}

/**
 * Resolve the organization context (role) for `userId` in `organizationId`.
 * Returns null when the user has no membership — the caller must fail closed.
 * The role is read from the server-side `member` table, never from client
 * input, so a client-supplied organization id cannot escalate authority.
 */
export async function resolveOrgContext(
  userId: string,
  organizationId: string,
): Promise<OrgContext | null> {
  const repo = createPostgresOrganizationRepository(await getDb());
  const membership = await repo.getMembership(organizationId, userId);
  if (!membership) {
    return null;
  }
  return {
    userId,
    organizationId,
    role: membership.role,
  };
}

/**
 * Determine the organization the current request should act in when none is
 * derived from a resource: prefer the session's active organization, else the
 * user's first membership. Returns null when the user belongs to no
 * organization.
 */
export async function resolveDefaultOrganizationId(
  userId: string,
): Promise<string | null> {
  const active = await getActiveOrganizationId();
  if (active) {
    return active;
  }
  const repo = createPostgresOrganizationRepository(await getDb());
  const orgs = await repo.listOrganizationsForUser(userId);
  return orgs[0]?.organizationId ?? null;
}

/** Throwing variant used by server actions. */
export function requireSessionUser(user: SessionUser | null): SessionUser {
  if (!user) {
    throw new AuthorizationError("unauthenticated", "Authentication is required.");
  }
  return user;
}

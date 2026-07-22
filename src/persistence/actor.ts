/**
 * Resolves the actor for ControlActivity rows.
 *
 * No internal User model yet. Cloudflare Access / session identity can plug
 * into this helper later without touching repositories or UI components.
 */

export type ActorIdentity = {
  actorId: string | null;
  actorDisplayName: string;
};

export const SYSTEM_ACTOR: ActorIdentity = {
  actorId: null,
  actorDisplayName: "System",
};

export const UNKNOWN_ACTOR: ActorIdentity = {
  actorId: null,
  actorDisplayName: "Unknown user",
};

type HeaderSource = {
  get(name: string): string | null;
};

/**
 * Optional identity claims from an authenticated edge proxy.
 * Kept isolated here so repositories never parse Cloudflare headers.
 */
function identityFromAccessHeaders(
  headers: HeaderSource | null | undefined,
): ActorIdentity | null {
  if (!headers) {
    return null;
  }

  const email =
    headers.get("cf-access-authenticated-user-email")?.trim() ||
    headers.get("Cf-Access-Authenticated-User-Email")?.trim() ||
    null;
  if (email) {
    return {
      actorId: email,
      actorDisplayName: email,
    };
  }

  return null;
}

/**
 * Resolve actor for the current request.
 * Falls back to System when no identity is available (local / single-user).
 */
export function resolveActor(
  headers?: HeaderSource | null,
): ActorIdentity {
  return identityFromAccessHeaders(headers) ?? SYSTEM_ACTOR;
}

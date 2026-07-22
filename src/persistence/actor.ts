/**
 * Actor identity for ControlActivity rows.
 *
 * Authenticated product paths resolve actors via `sessionActor` in
 * `src/auth/context.ts` (Better Auth session → user id + display name).
 * Automated operations (migrations, seeds, jobs) use `SYSTEM_ACTOR`.
 *
 * `resolveActor` remains a narrow header-based helper for tests and legacy
 * edge-proxy experiments; it must not be treated as the product auth boundary.
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
 * Kept isolated so repositories never parse proxy headers.
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
 * Resolve actor from optional proxy headers, else System.
 * Prefer `sessionActor` for authenticated Control Freak actions.
 */
export function resolveActor(
  headers?: HeaderSource | null,
): ActorIdentity {
  return identityFromAccessHeaders(headers) ?? SYSTEM_ACTOR;
}

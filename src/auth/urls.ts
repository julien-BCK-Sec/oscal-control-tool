/**
 * Public URL / origin helpers for Better Auth (ADR-015 / ADR-028).
 *
 * Hosting hostnames are never hard-coded. Operators set BETTER_AUTH_URL
 * and optionally NEXT_PUBLIC_APP_URL / BETTER_AUTH_TRUSTED_ORIGINS.
 */

export function resolveAuthBaseUrl(
  env: Record<string, string | undefined> = process.env,
): string | undefined {
  return (
    env.BETTER_AUTH_URL?.trim() || env.NEXT_PUBLIC_APP_URL?.trim() || undefined
  );
}

function addOrigin(origins: Set<string>, raw: string | undefined): void {
  const value = raw?.trim();
  if (!value) {
    return;
  }
  try {
    origins.add(new URL(value).origin);
  } catch {
    // Invalid URLs are rejected by production env validation / Better Auth.
  }
}

/**
 * Origins derived from configured public URLs. Better Auth also trusts
 * `baseURL` and comma-separated BETTER_AUTH_TRUSTED_ORIGINS.
 *
 * In `next dev` only, also trust the LAN host from `allowedDevOrigins` so
 * sign-in from http://192.168.211.160:3000 is same-origin CSRF-safe. Production
 * never receives this origin.
 */
export function resolveConfiguredTrustedOrigins(
  env: Record<string, string | undefined> = process.env,
): string[] {
  const origins = new Set<string>();
  for (const raw of [env.BETTER_AUTH_URL, env.NEXT_PUBLIC_APP_URL]) {
    addOrigin(origins, raw);
  }
  for (const raw of env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? []) {
    addOrigin(origins, raw);
  }
  if (env.NODE_ENV === "development") {
    const port = env.PORT?.trim() || "3000";
    addOrigin(origins, `http://192.168.211.160:${port}`);
  }
  return [...origins];
}

export function shouldTrustProxyHeaders(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.BETTER_AUTH_TRUSTED_PROXY_HEADERS?.trim().toLowerCase() === "true";
}

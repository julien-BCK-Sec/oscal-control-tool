/**
 * Safety gates for the developer demo bootstrap.
 * This is a setup tool, never a reset tool, and never runs in production.
 */

export class BootstrapSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BootstrapSafetyError";
  }
}

function hostnameFromDatabaseUrl(databaseUrl: string): string | null {
  try {
    const normalized = databaseUrl.replace(/^postgres(ql)?:/i, "http:");
    return new URL(normalized).hostname.toLowerCase() || null;
  } catch {
    return null;
  }
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".local")
  );
}

/**
 * Refuse production / remote targets. Throws BootstrapSafetyError.
 */
export function assertDevBootstrapAllowed(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (env.NODE_ENV === "production") {
    throw new BootstrapSafetyError(
      "bootstrap:demo refuses to run when NODE_ENV=production.",
    );
  }
  if (env.RENDER === "true" || env.RENDER_SERVICE_ID) {
    throw new BootstrapSafetyError(
      "bootstrap:demo refuses to run on Render / production hosting.",
    );
  }

  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new BootstrapSafetyError(
      "DATABASE_URL is required before bootstrap:demo can continue.",
    );
  }

  const host = hostnameFromDatabaseUrl(databaseUrl);
  if (!host) {
    throw new BootstrapSafetyError(
      "DATABASE_URL could not be parsed; refusing to bootstrap.",
    );
  }
  if (!isLocalHostname(host)) {
    throw new BootstrapSafetyError(
      `bootstrap:demo refuses non-local DATABASE_URL host "${host}". ` +
        "Use local Compose PostgreSQL only.",
    );
  }

  // Common managed-provider markers even if somehow pointed at a local alias.
  if (
    /render\.com|amazonaws\.com|neon\.tech|supabase\.co|railway\.app|azure\.com/i.test(
      databaseUrl,
    )
  ) {
    throw new BootstrapSafetyError(
      "bootstrap:demo refuses managed/production-looking DATABASE_URL values.",
    );
  }
}

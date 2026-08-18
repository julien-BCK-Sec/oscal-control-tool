/**
 * Safety gates for demo seed and bootstrap commands.
 *
 * Distinguishes:
 * - safe idempotent demo initialization (may run in a future demo deployment);
 * - destructive local reset/rebuild (never production).
 *
 * `bootstrap:demo` also writes `.env.local`, so that orchestrator stays
 * local-development-only. Production demo startup uses DEPLOYMENT_MODE=demo
 * and the shared canonical demo library (see `src/seed/canonical-demo.ts`
 * and `src/deployment/`). Do not use this module to decide production
 * startup; use `resolveProductionDeploymentMode` instead.
 */

export class DemoSeedSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DemoSeedSafetyError";
  }
}

/** @deprecated Use DemoSeedSafetyError. Kept for existing bootstrap imports. */
export class BootstrapSafetyError extends DemoSeedSafetyError {
  constructor(message: string) {
    super(message);
    this.name = "BootstrapSafetyError";
  }
}

export type DeploymentMode = "demo" | "normal" | "unset";

/**
 * Loose seed-safety mode parser. Unknown or omitted values are `unset`.
 * Production startup uses `resolveProductionDeploymentMode`, which defaults
 * omitted values to `normal` and rejects unknown values.
 */
export function resolveDeploymentMode(
  env: NodeJS.ProcessEnv = process.env,
): DeploymentMode {
  const raw = env.DEPLOYMENT_MODE?.trim().toLowerCase();
  if (raw === "demo") {
    return "demo";
  }
  if (raw === "normal") {
    return "normal";
  }
  return "unset";
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

function looksManaged(databaseUrl: string): boolean {
  return /render\.com|amazonaws\.com|neon\.tech|supabase\.co|railway\.app|azure\.com/i.test(
    databaseUrl,
  );
}

function requireDatabaseUrl(env: NodeJS.ProcessEnv): string {
  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new DemoSeedSafetyError(
      "DATABASE_URL is required before demo seed/bootstrap can continue.",
    );
  }
  return databaseUrl;
}

function assertNotRender(env: NodeJS.ProcessEnv): void {
  if (env.RENDER === "true" || env.RENDER_SERVICE_ID) {
    throw new DemoSeedSafetyError(
      "This command refuses to run on Render / production hosting.",
    );
  }
}

function assertLocalDatabase(databaseUrl: string, commandLabel: string): void {
  const host = hostnameFromDatabaseUrl(databaseUrl);
  if (!host) {
    throw new DemoSeedSafetyError(
      "DATABASE_URL could not be parsed; refusing to continue.",
    );
  }
  if (!isLocalHostname(host)) {
    throw new DemoSeedSafetyError(
      `${commandLabel} refuses non-local DATABASE_URL host "${host}". ` +
        "Use local Compose PostgreSQL only.",
    );
  }
  if (looksManaged(databaseUrl)) {
    throw new DemoSeedSafetyError(
      `${commandLabel} refuses managed/production-looking DATABASE_URL values.`,
    );
  }
}

/**
 * Local developer bootstrap (`npm run bootstrap:demo`).
 * Writes `.env.local` and must never target production.
 */
export function assertDevBootstrapAllowed(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (env.NODE_ENV === "production") {
    throw new BootstrapSafetyError(
      "bootstrap:demo refuses to run when NODE_ENV=production.",
    );
  }
  assertNotRender(env);
  const databaseUrl = requireDatabaseUrl(env);
  try {
    assertLocalDatabase(databaseUrl, "bootstrap:demo");
  } catch (error) {
    if (error instanceof DemoSeedSafetyError) {
      throw new BootstrapSafetyError(error.message);
    }
    throw error;
  }
}

/**
 * Safe idempotent demo initialization.
 *
 * Allowed on local databases, or when DEPLOYMENT_MODE=demo (production
 * seeded demo deployment). Does not truncate or reset data.
 */
export function assertIdempotentDemoSeedAllowed(
  env: NodeJS.ProcessEnv = process.env,
): void {
  const mode = resolveDeploymentMode(env);
  const databaseUrl = requireDatabaseUrl(env);

  if (mode === "demo") {
    return;
  }

  if (env.NODE_ENV === "production") {
    throw new DemoSeedSafetyError(
      "Idempotent demo seed refuses NODE_ENV=production unless DEPLOYMENT_MODE=demo.",
    );
  }
  assertNotRender(env);
  assertLocalDatabase(databaseUrl, "Idempotent demo seed");
}

/**
 * Destructive demo rebuild (`db:seed:demo -- --reset`).
 * Always local-only. Never production, never a demo deployment.
 */
export function assertDestructiveDemoResetAllowed(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (env.NODE_ENV === "production") {
    throw new DemoSeedSafetyError(
      "Destructive demo reset refuses to run when NODE_ENV=production.",
    );
  }
  if (resolveDeploymentMode(env) === "demo") {
    throw new DemoSeedSafetyError(
      "Destructive demo reset refuses DEPLOYMENT_MODE=demo. Reset is a local development tool only.",
    );
  }
  assertNotRender(env);
  assertLocalDatabase(requireDatabaseUrl(env), "Destructive demo reset");
}

import { DeploymentConfigError } from "./errors";

/**
 * Authoritative production deployment modes (Milestone 05B / ADR-028).
 *
 * `unset` is not a mode: omitted DEPLOYMENT_MODE defaults to `normal`.
 */
export type DeploymentMode = "normal" | "demo";

/** Test-friendly environment map (avoids required NODE_ENV on ProcessEnv). */
export type EnvMap = Record<string, string | undefined>;

export type DeploymentModeResolution = {
  mode: DeploymentMode;
  /** True when DEPLOYMENT_MODE was set explicitly. */
  explicit: boolean;
};

const TRUTHY_FLAGS = new Set(["true", "1", "yes"]);

export function isTruthyEnvFlag(raw: string | undefined): boolean {
  if (!raw) {
    return false;
  }
  return TRUTHY_FLAGS.has(raw.trim().toLowerCase());
}

export function resolveProductionDeploymentMode(
  env: EnvMap = process.env,
): DeploymentModeResolution {
  const raw = env.DEPLOYMENT_MODE?.trim();
  if (!raw) {
    return { mode: "normal", explicit: false };
  }

  const normalized = raw.toLowerCase();
  if (normalized === "normal" || normalized === "demo") {
    return { mode: normalized, explicit: true };
  }

  throw new DeploymentConfigError(
    `DEPLOYMENT_MODE must be "normal" or "demo" (got ${JSON.stringify(raw)}).`,
  );
}

/**
 * Legacy production switch. `SEED_DEMO_PROJECT=true` used to seed only the
 * flagship project. That is no longer a valid production demo path.
 *
 * - normal (including omitted default): refuse, so partial demo data cannot
 *   appear in a normal deployment.
 * - demo: ignore with a deprecation warning; DEPLOYMENT_MODE=demo is
 *   authoritative and already seeds the full canonical environment.
 */
export function warnOrRejectLegacySeedDemoProject(
  mode: DeploymentMode,
  env: EnvMap = process.env,
  log: (message: string) => void = console.log,
): void {
  if (!isTruthyEnvFlag(env.SEED_DEMO_PROJECT)) {
    return;
  }

  if (mode === "normal") {
    throw new DeploymentConfigError(
      "SEED_DEMO_PROJECT is deprecated and conflicts with DEPLOYMENT_MODE=normal. " +
        "Use DEPLOYMENT_MODE=demo to seed the full canonical Milestone 05A demo, " +
        "or omit SEED_DEMO_PROJECT.",
    );
  }

  log(
    "SEED_DEMO_PROJECT is deprecated and ignored when DEPLOYMENT_MODE=demo. " +
      "The full canonical demo path is used instead of the flagship-only seed.",
  );
}

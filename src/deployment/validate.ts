import { resolveDemoBootstrapPassword } from "@/seed/dev-bootstrap/password";
import { resolveEvidenceStorageConfig } from "@/storage/config";
import { DeploymentConfigError } from "./errors";
import {
  resolveProductionDeploymentMode,
  warnOrRejectLegacySeedDemoProject,
  type DeploymentMode,
  type EnvMap,
} from "./mode";

export type BootstrapAdminConfig = {
  email: string;
  password: string;
  name: string;
  orgName: string;
  orgSlug: string;
};

export type ValidatedProductionConfig = {
  mode: DeploymentMode;
  modeExplicit: boolean;
  databaseUrl: string;
  publicUrl: string | undefined;
  bootstrapAdmin: BootstrapAdminConfig | null;
};

function isProductionRuntime(env: EnvMap): boolean {
  return (
    env.NODE_ENV === "production" &&
    env.NEXT_PHASE !== "phase-production-build"
  );
}

function requireNonEmpty(
  env: EnvMap,
  name: string,
  context: string,
): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new DeploymentConfigError(`${name} is required ${context}.`);
  }
  return value;
}

function resolvePublicUrl(env: EnvMap): string | undefined {
  return (
    env.BETTER_AUTH_URL?.trim() || env.NEXT_PUBLIC_APP_URL?.trim() || undefined
  );
}

/**
 * Parse optional normal-mode admin bootstrap variables.
 *
 * If none of the bootstrap variables are set, return null (the application
 * may start with no users; registration remains invite-only).
 *
 * If any required variable is set, all required variables must be present.
 * BOOTSTRAP_ADMIN_NAME may default to the email.
 */
export function resolveBootstrapAdminConfig(
  env: EnvMap = process.env,
): BootstrapAdminConfig | null {
  const email = env.BOOTSTRAP_ADMIN_EMAIL?.trim();
  const password = env.BOOTSTRAP_ADMIN_PASSWORD?.trim();
  const orgName = env.BOOTSTRAP_ORG_NAME?.trim();
  const orgSlug = env.BOOTSTRAP_ORG_SLUG?.trim();
  const name = env.BOOTSTRAP_ADMIN_NAME?.trim();

  const provided = [email, password, orgName, orgSlug].filter(Boolean);
  if (provided.length === 0 && !name) {
    return null;
  }

  const missing: string[] = [];
  if (!email) missing.push("BOOTSTRAP_ADMIN_EMAIL");
  if (!password) missing.push("BOOTSTRAP_ADMIN_PASSWORD");
  if (!orgName) missing.push("BOOTSTRAP_ORG_NAME");
  if (!orgSlug) missing.push("BOOTSTRAP_ORG_SLUG");
  if (missing.length > 0) {
    throw new DeploymentConfigError(
      `Initial admin bootstrap is incomplete. Missing: ${missing.join(", ")}. ` +
        "Set all required BOOTSTRAP_* variables, or omit them all to start without an initial administrator.",
    );
  }

  if (password!.length < 12) {
    throw new DeploymentConfigError(
      "BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters.",
    );
  }

  const normalizedEmail = email!.toLowerCase();
  return {
    email: normalizedEmail,
    password: password!,
    name: name || normalizedEmail,
    orgName: orgName!,
    orgSlug: orgSlug!.toLowerCase(),
  };
}

/**
 * Validate production-critical environment before migrate/bootstrap/start.
 *
 * Never logs secrets. Throws DeploymentConfigError on conflict or omission.
 */
export function validateProductionDeploymentEnv(
  env: EnvMap = process.env,
  log: (message: string) => void = console.log,
): ValidatedProductionConfig {
  const { mode, explicit } = resolveProductionDeploymentMode(env);
  warnOrRejectLegacySeedDemoProject(mode, env, log);

  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new DeploymentConfigError(
      "DATABASE_URL is required before the application can start.",
    );
  }

  const production = isProductionRuntime(env);
  const publicUrl = resolvePublicUrl(env);

  if (production) {
    requireNonEmpty(
      env,
      "BETTER_AUTH_SECRET",
      "in production (opaque session signing secret)",
    );
    if (!publicUrl) {
      throw new DeploymentConfigError(
        "BETTER_AUTH_URL or NEXT_PUBLIC_APP_URL is required in production " +
          "(public application URL for cookies, callbacks, and invitation links).",
      );
    }
    try {
      resolveEvidenceStorageConfig(env as NodeJS.ProcessEnv);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new DeploymentConfigError(
        `Evidence storage is not configured for production. ${detail}`,
      );
    }
  }

  if (mode === "demo") {
    try {
      resolveDemoBootstrapPassword(env);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new DeploymentConfigError(detail);
    }
  }

  const bootstrapAdmin =
    mode === "normal" ? resolveBootstrapAdminConfig(env) : null;

  return {
    mode,
    modeExplicit: explicit,
    databaseUrl,
    publicUrl,
    bootstrapAdmin,
  };
}

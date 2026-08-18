import {
  closeDb,
  getDb,
  type AppDatabase,
} from "@/persistence/postgres/client";
import {
  canonicalDemoOrgNames,
  canonicalDemoUserEmails,
  ensureCanonicalDemoEnvironment,
  type CanonicalDemoResult,
} from "@/seed/canonical-demo";
import { logStartup } from "./log";
import { ensureBootstrapAdmin, type BootstrapAdminResult } from "./normal-bootstrap";
import { validateProductionDeploymentEnv } from "./validate";
import type { DeploymentMode, EnvMap } from "./mode";

export type ProductionLifecycleResult = {
  mode: DeploymentMode;
  modeExplicit: boolean;
  migrated: true;
  adminBootstrap: BootstrapAdminResult | null;
  demoBootstrap: CanonicalDemoResult | null;
};

export type ProductionLifecycleDependencies = {
  openDatabase: (databaseUrl: string) => Promise<AppDatabase>;
  closeDatabase: () => Promise<void>;
  ensureDemo: typeof ensureCanonicalDemoEnvironment;
  ensureAdmin: typeof ensureBootstrapAdmin;
  log: (message: string) => void;
};

const defaultDependencies: ProductionLifecycleDependencies = {
  openDatabase: getDb,
  closeDatabase: closeDb,
  ensureDemo: ensureCanonicalDemoEnvironment,
  ensureAdmin: ensureBootstrapAdmin,
  log: logStartup,
};

/**
 * Production startup lifecycle (Milestone 05B):
 *
 * validate → migrate → mode-specific bootstrap
 *
 * Does not start Next.js. Does not reset or truncate data.
 */
export async function runProductionLifecycle(
  env: EnvMap = process.env,
  dependencies: Partial<ProductionLifecycleDependencies> = {},
): Promise<ProductionLifecycleResult> {
  const deps: ProductionLifecycleDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };

  const config = validateProductionDeploymentEnv(env, deps.log);
  deps.log(
    `deployment mode: ${config.mode}${config.modeExplicit ? "" : " (default)"}`,
  );
  deps.log("validating environment");
  deps.log("environment valid");

  deps.log("running migrations");
  const db = await deps.openDatabase(config.databaseUrl);
  deps.log("migrations complete");

  let adminBootstrap: BootstrapAdminResult | null = null;
  let demoBootstrap: CanonicalDemoResult | null = null;

  try {
    if (config.mode === "demo") {
      deps.log("ensuring demo bootstrap");
      demoBootstrap = await deps.ensureDemo(db, {
        validateOscal: true,
        env,
      });
      deps.log(
        `demo bootstrap complete (orgs +${canonicalDemoOrgNames(demoBootstrap).length}, ` +
          `users +${canonicalDemoUserEmails(demoBootstrap).length}, ` +
          `projects +${demoBootstrap.projects.created.length})`,
      );
    } else {
      if (config.bootstrapAdmin) {
        deps.log("ensuring initial administrator");
        adminBootstrap = await deps.ensureAdmin(db, config.bootstrapAdmin);
        deps.log(
          adminBootstrap.createdUser
            ? "initial administrator created"
            : "initial administrator already present",
        );
      } else {
        deps.log(
          "normal bootstrap skipped (BOOTSTRAP_ADMIN_* not configured)",
        );
      }
    }
  } finally {
    await deps.closeDatabase();
  }

  return {
    mode: config.mode,
    modeExplicit: config.modeExplicit,
    migrated: true,
    adminBootstrap,
    demoBootstrap,
  };
}

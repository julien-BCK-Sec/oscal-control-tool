/**
 * Bootstrap the first organization administrator (ADR-015/019/028).
 *
 * Creates (idempotently) an email/password user with a verified email, an
 * organization, and an `organization_admin` membership. This is the documented
 * way to create the initial account because public self-registration is
 * disabled. It never seeds shared public credentials and never logs the
 * password.
 *
 * Production `DEPLOYMENT_MODE=normal` can run the same logic automatically
 * when the BOOTSTRAP_* variables are set. This CLI remains available for
 * one-off / local use.
 *
 * Usage:
 *   BOOTSTRAP_ADMIN_EMAIL=admin@example.com \
 *   BOOTSTRAP_ADMIN_PASSWORD='...' \
 *   BOOTSTRAP_ADMIN_NAME='Admin' \
 *   BOOTSTRAP_ORG_NAME='Example Org' \
 *   BOOTSTRAP_ORG_SLUG='example-org' \
 *   npm run bootstrap:admin
 */
import {
  closeDb,
  getDb,
  resolveDatabaseUrl,
} from "../src/persistence/postgres/client";
import {
  DeploymentConfigError,
  ensureBootstrapAdmin,
  resolveBootstrapAdminConfig,
} from "../src/deployment";
import { loadLocalEnv } from "./load-env";

async function main(): Promise<void> {
  loadLocalEnv();
  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to bootstrap the admin.");
  }

  const config = resolveBootstrapAdminConfig(process.env);
  if (!config) {
    throw new DeploymentConfigError(
      "BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD, BOOTSTRAP_ORG_NAME, " +
        "and BOOTSTRAP_ORG_SLUG are required.",
    );
  }

  const db = await getDb(databaseUrl);
  const result = await ensureBootstrapAdmin(db, config);

  console.log(
    result.createdUser
      ? `Created admin user ${result.email}.`
      : `Admin user ${result.email} already exists; reusing.`,
  );
  console.log(
    result.createdOrg
      ? `Created organization "${config.orgName}" (${result.organizationSlug}).`
      : `Organization "${result.organizationSlug}" already exists; reusing.`,
  );
  console.log("Bootstrap complete.");
  console.log(`  Organization id: ${result.organizationId}`);
  console.log(`  Organization slug: ${result.organizationSlug}`);
  console.log(`  Admin email: ${result.email} (verified)`);

  await closeDb();
}

main().catch(async (error) => {
  if (error instanceof DeploymentConfigError) {
    console.error(`Bootstrap configuration error: ${error.message}`);
  } else {
    console.error(error);
  }
  await closeDb();
  process.exit(1);
});

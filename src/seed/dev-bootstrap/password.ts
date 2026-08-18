import { DemoSeedSafetyError } from "@/seed/safety";
import { DEFAULT_LOCAL_DEMO_PASSWORD } from "./constants";

/**
 * Demo login password for bootstrap users.
 *
 * Local development may use the documented default. A demo deployment must
 * supply DEMO_BOOTSTRAP_PASSWORD so credentials are not hard-coded into a
 * production image.
 */
export function resolveDemoBootstrapPassword(
  env: Record<string, string | undefined> = process.env,
): string {
  const fromEnv = env.DEMO_BOOTSTRAP_PASSWORD?.trim();
  if (fromEnv) {
    if (fromEnv.length < 12) {
      throw new DemoSeedSafetyError(
        "DEMO_BOOTSTRAP_PASSWORD must be at least 12 characters.",
      );
    }
    return fromEnv;
  }

  if (env.NODE_ENV === "production" || env.DEPLOYMENT_MODE === "demo") {
    throw new DemoSeedSafetyError(
      "DEMO_BOOTSTRAP_PASSWORD is required when seeding demo users outside local development.",
    );
  }

  return DEFAULT_LOCAL_DEMO_PASSWORD;
}

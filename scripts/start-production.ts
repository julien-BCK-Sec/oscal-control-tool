/**
 * Production startup: validate → migrate → mode-specific bootstrap → Next.js.
 *
 * Never resets or truncates data. Exits non-zero if any step fails.
 *
 * Usage: npm start
 *
 * Env:
 *   DEPLOYMENT_MODE     "normal" (default) or "demo"
 *   DATABASE_URL        required
 *   PORT                listen port (default 3000)
 *
 * See docs/deployment.md and .env.example.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  DeploymentConfigError,
  logStartup,
  runProductionLifecycle,
} from "../src/deployment";
import { closeDb } from "../src/persistence/postgres/client";
import { loadLocalEnv } from "./load-env";

function resolveListenPort(env: NodeJS.ProcessEnv): string {
  const port = env.PORT?.trim();
  return port && port.length > 0 ? port : "3000";
}

export function startNextServer(env: NodeJS.ProcessEnv = process.env): void {
  const port = resolveListenPort(env);
  const nextBin = path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    "node_modules",
    "next",
    "dist",
    "bin",
    "next",
  );

  if (!fs.existsSync(nextBin)) {
    throw new Error(`Next.js binary not found at ${nextBin}`);
  }

  logStartup(`starting application on 0.0.0.0:${port}`);
  const child = spawn(
    process.execPath,
    [nextBin, "start", "-H", "0.0.0.0", "-p", port],
    {
      stdio: "inherit",
      env,
    },
  );

  const forwardSignal = (signal: NodeJS.Signals): void => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on("SIGINT", () => forwardSignal("SIGINT"));
  process.on("SIGTERM", () => forwardSignal("SIGTERM"));

  child.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.exit(1);
    }
    process.exit(code ?? 1);
  });
}

export async function startProduction(
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  await runProductionLifecycle(env);
  startNextServer(env);
}

async function main(): Promise<void> {
  loadLocalEnv();
  await startProduction(process.env);
}

main().catch(async (error) => {
  if (error instanceof DeploymentConfigError) {
    console.error(`Startup configuration error: ${error.message}`);
  } else {
    console.error(error);
  }
  await closeDb();
  process.exit(1);
});

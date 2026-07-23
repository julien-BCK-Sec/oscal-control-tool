/**
 * Developer demo bootstrap CLI.
 *
 * Usage:
 *   npm run bootstrap:demo
 *
 * Development only. Idempotent. Never truncates or resets databases.
 */
import {
  bootstrapDemo,
  formatBootstrapSummary,
  BootstrapSafetyError,
} from "../src/seed/dev-bootstrap";
import { closeDb } from "../src/persistence/postgres/client";

async function main(): Promise<void> {
  const result = await bootstrapDemo(process.cwd());
  console.log(formatBootstrapSummary(result));
}

main().catch(async (error) => {
  if (error instanceof BootstrapSafetyError) {
    console.error(`Safety check failed: ${error.message}`);
  } else {
    console.error(error);
  }
  await closeDb();
  process.exit(1);
});

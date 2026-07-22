import "server-only";

import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";

/**
 * Development email delivery sink (ADR-015).
 *
 * Milestone 1 has no production email provider wired. To keep verification and
 * invitation links out of logs, this module:
 *
 * - NEVER logs the token or full URL in production.
 * - In non-production, optionally records the full URL to a local JSON-lines
 *   sink so developers can complete flows. The sink path defaults to
 *   `data/email-sink.json` (git-ignored) and can be overridden with
 *   `TEST_EMAIL_SINK`.
 * - Always logs a single redacted line (email type + recipient domain only).
 *
 * Production deployments must configure a real transactional email provider;
 * see `docs/current-state.md` known gaps.
 */

export type AuthEmailType = "email-verification" | "organization-invitation";

function redactRecipient(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 0) {
    return "(redacted)";
  }
  return `***@${email.slice(at + 1)}`;
}

function sinkPath(): string | null {
  const isProduction =
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build";
  if (isProduction) {
    return null;
  }
  const configured = process.env.TEST_EMAIL_SINK?.trim();
  return configured || path.resolve(process.cwd(), "data", "email-sink.json");
}

export function deliverAuthEmail(input: {
  type: AuthEmailType;
  to: string;
  url: string;
  subject?: string;
}): void {
  // Redacted, token-free operational log line (safe for production).
  console.log(
    `[auth] Delivered ${input.type} email to ${redactRecipient(input.to)}`,
  );

  const target = sinkPath();
  if (!target) {
    return;
  }
  try {
    mkdirSync(path.dirname(target), { recursive: true });
    appendFileSync(
      target,
      `${JSON.stringify({
        type: input.type,
        to: input.to,
        subject: input.subject ?? null,
        url: input.url,
        at: new Date().toISOString(),
      })}\n`,
      "utf8",
    );
  } catch {
    // Sink is a developer convenience; never fail the auth flow on write error.
  }
}

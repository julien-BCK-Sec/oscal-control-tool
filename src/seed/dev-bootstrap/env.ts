import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { parseDotEnv } from "../../../scripts/load-env";

export type EnsureEnvResult = {
  status: "created" | "updated" | "unchanged";
  path: string;
  addedKeys: string[];
};

const LOCAL_DEFAULTS: Record<string, string> = {
  DATABASE_URL: "postgres://postgres:postgres@localhost:5432/oscal_control_tool",
  BETTER_AUTH_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  TEST_EMAIL_SINK: "./data/email-sink.json",
};

const SECRET_KEYS = new Set(["BETTER_AUTH_SECRET"]);

function generateSecret(): string {
  return randomBytes(32).toString("base64");
}

/**
 * Ensure `.env.local` exists for local development.
 * Never overwrites existing keys or regenerates existing secrets.
 */
export function ensureDevEnvLocal(
  cwd: string = process.cwd(),
): EnsureEnvResult {
  const examplePath = path.join(cwd, ".env.example");
  const localPath = path.join(cwd, ".env.local");

  if (!fs.existsSync(examplePath)) {
    throw new Error(".env.example is missing; cannot bootstrap environment.");
  }

  const example = parseDotEnv(fs.readFileSync(examplePath, "utf8"));
  const existing = fs.existsSync(localPath)
    ? parseDotEnv(fs.readFileSync(localPath, "utf8"))
    : {};

  const created = !fs.existsSync(localPath);
  const addedKeys: string[] = [];
  const next: Record<string, string> = { ...existing };

  // Keys from example that look like real config (not comments-only placeholders
  // that are empty / replace-me). Prefer LOCAL_DEFAULTS for known local values.
  const candidateKeys = new Set([
    ...Object.keys(example),
    ...Object.keys(LOCAL_DEFAULTS),
    ...SECRET_KEYS,
  ]);

  for (const key of candidateKeys) {
    if (next[key]?.trim()) {
      continue;
    }
    if (SECRET_KEYS.has(key)) {
      next[key] = generateSecret();
      addedKeys.push(key);
      continue;
    }
    if (LOCAL_DEFAULTS[key]) {
      next[key] = LOCAL_DEFAULTS[key];
      addedKeys.push(key);
      continue;
    }
    const fromExample = example[key]?.trim();
    if (
      fromExample &&
      !fromExample.startsWith("replace-with") &&
      fromExample !== "change-me-at-least-12-chars"
    ) {
      next[key] = fromExample;
      addedKeys.push(key);
    }
  }

  // Always ensure core local defaults when missing (even if example left blank).
  for (const [key, value] of Object.entries(LOCAL_DEFAULTS)) {
    if (!next[key]?.trim()) {
      next[key] = value;
      if (!addedKeys.includes(key)) {
        addedKeys.push(key);
      }
    }
  }

  if (created || addedKeys.length > 0) {
    const lines = [
      "# Generated / updated by npm run bootstrap:demo (development only).",
      "# Existing keys are preserved; missing keys are filled.",
      "",
    ];
    for (const [key, value] of Object.entries(next)) {
      lines.push(`${key}=${value}`);
    }
    fs.writeFileSync(localPath, `${lines.join("\n")}\n`, "utf8");
  }

  return {
    status: created ? "created" : addedKeys.length > 0 ? "updated" : "unchanged",
    path: localPath,
    addedKeys,
  };
}

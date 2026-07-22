import fs from "node:fs";
import path from "node:path";

export type LoadLocalEnvOptions = {
  /** Directory containing env files. Defaults to `process.cwd()`. */
  cwd?: string;
  /** Target env object. Defaults to `process.env`. */
  env?: NodeJS.ProcessEnv;
  /**
   * Effective `NODE_ENV`. Defaults to `env.NODE_ENV`. When `"test"`,
   * `.env.local` is skipped (Next.js-compatible).
   */
  nodeEnv?: string;
};

/**
 * Load local dotenv files into `env` for standalone Node/tsx scripts.
 *
 * Files are merged in Next.js order: `.env`, then `.env.local` (later wins).
 * Keys already present on `env` before loading are never overwritten, so shell
 * exports and platform-injected production variables retain precedence.
 *
 * Missing files are ignored. Does not invent database defaults.
 */
export function loadLocalEnv(options: LoadLocalEnvOptions = {}): string[] {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const nodeEnv = options.nodeEnv ?? env.NODE_ENV;
  const loaded: string[] = [];

  const files = [".env"];
  if (nodeEnv !== "test") {
    files.push(".env.local");
  }

  const preexisting = new Set(
    Object.keys(env).filter((key) => env[key] !== undefined),
  );

  const merged: Record<string, string> = {};
  for (const fileName of files) {
    const filePath = path.join(cwd, fileName);
    if (!fs.existsSync(filePath)) {
      continue;
    }
    Object.assign(merged, parseDotEnv(fs.readFileSync(filePath, "utf8")));
    loaded.push(fileName);
  }

  for (const [key, value] of Object.entries(merged)) {
    if (!preexisting.has(key)) {
      env[key] = value;
    }
  }

  return loaded;
}

/**
 * Parse a dotenv-format string into key/value pairs.
 * Supports optional `export` prefix, single/double quotes, and `#` comments.
 */
export function parseDotEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const withoutExport = line.startsWith("export ")
      ? line.slice("export ".length).trim()
      : line;
    const eq = withoutExport.indexOf("=");
    if (eq <= 0) {
      continue;
    }

    const key = withoutExport.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      continue;
    }

    let value = withoutExport.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      const comment = value.search(/\s+#/);
      if (comment >= 0) {
        value = value.slice(0, comment).trimEnd();
      }
    }

    result[key] = value;
  }

  return result;
}

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, afterEach } from "node:test";
import { loadLocalEnv, parseDotEnv } from "./load-env";

describe("parseDotEnv", () => {
  it("parses keys, quotes, export prefix, and comments", () => {
    const parsed = parseDotEnv(`
# comment
DATABASE_URL=postgres://localhost/db
export BOOTSTRAP_ADMIN_EMAIL=admin@example.com
QUOTED="value with spaces"
SINGLE='other'
WITH_COMMENT=keep # trailing comment
INVALID LINE
=nostart
`);
    assert.deepEqual(parsed, {
      DATABASE_URL: "postgres://localhost/db",
      BOOTSTRAP_ADMIN_EMAIL: "admin@example.com",
      QUOTED: "value with spaces",
      SINGLE: "other",
      WITH_COMMENT: "keep",
    });
  });
});

describe("loadLocalEnv", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  function tempDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "load-env-"));
    dirs.push(dir);
    return dir;
  }

  it("loads .env.local and falls back to .env without overriding existing keys", () => {
    const cwd = tempDir();
    fs.writeFileSync(
      path.join(cwd, ".env"),
      "FROM_ENV=base\nSHARED=from-env\nONLY_ENV=1\n",
    );
    fs.writeFileSync(
      path.join(cwd, ".env.local"),
      "SHARED=from-local\nONLY_LOCAL=1\nDATABASE_URL=postgres://local/db\n",
    );

    const env: NodeJS.ProcessEnv = {
      FROM_ENV: "already-set",
    };

    const loaded = loadLocalEnv({ cwd, env, nodeEnv: "development" });
    assert.deepEqual(loaded, [".env", ".env.local"]);
    assert.equal(env.FROM_ENV, "already-set");
    assert.equal(env.SHARED, "from-local");
    assert.equal(env.ONLY_ENV, "1");
    assert.equal(env.ONLY_LOCAL, "1");
    assert.equal(env.DATABASE_URL, "postgres://local/db");
  });

  it("loads only .env when .env.local is absent", () => {
    const cwd = tempDir();
    fs.writeFileSync(path.join(cwd, ".env"), "DATABASE_URL=postgres://env/db\n");

    const env: NodeJS.ProcessEnv = {};
    const loaded = loadLocalEnv({ cwd, env, nodeEnv: "development" });
    assert.deepEqual(loaded, [".env"]);
    assert.equal(env.DATABASE_URL, "postgres://env/db");
  });

  it("skips .env.local when NODE_ENV is test", () => {
    const cwd = tempDir();
    fs.writeFileSync(path.join(cwd, ".env"), "FROM_ENV=1\n");
    fs.writeFileSync(path.join(cwd, ".env.local"), "FROM_LOCAL=1\n");

    const env: NodeJS.ProcessEnv = { NODE_ENV: "test" };
    const loaded = loadLocalEnv({ cwd, env });
    assert.deepEqual(loaded, [".env"]);
    assert.equal(env.FROM_ENV, "1");
    assert.equal(env.FROM_LOCAL, undefined);
  });

  it("ignores missing files without throwing", () => {
    const cwd = tempDir();
    const env: NodeJS.ProcessEnv = {};
    const loaded = loadLocalEnv({ cwd, env, nodeEnv: "development" });
    assert.deepEqual(loaded, []);
  });
});

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createFilesystemObjectStorage } from "./filesystem-provider";

describe("filesystem object storage", () => {
  let root = "";

  afterEach(async () => {
    if (root) {
      await fs.rm(root, { recursive: true, force: true });
      root = "";
    }
  });

  it("puts, gets, and deletes objects", async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "cf-evidence-"));
    const storage = createFilesystemObjectStorage(root);
    const key = "evidence/p1/e1/v1/obj";
    const body = Buffer.from("hello-evidence");
    await storage.put({
      key,
      body,
      contentType: "text/plain",
    });
    assert.equal(await storage.exists(key), true);
    const got = await storage.get(key);
    assert.ok(got);
    assert.equal(got?.body.toString("utf8"), "hello-evidence");
    assert.equal(got?.contentType, "text/plain");
    await storage.delete(key);
    assert.equal(await storage.exists(key), false);
    assert.equal(await storage.get(key), null);
  });

  it("rejects path traversal keys", async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "cf-evidence-"));
    const storage = createFilesystemObjectStorage(root);
    await assert.rejects(
      () =>
        storage.put({
          key: "../outside",
          body: Buffer.from("x"),
          contentType: "text/plain",
        }),
      /Invalid storage key/,
    );
  });
});

import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import type {
  GetObjectResult,
  ObjectStorageProvider,
  PutObjectInput,
} from "./types";

/**
 * Local filesystem object storage for development and tests (ADR-025).
 * Not permitted in production.
 */
export function createFilesystemObjectStorage(
  rootDir: string,
): ObjectStorageProvider {
  const root = path.resolve(rootDir);

  function resolveSafe(key: string): string {
    if (!key || key.includes("\0") || key.includes("..")) {
      throw new Error("Invalid storage key.");
    }
    const normalized = key.replace(/^\/+/, "").replace(/\\/g, "/");
    const full = path.resolve(root, normalized);
    if (full !== root && !full.startsWith(root + path.sep)) {
      throw new Error("Invalid storage key.");
    }
    return full;
  }

  return {
    kind: "filesystem",

    async put(input: PutObjectInput): Promise<void> {
      const full = resolveSafe(input.key);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, input.body);
      await fs.writeFile(
        `${full}.meta.json`,
        JSON.stringify({
          contentType: input.contentType,
          contentLength: input.body.byteLength,
        }),
        "utf8",
      );
    },

    async get(key: string): Promise<GetObjectResult | null> {
      const full = resolveSafe(key);
      try {
        const body = await fs.readFile(full);
        let contentType = "application/octet-stream";
        try {
          const metaRaw = await fs.readFile(`${full}.meta.json`, "utf8");
          const meta = JSON.parse(metaRaw) as { contentType?: string };
          if (typeof meta.contentType === "string" && meta.contentType) {
            contentType = meta.contentType;
          }
        } catch {
          // Meta is optional for robustness.
        }
        return {
          body,
          contentType,
          contentLength: body.byteLength,
        };
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "ENOENT"
        ) {
          return null;
        }
        throw error;
      }
    },

    async delete(key: string): Promise<void> {
      const full = resolveSafe(key);
      try {
        await fs.unlink(full);
      } catch (error) {
        if (
          !(
            error &&
            typeof error === "object" &&
            "code" in error &&
            error.code === "ENOENT"
          )
        ) {
          throw error;
        }
      }
      try {
        await fs.unlink(`${full}.meta.json`);
      } catch {
        // Ignore missing meta.
      }
    },

    async exists(key: string): Promise<boolean> {
      const full = resolveSafe(key);
      try {
        await fs.access(full);
        return true;
      } catch {
        return false;
      }
    },
  };
}

import "server-only";

import {
  resolveEvidenceStorageConfig,
  type EvidenceStorageConfig,
} from "./config";
import { createFilesystemObjectStorage } from "./filesystem-provider";
import { createS3ObjectStorage } from "./s3-provider";
import type { ObjectStorageProvider } from "./types";

let cached:
  | { configKey: string; provider: ObjectStorageProvider; maxBytes: number }
  | null = null;

function configCacheKey(config: EvidenceStorageConfig): string {
  if (config.driver === "filesystem") {
    return `filesystem:${config.rootDir}:${config.uploadMaxBytes}`;
  }
  return [
    "s3",
    config.bucket,
    config.region,
    config.endpoint ?? "",
    config.forcePathStyle ? "1" : "0",
    config.keyPrefix,
    config.uploadMaxBytes,
    config.accessKeyId,
  ].join(":");
}

export function createObjectStorageProvider(
  config: EvidenceStorageConfig = resolveEvidenceStorageConfig(),
): ObjectStorageProvider {
  if (config.driver === "filesystem") {
    return createFilesystemObjectStorage(config.rootDir);
  }
  return createS3ObjectStorage(config);
}

/**
 * Process-local singleton for request handlers. Tests should prefer
 * `createObjectStorageProvider` with an explicit config.
 */
export function getObjectStorageProvider(
  env: NodeJS.ProcessEnv = process.env,
): { provider: ObjectStorageProvider; uploadMaxBytes: number } {
  const config = resolveEvidenceStorageConfig(env);
  const key = configCacheKey(config);
  if (cached && cached.configKey === key) {
    return { provider: cached.provider, uploadMaxBytes: cached.maxBytes };
  }
  const provider = createObjectStorageProvider(config);
  cached = {
    configKey: key,
    provider,
    maxBytes: config.uploadMaxBytes,
  };
  return { provider, uploadMaxBytes: config.uploadMaxBytes };
}

/** Test helper: drop the cached provider. */
export function resetObjectStorageProviderCache(): void {
  cached = null;
}

/**
 * Evidence object-storage configuration (ADR-025).
 *
 * Production requires S3-compatible settings and fails closed.
 * Filesystem is development/test only.
 */

export const DEFAULT_EVIDENCE_UPLOAD_MAX_BYTES = 25 * 1024 * 1024; // 25 MiB
export const DEFAULT_EVIDENCE_STORAGE_ROOT = "data/evidence-storage";

export type EvidenceStorageDriver = "filesystem" | "s3";

export type EvidenceStorageConfig =
  | {
      driver: "filesystem";
      rootDir: string;
      uploadMaxBytes: number;
    }
  | {
      driver: "s3";
      bucket: string;
      region: string;
      endpoint: string | undefined;
      forcePathStyle: boolean;
      accessKeyId: string;
      secretAccessKey: string;
      uploadMaxBytes: number;
      /** Optional key prefix inside the bucket (no leading/trailing slash). */
      keyPrefix: string;
    };

function isProductionRuntime(env: NodeJS.ProcessEnv): boolean {
  return (
    env.NODE_ENV === "production" &&
    env.NEXT_PHASE !== "phase-production-build"
  );
}

function parseUploadMaxBytes(env: NodeJS.ProcessEnv): number {
  const raw = env.EVIDENCE_UPLOAD_MAX_BYTES?.trim();
  if (!raw) {
    return DEFAULT_EVIDENCE_UPLOAD_MAX_BYTES;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      "EVIDENCE_UPLOAD_MAX_BYTES must be a positive integer (bytes).",
    );
  }
  return parsed;
}

function requireNonEmpty(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for S3-compatible evidence storage.`);
  }
  return value;
}

/**
 * Resolve evidence storage configuration.
 *
 * - Explicit `EVIDENCE_STORAGE_DRIVER=s3` → S3 (all environments).
 * - Explicit `EVIDENCE_STORAGE_DRIVER=filesystem` → filesystem; **rejected**
 *   in production runtime.
 * - Unset driver: production → S3 (fail closed if incomplete); otherwise
 *   filesystem for local development and tests.
 */
export function resolveEvidenceStorageConfig(
  env: NodeJS.ProcessEnv = process.env,
): EvidenceStorageConfig {
  const uploadMaxBytes = parseUploadMaxBytes(env);
  const driverRaw = env.EVIDENCE_STORAGE_DRIVER?.trim().toLowerCase();
  const production = isProductionRuntime(env);

  let driver: EvidenceStorageDriver;
  if (driverRaw === "s3" || driverRaw === "filesystem") {
    driver = driverRaw;
  } else if (driverRaw) {
    throw new Error(
      `EVIDENCE_STORAGE_DRIVER must be "s3" or "filesystem" (got "${driverRaw}").`,
    );
  } else {
    driver = production ? "s3" : "filesystem";
  }

  if (driver === "filesystem") {
    if (production) {
      throw new Error(
        "Filesystem evidence storage is not allowed in production. Configure S3-compatible object storage (EVIDENCE_STORAGE_DRIVER=s3 and related EVIDENCE_S3_* variables).",
      );
    }
    const rootDir =
      env.EVIDENCE_STORAGE_ROOT?.trim() || DEFAULT_EVIDENCE_STORAGE_ROOT;
    return { driver: "filesystem", rootDir, uploadMaxBytes };
  }

  const bucket = requireNonEmpty(env, "EVIDENCE_S3_BUCKET");
  const region = env.EVIDENCE_S3_REGION?.trim() || "us-east-1";
  const endpoint = env.EVIDENCE_S3_ENDPOINT?.trim() || undefined;
  const forcePathStyle = env.EVIDENCE_S3_FORCE_PATH_STYLE === "true";
  const accessKeyId = requireNonEmpty(env, "EVIDENCE_S3_ACCESS_KEY_ID");
  const secretAccessKey = requireNonEmpty(env, "EVIDENCE_S3_SECRET_ACCESS_KEY");
  const keyPrefix = (env.EVIDENCE_S3_KEY_PREFIX?.trim() || "").replace(
    /^\/+|\/+$/g,
    "",
  );

  return {
    driver: "s3",
    bucket,
    region,
    endpoint,
    forcePathStyle,
    accessKeyId,
    secretAccessKey,
    uploadMaxBytes,
    keyPrefix,
  };
}

export function getEvidenceUploadMaxBytes(
  env: NodeJS.ProcessEnv = process.env,
): number {
  return resolveEvidenceStorageConfig(env).uploadMaxBytes;
}

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_EVIDENCE_UPLOAD_MAX_BYTES,
  resolveEvidenceStorageConfig,
} from "./config";

describe("resolveEvidenceStorageConfig", () => {
  it("defaults to filesystem outside production", () => {
    const config = resolveEvidenceStorageConfig({
      NODE_ENV: "development",
    });
    assert.equal(config.driver, "filesystem");
    assert.equal(config.uploadMaxBytes, DEFAULT_EVIDENCE_UPLOAD_MAX_BYTES);
  });

  it("honors EVIDENCE_UPLOAD_MAX_BYTES", () => {
    const config = resolveEvidenceStorageConfig({
      NODE_ENV: "test",
      EVIDENCE_UPLOAD_MAX_BYTES: "1048576",
    });
    assert.equal(config.uploadMaxBytes, 1_048_576);
  });

  it("fails closed in production without S3 config", () => {
    assert.throws(
      () =>
        resolveEvidenceStorageConfig({
          NODE_ENV: "production",
        }),
      /EVIDENCE_S3_BUCKET/,
    );
  });

  it("rejects filesystem driver in production", () => {
    assert.throws(
      () =>
        resolveEvidenceStorageConfig({
          NODE_ENV: "production",
          EVIDENCE_STORAGE_DRIVER: "filesystem",
        }),
      /not allowed in production/,
    );
  });

  it("resolves S3 config when complete", () => {
    const config = resolveEvidenceStorageConfig({
      NODE_ENV: "production",
      EVIDENCE_S3_BUCKET: "evidence",
      EVIDENCE_S3_ACCESS_KEY_ID: "key",
      EVIDENCE_S3_SECRET_ACCESS_KEY: "secret",
      EVIDENCE_S3_REGION: "auto",
      EVIDENCE_S3_ENDPOINT: "https://example.r2.cloudflarestorage.com",
      EVIDENCE_S3_FORCE_PATH_STYLE: "true",
      EVIDENCE_S3_KEY_PREFIX: "prod/",
    });
    assert.equal(config.driver, "s3");
    if (config.driver !== "s3") {
      return;
    }
    assert.equal(config.bucket, "evidence");
    assert.equal(config.region, "auto");
    assert.equal(config.endpoint, "https://example.r2.cloudflarestorage.com");
    assert.equal(config.forcePathStyle, true);
    assert.equal(config.keyPrefix, "prod");
  });

  it("allows unset storage during next production build", () => {
    const config = resolveEvidenceStorageConfig({
      NODE_ENV: "production",
      NEXT_PHASE: "phase-production-build",
    });
    assert.equal(config.driver, "filesystem");
  });
});

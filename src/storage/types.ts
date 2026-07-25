/**
 * Object storage port for Evidence Version binaries (ADR-025).
 * Provider-specific types must not escape this module boundary.
 */

export type StorageObjectMetadata = {
  /** Opaque storage key (never expose to clients). */
  key: string;
  contentType: string;
  contentLength: number;
};

export type PutObjectInput = {
  key: string;
  body: Buffer;
  contentType: string;
};

export type GetObjectResult = {
  body: Buffer;
  contentType: string;
  contentLength: number;
};

/**
 * Application-facing storage provider. Implementations: filesystem (dev/test),
 * S3-compatible (production). Azure Blob / GCS may be added later.
 */
export interface ObjectStorageProvider {
  readonly kind: "filesystem" | "s3";

  put(input: PutObjectInput): Promise<void>;

  get(key: string): Promise<GetObjectResult | null>;

  delete(key: string): Promise<void>;

  exists(key: string): Promise<boolean>;
}

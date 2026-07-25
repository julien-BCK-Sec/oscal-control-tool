import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type {
  GetObjectResult,
  ObjectStorageProvider,
  PutObjectInput,
} from "./types";
import type { EvidenceStorageConfig } from "./config";

type S3Config = Extract<EvidenceStorageConfig, { driver: "s3" }>;

async function streamToBuffer(
  body: ReadableStream | NodeJS.ReadableStream | Blob | undefined,
): Promise<Buffer> {
  if (!body) {
    return Buffer.alloc(0);
  }
  if (body instanceof Blob) {
    return Buffer.from(await body.arrayBuffer());
  }
  // AWS SDK v3 may return a web ReadableStream or a Node stream.
  if (typeof (body as ReadableStream).getReader === "function") {
    const reader = (body as ReadableStream).getReader();
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        chunks.push(value);
      }
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c)));
  }
  const nodeStream = body as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  for await (const chunk of nodeStream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * S3-compatible object storage (AWS S3, MinIO, Cloudflare R2, …).
 */
export function createS3ObjectStorage(config: S3Config): ObjectStorageProvider {
  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  function objectKey(key: string): string {
    if (!key || key.includes("\0") || key.includes("..")) {
      throw new Error("Invalid storage key.");
    }
    const normalized = key.replace(/^\/+/, "");
    return config.keyPrefix
      ? `${config.keyPrefix}/${normalized}`
      : normalized;
  }

  return {
    kind: "s3",

    async put(input: PutObjectInput): Promise<void> {
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: objectKey(input.key),
          Body: input.body,
          ContentType: input.contentType,
          ContentLength: input.body.byteLength,
        }),
      );
    },

    async get(key: string): Promise<GetObjectResult | null> {
      try {
        const result = await client.send(
          new GetObjectCommand({
            Bucket: config.bucket,
            Key: objectKey(key),
          }),
        );
        const body = await streamToBuffer(
          result.Body as ReadableStream | NodeJS.ReadableStream | undefined,
        );
        return {
          body,
          contentType: result.ContentType || "application/octet-stream",
          contentLength: result.ContentLength ?? body.byteLength,
        };
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "name" in error &&
          (error.name === "NoSuchKey" || error.name === "NotFound")
        ) {
          return null;
        }
        if (
          error &&
          typeof error === "object" &&
          "$metadata" in error &&
          (error as { $metadata?: { httpStatusCode?: number } }).$metadata
            ?.httpStatusCode === 404
        ) {
          return null;
        }
        throw error;
      }
    },

    async delete(key: string): Promise<void> {
      await client.send(
        new DeleteObjectCommand({
          Bucket: config.bucket,
          Key: objectKey(key),
        }),
      );
    },

    async exists(key: string): Promise<boolean> {
      try {
        await client.send(
          new HeadObjectCommand({
            Bucket: config.bucket,
            Key: objectKey(key),
          }),
        );
        return true;
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "$metadata" in error &&
          (error as { $metadata?: { httpStatusCode?: number } }).$metadata
            ?.httpStatusCode === 404
        ) {
          return false;
        }
        if (
          error &&
          typeof error === "object" &&
          "name" in error &&
          (error.name === "NotFound" || error.name === "NoSuchKey")
        ) {
          return false;
        }
        throw error;
      }
    },
  };
}

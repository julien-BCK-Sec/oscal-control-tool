/**
 * Upload validation helpers for Evidence Versions (Milestone 03B).
 */

import { createHash } from "node:crypto";

/** Conservative allowlist of evidence artifact types. */
export const ALLOWED_EVIDENCE_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/csv",
  "application/json",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.ms-excel",
  "application/octet-stream",
] as const;

export type AllowedEvidenceMimeType =
  (typeof ALLOWED_EVIDENCE_MIME_TYPES)[number];

const MAX_FILENAME_LENGTH = 255;

export type ValidatedUpload = {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  body: Buffer;
};

export type UploadValidationError = {
  code:
    | "empty"
    | "too-large"
    | "invalid-filename"
    | "unsupported-type"
    | "missing-file";
  message: string;
};

function startsWithBytes(buffer: Buffer, bytes: number[]): boolean {
  if (buffer.length < bytes.length) {
    return false;
  }
  return bytes.every((b, i) => buffer[i] === b);
}

/**
 * Detect MIME from magic bytes when possible; otherwise fall back to the
 * client-declared type when it is on the allowlist.
 */
export function detectMimeType(
  body: Buffer,
  declaredMimeType: string | undefined,
): string {
  if (startsWithBytes(body, [0x25, 0x50, 0x44, 0x46])) {
    return "application/pdf";
  }
  if (startsWithBytes(body, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  if (startsWithBytes(body, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }
  if (
    startsWithBytes(body, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    startsWithBytes(body, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return "image/gif";
  }
  if (
    body.length >= 12 &&
    body.subarray(0, 4).toString("ascii") === "RIFF" &&
    body.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  if (startsWithBytes(body, [0x50, 0x4b, 0x03, 0x04])) {
    // ZIP container — may be OOXML; prefer declared type when allowlisted.
    const declared = normalizeMime(declaredMimeType);
    if (
      declared ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      declared ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      declared ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      declared === "application/zip"
    ) {
      return declared;
    }
    return "application/zip";
  }

  const declared = normalizeMime(declaredMimeType);
  if (
    declared === "text/plain" ||
    declared === "text/csv" ||
    declared === "application/json"
  ) {
    return declared;
  }

  if (
    (ALLOWED_EVIDENCE_MIME_TYPES as readonly string[]).includes(declared) &&
    declared !== "application/octet-stream"
  ) {
    return declared;
  }

  return "application/octet-stream";
}

function normalizeMime(value: string | undefined): string {
  if (!value) {
    return "";
  }
  return value.split(";")[0]?.trim().toLowerCase() ?? "";
}

/**
 * Strip path components and null bytes; bound length.
 */
export function sanitizeFilename(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.includes("\0")) {
    return null;
  }
  const base = trimmed.replace(/\\/g, "/").split("/").pop() ?? "";
  const cleaned = base.replace(/[\r\n\t]/g, "_").trim();
  if (!cleaned || cleaned === "." || cleaned === "..") {
    return null;
  }
  if (cleaned.length > MAX_FILENAME_LENGTH) {
    return cleaned.slice(0, MAX_FILENAME_LENGTH);
  }
  return cleaned;
}

export function sha256Hex(body: Buffer): string {
  return createHash("sha256").update(body).digest("hex");
}

export function validateEvidenceUpload(input: {
  filename: string | undefined;
  declaredMimeType: string | undefined;
  body: Buffer;
  maxBytes: number;
}): { ok: true; value: ValidatedUpload } | { ok: false; error: UploadValidationError } {
  if (!input.body || input.body.byteLength === 0) {
    return {
      ok: false,
      error: {
        code: "empty",
        message: "Empty files are not allowed.",
      },
    };
  }
  if (input.body.byteLength > input.maxBytes) {
    return {
      ok: false,
      error: {
        code: "too-large",
        message: `File exceeds the maximum upload size of ${input.maxBytes} bytes.`,
      },
    };
  }
  const filename = sanitizeFilename(input.filename ?? "");
  if (!filename) {
    return {
      ok: false,
      error: {
        code: "invalid-filename",
        message: "A valid filename is required.",
      },
    };
  }
  const mimeType = detectMimeType(input.body, input.declaredMimeType);
  if (!(ALLOWED_EVIDENCE_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return {
      ok: false,
      error: {
        code: "unsupported-type",
        message: `Unsupported file type: ${mimeType}.`,
      },
    };
  }
  return {
    ok: true,
    value: {
      filename,
      mimeType,
      sizeBytes: input.body.byteLength,
      sha256: sha256Hex(input.body),
      body: input.body,
    },
  };
}

/**
 * RFC 5987 Content-Disposition filename for attachment downloads.
 */
export function contentDispositionAttachment(filename: string): string {
  const safe = sanitizeFilename(filename) ?? "download";
  const asciiFallback = safe.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(safe).replace(
    /['()]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

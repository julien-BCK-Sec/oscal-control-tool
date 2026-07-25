import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  contentDispositionAttachment,
  detectMimeType,
  sanitizeFilename,
  validateEvidenceUpload,
} from "./upload-validation";

describe("evidence upload validation", () => {
  it("rejects empty files", () => {
    const result = validateEvidenceUpload({
      filename: "a.txt",
      declaredMimeType: "text/plain",
      body: Buffer.alloc(0),
      maxBytes: 1000,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "empty");
    }
  });

  it("rejects oversized files", () => {
    const result = validateEvidenceUpload({
      filename: "a.txt",
      declaredMimeType: "text/plain",
      body: Buffer.alloc(10, 1),
      maxBytes: 5,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "too-large");
    }
  });

  it("sanitizes path-like filenames", () => {
    assert.equal(sanitizeFilename("../../etc/passwd"), "passwd");
    assert.equal(sanitizeFilename(""), null);
  });

  it("detects PDF magic bytes", () => {
    const body = Buffer.from("%PDF-1.4 hello");
    assert.equal(detectMimeType(body, "application/octet-stream"), "application/pdf");
  });

  it("builds attachment Content-Disposition", () => {
    const header = contentDispositionAttachment('report "Q1".pdf');
    assert.match(header, /^attachment;/);
    assert.match(header, /filename=/);
    assert.match(header, /filename\*=UTF-8''/);
  });

  it("accepts a valid text upload", () => {
    const result = validateEvidenceUpload({
      filename: "note.txt",
      declaredMimeType: "text/plain",
      body: Buffer.from("policy excerpt"),
      maxBytes: 10_000,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.filename, "note.txt");
      assert.equal(result.value.mimeType, "text/plain");
      assert.equal(result.value.sha256.length, 64);
    }
  });
});

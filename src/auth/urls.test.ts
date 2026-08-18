import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveAuthBaseUrl,
  resolveConfiguredTrustedOrigins,
  shouldTrustProxyHeaders,
} from "./urls";

describe("auth public URL helpers", () => {
  it("prefers BETTER_AUTH_URL over NEXT_PUBLIC_APP_URL", () => {
    assert.equal(
      resolveAuthBaseUrl({
        BETTER_AUTH_URL: "https://app.example.com",
        NEXT_PUBLIC_APP_URL: "https://other.example.com",
      }),
      "https://app.example.com",
    );
  });

  it("falls back to NEXT_PUBLIC_APP_URL", () => {
    assert.equal(
      resolveAuthBaseUrl({ NEXT_PUBLIC_APP_URL: "https://app.example.com" }),
      "https://app.example.com",
    );
  });

  it("collects unique origins without hard-coding a host", () => {
    assert.deepEqual(
      resolveConfiguredTrustedOrigins({
        BETTER_AUTH_URL: "https://app.example.com/path",
        NEXT_PUBLIC_APP_URL: "https://app.example.com",
      }),
      ["https://app.example.com"],
    );
  });

  it("does not enable trusted proxy headers by default", () => {
    assert.equal(shouldTrustProxyHeaders({}), false);
    assert.equal(
      shouldTrustProxyHeaders({ BETTER_AUTH_TRUSTED_PROXY_HEADERS: "true" }),
      true,
    );
  });
});

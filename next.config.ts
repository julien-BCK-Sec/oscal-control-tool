import type { NextConfig } from "next";

/**
 * Next.js `allowedDevOrigins` is a `next dev` allowlist only. Omit it unless
 * NODE_ENV is development so production `next build` / `next start` never
 * include a LAN host (ADR-028: hosting hostnames are never hard-coded in
 * production).
 */
const allowedDevOrigins =
  process.env.NODE_ENV === "development" ? ["192.168.211.160"] : undefined;

/**
 * better-sqlite3 is already on Next's default serverExternalPackages list.
 * Server Action body limit raised so full Moderate implementation maps fit
 * (default 1MB; filled narratives can approach ~600KB).
 */
const nextConfig: NextConfig = {
  ...(allowedDevOrigins ? { allowedDevOrigins } : {}),
  serverExternalPackages: ["better-sqlite3", "@aws-sdk/client-s3"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;

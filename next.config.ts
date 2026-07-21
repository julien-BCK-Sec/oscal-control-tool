import type { NextConfig } from "next";

/**
 * better-sqlite3 is already on Next's default serverExternalPackages list.
 * Server Action body limit raised so full Moderate implementation maps fit
 * (default 1MB; filled narratives can approach ~600KB).
 */
const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;

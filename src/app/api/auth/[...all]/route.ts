import { getAuth } from "@/auth/server";

/**
 * Better Auth request handler (ADR-015). The auth instance is resolved per
 * request so `next build` never requires a live database or secrets.
 */
export const dynamic = "force-dynamic";

async function handler(request: Request): Promise<Response> {
  return getAuth().handler(request);
}

export { handler as GET, handler as POST };

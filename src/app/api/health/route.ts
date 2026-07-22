import { sql } from "drizzle-orm";
import { getDb } from "@/persistence/postgres/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Lightweight liveness/readiness probe for Render (and local Docker).
 * Does not expose paths, secrets, or error details.
 */
export async function GET(): Promise<Response> {
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok" }, { status: 200 });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}

import { sql } from "drizzle-orm";
import { getDb } from "@/persistence/postgres/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Lightweight liveness/readiness probe for cloud hosts and local Docker.
 *
 * Next.js only serves this after production startup has validated the
 * environment, applied migrations, and finished mode-specific bootstrap.
 * Success means the process is up and PostgreSQL is reachable. It does not
 * expose paths, secrets, deployment mode, or error details.
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

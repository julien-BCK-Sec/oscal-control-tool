import { AuthorizationError } from "@/authz/authorize";
import {
  getControlRecordRepository,
  getEvidenceService,
  getProjectRepository,
} from "@/persistence/server";
import { authorizeEvidenceProjectRoute } from "@/server/evidence-route-auth";
import { handleIl4AddendumDocxExportRequest } from "@/server/il4-addendum-docx-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

/**
 * GET an in-memory DoD IL4 SSP Addendum DOCX for a project.
 * Requires a session and project.read. Available only for dod-cloud-il4-rev5.
 * Cross-tenant access is not-found.
 */
export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { projectId } = await context.params;
  if (!projectId?.trim()) {
    return new Response("Not found.", { status: 404 });
  }

  const auth = await authorizeEvidenceProjectRoute(projectId);
  try {
    const deps = {
      projectRepo: await getProjectRepository(),
      controlRecordRepo: await getControlRecordRepository(),
      evidenceService: await getEvidenceService(),
    };
    return handleIl4AddendumDocxExportRequest({
      projectId,
      auth,
      deps,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response("Forbidden.", { status: 403 });
    }
    throw error;
  }
}

import { AuthorizationError } from "@/authz/authorize";
import {
  getControlRecordRepository,
  getEvidenceService,
  getProjectRepository,
} from "@/persistence/server";
import { authorizeEvidenceProjectRoute } from "@/server/evidence-route-auth";
import { handleSspDocxExportRequest } from "@/server/ssp-docx-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

/**
 * GET an in-memory Control Freak System Security Plan DOCX for a project.
 * Requires a session and project.read. Cross-tenant access is not-found.
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
    return handleSspDocxExportRequest({
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

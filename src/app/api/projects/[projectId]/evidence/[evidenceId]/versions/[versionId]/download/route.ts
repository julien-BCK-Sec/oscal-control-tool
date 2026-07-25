import { AuthorizationError } from "@/authz/authorize";
import { contentDispositionAttachment } from "@/data/evidence";
import {
  getEvidenceVersionService,
  getProjectRepository,
} from "@/persistence/server";
import { authorizeEvidenceProjectRoute } from "@/server/evidence-route-auth";
import { downloadEvidenceVersionForOrg } from "@/server/authorized-evidence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    projectId: string;
    evidenceId: string;
    versionId: string;
  }>;
};

/**
 * GET authorized download of an Evidence Version by application identifiers.
 * Never accepts or returns raw storage keys (ADR-025).
 */
export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { projectId, evidenceId, versionId } = await context.params;
  if (!projectId?.trim() || !evidenceId?.trim() || !versionId?.trim()) {
    return new Response("Not found.", { status: 404 });
  }

  const auth = await authorizeEvidenceProjectRoute(projectId);
  if (!auth.ok) {
    return new Response(auth.status === 401 ? "Unauthorized." : "Not found.", {
      status: auth.status,
    });
  }

  try {
    const projectRepo = await getProjectRepository();
    const versionService = await getEvidenceVersionService();
    const result = await downloadEvidenceVersionForOrg(
      projectRepo,
      versionService,
      auth.ctx,
      projectId,
      evidenceId,
      versionId,
    );
    if (!result.ok) {
      const status = result.reason === "not-found" ? 404 : 500;
      return new Response(result.message, { status });
    }

    return new Response(new Uint8Array(result.body), {
      status: 200,
      headers: {
        "Content-Type": result.contentType || result.version.mimeType,
        "Content-Length": String(result.body.byteLength),
        "Content-Disposition": contentDispositionAttachment(
          result.version.originalFilename,
        ),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response("Forbidden.", { status: 403 });
    }
    throw error;
  }
}

import { AuthorizationError } from "@/authz/authorize";
import { validateEvidenceUpload } from "@/data/evidence";
import {
  getEvidenceVersionService,
  getProjectRepository,
} from "@/persistence/server";
import { authorizeEvidenceProjectRoute } from "@/server/evidence-route-auth";
import { uploadEvidenceVersionForOrg } from "@/server/authorized-evidence";
import { getObjectStorageProvider } from "@/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ projectId: string; evidenceId: string }>;
};

/**
 * POST multipart upload of a new immutable Evidence Version.
 * Form field: `file` (required).
 */
export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { projectId, evidenceId } = await context.params;
  if (!projectId?.trim() || !evidenceId?.trim()) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  const auth = await authorizeEvidenceProjectRoute(projectId);
  if (!auth.ok) {
    return Response.json(
      { error: auth.status === 401 ? "Unauthorized." : "Not found." },
      { status: auth.status },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return Response.json(
      { error: "Expected multipart/form-data with a file field." },
      { status: 400 },
    );
  }

  const contentLengthHeader = request.headers.get("content-length");
  const { uploadMaxBytes } = getObjectStorageProvider();
  if (contentLengthHeader) {
    const contentLength = Number.parseInt(contentLengthHeader, 10);
    if (Number.isFinite(contentLength) && contentLength > uploadMaxBytes + 4096) {
      // Small overhead allowance for multipart framing.
      return Response.json(
        {
          error: `File exceeds the maximum upload size of ${uploadMaxBytes} bytes.`,
        },
        { status: 413 },
      );
    }
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Invalid multipart body." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json(
      { error: "Missing file field." },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const body = Buffer.from(arrayBuffer);
  const validated = validateEvidenceUpload({
    filename: file.name,
    declaredMimeType: file.type || undefined,
    body,
    maxBytes: uploadMaxBytes,
  });
  if (!validated.ok) {
    const status = validated.error.code === "too-large" ? 413 : 400;
    return Response.json({ error: validated.error.message }, { status });
  }

  try {
    const projectRepo = await getProjectRepository();
    const versionService = await getEvidenceVersionService();
    const result = await uploadEvidenceVersionForOrg(
      projectRepo,
      versionService,
      auth.ctx,
      {
        projectId,
        evidenceId,
        upload: validated.value,
      },
      auth.actor,
    );
    if (!result.ok) {
      const status =
        result.reason === "not-found"
          ? 404
          : result.reason === "validation"
            ? 400
            : 500;
      return Response.json({ error: result.message }, { status });
    }
    return Response.json(
      {
        version: result.version,
        evidence: {
          id: result.evidence.id,
          currentVersionId: result.evidence.currentVersionId,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return Response.json({ error: "Forbidden." }, { status: 403 });
    }
    throw error;
  }
}

import { AuthorizationError } from "@/authz/authorize";
import {
  contentDispositionAttachment,
  evidenceInventoryFilename,
  formatEvidenceInventoryCsv,
  parseEvidenceDate,
  utcTodayIsoDate,
  type EvidenceInventoryRow,
} from "@/data/evidence";
import { frameworkRegistry } from "@/data/framework";
import {
  getEvidenceCoverageQuery,
  getProjectRepository,
} from "@/persistence/server";
import { authorizeEvidenceProjectRoute } from "@/server/evidence-route-auth";
import { getEvidenceInventoryForOrg } from "@/server/authorized-evidence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

/**
 * GET authorized Evidence inventory CSV for a project (Milestone 03D).
 * One row per Evidence–control pair; unlinked Evidence has empty control fields.
 * Never includes binaries or storage keys.
 */
export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { projectId } = await context.params;
  if (!projectId?.trim()) {
    return new Response("Not found.", { status: 404 });
  }

  const url = new URL(request.url);
  const asOfParam = url.searchParams.get("asOfDate");
  let asOfDate = utcTodayIsoDate();
  if (asOfParam !== null && asOfParam.trim() !== "") {
    const parsed = parseEvidenceDate(asOfParam);
    if (parsed === null || parsed === undefined) {
      return new Response("asOfDate must be YYYY-MM-DD.", { status: 400 });
    }
    asOfDate = parsed;
  }

  const auth = await authorizeEvidenceProjectRoute(projectId);
  if (!auth.ok) {
    return new Response(auth.status === 401 ? "Unauthorized." : "Not found.", {
      status: auth.status,
    });
  }

  try {
    const projectRepo = await getProjectRepository();
    const loaded = await projectRepo.load(projectId);
    if (!loaded.ok) {
      return new Response("Not found.", { status: 404 });
    }
    const coverageQuery = await getEvidenceCoverageQuery();
    const inventory = await getEvidenceInventoryForOrg(
      projectRepo,
      coverageQuery,
      auth.ctx,
      projectId,
      asOfDate,
    );
    if (!inventory) {
      return new Response("Not found.", { status: 404 });
    }

    const rows: EvidenceInventoryRow[] = inventory.rows.map((row) => ({
      ...row,
      projectName: loaded.project.name,
    }));
    const descriptor = frameworkRegistry.getDescriptor(
      loaded.project.frameworkId,
    );
    const controlIdColumnLabel =
      descriptor?.itemSingular === "requirement"
        ? "Requirement ID"
        : "Control ID";
    const csv = formatEvidenceInventoryCsv(rows, { controlIdColumnLabel });
    const filename = evidenceInventoryFilename(loaded.project.name, asOfDate);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": contentDispositionAttachment(filename),
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

import "server-only";

import { AuthorizationError } from "@/authz/authorize";
import type { OrgContext } from "@/authz/authorize";
import type { EvidenceWithControlIds } from "@/data/evidence";
import { contentDispositionAttachment } from "@/data/evidence";
import { frameworkRegistry, UnknownFrameworkError } from "@/data/framework";
import { renderSspDocx, SSP_DOCX_CONTENT_TYPE } from "@/export/ssp-docx";
import type { ControlRecordRepository } from "@/persistence/control-record-repository";
import type { EvidenceService } from "@/persistence/evidence-service";
import type { ProjectRepository } from "@/persistence/repository";
import {
  listControlRecordsForOrg,
} from "@/server/authorized-controls";
import { listEvidenceForOrg } from "@/server/authorized-evidence";
import { loadProjectForOrg } from "@/server/authorized-projects";
import type { EvidenceRouteAuth } from "@/server/evidence-route-auth";
import {
  buildSspDocument,
  buildSspDocxFilename,
  CF_SSP_LAYOUT_ID,
  CF_SSP_LAYOUT_VERSION,
} from "@/ssp";

export { SSP_DOCX_CONTENT_TYPE };

const GENERIC_FAILURE = "Unable to generate the System Security Plan.";

export type SspDocxExportDeps = {
  projectRepo: ProjectRepository;
  controlRecordRepo: ControlRecordRepository;
  evidenceService: EvidenceService;
};

export type SspDocxExportSuccess = {
  ok: true;
  buffer: Buffer;
  filename: string;
  frameworkId: string;
  byteLength: number;
  durationMs: number;
  projectId: string;
};

export type SspDocxExportFailure = {
  ok: false;
  status: 404 | 500;
  message: string;
};

export type SspDocxExportResult = SspDocxExportSuccess | SspDocxExportFailure;

function evidenceByControlId(
  items: readonly EvidenceWithControlIds[],
): Map<string, EvidenceWithControlIds[]> {
  const map = new Map<string, EvidenceWithControlIds[]>();
  for (const item of items) {
    for (const controlId of item.controlIds) {
      const list = map.get(controlId) ?? [];
      list.push(item);
      map.set(controlId, list);
    }
  }
  return map;
}

export function logSspDocxExport(input: {
  projectId: string;
  organizationId: string;
  userId: string;
  frameworkId: string;
  byteLength: number;
  durationMs: number;
}): void {
  console.info("ssp.docx generated", {
    projectId: input.projectId,
    organizationId: input.organizationId,
    userId: input.userId,
    frameworkId: input.frameworkId,
    layoutId: CF_SSP_LAYOUT_ID,
    layoutVersion: CF_SSP_LAYOUT_VERSION,
    byteLength: input.byteLength,
    durationMs: input.durationMs,
  });
}

export async function generateSspDocxForOrg(
  deps: SspDocxExportDeps,
  ctx: OrgContext,
  projectId: string,
  generatedAt: string,
): Promise<SspDocxExportResult> {
  const started = Date.now();
  const loaded = await loadProjectForOrg(deps.projectRepo, ctx, projectId);
  if (!loaded.ok) {
    return { ok: false, status: 404, message: "Not found." };
  }

  let framework;
  let descriptor;
  try {
    framework = frameworkRegistry.require(loaded.project.frameworkId).getFramework();
    descriptor = frameworkRegistry.requireDescriptor(loaded.project.frameworkId);
  } catch (error) {
    if (error instanceof UnknownFrameworkError) {
      return { ok: false, status: 500, message: GENERIC_FAILURE };
    }
    throw error;
  }

  const records = await listControlRecordsForOrg(
    deps.projectRepo,
    deps.controlRecordRepo,
    ctx,
    projectId,
  );
  const evidence = await listEvidenceForOrg(
    deps.projectRepo,
    deps.evidenceService,
    ctx,
    projectId,
  );

  const document = buildSspDocument({
    project: loaded.project,
    framework,
    descriptor,
    controlRecordsByControlId: new Map(
      records.map((record) => [record.controlId, record]),
    ),
    evidenceByControlId: evidenceByControlId(evidence),
    generatedAt,
  });

  const buffer = await renderSspDocx(document);
  const filename = buildSspDocxFilename(
    loaded.project.metadata.systemName || loaded.project.name,
  );
  return {
    ok: true,
    buffer,
    filename,
    frameworkId: loaded.project.frameworkId,
    byteLength: buffer.byteLength,
    durationMs: Date.now() - started,
    projectId: loaded.project.id,
  };
}

export async function handleSspDocxExportRequest(input: {
  projectId: string;
  auth: EvidenceRouteAuth;
  deps: SspDocxExportDeps;
  generatedAt?: string;
  now?: () => string;
}): Promise<Response> {
  const projectId = input.projectId.trim();
  if (!projectId) {
    return new Response("Not found.", { status: 404 });
  }
  if (!input.auth.ok) {
    return new Response(input.auth.status === 401 ? "Unauthorized." : "Not found.", {
      status: input.auth.status,
    });
  }

  try {
    const generatedAt = input.generatedAt ?? (input.now ?? (() => new Date().toISOString()))();
    const result = await generateSspDocxForOrg(
      input.deps,
      input.auth.ctx,
      projectId,
      generatedAt,
    );
    if (!result.ok) {
      return new Response(result.message, { status: result.status });
    }

    logSspDocxExport({
      projectId: result.projectId,
      organizationId: input.auth.ctx.organizationId,
      userId: input.auth.ctx.userId,
      frameworkId: result.frameworkId,
      byteLength: result.byteLength,
      durationMs: result.durationMs,
    });

    return new Response(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": SSP_DOCX_CONTENT_TYPE,
        "Content-Disposition": contentDispositionAttachment(result.filename),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response("Forbidden.", { status: 403 });
    }
    console.error("ssp.docx generation failed", {
      projectId,
      organizationId: input.auth.ctx.organizationId,
      userId: input.auth.ctx.userId,
    });
    return new Response(GENERIC_FAILURE, { status: 500 });
  }
}

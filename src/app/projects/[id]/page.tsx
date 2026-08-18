import { notFound } from "next/navigation";
import {
  listSnapshotsAction,
  loadProjectAction,
} from "@/app/actions/projects";
import { listControlRecordsAction } from "@/app/actions/control-records";
import { ProjectWorkspace } from "@/components/ProjectWorkspace";
import { formatFrameworkLabel } from "@/components/framework/presentation";
import { frameworkRegistry, resolveFramework } from "@/data/framework";
import {
  firstSearchParam,
  parseCommentQueryParam,
  parseControlQueryParam,
  parseEvidenceAttentionParam,
  parseEvidenceQueryParam,
  parseWorkspaceViewParam,
} from "@/components/workspace/presentation";

export const dynamic = "force-dynamic";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    view?: string | string[];
    control?: string | string[];
    comment?: string | string[];
    attention?: string | string[];
    evidence?: string | string[];
  }>;
};

export default async function ProjectPage({
  params,
  searchParams,
}: ProjectPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const viewParam = firstSearchParam(query.view);
  const controlParam = firstSearchParam(query.control);
  const commentParam = firstSearchParam(query.comment);
  const attentionParam = firstSearchParam(query.attention);
  const evidenceParam = firstSearchParam(query.evidence);
  const initialEvidenceId = parseEvidenceQueryParam(evidenceParam);
  const initialControlId = parseControlQueryParam(controlParam);
  const initialCommentId = parseCommentQueryParam(commentParam);
  const initialEvidenceAttention = parseEvidenceAttentionParam(attentionParam);
  const parsedView = parseWorkspaceViewParam(viewParam);
  const initialView = initialEvidenceId
    ? "evidence"
    : initialControlId
      ? "controls"
      : parsedView;
  const initialFocus =
    initialControlId || initialCommentId
      ? {
          controlId: initialControlId,
          commentId: initialCommentId,
        }
      : undefined;

  const loaded = await loadProjectAction(id);
  if (!loaded.ok) {
    if (loaded.error.kind === "not-found") {
      notFound();
    }
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-sm text-danger">
        <h1 className="text-lg font-semibold">Cannot open project</h1>
        <p className="mt-2">
          {loaded.error.kind === "unsupported-schema"
            ? `Unsupported project schema version ${loaded.error.schemaVersion}.`
            : loaded.error.message}
        </p>
      </div>
    );
  }

  const [snapshots, controlRecords] = await Promise.all([
    listSnapshotsAction(id),
    listControlRecordsAction(id),
  ]);
  const frameworkDescriptor = frameworkRegistry.requireDescriptor(
    loaded.project.frameworkId,
  );
  return (
    <ProjectWorkspace
      key={loaded.project.id}
      initialProject={loaded.project}
      framework={resolveFramework(loaded.project.frameworkId)}
      frameworkDescriptor={frameworkDescriptor}
      frameworkLabel={formatFrameworkLabel(frameworkDescriptor)}
      initialControlRecords={controlRecords}
      initialSnapshots={snapshots}
      initialView={initialView}
      initialFocus={initialFocus}
      initialEvidenceId={initialEvidenceId}
      initialEvidenceAttention={initialEvidenceAttention}
    />
  );
}

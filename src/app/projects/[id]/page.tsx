import { notFound } from "next/navigation";
import {
  listSnapshotsAction,
  loadProjectAction,
} from "@/app/actions/projects";
import { ProjectWorkspace } from "@/components/ProjectWorkspace";
import { parseWorkspaceViewParam } from "@/components/workspace/presentation";

export const dynamic = "force-dynamic";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string | string[] }>;
};

export default async function ProjectPage({
  params,
  searchParams,
}: ProjectPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const viewParam = Array.isArray(query.view) ? query.view[0] : query.view;
  const initialView = parseWorkspaceViewParam(viewParam);

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

  const snapshots = await listSnapshotsAction(id);
  return (
    <ProjectWorkspace
      key={loaded.project.id}
      initialProject={loaded.project}
      initialSnapshots={snapshots}
      initialView={initialView}
    />
  );
}

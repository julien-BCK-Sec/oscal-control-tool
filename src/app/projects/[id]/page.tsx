import { notFound } from "next/navigation";
import {
  listSnapshotsAction,
  loadProjectAction,
} from "@/app/actions/projects";
import { ProjectWorkspace } from "@/components/ProjectWorkspace";

export const dynamic = "force-dynamic";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const loaded = await loadProjectAction(id);
  if (!loaded.ok) {
    if (loaded.error.kind === "not-found") {
      notFound();
    }
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-sm text-red-800">
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
    />
  );
}

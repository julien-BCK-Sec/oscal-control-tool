import { listProjectsAction, loadProjectAction } from "@/app/actions/projects";
import {
  ProjectsHome,
  type ProjectListItem,
} from "@/components/ProjectsHome";
import { FRAMEWORK_CONTROLS } from "@/data/framework";
import { computeOverallCompletion } from "@/domain";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const summaries = await listProjectsAction();
  const projects: ProjectListItem[] = [];

  for (const summary of summaries) {
    const loaded = await loadProjectAction(summary.id);
    const completion = loaded.ok
      ? computeOverallCompletion(
          FRAMEWORK_CONTROLS,
          loaded.project.implementations,
        )
      : computeOverallCompletion(FRAMEWORK_CONTROLS, {});
    projects.push({ ...summary, completion });
  }

  return <ProjectsHome projects={projects} />;
}

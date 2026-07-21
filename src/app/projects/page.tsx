import { listProjectsAction } from "@/app/actions/projects";
import { ProjectsHome } from "@/components/ProjectsHome";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listProjectsAction();
  return <ProjectsHome projects={projects} />;
}

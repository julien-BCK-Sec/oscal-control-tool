import { redirect } from "next/navigation";
import { listProjectsAction, loadProjectAction } from "@/app/actions/projects";
import {
  ProjectsHome,
  type ProjectListItem,
} from "@/components/ProjectsHome";
import { FRAMEWORK_CONTROLS } from "@/data/framework";
import { computeOverallCompletion } from "@/domain";
import {
  getSessionUser,
  resolveDefaultOrganizationId,
  resolveOrgContext,
} from "@/auth/context";
import { getDb } from "@/persistence/postgres/client";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { roleHasPermission } from "@/authz/permissions";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/sign-in?redirectTo=/projects");
  }

  const organizationId = await resolveDefaultOrganizationId(user.id);
  const ctx = organizationId
    ? await resolveOrgContext(user.id, organizationId)
    : null;

  if (!organizationId || !ctx) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-sm text-text-secondary">
        <h1 className="text-lg font-semibold text-foreground">
          No organization
        </h1>
        <p className="mt-2">
          Your account is not a member of any organization yet. Ask an
          organization administrator to invite you, then sign in again.
        </p>
      </div>
    );
  }

  const orgRepo = createPostgresOrganizationRepository(await getDb());
  const organization = await orgRepo.getOrganizationById(organizationId);

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

  return (
    <ProjectsHome
      projects={projects}
      canCreate={roleHasPermission(ctx.role, "project.create")}
      account={{
        name: user.name?.trim() || user.email,
        email: user.email,
        organizationId,
        organizationName: organization?.name ?? "Your organization",
        canManageMembers: roleHasPermission(ctx.role, "org.manage_members"),
      }}
    />
  );
}

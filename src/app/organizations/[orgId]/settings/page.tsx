import { redirect } from "next/navigation";
import { getDb } from "@/persistence/postgres/client";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { getSessionUser, resolveOrgContext } from "@/auth/context";
import { can } from "@/authz/authorize";
import { listTeam } from "@/server/authorized-organizations";
import { TeamManagement } from "@/components/organizations/TeamManagement";

export const dynamic = "force-dynamic";

export const metadata = { title: "Team" };

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  const user = await getSessionUser();
  if (!user) {
    redirect(`/sign-in?redirectTo=/organizations/${orgId}/settings`);
  }

  const ctx = await resolveOrgContext(user.id, orgId);
  if (!ctx || !can(ctx, orgId, "org.manage_members")) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-sm text-text-secondary">
        <h1 className="text-lg font-semibold text-foreground">Not authorized</h1>
        <p className="mt-2">
          You do not have permission to manage this organization&rsquo;s team.
        </p>
      </div>
    );
  }

  const orgRepo = createPostgresOrganizationRepository(await getDb());
  const [organization, team] = await Promise.all([
    orgRepo.getOrganizationById(orgId),
    listTeam(orgRepo, ctx),
  ]);

  return (
    <TeamManagement
      organizationId={orgId}
      organizationName={organization?.name ?? "your organization"}
      currentUserId={user.id}
      members={team.members}
      invitations={team.invitations}
    />
  );
}

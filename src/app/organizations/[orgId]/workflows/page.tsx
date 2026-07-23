import { redirect } from "next/navigation";
import { getSessionUser, resolveOrgContext } from "@/auth/context";
import { can } from "@/authz/authorize";
import { OrgAdminNav } from "@/components/organizations/OrgAdminNav";
import { WorkflowRuleList } from "@/components/workflows/WorkflowRuleList";
import { getDb } from "@/persistence/postgres/client";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { getWorkflowRepository } from "@/persistence/server";
import { listWorkflowRulesForOrg } from "@/server/authorized-workflows";

export const dynamic = "force-dynamic";

export const metadata = { title: "Workflows" };

export default async function WorkflowsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { orgId } = await params;
  const { notice: noticeRaw } = await searchParams;
  const notice =
    noticeRaw === "created" || noticeRaw === "updated" ? noticeRaw : null;

  const user = await getSessionUser();
  if (!user) {
    redirect(`/sign-in?redirectTo=/organizations/${orgId}/workflows`);
  }

  const ctx = await resolveOrgContext(user.id, orgId);
  if (!ctx || !can(ctx, orgId, "workflow.read")) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-sm text-text-secondary">
        <h1 className="text-lg font-semibold text-foreground">Not authorized</h1>
        <p className="mt-2">
          You do not have permission to view workflows for this organization.
        </p>
      </div>
    );
  }

  const db = await getDb();
  const organizationRepo = createPostgresOrganizationRepository(db);
  const workflowRepo = await getWorkflowRepository();
  const [organization, rules] = await Promise.all([
    organizationRepo.getOrganizationById(orgId),
    listWorkflowRulesForOrg(workflowRepo, ctx),
  ]);

  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <OrgAdminNav organizationId={orgId} current="workflows" />
      </div>
      <WorkflowRuleList
        organizationId={orgId}
        organizationName={organization?.name ?? "your organization"}
        rules={rules}
        notice={notice}
      />
    </div>
  );
}

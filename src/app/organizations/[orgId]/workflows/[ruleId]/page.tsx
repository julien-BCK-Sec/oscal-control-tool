import { notFound, redirect } from "next/navigation";
import { getSessionUser, resolveOrgContext } from "@/auth/context";
import { can } from "@/authz/authorize";
import { WorkflowRuleForm } from "@/components/workflows/WorkflowRuleForm";
import { getWorkflowRepository } from "@/persistence/server";
import { getWorkflowRuleForOrg } from "@/server/authorized-workflows";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit workflow" };

export default async function EditWorkflowPage({
  params,
}: {
  params: Promise<{ orgId: string; ruleId: string }>;
}) {
  const { orgId, ruleId } = await params;

  const user = await getSessionUser();
  if (!user) {
    redirect(
      `/sign-in?redirectTo=/organizations/${orgId}/workflows/${ruleId}`,
    );
  }

  const ctx = await resolveOrgContext(user.id, orgId);
  if (!ctx || !can(ctx, orgId, "workflow.manage")) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-sm text-text-secondary">
        <h1 className="text-lg font-semibold text-foreground">Not authorized</h1>
        <p className="mt-2">
          You do not have permission to edit workflows for this organization.
        </p>
      </div>
    );
  }

  const workflowRepo = await getWorkflowRepository();
  const rule = await getWorkflowRuleForOrg(workflowRepo, ctx, ruleId);
  if (!rule) {
    notFound();
  }

  return (
    <WorkflowRuleForm organizationId={orgId} mode="edit" initial={rule} />
  );
}

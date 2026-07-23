import { redirect } from "next/navigation";
import { getSessionUser, resolveOrgContext } from "@/auth/context";
import { can } from "@/authz/authorize";
import { WorkflowRuleForm } from "@/components/workflows/WorkflowRuleForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Create workflow" };

export default async function NewWorkflowPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  const user = await getSessionUser();
  if (!user) {
    redirect(`/sign-in?redirectTo=/organizations/${orgId}/workflows/new`);
  }

  const ctx = await resolveOrgContext(user.id, orgId);
  if (!ctx || !can(ctx, orgId, "workflow.manage")) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-sm text-text-secondary">
        <h1 className="text-lg font-semibold text-foreground">Not authorized</h1>
        <p className="mt-2">
          You do not have permission to create workflows for this organization.
        </p>
      </div>
    );
  }

  return <WorkflowRuleForm organizationId={orgId} mode="create" />;
}

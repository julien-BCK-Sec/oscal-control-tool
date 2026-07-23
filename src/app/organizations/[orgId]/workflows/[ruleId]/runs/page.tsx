import { notFound, redirect } from "next/navigation";
import { getSessionUser, resolveOrgContext } from "@/auth/context";
import { can } from "@/authz/authorize";
import { WorkflowExecutionList } from "@/components/workflows/WorkflowExecutionList";
import { getWorkflowRepository } from "@/persistence/server";
import {
  getWorkflowRuleForOrg,
  listWorkflowExecutionsForOrg,
} from "@/server/authorized-workflows";

export const dynamic = "force-dynamic";

export const metadata = { title: "Workflow runs" };

export default async function WorkflowRunsPage({
  params,
}: {
  params: Promise<{ orgId: string; ruleId: string }>;
}) {
  const { orgId, ruleId } = await params;

  const user = await getSessionUser();
  if (!user) {
    redirect(
      `/sign-in?redirectTo=/organizations/${orgId}/workflows/${ruleId}/runs`,
    );
  }

  const ctx = await resolveOrgContext(user.id, orgId);
  if (!ctx || !can(ctx, orgId, "workflow.read")) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-sm text-text-secondary">
        <h1 className="text-lg font-semibold text-foreground">Not authorized</h1>
        <p className="mt-2">
          You do not have permission to view workflow diagnostics for this
          organization.
        </p>
      </div>
    );
  }

  const workflowRepo = await getWorkflowRepository();
  const rule = await getWorkflowRuleForOrg(workflowRepo, ctx, ruleId);
  if (!rule) {
    notFound();
  }

  const executions = await listWorkflowExecutionsForOrg(workflowRepo, ctx, {
    workflowRuleId: ruleId,
    limit: 50,
  });

  return (
    <WorkflowExecutionList
      organizationId={orgId}
      ruleId={ruleId}
      ruleName={rule.name}
      executions={executions}
    />
  );
}

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/design-system/card/Card";
import { WorkflowBackLink } from "@/components/workflows/WorkflowBackLink";
import type { WorkflowExecution } from "@/persistence/workflow-repository";

export type WorkflowExecutionListProps = {
  organizationId: string;
  ruleId: string;
  ruleName: string;
  executions: WorkflowExecution[];
};

function statusLabel(status: WorkflowExecution["status"]): string {
  switch (status) {
    case "succeeded":
      return "Succeeded";
    case "failed":
      return "Failed";
    case "skipped":
      return "Skipped";
    case "duplicate":
      return "Duplicate";
  }
}

export function WorkflowExecutionList({
  organizationId,
  ruleId,
  ruleName,
  executions,
}: WorkflowExecutionListProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header>
        <WorkflowBackLink organizationId={organizationId} />
        <p className="mt-2 text-sm text-text-secondary">
          <Link
            href={`/organizations/${organizationId}/workflows/${ruleId}`}
            className="underline underline-offset-2 hover:text-foreground"
          >
            {ruleName}
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Execution history
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Recent runs for this rule, including trigger, condition match, actions,
          duration, and errors.
        </p>
      </header>

      {executions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-text-secondary">
            No executions recorded yet.
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {executions.map((execution) => (
            <li key={execution.id}>
              <Card as="article" variant="surface">
                <CardHeader>
                  <CardTitle>
                    {statusLabel(execution.status)}
                    {" · "}
                    {execution.triggeringEventType}
                  </CardTitle>
                  <p className="mt-1 text-sm text-text-secondary">
                    {new Date(execution.startedAt).toLocaleString()} ·{" "}
                    {execution.durationMs} ms
                    {execution.projectId
                      ? ` · project ${execution.projectId}`
                      : ""}
                    {execution.controlId
                      ? ` · control ${execution.controlId}`
                      : ""}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-text-secondary">
                  <p>
                    Conditions matched:{" "}
                    {execution.conditionsMatched ? "yes" : "no"}
                    {" · "}
                    {execution.detail.conditionResults.length} evaluated
                    {" · "}
                    {execution.detail.actionResults.length} action result
                    {execution.detail.actionResults.length === 1 ? "" : "s"}
                  </p>
                  {execution.errorMessage ? (
                    <p role="status" className="text-danger">
                      {execution.errorMessage}
                    </p>
                  ) : null}
                  {execution.detail.actionResults.length > 0 ? (
                    <ul className="list-disc pl-5">
                      {execution.detail.actionResults.map((action, index) => (
                        <li key={`${action.type}-${index}`}>
                          {action.type}: {action.status}
                          {action.errorMessage
                            ? ` (${action.errorMessage})`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteWorkflowRuleAction,
  setWorkflowRuleEnabledAction,
} from "@/app/actions/workflows";
import { Button } from "@/components/design-system/button/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/design-system/card/Card";
import type { WorkflowRule } from "@/workflow/types";
import { WORKFLOW_TRIGGER_LABELS } from "./catalog-labels";

export type WorkflowRuleListProps = {
  organizationId: string;
  organizationName: string;
  rules: WorkflowRule[];
};

export function WorkflowRuleList({
  organizationId,
  organizationName,
  rules,
}: WorkflowRuleListProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleEnabled(rule: WorkflowRule) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await setWorkflowRuleEnabledAction({
        organizationId,
        ruleId: rule.id,
        enabled: !rule.enabled,
      });
      if (result.ok) {
        setMessage(
          rule.enabled ? `Disabled “${rule.name}”.` : `Enabled “${rule.name}”.`,
        );
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  function removeRule(rule: WorkflowRule) {
    if (
      !window.confirm(
        `Delete workflow “${rule.name}”? Execution history for this rule will also be removed.`,
      )
    ) {
      return;
    }
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await deleteWorkflowRuleAction({
        organizationId,
        ruleId: rule.id,
      });
      if (result.ok) {
        setMessage(`Deleted “${rule.name}”.`);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Workflows
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Automations for {organizationName}. Rules react to domain events;
            they never run from business services directly.
          </p>
        </div>
        <Link
          href={`/organizations/${organizationId}/workflows/new`}
          className="btn btn-primary"
        >
          Create workflow
        </Link>
      </header>

      {message ? (
        <p role="status" className="text-sm text-success">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      {rules.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-text-secondary">
            No workflows yet. Create a rule to notify people, assign work, or
            update control metadata when events occur.
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {rules.map((rule) => (
            <li key={rule.id}>
              <Card as="article" variant="surface">
                <CardHeader className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>
                      <Link
                        href={`/organizations/${organizationId}/workflows/${rule.id}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {rule.name}
                      </Link>
                    </CardTitle>
                    <p className="mt-1 text-sm text-text-secondary">
                      Trigger: {WORKFLOW_TRIGGER_LABELS[rule.triggerType]}
                      {" · "}
                      {rule.enabled ? "Enabled" : "Disabled"}
                      {" · "}
                      {rule.conditions.length} condition
                      {rule.conditions.length === 1 ? "" : "s"}
                      {" · "}
                      {rule.actions.length} action
                      {rule.actions.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={pending}
                      onClick={() => toggleEnabled(rule)}
                    >
                      {rule.enabled ? "Disable" : "Enable"}
                    </Button>
                    <Link
                      href={`/organizations/${organizationId}/workflows/${rule.id}/runs`}
                      className="btn btn-sm"
                    >
                      Runs
                    </Link>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={pending}
                      onClick={() => removeRule(rule)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardHeader>
                {rule.description ? (
                  <CardContent className="pt-0 text-sm text-text-secondary">
                    {rule.description}
                  </CardContent>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

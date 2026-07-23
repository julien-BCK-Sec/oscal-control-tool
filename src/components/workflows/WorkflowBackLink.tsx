import Link from "next/link";

export type WorkflowBackLinkProps = {
  organizationId: string;
};

/**
 * Obvious navigation back to the organization workflow list.
 */
export function WorkflowBackLink({ organizationId }: WorkflowBackLinkProps) {
  return (
    <p className="text-sm">
      <Link
        href={`/organizations/${organizationId}/workflows`}
        className="text-text-secondary underline underline-offset-2 hover:text-foreground"
      >
        ← Back to Workflows
      </Link>
    </p>
  );
}

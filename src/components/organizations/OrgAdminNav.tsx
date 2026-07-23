import Link from "next/link";

export type OrgAdminNavProps = {
  organizationId: string;
  current: "team" | "workflows";
};

/**
 * Simple org-admin section switcher (Team / Workflows).
 */
export function OrgAdminNav({ organizationId, current }: OrgAdminNavProps) {
  const linkClass = (active: boolean) =>
    active
      ? "font-medium text-foreground"
      : "text-text-secondary underline underline-offset-2 hover:text-foreground";

  return (
    <nav
      aria-label="Organization administration"
      className="flex flex-wrap gap-4 text-sm"
    >
      <Link
        href={`/organizations/${organizationId}/settings`}
        className={linkClass(current === "team")}
        aria-current={current === "team" ? "page" : undefined}
      >
        Team
      </Link>
      <Link
        href={`/organizations/${organizationId}/workflows`}
        className={linkClass(current === "workflows")}
        aria-current={current === "workflows" ? "page" : undefined}
      >
        Workflows
      </Link>
    </nav>
  );
}

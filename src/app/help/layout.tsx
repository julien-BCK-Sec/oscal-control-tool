import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/auth/context";
import { AppShell, PageContent, ProductHeader } from "@/components/design-system";
import { AuthenticatedHeaderActions } from "@/components/auth/AuthenticatedHeaderActions";
import {
  HELP_BACK_TO_PROJECTS_HREF,
  HELP_BACK_TO_PROJECTS_LABEL,
} from "@/help/navigation";

export const dynamic = "force-dynamic";

export default async function HelpLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/sign-in?redirectTo=/help");
  }

  return (
    <AppShell
      header={
        <ProductHeader
          href={HELP_BACK_TO_PROJECTS_HREF}
          context="User guide"
          actions={
            <>
              <Link
                href={HELP_BACK_TO_PROJECTS_HREF}
                className="text-sm text-text-secondary hover:text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                {HELP_BACK_TO_PROJECTS_LABEL}
              </Link>
              <AuthenticatedHeaderActions />
            </>
          }
        />
      }
    >
      <PageContent>
        <a
          href="#help-main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-sm focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow-[var(--shadow-elevated)] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-focus-ring"
        >
          Skip to help content
        </a>
        {children}
      </PageContent>
    </AppShell>
  );
}

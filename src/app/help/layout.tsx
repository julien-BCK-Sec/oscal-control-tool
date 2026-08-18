import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/auth/context";
import { AppShell, PageContent, ProductHeader } from "@/components/design-system";
import { AuthenticatedHeaderActions } from "@/components/auth/AuthenticatedHeaderActions";

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
          context="User guide"
          actions={<AuthenticatedHeaderActions />}
        />
      }
    >
      <PageContent>{children}</PageContent>
    </AppShell>
  );
}

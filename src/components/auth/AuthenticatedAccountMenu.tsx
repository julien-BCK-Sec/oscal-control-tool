"use client";

import { authClient, useSession } from "@/auth/client";
import { AccountMenu } from "@/components/auth/AccountMenu";
import type { AccountMenuAccount } from "@/components/auth/account-menu";
import { useSignOut } from "@/components/auth/SignOutButton";

/**
 * Resolves the signed-in user and organization labels for the account menu.
 * Falls back to the first membership when no active organization is set.
 */
function useAccountMenuAccount(): AccountMenuAccount | null {
  const { data: session, isPending: sessionPending } = useSession();
  const { data: activeOrganization, isPending: activePending } =
    authClient.useActiveOrganization();
  const { data: organizations, isPending: listPending } =
    authClient.useListOrganizations();

  if (sessionPending || activePending || listPending) {
    return null;
  }

  const user = session?.user;
  if (!user) {
    return null;
  }

  const displayName = user.name?.trim() || user.email;
  const organizationName =
    activeOrganization?.name?.trim() ||
    organizations?.[0]?.name?.trim() ||
    "Your organization";

  return { displayName, organizationName };
}

/**
 * Authenticated product-header account menu: loads session/org context and
 * reuses the shared sign-out action.
 */
export function AuthenticatedAccountMenu() {
  const account = useAccountMenuAccount();
  const onSignOut = useSignOut();

  if (!account) {
    return null;
  }

  return <AccountMenu account={account} onSignOut={onSignOut} />;
}

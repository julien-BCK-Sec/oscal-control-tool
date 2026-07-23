"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/auth/client";
import { Button } from "@/components/design-system/button/Button";

/**
 * Shared sign-out action used by the account menu (and any other chrome that
 * must match the historical Sign out → `/sign-in` behavior).
 */
export function useSignOut(): () => void {
  const router = useRouter();
  return () => {
    void signOut().then(() => router.push("/sign-in"));
  };
}

/**
 * Standalone sign-out control. Prefer {@link AccountMenu} in product chrome;
 * kept for reuse of the same `useSignOut` behavior.
 */
export function SignOutButton() {
  const onSignOut = useSignOut();
  return (
    <Button type="button" variant="default" onClick={onSignOut}>
      Sign out
    </Button>
  );
}

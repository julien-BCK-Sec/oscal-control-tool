"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/auth/client";
import { Button } from "@/components/design-system/button/Button";

/**
 * Shared sign-out control. Reuses Better Auth client `signOut` and redirects
 * to the sign-in page — same behavior as the former Projects-only control.
 */
export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="default"
      onClick={() => {
        void signOut().then(() => router.push("/sign-in"));
      }}
    >
      Sign out
    </Button>
  );
}

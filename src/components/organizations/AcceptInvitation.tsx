"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acceptInvitationAction } from "@/app/actions/organizations";
import { Button } from "@/components/design-system/button/Button";

export function AcceptInvitation({
  invitationId,
  organizationName,
}: {
  invitationId: string;
  organizationName: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptInvitationAction(invitationId);
      if (result.ok) {
        router.push("/projects");
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="primary"
        disabled={pending}
        onClick={handleAccept}
      >
        {pending ? "Joining…" : `Join ${organizationName}`}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  inviteMemberAction,
  removeMemberAction,
  resendInvitationAction,
  revokeInvitationAction,
} from "@/app/actions/organizations";
import { Button } from "@/components/design-system/button/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/design-system/card/Card";
import { ORG_ROLES, type OrgRole } from "@/authz/permissions";
import type {
  InvitationDto,
  OrganizationMemberDto,
} from "@/persistence/postgres/organization-repository";

const ROLE_LABELS: Record<OrgRole, string> = {
  organization_admin: "Organization admin",
  project_manager: "Project manager",
  author: "Author",
  reviewer: "Reviewer",
  viewer: "Viewer",
};

export type TeamManagementProps = {
  organizationId: string;
  organizationName: string;
  currentUserId: string;
  members: OrganizationMemberDto[];
  invitations: InvitationDto[];
};

export function TeamManagement({
  organizationId,
  organizationName,
  currentUserId,
  members,
  invitations,
}: TeamManagementProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("author");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; message?: string }>, ok: string) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setMessage(ok);
        router.refresh();
      } else {
        setError(result.message ?? "Action failed.");
      }
    });
  }

  function handleInvite(event: FormEvent) {
    event.preventDefault();
    run(
      () => inviteMemberAction({ organizationId, email, role }),
      `Invitation sent to ${email}.`,
    );
    setEmail("");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Team
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage members and invitations for {organizationName}.
        </p>
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

      <Card prominent aria-labelledby="invite-heading">
        <CardHeader>
          <CardTitle id="invite-heading">Invite a member</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleInvite}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="min-w-[16rem] flex-1">
              <label htmlFor="invite-email" className="label">
                Email
              </label>
              <input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="invite-role" className="label">
                Role
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as OrgRole)}
                className="field mt-1.5"
              >
                {ORG_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="primary" disabled={pending}>
              Send invitation
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card aria-labelledby="members-heading">
        <CardHeader>
          <CardTitle id="members-heading">Members</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y divide-border">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <span className="min-w-0">
                  <span className="font-medium text-foreground">
                    {member.name || member.email}
                  </span>
                  <span className="text-text-secondary">
                    {" · "}
                    {member.email}
                    {" · "}
                    {ROLE_LABELS[member.role]}
                  </span>
                </span>
                {member.userId !== currentUserId ? (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () =>
                          removeMemberAction({
                            organizationId,
                            userId: member.userId,
                          }),
                        "Member removed.",
                      )
                    }
                  >
                    Remove
                  </Button>
                ) : (
                  <span className="text-sm text-text-secondary">You</span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card aria-labelledby="invitations-heading">
        <CardHeader>
          <CardTitle id="invitations-heading">Pending invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-sm text-text-secondary">No pending invitations.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {invitations.map((invite) => (
                <li
                  key={invite.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <span className="min-w-0">
                    <span className="font-medium text-foreground">
                      {invite.email}
                    </span>
                    <span className="text-text-secondary">
                      {" · "}
                      {ROLE_LABELS[invite.role]}
                      {" · expires "}
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </span>
                  </span>
                  <span className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        run(
                          () =>
                            resendInvitationAction({
                              organizationId,
                              email: invite.email,
                              role: invite.role,
                            }),
                          "Invitation resent.",
                        )
                      }
                    >
                      Resend
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        run(
                          () =>
                            revokeInvitationAction({
                              organizationId,
                              invitationId: invite.id,
                            }),
                          "Invitation revoked.",
                        )
                      }
                    >
                      Revoke
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

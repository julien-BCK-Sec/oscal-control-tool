import Link from "next/link";
import { getDb } from "@/persistence/postgres/client";
import { createPostgresOrganizationRepository } from "@/persistence/postgres/organization-repository";
import { getSessionUser } from "@/auth/context";
import { Brand } from "@/components/design-system/brand/Brand";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/design-system/card/Card";
import { AcceptInvitation } from "@/components/organizations/AcceptInvitation";

export const dynamic = "force-dynamic";

export const metadata = { title: "Invitation" };

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const orgRepo = createPostgresOrganizationRepository(await getDb());
  const invitation = await orgRepo.getInvitationById(id);
  const organization = invitation
    ? await orgRepo.getOrganizationById(invitation.organizationId)
    : null;
  const user = await getSessionUser();

  const organizationName = organization?.name ?? "an organization";

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 px-4 py-16">
      <Brand variant="lockup" appearance="on-light" size="sm" priority />
      <Card prominent aria-labelledby="invitation-heading">
        <CardHeader>
          <CardTitle id="invitation-heading">Organization invitation</CardTitle>
        </CardHeader>
        <CardContent>
          {!invitation || invitation.status !== "pending" ? (
            <p className="text-sm text-text-secondary">
              This invitation is no longer valid. Ask an administrator to send a
              new one.
            </p>
          ) : !user ? (
            <div className="flex flex-col gap-3 text-sm text-text-secondary">
              <p>
                You&rsquo;ve been invited to join{" "}
                <span className="font-medium text-foreground">
                  {organizationName}
                </span>
                . Sign in as{" "}
                <span className="font-medium text-foreground">
                  {invitation.email}
                </span>{" "}
                to accept.
              </p>
              <Link
                href={`/sign-in?redirectTo=/invitations/${id}`}
                className="btn btn-primary w-fit"
              >
                Sign in to continue
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text-secondary">
                Accept the invitation to join{" "}
                <span className="font-medium text-foreground">
                  {organizationName}
                </span>
                .
              </p>
              <AcceptInvitation
                invitationId={id}
                organizationName={organizationName}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

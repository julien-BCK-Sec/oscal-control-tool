---
title: Invitations and team management
summary: Inviting members, the roles you can assign, and how pending invitations behave — from the Team page.
section: administration
order: 20
related: roles-and-permissions, signing-in
---

## The Team page

Organization administrators manage membership from **Team**
(`/organizations/{org}/settings`), linked from the projects list. It has
three parts: **Invite a member**, the **Members** list, and
**Pending invitations**.

## Inviting someone

Enter their email address, choose a role from the five described in
[Roles and permissions](/help/roles-and-permissions), and select
**Send invitation**. You can only assign a role at or below your own
authority — only an organization administrator can grant the
organization administrator role to someone else.

Invitations expire after **7 days**, shown next to each pending invitation.
**Resend** re-sends the same invitation (and refreshes its expiration);
**Revoke** cancels it outright. Sending a new invitation to an email that
already has a pending one automatically supersedes the earlier one.

> **Note:** Invitations grant organization membership to an account that
> can sign in — they are not a self-service "create your account" flow.
> The invited person must already have (or have had one provisioned for
> them) a verified Control Freak account under that exact email address
> before they can accept. See [Signing in](/help/signing-in).

## Removing a member

Select **Remove** on a member's row to remove them from the organization.
You cannot remove the organization's last remaining administrator — Control
Freak blocks this so an organization can never be left with no one able to
manage it.

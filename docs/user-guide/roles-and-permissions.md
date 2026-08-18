---
title: Roles and permissions
summary: The five organization roles, what each one can actually do, and how roles apply across every project in an organization.
section: administration
order: 10
related: invitations-and-team, signing-in
---

## Roles are organization-wide

Control Freak has five fixed roles, and there are no custom roles. A role
is assigned once per organization membership — **not** per project. If
you're an Author in your organization, you're an Author on every project
that organization owns; there is no way to give someone a different role
on different projects within the same organization.

## What each role can do

| Capability | Organization admin | Project manager | Author | Reviewer | Viewer |
| --- | --- | --- | --- | --- | --- |
| View projects and controls | Yes | Yes | Yes | Yes | Yes |
| Create / edit / delete projects | Yes | Yes | No | No | No |
| Edit implementation narrative and control metadata | Yes | Yes | Yes | No | No |
| Submit / resubmit for review | Yes | Yes | Yes | No | No |
| Start / approve / request changes / reopen review | Yes | Yes | No | Yes | No |
| Participate in discussions | Yes | Yes | Yes | Yes | Read only |
| Moderate discussions, manage assignments | Yes | Yes | No | No | No |
| Create / edit / link / archive Evidence | Yes | Yes | Yes | No | No |
| Permanently delete draft Evidence | Yes | Yes | No | No | No |
| Manage organization members and invitations | Yes | No | No | No | No |
| Manage workflow automation rules | Yes | No | No | No | No |

See [Review workflow](/help/review-workflow) for how the Author/Reviewer
split plays out action by action, and [Evidence](/help/evidence) for the
full Evidence permission table.

## Administration is organization-admin only

Two capabilities are exclusive to **organization administrators**: managing
team membership and invitations
([Manage your team](/help/invitations-and-team)), and
managing workflow automation rules
([Workflow automation](/help/workflow-automation)). No other role — not
even project manager — can see either of those screens.

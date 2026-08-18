---
title: Collaboration
summary: Threaded discussions, @mentions, control assignments, notifications, and the activity history on every control.
section: collaboration
order: 10
related: authoring-controls, roles-and-permissions
---

Collaboration in Control Freak is scoped to **controls only** — there is no
discussion, assignment, or notification thread on a project as a whole or
on an Evidence record. Everything below lives in a control's sidebar,
alongside its Ownership, Implementation, and Review cards.

## Discussions

The **Discussions** card is a threaded comment log on the control. Start a
new discussion in the **New discussion** box; **Reply** on any comment to
continue that thread, at unlimited depth. Type `@` in a comment to mention
a teammate — suggestions are limited to your organization's members, matched
by name or email, and unmatched `@text` is left as plain text.

You can **Edit** or **Delete** your own comments (or any comment, if you
moderate discussions); a deleted comment shows as "Comment deleted" rather
than disappearing, to preserve the thread's context. The **Resolve** button
(available to the thread's original author or a moderator) marks a
discussion resolved and can be reversed with **Reopen**.

> **Note:** Deleting a comment is currently one-way from the interface —
> there is no **Restore** button for a deleted comment, even though it
> remains visible as "Comment deleted" rather than being erased.

## Assignments

The **Assignments** card assigns a specific organization member to a
control as **Owner** or **Reviewer**, choosing from a dropdown of your
organization's members. Each assignment can be marked **Complete** or
**Removed**. To change who is assigned, remove the existing assignment and
create a new one — there is currently no in-place **Reassign** action in
the interface.

> **Note:** Control Freak does not enforce a single owner or reviewer per
> control. Nothing prevents two separate Owner assignments (for two
> different people) from existing on the same control at once; each
> assignment record simply holds one assignee.

## Notifications

The **Notifications** bell in the header shows an unread count and opens a
panel of your notifications, each with a summary, the related project and
control, a short preview, and a timestamp. **Mark read** and **Delete** are
available per item, plus **Mark all read** for the whole list. Notifications
are retained until you delete them — there is no automatic expiry.

You're notified when: someone @mentions you in a comment, someone replies
to your comment, someone resolves a discussion you authored, you're
assigned to a control, or an assignment you're on is completed or removed.
Opening a notification takes you directly to the relevant control (and, for
comment-related notifications, scrolls to and highlights that comment).

Notifications are in-app only. Control Freak does not send email, Slack, or
Microsoft Teams notifications for any of this.

## History

The **History** card is a running, newest-first log of everything that has
happened to a control: metadata changes, review transitions, comments,
assignments, and Evidence links/unlinks, each attributed to the person (or
"System," for automated changes) who made it. Older entries load on demand
with **Load older activity**.

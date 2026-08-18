---
title: Review workflow
summary: The review status state machine, the actions that move a control through it, and which role can take each action.
section: controls
order: 20
related: authoring-controls, roles-and-permissions
---

## The review states

A control's **Review** status is changed only through the named actions
below — there is no way to set it directly to an arbitrary value. The
states are:

**Not Reviewed** → **Ready for Review** → **Under Review** → **Approved**,
with a **Changes Requested** branch that loops back for another pass, and
a **Reopen Review** action that sends an approved control back into the
queue.

## Actions and who takes them

| Action | Moves from → to | Who takes it |
| --- | --- | --- |
| Submit for Review | Not Reviewed → Ready for Review | Author (or anyone with `review.submit`) |
| Start Review | Ready for Review → Under Review | Reviewer (or anyone with `review.start`) |
| Approve | Under Review → Approved | Reviewer (or anyone with `review.approve`) |
| Request Changes | Under Review → Changes Requested | Reviewer (or anyone with `review.request_changes`) |
| Resubmit for Review | Changes Requested → Ready for Review | Author (or anyone with `review.resubmit`) |
| Reopen Review | Approved → Ready for Review | Reviewer or manager (or anyone with `review.reopen`) |

In practice: **Authors** can submit and resubmit, but cannot start,
approve, request changes on, or reopen a review. **Reviewers** can start,
approve, request changes, and reopen a review, but cannot submit or
resubmit one themselves. **Organization administrators** and
**project managers** can take every review action. See
[Roles and permissions](/help/roles-and-permissions) for the complete
permission matrix.

## Where the actions appear

The **Review** card in the control editor's sidebar always shows the
current status badge and a short status message (for example, "Waiting for
a reviewer" while Ready for Review, or "Address the requested changes, then
resubmit" while Changes Requested). The single most likely next action
(Approve, when a control is Under Review; otherwise the first available
action) is promoted to a primary button in the control's header on wider
screens; the Review card always lists every currently available action,
including the primary one on narrower screens.

## What review status does not do

Approving a control's review does not rewrite its Narrative status or its
Implementation status field, and it does not touch its Evidence. Review
status is purely the workflow gate itself — see
[Document controls and requirements](/help/authoring-controls) for how it relates to the
other two status fields on a control.

Every review transition is recorded in the control's **History** — see
[Collaboration](/help/collaboration).

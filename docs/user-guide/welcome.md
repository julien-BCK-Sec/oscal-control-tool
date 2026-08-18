---
title: Welcome to Control Freak
summary: What Control Freak is, the vocabulary it uses, and the ideas that make the rest of this guide easier to follow.
section: getting-started
order: 10
related: quick-start, signing-in, projects, authoring-controls
---

## What Control Freak is

Control Freak is a collaborative compliance authoring and control governance
platform built around OSCAL. It helps a team document how their organization
implements a security control framework, review that documentation together,
attach supporting Evidence, and export a standards-based System Security Plan
(SSP) when the framework supports it.

Control Freak documents your implementation. It does not assess it.

> **Limitation:** Nothing in the product certifies compliance, issues an
> authorization to operate, scores a SPRS submission, or determines that a
> control is MET or NOT MET. A framework choice, a completion percentage,
> and an Evidence coverage count are all program-management facts about
> your documentation — not a compliance determination.

See [Product limitations](/help/limitations) for the full list of things
Control Freak intentionally does not do.

## The vocabulary

A few terms recur throughout this guide with a specific meaning in Control
Freak:

- **Organization** — the tenant that owns your projects and team members.
  Every project belongs to exactly one organization, and your role is
  assigned per organization (not per project). See
  [Roles and permissions](/help/roles-and-permissions).
- **Project** — a single documentation effort against a single framework
  (for example, "Strategic Ops Platform" documented against the NIST SP
  800-53 Moderate baseline). A project's framework is chosen when it is
  created and cannot be changed afterward.
- **Control** or **requirement** — one item from the selected framework.
  NIST SP 800-53 projects call these **controls**; CMMC Level 2 projects
  call the same kind of item a **requirement**. The underlying workflow is
  identical either way — see [Choose and understand frameworks](/help/frameworks).
- **Implementation** — the narrative text you write describing how your
  organization satisfies a control or requirement.
- **Evidence** — a record (optionally with an uploaded file) that
  substantiates an implementation, linked to one or more controls.
- **Review** — the approval workflow a control's documentation moves
  through, independent of how "done" the narrative is.
- **Version history** — named versions and automatic snapshots of a
  project's implementation content, with the ability to restore an earlier
  state.

## Three different ideas of "status" — read this first

The single most common source of confusion in Control Freak is that a
control has **three independent status fields**, each answering a different
question. They do not automatically move together, and none of them
implies the others.

> **Note:** These three statuses are independent. Narrative Implemented does
> not imply review Approved. Implementation status Approved is not the same
> as review Approved. Review approval does not rewrite Narrative or
> Implementation status.

```diagram
columns
Narrative status
Has the implementation text been written?
---
Implementation status
What is this control record's governance state?
---
Review status
Where is the documentation in the controlled review workflow?
```

| Status | Question it answers | Values | Who changes it |
| --- | --- | --- | --- |
| Narrative status | Has the implementation text been written? | Not started, In progress, Implemented, Not applicable | Anyone editing the narrative |
| Implementation status | What is this control record's governance state? | Draft, In Review, Approved, Implemented, Deprecated | Anyone editing control metadata |
| Review status | Where is this control in the review workflow? | Not Reviewed, Ready for Review, Under Review, Changes Requested, Approved | Only through the review actions described in [Review workflow](/help/review-workflow) |

For example, a control's **narrative status** can be "Implemented" while its
**review status** is still "Not Reviewed" — writing the narrative does not
submit anything for review, and approving a review does not rewrite the
narrative status. Setting **implementation status** to "Approved" is a
metadata field you set yourself; it is a separate concept from the reviewer
actually approving the review workflow. The difference between Implemented
and Approved depends on which of the three fields you are looking at. See
[Document controls and requirements](/help/authoring-controls) for a full
walkthrough of all three fields together on one control.

## Where to go next

- Follow [Quick start: document your first control](/help/quick-start) for a
  short end-to-end workflow.
- New to signing in? Continue to [Signing in and finding your way around](/help/signing-in).
- Ready to create something? See [Create and manage projects](/help/projects).
- Want the control-editing details right away? See
  [Document controls and requirements](/help/authoring-controls).

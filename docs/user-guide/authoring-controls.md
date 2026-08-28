---
title: Document controls and requirements
summary: Browsing the control tree and everything on the control editor screen — narrative, ownership, and the three status fields.
section: controls
order: 10
related: welcome, review-workflow, evidence, dod-cloud-il4
---

## Browsing controls

The Controls tab (labeled Requirements on CMMC projects) shows every item
in the project's framework as a tree, grouped by family, with NIST
enhancements nested under their parent control. DoD General Readiness
Requirements appear as top-level items in their own family, not nested
under NIST controls. A search box filters by ID
or title — matching a parent control also shows its enhancements, and
matching an enhancement keeps its parent visible for context. **Expand
all** / **Collapse all** control the tree, and an overall completion
progress bar sits above the tree. Selecting an item opens the control
editor. Long titles are truncated in the list; hover or keyboard-focus a
truncated title to read the full text. On wider screens the list pane can
be resized by dragging the divider (or with Left/Right arrows when the
divider is focused).

## The control editor

The header identifies the control (its ID, title, and family — plus the
original NIST SP 800-171 number for CMMC requirements) and summarizes its
current **Implementation**, **Review**, and **Narrative** status with
badges, plus its assigned **Owner**. The primary review action available
from the current review status (see [Review workflow](/help/review-workflow))
appears here too on wider screens.

Below the header:

- **Requirement** — the human-readable requirement text. Catalog
  parameter placeholders are replaced with the NIST parameter
  description, and known authoritative assignments (when a framework
  supplies them) are inserted inline. This is read-only reference text,
  not your narrative. The untouched catalog **Source statement** remains
  available and collapsed by default when you need exact source
  wording. On DoD Cloud Impact Level 4 projects, a derived **Effective
  requirement** may appear first when authoritative assignments are
  known. See [DoD Cloud Impact Level 4](/help/dod-cloud-il4).
- **Narrative** — your implementation text, plus a **Narrative status**
  field (see below).
- **Evidence** — Evidence records linked to this control. See
  [Evidence](/help/evidence).

A sidebar alongside the narrative holds operational metadata, in this
order: **Ownership**, **Implementation** (metadata), **Review**,
**Assignments**, **Discussions**, and **History**. Assignments,
Discussions, and History are covered in
[Collaboration](/help/collaboration).

## Ownership fields

The **Ownership** card holds three free-text fields you can set on any
control: **Owner**, **Co-owner**, and **Business unit**. These are simple
labels for organizing responsibility — they are independent of the formal
**Assignments** feature (which assigns a specific organization member as
owner or reviewer and drives notifications); see
[Collaboration](/help/collaboration) for that. An unset Owner field shows
as "No owner assigned."

## The three status fields, in detail

Every control carries three independent status concepts. Changing one
never changes another.

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

### Narrative status

Tracks whether you've written the implementation text — nothing more. Set
it directly in the Narrative section:

- **Not started**
- **In progress**
- **Implemented**
- **Not applicable**

The helper text on this field says it plainly: it "tracks the completion
of this implementation narrative, not the control's governance status."

### Implementation status

A governance-metadata field in the sidebar's **Implementation** card,
alongside **Review due date** and **Evidence requirement**. Values:

- **Draft**
- **In Review**
- **Approved**
- **Implemented**
- **Deprecated**

You set this yourself, the same way you'd set any other metadata field — it
does not require going through the review workflow, and setting it to
"Approved" does not itself approve anything in the Review workflow below.

### Review status

The only status that changes through a controlled workflow rather than a
free-form field. It starts at **Not Reviewed** and moves through **Ready
for Review**, **Under Review**, **Changes Requested**, and **Approved**
using the named actions in the **Review** card. See
[Review workflow](/help/review-workflow) for the full action list, who can
take each action, and what each transition means.

### Putting it together

A realistic control midway through work might show: Narrative status
**Implemented** (you've written the text), Implementation status
**In Review** (you've flagged it as under internal governance review),
and Review status **Ready for Review** (you've formally submitted it and
are waiting for a reviewer to start). All three are true at once and none
of them was inferred from another — that's expected, not a bug.

## Evidence requirement

Also in the Implementation card: **Evidence requirement**, one of
**Required** (the default for every control), **Optional**, or
**Not required**. This determines whether the control counts toward
Evidence coverage gaps — see [Add and manage Evidence](/help/evidence).

---
title: Document controls and requirements
summary: Browsing the control tree and everything on the control editor screen — narrative, organization-defined parameters, ownership, and the three status fields.
section: controls
order: 10
related: welcome, review-workflow, evidence, dod-cloud-il4, human-readable-ssp
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
appears here too on wider screens. On wide screens, **Show operations**
opens the ownership, review, assignment, discussion, and history inspector;
it starts collapsed so authoring keeps the width. The same inspector stays
visible when the layout stacks on small screens.

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
- **Framework context** — on overlay items that still have notices or
  leftover FedRAMP/DoD source-layer material, a compact summary of the
  important condition and framework relationship. Assignment values,
  additional guidance, supplements, provenance, and Help stay behind
  **Show framework details**. Ordinary NIST and CMMC items do not show
  this section.
- **Organization-defined parameters** — explicit project values for
  catalog ODPs, kept separate from the narrative. The section heading
  shows how many currently authorable parameters are resolved. Expand it
  to edit. See
  [Organization-defined parameters](/help/authoring-controls#organization-defined-parameters).
- **Implementation** — your implementation text, plus a **Narrative status**
  field (see below).
- **Evidence** — Evidence records linked to this control, with the existing
  coverage caption. Linked records are documentation references, not an
  assessment. See [Evidence](/help/evidence).

When **Show operations** is selected, the inspector still contains
**Ownership**, **Implementation** metadata, **Review**, **Assignments**,
**Discussions**, and **History**. Assignments, Discussions, and History
are covered in [Collaboration](/help/collaboration).

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

## Organization-defined parameters

NIST SP 800-53 controls can include organization-defined parameters (ODPs).
Author those values on the control workspace. Control Freak does **not**
infer them from the implementation narrative.

The ODP editor shows a compact **n of m resolved** summary derived from the
same resolution engine used for SSP substitution. Unresolved parameters
do **not** force the section open — a control with many unresolved ODPs is
exactly where a collapsed summary is most useful. Open **Review
parameters** to author values. Resolved assignment rows stay compact;
use **Edit** to change a value. Catalog IDs, mapping basis, provenance,
and insert context stay behind **Details**, which starts collapsed.

When every currently authorable parameter shares the same overlay
condition (for example, a control-level assignment with no per-ODP
mapping), that explanation appears once at the section, not on every
row. Distinct parameter states are not grouped together.

Author-facing status is **Resolved** or **Unresolved**. Technical
resolver wording remains in Details.

Each expanded editor still shows:

- the catalog prompt (label or guideline);
- a concise description;
- the editable project value, catalog choices, or required action;
- the current resolved/unresolved state.

Flexible text is expected. A value may be `15 minutes` or a longer
operational sentence. Catalog **select** parameters use the catalog's own
choices (`one` or `one or more`). When a selected choice includes a nested
parameter, that editor appears under the choice. Nested values remain
stored if you later deselect the parent choice; they are hidden until the
choice applies again. Control Freak does not invent dropdowns for ordinary
assignment parameters.

Keep these layers distinct:

- **Framework value** — immutable reference data from the catalog, baseline,
  or overlay.
- **Project value** — what this organization authored.
- **Unresolved ODP** — no legitimate substitution is available yet.
- **Accepted permitted baseline** — DoD may permit a FedRAMP value; it is
  not used in the resolved requirement until someone explicitly accepts it.
- **Documented deviation** — the project records that operations differ.
  This does **not** replace the authoritative framework value.
- **DSPAV assertion** — the organization asserts it obtained a restricted
  authoritative value. This is project documentation, not a Control Freak
  verified substitution.
- **Source conflict** — both authoritative sources remain visible. A
  proceeding note does not choose a winner.

Grouping/aggregate catalog parameters are hidden; edit the child ODPs
instead. CMMC requirements and DoD General Readiness Requirements do not
get an artificial ODP editor, because those catalogs do not populate NIST
parameter identity in Control Freak.

Viewers can read parameter records. Authors and other roles with
implementation-edit permission can change them. Saves follow the same
project autosave and revision path as narratives.

See [Human-readable SSP](/help/human-readable-ssp) for how resolved and
unresolved inserts appear in the Word export.

## Evidence requirement

Also in the Implementation card: **Evidence requirement**, one of
**Required** (the default for every control), **Optional**, or
**Not required**. This determines whether the control counts toward
Evidence coverage gaps — see [Add and manage Evidence](/help/evidence).

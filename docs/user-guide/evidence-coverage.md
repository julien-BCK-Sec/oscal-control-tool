---
title: Track Evidence coverage
summary: How coverage and freshness are computed, what the Evidence Browser's attention views mean, and exporting the CSV inventory.
section: evidence
order: 20
related: evidence, frameworks
---

## Evidence coverage is not a compliance score

> **Limitation:** Evidence Coverage is not a compliance score. Counts
> describe linked active Evidence against each control's (or requirement's)
> Evidence requirement.

For CMMC projects, Evidence Coverage is not:

- a CMMC assessment result
- MET / NOT MET
- an SPRS score
- certification status

Control Freak does not show coverage as a percentage or as a pass/fail
compliance rating.

## How coverage is computed

Coverage is computed per control from two things: the control's **Evidence
requirement** field (Required, Optional, or Not required — see
[Add and manage Evidence](/help/evidence)) and whether it has at least one
linked **Active** Evidence record. A linked Active record satisfies
coverage even if it has no uploaded file yet; **Draft** Evidence never
satisfies coverage (it shows as an in-progress attention fact instead),
and **Archived** Evidence is excluded from coverage entirely and cannot be
newly linked.

The resulting coverage states are:

| State | Meaning |
| --- | --- |
| Not required | This control's Evidence requirement is Not required |
| Optional — no evidence | Optional, with nothing linked yet |
| Optional — evidence present | Optional, with active Evidence linked |
| Required — missing evidence | Required, with no active Evidence linked |
| Required — evidence present | Required, with active Evidence linked |

## Freshness

Independently of coverage, each Evidence record has a **freshness** state
derived from its review due date compared to today: **Current**,
**Due soon** (within the next 30 days), **Overdue** (past its due date), or
**No review date**. Freshness never changes an Evidence record's lifecycle
status on its own — it's a read-only signal, recalculated each time you
view it, not something that automatically archives or flags a record.

## The Evidence Browser's attention views

The Evidence tab offers five views: **All evidence**, **Missing required**
(controls whose Evidence requirement is Required with nothing active
linked), **Due soon**, **Overdue**, and **Unlinked** (Evidence with no
control association at all). Search and filter by title, owner, filename,
type, status, and whether a current file is attached; archived Evidence is
hidden by default unless you include it explicitly.

Overview's coverage cards (see [Create and manage projects](/help/projects))
link directly into these same filtered views.

## Exporting a CSV inventory

Select **Download inventory CSV** on the Evidence tab to export one row per
Evidence-to-control association (unlinked Evidence gets a single row with
empty control fields). The export includes the project, the control (or
requirement) ID, the Evidence requirement, Evidence details (title, type,
owner, status, collection and review-due dates, freshness), and the current
file version's name and upload time — never the file itself or any storage
details. The export requires the same permission as viewing Evidence, so
anyone who can see Evidence can download the inventory.

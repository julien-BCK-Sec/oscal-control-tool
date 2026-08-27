---
title: Create and manage projects
summary: Creating a project, the tabs in the project workspace, and what the Overview tab shows you at a glance.
section: projects
order: 10
related: frameworks, authoring-controls, version-history
---

## Creating a project

From your projects list, select **New project**, give it a name, and choose
a framework. The framework choice is grouped by family — **NIST SP 800-53
Rev. 5** (Low, Moderate, or High), **CMMC** (Level 2), and **DoD Cloud**
(Impact Level 4) — and defaults to NIST SP 800-53 Rev. 5 Moderate.

> **Warning:** A framework cannot be changed after the project is created,
> and choosing one is not a certification, assessment, or authorization
> status. See [Choose and understand frameworks](/help/frameworks) before
> you create a project if you're unsure which one applies. For DoD Cloud
> Impact Level 4, see [DoD Cloud Impact Level 4](/help/dod-cloud-il4).

Creating a project requires the `project.create` permission (organization
administrators and project managers). Everyone with project access can open
and work within a project once it exists.

## The projects list

Your projects list shows every project in your active organization, each
as a card with its framework label, an implementation-completion count and
progress bar (for example, "42 of 156 controls implemented"), its current
revision number, and when it was last updated. From a card you can **Open**
the project, **Rename** it, or **Delete** it. Deleting a project is a
permanent, hard delete — there is no archive state for projects (Evidence
records have their own separate archive concept; see
[Evidence](/help/evidence)).

## The workspace tabs

Opening a project puts you in its workspace, with five tabs:

| Tab | What it shows |
| --- | --- |
| Overview | A summary dashboard — see below |
| Controls (or Requirements) | The browsable control/requirement tree and editor — see [Document controls and requirements](/help/authoring-controls) |
| Evidence | The project's Evidence records and coverage — see [Evidence](/help/evidence) |
| Project details | System name, organization name, description, and OSCAL export — see [OSCAL export](/help/oscal-export) |
| Version history | Named versions and automatic snapshots — see [Version history](/help/version-history) |

The workspace header also shows the project's framework label, its current
revision number, autosave status ("Saved", "Unsaved changes", "Saving…",
"Save failed", or "Conflict"), and Undo / Redo buttons for the implementation
editor. If a save conflicts with changes made elsewhere, a **Reload latest**
option appears — reload before continuing rather than overwriting someone
else's work.

## The Overview tab

Overview is the workspace's default landing tab and pulls together, in one
place:

- **Implementation completion** — controls/requirements completed out of
  the total, as a count and a progress bar.
- **Evidence coverage** — four clickable summary cards (required items
  missing Evidence, Evidence due soon, Evidence overdue, and unlinked
  Evidence), each of which jumps into the Evidence tab pre-filtered. See
  [Track Evidence coverage](/help/evidence-coverage) for exactly
  what these numbers mean.
- **Family progress** — completion by control family, each entry linking
  into that family in the Controls tab.
- **Validation** — pass/fail checks on the project's documentation, plus
  (for frameworks with OSCAL export) an on-demand **Run OSCAL validation**
  button. See [OSCAL export](/help/oscal-export).
- **Continue authoring** — a shortcut to the first incomplete item, or to
  review/validate the project once everything is complete.
- **Recent versions** — the most recent named versions and automatic
  snapshots, with a link into the full [version history](/help/version-history).
- **Project details** — a summary of the system name, organization, and
  description, with a link to edit them on the Project details tab.

## Autosave, undo, and conflicts

Edits to implementation narratives and project metadata save automatically;
the workspace header's status indicator reflects it in real time ("Saved,"
"Unsaved changes," "Saving…," "Save failed," or "Conflict"). **Undo** and
**Redo** buttons in the header (also bound to Ctrl/Cmd+Z and
Ctrl/Cmd+Shift+Z) step back and forward through your edits in the current
session. Each save increments the project's **revision** counter shown in
the header — a save counter, not a named version; see
[Version history](/help/version-history) for named, restorable points in
time.

If someone else saves the same project while you're editing, the status
turns to **Conflict** and a **Reload latest** action appears. Control Freak
does not merge conflicting edits automatically — reload before continuing.

## Linking directly into a project

Each workspace tab corresponds to a URL query parameter, so you can
bookmark or share a link straight into a specific place:

| Parameter | Effect |
| --- | --- |
| `?view=controls` (or `evidence`, `details`, `history`) | Opens that tab. Omitted for Overview, the default. |
| `?control={controlId}` | Also opens the Controls tab and selects that control. |
| `?comment={commentId}` | Scrolls to and highlights a specific discussion comment. |
| `?evidence={evidenceId}` | Opens the Evidence tab and selects that Evidence record. |
| `?attention=missing\|due_soon\|overdue\|unlinked` | Opens the Evidence tab pre-filtered to that attention view. |

Notification links use exactly this mechanism — see
[Collaboration](/help/collaboration). A deep link never bypasses
authorization; access is still governed by your organization membership and
role.

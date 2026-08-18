---
title: Version history
summary: Named versions, automatic and recovery snapshots, and exactly what restoring a snapshot does and does not do.
section: history
order: 10
related: projects, authoring-controls
---

## Revision number vs. version history

Every project has a **revision** number that increments on every save —
it's a save counter, not a version name, and climbs continuously as you
work. **Version history** is a separate, deliberate record of specific
points in time, made up of three kinds of entries:

- **Named versions** — immutable milestones you create yourself, from the
  Version history tab, by giving a name and selecting **Save Version**.
- **Automatic snapshots** — periodic recovery points Control Freak saves
  as you edit, without you asking for one. You can also force one
  immediately with **Snapshot now**.
- **Recovery snapshots** — saved automatically, every time, right before a
  restore happens (see below), so a restore is never a one-way door.

## Restoring a snapshot

Any restorable entry in Version history has a **Restore** button, which
asks you to confirm before proceeding — restoring replaces your project's
current working implementation content with that snapshot's content, after
first saving your current state as a new recovery snapshot.

> **Note:** Restore only replaces implementation content (the narrative
> text and related project document data). It does **not** roll back
> ControlRecord metadata (ownership, statuses, Evidence requirement),
> activity history, discussions, assignments, or Evidence links — those
> keep their current state regardless of which version you restore. Restore
> also never changes a project's framework, which is fixed at creation
> regardless of what any snapshot recorded.

If someone else has saved changes since you loaded the page, restoring is
blocked with a conflict message asking you to reload first — this prevents
a restore from silently discarding work you haven't seen yet.

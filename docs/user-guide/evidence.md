---
title: Evidence
summary: What an Evidence record is, its lifecycle, and how to create, upload, and link it to controls.
section: evidence
order: 10
related: evidence-coverage, authoring-controls, roles-and-permissions
---

## What Evidence is

An Evidence record is a **logical, permanent record** — not a file. It has
a title, description, owner, type (Document, Screenshot, Log, Policy,
Attestation, or Other), a collection date, and a review due date. A file
upload is optional: an Evidence record can exist, and satisfy coverage,
with no file attached at all (see
[Evidence coverage and reporting](/help/evidence-coverage)). When you do
upload a file, replacing it later creates a new, immutable **version**
rather than overwriting anything — see below.

Evidence belongs to a single project and can be linked to any number of
controls within it (and a control can have any number of linked Evidence
records). There is no organization-wide Evidence library shared across
projects in this version of Control Freak.

## Lifecycle

An Evidence record moves through three states:

- **Draft** — the default for new Evidence you create from the Evidence
  tab. Does not satisfy coverage; shown as an in-progress "attention" fact.
- **Active** — counts toward Evidence coverage. Evidence created directly
  from a control's Evidence panel is created as Active immediately.
- **Archived** — a one-way action (there is no "un-archive"). Archived
  Evidence becomes read-only, is excluded from coverage, and cannot be
  newly linked to a control.

A **draft** record with no linked controls can be permanently deleted
(organization administrators and project managers only); every other
Evidence record should be archived rather than deleted, to preserve the
audit trail.

## Linking Evidence to a control

From a control's **Evidence** panel, select **Link evidence** to search
existing project Evidence (archived and already-linked records are
excluded from the picker), or create a new one on the spot with
**Create and link** — that path always creates the record as Active.
**Unlink** removes the association without affecting the Evidence record
itself. You can also manage links from the Evidence tab, but linking and
unlinking always happens through a specific control's Evidence panel.

Each control also has its own **Evidence requirement** field — **Required**
(the default for every control), **Optional**, or **Not required** — set in
the control editor's Implementation card. This is what Evidence coverage
measures against; see
[Evidence coverage and reporting](/help/evidence-coverage).

## Uploading files and versions

Open an Evidence record's file versions panel to upload. The first upload
is labeled **Upload file**; every upload after that is labeled
**Upload replacement**, and the panel says plainly: uploaded artifacts are
immutable, and replacing a file creates a new version and updates the
current pointer. Every version remains browsable and downloadable — nothing
is overwritten or lost when you upload a replacement.

Uploads are limited to 25 MiB by default (your deployment may configure a
different limit) and are restricted to common document, image, and archive
types (PDF, PNG/JPEG/GIF/WebP, plain text, CSV, JSON, ZIP, and Office
formats). Empty files are rejected. Each version records its original
filename, file type, size, a SHA-256 checksum, and who uploaded it and
when.

## Who can do what

| Action | Organization admin | Project manager | Author | Reviewer | Viewer |
| --- | --- | --- | --- | --- | --- |
| View Evidence | Yes | Yes | Yes | Yes | Yes |
| Create Evidence | Yes | Yes | Yes | No | No |
| Edit / upload / link Evidence | Yes | Yes | Yes | No | No |
| Archive Evidence | Yes | Yes | Yes | No | No |
| Permanently delete a draft | Yes | Yes | No | No | No |

Reviewers and viewers can see Evidence but cannot create, edit, upload,
link, archive, or delete it.

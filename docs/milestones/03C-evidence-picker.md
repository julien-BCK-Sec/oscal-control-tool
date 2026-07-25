# Milestone 03C — Scalable Evidence Picker

## Status

Implemented on `feat/evidence-picker-03c` (uncommitted until review).

## Objective

Replace the control Evidence dropdown with a reusable, searchable, paginated
Evidence Picker built on the 03A aggregate and 03B version/storage stack.

---

## Accepted decisions (no new ADR)

1. **Presentational picker** — `EvidencePicker` searches and emits
   `onSelect` / `onCreateRequested`. `ControlEvidencePanel` owns create,
   associate, refresh, and messaging.
2. **Project-scoped search** via Server Action `searchEvidenceAction`
   (`evidence.read`). No new Route Handler for metadata search.
3. **Keyset pagination** — order `updated_at DESC, id DESC`; opaque cursor;
   default limit 20; hard max 50. Index
   `evidence_project_updated_id_idx`.
4. **Eligibility** — default excludes archived; control linking excludes
   already-linked via `excludeLinkedToControlId`. Results use
   `EvidenceSearchResult` (optional current-version summary; no control IDs
   or storage keys).
5. **Associate hardening** — new links to archived Evidence are rejected
   server-side; already-linked remains idempotent.
6. **Native `<dialog>`** with explicit focus restore, Escape close, listbox
   keyboard navigation, and live status text. No third-party UI kit.

Organization-wide libraries remain deferred.

---

## Search contract

Request (Server Action):

- `projectId` (required; authorized)
- `query?`, `cursor?`, `limit?`
- `status?`, `evidenceType?`
- `excludeLinkedToControlId?`, `excludeArchived?` (default true)

Response page:

- `items: EvidenceSearchResult[]`
- `nextCursor`, `hasMore`

ILIKE over title, description, owner, and current version filename when
`query` is non-empty. No Postgres FTS/trigram in 03C.

---

## Success criteria

Met when tests, lint, and production build pass and a user can open the
picker from a control, search/paginate, link or create+link, and use the
keyboard without loading the full library.

No commits (per task request).

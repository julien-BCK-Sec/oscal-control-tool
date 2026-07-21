# Architectural Decisions

## ADR-001

Decision:
Use an internal domain model instead of exposing OSCAL directly to the UI.

Reason:
OSCAL is an interchange format, not an application data model.

Date:
2026-07-21

## ADR-002

Decision:
Introduce a small `FrameworkProvider` interface and derive the NIST Moderate
framework at build time from the pinned profile and catalog into generated
application JSON.

Reason:
- Keeps the UI on application types (`Framework`, `FrameworkControl`).
- Avoids shipping the full OSCAL catalog/profile to the browser.
- Uses only local pinned artifacts (no runtime network fetch).
- Limits profile support to features actually used by the Moderate baseline.

Date:
2026-07-21

## ADR-003

Decision:
Persist projects in local SQLite using Drizzle ORM and `better-sqlite3`, behind
an application-facing `ProjectRepository`. Use Next.js Server Actions as the
mutation boundary on the Node.js runtime (not Edge).

Reason:
- Fits local-first, single-instance authoring without a separate database service.
- Keeps Drizzle/SQLite types out of React and domain code.
- Server Actions match the App Router mutation model in Next.js 16.

Date:
2026-07-21

## ADR-004

Decision:
Use a hybrid schema: denormalized list columns plus a validated JSON document
(`project_json`) for the OSCAL-independent user project. Do not store framework
control text in the database.

Reason:
- Avoids premature normalization of implementations.
- List/rename queries stay simple.
- Framework remains sourced from `FrameworkProvider`.

Date:
2026-07-21

## ADR-005

Decision:
Debounce database autosave (~1.5s), use optimistic concurrency via `revision`,
and keep in-session undo/redo separate from database revisions. Store automatic
recovery snapshots (throttled, retained) and immutable named versions in
`project_snapshots`.

Reason:
- Preserves localStorage-like convenience without per-keystroke writes.
- Conflicts fail closed with reload-latest (merge deferred).
- Named versions are user milestones and must not be auto-pruned.

Date:
2026-07-21

## ADR-006

Decision:
Provide a one-time localStorage → database import that never deletes browser
data automatically and records a migration marker only after a successful write.

Reason:
- Existing users keep a fallback copy.
- Prevents accidental repeated imports.

Date:
2026-07-21

## ADR-007

Decision:
Assume a trusted local or single-user deployment with a durable filesystem and
one application instance. Do not claim public multi-tenant safety without
authentication. Ephemeral serverless hosts are out of scope for this SQLite
layout. Word/PDF export is Milestone 5 (after database persistence).

Reason:
- Matches current product scope and deployment reality.
- Avoids premature cloud/auth/Postgres complexity.

Date:
2026-07-21

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

## ADR-008

Decision:
Deploy to Render as a single Docker web service with a persistent disk at
`/var/data` and `DATABASE_PATH=/var/data/oscal-author.db`. Production startup
migrates SQLite, optionally seeds the CGDS demo idempotently
(`SEED_DEMO_PROJECT=true`, never `--reset`), then runs Next.js on `0.0.0.0`
using `PORT`. Do not migrate to Postgres or another network database for this
deployment path. Do not use Next.js `output: "standalone"` while migrate/seed
scripts and pinned on-disk artifacts remain part of production startup.

Reason:
- Preserves the existing SQLite + Drizzle architecture on a durable mount.
- Fails closed if `DATABASE_PATH` is unset in production (no silent local DB).
- Keeps a clear health check (`/api/health`) for Render.
- Avoids standalone packaging that would complicate migrations, seed, and
  vendor schema access.

Date:
2026-07-21

## ADR-009

Decision:
Store Control Freak ownership and lifecycle metadata in a separate
`control_records` SQLite table (`ControlRecord`), scoped by `projectId` and
keyed uniquely with framework `controlId`. Do not put these fields in OSCAL
models, `FrameworkControl`, or `project_json` implementations.

Reason:
- Keeps standards-based OSCAL / framework content separate from application
  management data.
- Gives future entities (comments, reviews, approvals, evidence, history) a
  stable `ControlRecord.id` to reference.
- Allows lazy creation: missing rows resolve to draft / unassigned defaults
  without backfilling every baseline control up front.

Date:
2026-07-22

## ADR-010

Decision:
Introduce an append-only `control_activities` table (`ControlActivity`) keyed by
`control_record_id`, written in the same SQLite transaction as ControlRecord
metadata upserts. Emit `control_record_created` on first create without
per-field events for initial values; on update emit field-change events only
for values that actually changed. Actor identity is resolved via a small
`resolveActor` helper (System fallback today; Cloudflare Access headers later).

Reason:
- Gives ownership, workflow, comments, approvals, evidence, and history a
  shared durable activity stream without mixing into OSCAL / project_json.
- Named version restore stays document-only; operational metadata keeps an
  independent lifecycle.
- No-op autosaves must not spam the stream.

Date:
2026-07-22

## ADR-011

Decision:
Rename ControlRecord.`status` to `implementationStatus` (SQLite column
`implementation_status`) and rename the activity type `status_changed` to
`implementation_status_changed`. Do not keep compatibility aliases.

Reason:
- Makes clear that this field is the implementation lifecycle, not review
  progress.
- Prepares for a separate future `reviewStatus` without overloaded “status”
  wording in types, UI, or activity history.

Date:
2026-07-22

## ADR-012

Decision:
Add `reviewStatus` on ControlRecord (SQLite column `review_status`) as a
separate review-workflow lifecycle from `implementationStatus`. Change
`reviewStatus` only through a centralized state machine and
`transitionReviewStatus` service method (never via the metadata autosave
payload or arbitrary status assignment). Emit matching ControlActivity rows
(`review_requested`, `review_started`, `review_approved`, `changes_requested`,
`review_resubmitted`, `review_reopened`). Treat approval as a state transition
plus activity, not a durable Approval entity. Keep review state and activity
history live operational metadata that named `project_json` version restore
does not roll back. Future RBAC will gate who may invoke each transition.

Reason:
- Keeps implementation maturity and review workflow independent.
- Prevents UI/API drift by centralizing legal transitions, action labels, and
  activity types.
- `expectedCurrentStatus` concurrency check avoids silent overwrites across
  tabs/users.
- Defers comments, evidence, notifications, and Approval records until needed.

Date:
2026-07-22

## ADR-013

Decision:
Introduce a lightweight in-repo design system under
`src/components/design-system` (tokens in `globals.css`, Brand, Card,
StatusBadge, AppShell / ProductHeader) and standardize Control Freak brand
assets under `public/brand/`. Product chrome uses ProductHeader; control
editor composes SplitLayout + shared cards. Do not add a third-party UI kit.

Reason:
- Removes duplicated badge/card/button styling as the product grows beyond a
  simple OSCAL editor.
- Centralizes logo selection and responsive lockup/mark behavior.
- Keeps presentation separate from persistence and review workflow logic.

Date:
2026-07-22

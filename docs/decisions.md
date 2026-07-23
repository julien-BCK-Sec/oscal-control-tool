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

**Superseded in part by ADR-014 (2026-07-22).** Historical context for the
SQLite era. Repository interfaces, Server Actions mutation boundaries, and
keeping Drizzle types out of React/domain code remain in force. The application
database dialect is now PostgreSQL.

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

**Superseded in part by ADR-014 and ADR-015 (2026-07-22).** Historical context
for the trusted single-user SQLite deployment. Fail-closed production
configuration, Server Actions as the mutation boundary, and not claiming
unauthenticated multi-tenant safety remain in force. Authentication,
organizations, and PostgreSQL are now required platform foundation.

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

**Superseded in part by ADR-014 and ADR-019 (2026-07-22).** Historical context
for the SQLite-on-disk Render path. Docker multi-stage packaging without
`output: "standalone"`, idempotent demo seeding without `--reset`, health check
at `/api/health`, and fail-closed production configuration remain in force. The
application database is now Render PostgreSQL via `DATABASE_URL`.

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

**Actor resolution updated by ADR-015.** System actor remains for automated
operations; authenticated user actions use Better Auth session identity.

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

## ADR-014

Decision:
Use PostgreSQL as the supported application database with Drizzle ORM. Connect
through server-only `DATABASE_URL` using a bounded connection pool. In
production, use Render PostgreSQL in the same region as the Render web service
and prefer the Render internal connection URL. Require secure external
connections. Never expose database configuration through `NEXT_PUBLIC_*`
variables.

Preserve application-facing repository interfaces and Next.js Server Actions as
the mutation boundary on the Node.js runtime. Keep Drizzle and driver types out
of React and domain code.

This decision supersedes the SQLite dialect/driver and filesystem database path
portions of ADR-003 and ADR-008. Historical SQLite migrations and tooling remain
available only to support the one-shot cutover in ADR-016 until that migration
path is no longer needed.

Reason:
- Enables multi-user, multi-tenant platform foundation.
- Matches the approved Render production topology.
- Keeps fail-closed production configuration without silent local defaults.

Date:
2026-07-22

## ADR-015

Decision:
Authenticate users with Better Auth backed by PostgreSQL and the Better Auth
organization plugin. For Milestone 1, enable email/password authentication with
mandatory email verification. Disable public self-registration; membership is
invite-only after bootstrap. Social authentication, SSO, passkeys, MFA, and
SCIM are out of scope.

Use database-backed opaque sessions stored in secure HTTP-only cookies
(`Secure` in production, `SameSite=Lax`), with server-side validation,
expiration, and rotation. Do not use stateless application JWT authorization
claims.

Resolve actors from the authenticated Better Auth session for user actions.
Preserve a System actor for automated operations (migrations, seeds, jobs).

Control Freak application repositories and services remain responsible for
resource-level authorization. Do not treat Better Auth as the sole
authorization boundary.

This decision supersedes the unauthenticated trusted-deployment assumption in
ADR-007 and replaces the Cloudflare Access header path previously anticipated
in ADR-010 for product authentication.

Reason:
- Provides a maintained auth stack with organizations and invitations.
- Opaque server sessions avoid client-forged authorization claims.
- Keeps project/control authorization fail-closed in application code.

Date:
2026-07-22

## ADR-016

Decision:
Migrate existing SQLite data to PostgreSQL with a one-shot offline cutover. Do
not implement dual-write.

Procedure:

1. Stop writes.
2. Back up the SQLite file.
3. Apply PostgreSQL migrations.
4. Create an initial organization and administrator.
5. Assign all existing projects to that organization.
6. Migrate projects, snapshots, control records, and control activities.
7. Preserve identifiers, revisions, timestamps, relationships, statuses, and
   ordering.
8. Produce count and integrity verification.
9. Verify representative projects and OSCAL export.
10. Switch the application to PostgreSQL.

Rollback is restoration of the previous SQLite deployment and its backup. No
PostgreSQL-to-SQLite reverse synchronization is required.

Reason:
- Avoids prolonged dual-database complexity for a clear platform cutover.
- Preserves audit and version history required by the product.
- Makes recovery explicit and operationally testable.

Date:
2026-07-22

## ADR-017

Decision:
Use these fixed organization roles for Milestone 1:

- `organization_admin`
- `project_manager`
- `author`
- `reviewer`
- `viewer`

Encode the permission matrix centrally in Control Freak application code and
enforce it server-side before repository reads and mutations. Do not implement
custom roles. UI visibility may hide unavailable actions but is never
authorization.

Better Auth organization plugin membership stores the role string; Control
Freak owns the authoritative permission checks for projects, controls, review
transitions, invitations, and membership management.

Reason:
- Smallest role model that satisfies the platform foundation milestone.
- Prevents authorization drift across Server Actions and UI.

Date:
2026-07-22

## ADR-018

Decision:
Organization invitations use a seven-day lifetime. Invitation identifiers must
be cryptographically unpredictable. Acceptance requires an authenticated user
with a verified email matching the invitation. Acceptance creates exactly one
membership and is idempotent. Accepted, expired, revoked, or superseded
invitations cannot be reused. Resending supersedes the existing pending
invitation. Organization administrators may revoke invitations. Do not log
invitation links or tokens.

Implement invitations through Better Auth’s organization invitation flow
configured to these rules, with Control Freak authorization gating who may
invite, revoke, or change roles.

Reason:
- Matches approved invite-only tenancy without storing recoverable plaintext
  invitation secrets beyond opaque identifiers.
- Prevents privilege escalation and invitation replay.

Date:
2026-07-22

## ADR-019

Decision:
Keep the Render demo deployment, but make it authenticated and invite-only.
Seed one demo organization. Do not seed shared public credentials. Create the
initial administrator through a documented bootstrap process. Seed the demo
project idempotently into the demo organization. Never use `--reset` during
deployment. Disable public self-registration.

Reason:
- Preserves a representative demo without an open anonymous data plane.
- Aligns demo access with the multi-user security model.

Date:
2026-07-22

## ADR-020

Decision:
Introduce control-scoped collaboration as operational metadata (Milestone 02A):

- Collaboration targets are Controls only.
- Discussions use an unlimited-depth parent-child comment model.
- Comments are soft-deleted (`deleted_at`) to preserve auditability; moderators
  may restore.
- Mentions resolve `@token` values against organization members only (email,
  email local-part, or display name); unresolved tokens are ignored.
- In-app notifications are retained indefinitely unless explicitly soft-deleted;
  active-row duplicate prevention keys on recipient + event type + related
  object id.
- Assignments carry one primary assignee per assignment record with role
  `owner` or `reviewer`.
- Collaboration events append to the existing ControlActivity stream and follow
  the same retention policy.
- Collaboration metadata is never stored in `project_json` or exported as OSCAL.

Centralize collaboration permissions in `src/authz/permissions.ts` and enforce
them in authorized server wrappers before repository access.

Reason:
- Enables first-class collaboration without contaminating standards interchange.
- Reuses Platform Foundation tenancy, RBAC, and activity patterns.
- Keeps email/chat/live presence and workflow automation out of scope.

Date:
2026-07-22

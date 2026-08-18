# Current Project State

Date: 2026-08-17

## Product Position

Control Freak is a collaborative compliance authoring application built around
OSCAL. Milestone 04B (Framework UX and Runtime Hardening) completes the
project-scoped NIST SP 800-53 Rev. 5 Low / Moderate / High architecture
introduced in Milestone 04A, on top of Evidence Coverage (03D), Evidence
Versions (03B), Workflow Automation (02C), Domain Events (02B), Collaboration
(02A), and Platform Foundation.

The application currently provides:

- Organization-owned project management
- Better Auth email/password authentication with email verification
- Role-based authorization (`organization_admin`, `project_manager`, `author`,
  `reviewer`, `viewer`) including collaboration, event-diagnostics, workflow,
  and evidence permissions
- Organization invitations and team management
- Control authoring
- Review workflow
- Threaded control discussions (soft delete, resolution, @mentions)
- Control assignments (owner / reviewer roles)
- In-app notification center
- Domain event publication after successful authorized mutations
- Process-local domain event diagnostics (organization admin)
- Workflow automation rules that subscribe to the Domain Event Bus
- Workflow execution history / diagnostics (organization admin)
- Project-scoped Evidence records with control associations and requirement
  metadata on ControlRecord (ADR-024)
- Immutable Evidence Versions with app-proxied upload/download and
  S3-compatible / filesystem object storage (ADR-025; Milestone 03B)
- Operational metadata and activity history (including collaboration and
  evidence link/unlink events)
- Version history
- OSCAL SSP export and schema validation (profile metadata from the selected
  project framework)
- Idempotent demo project seeding into a demo organization
- Developer demo bootstrap (`npm run bootstrap:demo`) for a full local
  multi-tenant environment (Acme + Contoso, users, projects, collaboration)

OSCAL is an export/interchange format, not the internal editing model.
Collaboration metadata is never exported as OSCAL.

Current stack:

- Next.js (App Router)
- TypeScript
- React
- Tailwind
- npm
- PostgreSQL + Drizzle (`pg`) for application persistence
- Better Auth (sessions, organizations plugin)
- SQLite tooling retained only for offline cutover from legacy deployments
- Browser localStorage retained only for non-authoritative UI preferences
  (theme preference `system` | `light` | `dark`, ADR-022; authoritative data is
  PostgreSQL)

## Architecture

1. Pinned NIST OSCAL profiles + catalog (vendor)
2. `FrameworkRegistry` → `FrameworkProvider` → application-facing `Framework`
3. Better Auth users / sessions / organizations / memberships / invitations
4. User implementation data (persisted per organization-owned project)
5. Project metadata (persisted per project)
6. OSCAL-independent domain model (`assembleProject`)
7. `ProjectRepository` → PostgreSQL (hybrid columns + validated JSON)
8. Collaboration repositories/services → PostgreSQL (`comments`,
   `comment_mentions`, `assignments`, `notifications`)
9. Centralized Control Freak RBAC (`src/authz`) before repository access
10. Domain events (`DomainEventPublisher` → `DomainEventBus`) after successful
    mutations (ADR-021)
11. Workflow engine subscribes to `DomainEventBus` (ADR-023); business services
    never invoke workflows
12. OSCAL exporter + AJV validation

Keep these concerns separate. Framework content is never stored in the database.
Authorization is enforced server-side; UI hiding is not authorization.

## Platform foundation (Milestone 1)

- Database: PostgreSQL via `DATABASE_URL` (ADR-014)
- Auth: Better Auth email/password, mandatory verification, opaque cookie
  sessions, invite-only registration (ADR-015, ADR-018, ADR-019)
- Tenancy: every project has `organization_id`; memberships bind users to orgs
- Roles and permissions: authoritative matrix in `src/authz/permissions.ts`
- Cutover: one-shot SQLite → PostgreSQL
  (`docs/playbooks/sqlite-to-postgres-cutover.md`, ADR-016)
- Demo: authenticated invite-only; full local environment via
  `npm run bootstrap:demo` (development-only, idempotent, never truncates);
  minimal admin via `npm run bootstrap:admin`; deploy seed with
  `SEED_DEMO_ORG_SLUG` (never `--reset` on deploy)
- Health: `GET /api/health` probes PostgreSQL without exposing secrets

## Developer demo bootstrap

`npm run bootstrap:demo` prepares a complete local environment without manual
`.env.local` editing, invitations, or hand-built demo data. It:

1. Ensures `.env.local` (create from `.env.example` or fill missing keys only)
2. Refuses production / non-local databases
3. Runs `npm run db:migrate`
4. Creates Acme Corporation and Contoso Industries with RBAC memberships
5. Creates four NIST SP 800-53 Rev. 5 Moderate projects (Goose flagship plus
   thinner Acme/Contoso projects), each with an explicit Moderate
   `frameworkId`
6. Populates Milestone 02A collaboration via discussion/assignment services
   (markers keep seeds idempotent)

Shared demo password: `ControlFreakDemo123!`. Olivia’s prompt label
“Contributor” maps to the existing `author` role. There is no FedRAMP Moderate
importer; demo/bootstrap projects explicitly use the pinned NIST Moderate
baseline. New projects may select Low, Moderate, or High.

## Collaboration (Milestone 02A)

- Targets: Controls only (ADR-020)
- Discussions: unlimited parent-child depth; soft delete; resolution
- Mentions: `@token` resolved to organization members only
- Notifications: in-app only; retained until explicitly deleted; active-row
  duplicate prevention; by-ID mutations authorize against the notification's
  organization, not membership order
- Assignments: one primary assignee per assignment record (`owner` | `reviewer`)
- Activity: collaboration events append to the existing ControlActivity stream
  with newest-first pagination
- UI: discussion panel, assignment controls, mention autocomplete, notification
  center in product header (enriched context + deep links into Controls)
- Routes / actions: discussion, assignment, notification, and mention-candidate
  Server Actions under `src/app/actions/`
- Notification deep links: `/projects/{id}?view=controls&control={id}&comment={id}`
  (authorization still enforced by project/org membership; deleted comments show
  a graceful fallback in the discussion panel)

## Domain events (Milestone 02B)

- Contracts in `src/domain/events` with `<Aggregate><Action>` event names
- `DomainEventPublisher` and in-process `DomainEventBus` (ADR-021)
- Authorized wrappers publish after successful project/control/discussion/
  assignment/notification operations
- Notifications and ControlActivity remain direct writes (not handler-driven yet)
- Handler failures are logged and isolated from originating mutations
- Process-local diagnostics via `event.diagnostics.read` (organization admin)
- No durable event store, retries, workers, or external broker in this milestone

## Workflow automation (Milestone 02C)

- Engine and registries in `src/workflow` (ADR-023); see `docs/workflows.md`
- Subscribes to DomainEventBus after successful publishes; business services
  never call workflows
- Persistence: `workflow_rules` + `workflow_executions` (migration
  `drizzle-pg/0004_*.sql`) with validated JSON for conditions/actions/detail
- Admin UI: `/organizations/{orgId}/workflows` (list/create/edit/runs)
- Permissions: `workflow.read` / `workflow.manage` (organization admin)
- Synchronous execution; no-cascade loop protection
- Priority/severity/tag catalog entries registered as unavailable extension
  points (no ControlRecord schema for those fields yet)

## Evidence management (Milestone 03A / 03B / 03C / 03D)

- Aggregate: project-scoped Evidence with stable UUID (ADR-024)
- Junction: `evidence_controls` (M:N to framework `control_id`)
- ControlRecord.`evidenceRequirement`: `required` (default) | `optional` |
  `not_required`
- Lifecycle: `draft` | `active` | `archived`; hard-delete only for unlinked
  drafts (`evidence.delete` for managers); new associations reject archived
- Versions: immutable `evidence_versions` + `current_version_id`; binaries in
  object storage via storage port (filesystem dev/test; S3-compatible
  production, fail closed) — ADR-025
- Upload/download: authorized Route Handlers; max size
  `EVIDENCE_UPLOAD_MAX_BYTES` (default 25 MiB)
- Search: project-scoped Server Action with keyset pagination and
  `EvidenceSearchResult` DTO (optional current-version summary)
- Derived Evidence Coverage and freshness (Milestone 03D): control and
  project read models, Evidence Browser filters, inventory CSV; not a
  compliance score (ADR-024 amendment)
- Audit: ControlActivity `evidence_added` / `evidence_removed` /
  `evidence_requirement_changed`; domain events including
  `EvidenceVersionUploaded`
- Permissions: `evidence.read|create|update|associate|archive|delete` (no new
  reporting permission; inventory CSV uses `evidence.read`)
- UI: Overview coverage counts; scalable Evidence tab search/filters/attention
  views; control-tree coverage indicators; control Evidence panel freshness
- Coverage semantics: only `active` Evidence satisfies coverage; drafts are
  attention facts; archived is excluded; metadata-only active Evidence counts;
  computed over the project's selected framework control set (default
  `required`)
- Freshness: derived from `reviewDueDate` vs UTC `asOfDate`; due-soon window
  30 days (`EVIDENCE_DUE_SOON_DAYS`); no scheduled jobs
- Export: authorized CSV inventory
  (`GET /api/projects/{id}/evidence/inventory`); one row per Evidence–control
  pair; unlinked Evidence has empty control fields; no binaries or storage keys;
  CSV cells neutralize spreadsheet formula prefixes (`= + - @` tab CR) before
  RFC quoting
- Out of scope: org-wide library, approval, assessment, OSCAL export of
  evidence, virus scan, compliance scores

## Current standards position

- OSCAL version: 1.2.2
- Supported frameworks: NIST SP 800-53 Rev. 5 Low, Moderate, and High
  (opaque `frameworkId` values `nist-sp-800-53-rev5-low|moderate|high`)
- Framework source of truth: pinned Low / Moderate / High profiles + SP 800-53
  catalog, selected per project via `FrameworkRegistry` (ADR-026). Runtime
  identity is `projects.framework_id`; `project_json.project.frameworkId` is a
  schema v1 compatibility copy only.
- Create UI defaults to Moderate and always sends an explicit `frameworkId`.
  Omitting `frameworkId` on the create API still selects Moderate for
  backwards-compatible callers; that default is API compatibility, not the
  architectural source of framework identity.
- Demo/bootstrap projects remain Moderate with that `frameworkId` explicit
- Existing projects continue as Moderate; no SQL backfill was required
- Current product does not claim FedRAMP support
- FedRAMP Rules are a separate future policy layer
- Do not invent or substitute a FedRAMP OSCAL profile

## Pinned official artifacts

Under:

`vendor/oscal/v1.2.2/`

Use:

- `schema/oscal_ssp_schema.json`
- `schema/oscal_profile_schema.json`
- `schema/oscal_catalog_schema.json`
- `profiles/NIST_SP-800-53_rev5_LOW-baseline_profile.json`
- `profiles/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json`
- `profiles/NIST_SP-800-53_rev5_HIGH-baseline_profile.json`
- `catalogs/NIST_SP-800-53_rev5_catalog.json`

Provenance and checksums are documented in:

`vendor/oscal/v1.2.2/SOURCES.md`

Do not fetch standards files at runtime and do not use moving branches.

## Persistence

- Interface: `ProjectRepository` in `src/persistence/`
- Implementation: Drizzle + `pg` under `src/persistence/postgres/`
- Collaboration: `CommentRepository`, `AssignmentRepository`,
  `NotificationRepository`, `DiscussionService`, `AssignmentService`
- Workflow: `WorkflowRepository` (`workflow_rules`, `workflow_executions`)
- Server entry: `src/persistence/server.ts` (`server-only`) + authorized
  wrappers in `src/server/`
- Database: `DATABASE_URL` (required in production)
- Local development database: `docker compose up -d` (`compose.yaml`,
  PostgreSQL 16, `postgres`/`postgres`/`oscal_control_tool` on port 5432).
  On Ubuntu `docker.io`, also install `docker-compose-v2`.
- Migrations: `drizzle-pg/` via `npm run db:migrate` (standalone scripts load
  `.env`, then `.env.local`; existing process env wins). Collaboration tables
  are in `drizzle-pg/0003_demonic_moondragon.sql`; workflow tables in
  `drizzle-pg/0004_redundant_paibok.sql`; evidence tables +
  `control_records.evidence_requirement` in
  `drizzle-pg/0005_happy_lethal_legion.sql`; Evidence Versions +
  `evidence.current_version_id` in `drizzle-pg/0006_happy_raza.sql`; Evidence
  search keyset index in `drizzle-pg/0007_evidence_search_idx.sql`; Evidence
  review-due index in `drizzle-pg/0008_evidence_review_due_idx.sql`.
- Routes: `/sign-in`, `/projects`, `/projects/[id]` (including `?view=evidence`),
  `/organizations/[orgId]/settings`, `/organizations/[orgId]/workflows`,
  `/invitations/[id]`
- ControlRecords / ControlActivity / collaboration / evidence tables remain
  operational metadata outside OSCAL and `project_json`

Legacy SQLite code under `src/persistence/sqlite/` and `drizzle/` supports
cutover only.

## Known gaps

- No production email provider wired (dev uses `TEST_EMAIL_SINK`)
- Social login, SSO, passkeys, MFA, SCIM out of scope
- No semantic OSCAL cross-reference validation yet
- No stable OSCAL UUID persistence
- No FedRAMP policy evaluation
- No portable OSCAL package
- No OSCAL import (SSP → project)
- Snapshot merge UX deferred (reload-latest on conflict)
- Searchable Evidence Picker implemented (org-wide library still deferred)
- Evidence approval workflow not implemented
- Evidence Coverage is derived program management, not assessment or
  compliance scoring
- Email / Slack / Teams notifications out of scope (in-app only)
- ControlRecord priority, severity, and tags not modeled (workflow catalog
  entries exist but are unavailable)
- Workflow execution is synchronous / in-process; no queues or retries
- Workflows do not cascade (documented limitation)
- Durable domain event store / outbox / external broker not implemented
- Named version restore does not roll back ControlRecord metadata, activity,
  or collaboration rows; it also does not change the live project's
  `frameworkId` column (ADR-026)
- Intentionally NIST-specific behavior remains: control families, enhancement
  IDs (`ac-2.1`), family grouping, and client SSP export via the NIST identity
  table rather than `FrameworkRegistry`
- Per-control UI action hiding is coarse; server authorization is authoritative
- Favicon remains the light-mark asset (not theme-switched)

## Next approved milestone

Word/PDF export remains the next roadmap item after Framework UX and Runtime
Hardening (Milestone 04B). Assessment management, Evidence approval, and an
organization-wide library are later. See `docs/roadmap.md`.

## Required verification for each milestone

Run:

- `npm test`
- `npm run lint`
- `npm run build`

Do not commit until the user reviews the summary.

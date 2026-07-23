# Current Project State

Date: 2026-07-22

## Product Position

Control Freak is a collaborative compliance authoring application built around
OSCAL. Milestone 02C (Workflow Automation) adds an event-driven workflow
engine on top of Domain Events (02B), Collaboration (02A), and Platform
Foundation (PostgreSQL, Better Auth, organizations, RBAC, invite-only access).

The application currently provides:

- Organization-owned project management
- Better Auth email/password authentication with email verification
- Role-based authorization (`organization_admin`, `project_manager`, `author`,
  `reviewer`, `viewer`) including collaboration, event-diagnostics, and
  workflow permissions
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
- Operational metadata and activity history (including collaboration events)
- Version history
- OSCAL SSP export and schema validation
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

1. Pinned NIST OSCAL profile + catalog (vendor)
2. `FrameworkProvider` → application-facing `Framework`
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
   thinner Acme/Contoso projects)
6. Populates Milestone 02A collaboration via discussion/assignment services
   (markers keep seeds idempotent)

Shared demo password: `ControlFreakDemo123!`. Olivia’s prompt label
“Contributor” maps to the existing `author` role. There is no FedRAMP Moderate
importer; projects use the pinned NIST Moderate baseline.

## Collaboration (Milestone 02A)

- Targets: Controls only (ADR-020)
- Discussions: unlimited parent-child depth; soft delete; resolution
- Mentions: `@token` resolved to organization members only
- Notifications: in-app only; retained until explicitly deleted; active-row
  duplicate prevention
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

## Current standards position

- OSCAL version: 1.2.2
- Current framework: NIST SP 800-53 Rev. 5 Moderate (full baseline via profile)
- Framework source of truth: pinned Moderate profile + SP 800-53 catalog
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
- `profiles/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json`
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
  `drizzle-pg/0004_redundant_paibok.sql`.
- Routes: `/sign-in`, `/projects`, `/projects/[id]`,
  `/organizations/[orgId]/settings`, `/organizations/[orgId]/workflows`,
  `/invitations/[id]`
- ControlRecords / ControlActivity / collaboration tables remain operational
  metadata outside OSCAL and `project_json`

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
- Evidence management not implemented
- Email / Slack / Teams notifications out of scope (in-app only)
- ControlRecord priority, severity, and tags not modeled (workflow catalog
  entries exist but are unavailable)
- Workflow execution is synchronous / in-process; no queues or retries
- Workflows do not cascade (documented limitation)
- Durable domain event store / outbox / external broker not implemented
- Named version restore does not roll back ControlRecord metadata, activity,
  or collaboration rows
- Per-control UI action hiding is coarse; server authorization is authoritative
- Favicon remains the light-mark asset (not theme-switched)

## Next approved milestone

Word/PDF export (and later framework expansions) remain later roadmap items.
See `docs/roadmap.md`.

Workflow Automation (Milestone 02C) is implemented on
`feat/workflow-automation-02c`.

## Required verification for each milestone

Run:

- `npm test`
- `npm run lint`
- `npm run build`

Do not commit until the user reviews the summary.

# Current Project State

Date: 2026-07-22

## Product Position

Control Freak is a collaborative compliance authoring application built around
OSCAL. Milestone 1 (Platform Foundation) establishes multi-user tenancy on
PostgreSQL with Better Auth, organizations, RBAC, and invite-only access.

The application currently provides:

- Organization-owned project management
- Better Auth email/password authentication with email verification
- Role-based authorization (`organization_admin`, `project_manager`, `author`,
  `reviewer`, `viewer`)
- Organization invitations and team management
- Control authoring
- Review workflow
- Operational metadata and activity history
- Version history
- OSCAL SSP export and schema validation
- Idempotent demo project seeding into a demo organization

OSCAL is an export/interchange format, not the internal editing model.

Current stack:

- Next.js (App Router)
- TypeScript
- React
- Tailwind
- npm
- PostgreSQL + Drizzle (`pg`) for application persistence
- Better Auth (sessions, organizations plugin)
- SQLite tooling retained only for offline cutover from legacy deployments
- Browser localStorage only as a legacy import source

## Architecture

1. Pinned NIST OSCAL profile + catalog (vendor)
2. `FrameworkProvider` → application-facing `Framework`
3. Better Auth users / sessions / organizations / memberships / invitations
4. User implementation data (persisted per organization-owned project)
5. Project metadata (persisted per project)
6. OSCAL-independent domain model (`assembleProject`)
7. `ProjectRepository` → PostgreSQL (hybrid columns + validated JSON)
8. Centralized Control Freak RBAC (`src/authz`) before repository access
9. OSCAL exporter + AJV validation

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
- Demo: authenticated invite-only; bootstrap admin via
  `npm run bootstrap:admin`; seed with `SEED_DEMO_ORG_SLUG` (never `--reset`
  on deploy)
- Health: `GET /api/health` probes PostgreSQL without exposing secrets

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
- Server entry: `src/persistence/server.ts` (`server-only`) + authorized
  wrappers in `src/server/`
- Database: `DATABASE_URL` (required in production)
- Migrations: `drizzle-pg/` via `npm run db:migrate`
- Routes: `/sign-in`, `/projects`, `/projects/[id]`,
  `/organizations/[orgId]/settings`, `/invitations/[id]`
- ControlRecords / ControlActivity remain operational metadata outside OSCAL
  and `project_json`

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
- ControlRecord comments / evidence / notifications not implemented
- Named version restore does not roll back ControlRecord metadata or activity
- Per-control UI action hiding is coarse; server authorization is authoritative

## Next approved milestone

Word/PDF export and later collaboration features. See `docs/roadmap.md`.

Platform Foundation (Milestone 1) is implemented on `feat/platform-foundation`.

## Required verification for each milestone

Run:

- `npm test`
- `npm run lint`
- `npm run build`

Do not commit until the user reviews the summary.

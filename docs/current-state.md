# Current Project State

Date: 2026-08-27

## Product Position

Control Freak is a collaborative compliance authoring application.
Milestone 06A adds DoD Cloud Impact Level 4 as a product-selectable
framework on top of Milestone 05C (Render demo hosting), Milestone 05B
(`DEPLOYMENT_MODE=normal|demo`), Milestone 05A (canonical demo dataset),
Milestone 04C (CMMC Level 2 Framework Support), Milestone 04B
(Framework UX and Runtime Hardening), and the project-scoped NIST SP 800-53
Rev. 5 Low / Moderate / High architecture introduced in Milestone 04A, on
top of Evidence Coverage (03D), Evidence Versions (03B), Workflow Automation
(02C), Domain Events (02B), Collaboration (02A), and Platform Foundation.

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
- OSCAL SSP export and schema validation for NIST SP 800-53 projects
  (unavailable for CMMC and DoD Cloud IL4; no official CMMC / SP 800-171
  Rev. 2, FedRAMP, or DoD IL4 OSCAL profile)
- Idempotent demo project seeding into a demo organization
- Canonical demo bootstrap (`npm run bootstrap:demo`) for a local
  multi-tenant environment: Canadian Goose Defence System (Goose flagship
  plus supporting projects, including CMMC Level 2 and DoD Cloud Impact
  Level 4), Contoso Industries, and FirstDoor.
- In-app Help / user guide (`/help`, `/help/{slug}`) rendering Markdown
  content from `docs/user-guide/` for authenticated users, with contextual
  links from the control editor, overlay metadata panel, Evidence tab, OSCAL
  export, and workflow
  automation screens


OSCAL is an export/interchange format, not the internal editing model.
Collaboration metadata is never exported as OSCAL.

## Verified production release

**v0.6.1** (`eb12b69926dca4b47c2cb4cd03e3d8dc0f053391`) is the live
production revision. Milestone 06A is implemented, merged, released, and
production verified.

**v0.6.0** (`48ae30f`) is the 06A merge commit. It is **not** the live
release: the Render Docker build failed because `.dockerignore` excluded
`docs/user-guide` from the builder context. **v0.6.1** includes that
packaging fix (`7d2034f`, merged as `eb12b69`). The production image uses
builder `COPY . .` plus `.dockerignore` exceptions for `docs/user-guide`.
No extra Dockerfile `COPY` of Help files was committed.

Hosted demo (`docs/deploy-render.md`): service `oscal-control-tool`, source
branch `main`, auto-deploy **off**, `DEPLOYMENT_MODE=demo`. Health
`GET /api/health` returns HTTP 200.

Production smoke confirmed IL4 is selectable, Snow Goose Cloud Impact
Level 4 (Demo) exists, NIST Moderate and CMMC Level 2 remain available
(including Strategic Goose Operations Platform), IL4 Help resolves, IL4
OSCAL SSP export remains unavailable, and representative IL4 items
(AC-2, AC-7, IA-5(1), SC-17, SC-46, GRR-1) resolve with the IA-5(1)
source-conflict notice and DSPAV-required overlay behavior still present.
Help Markdown is in the production Docker image.

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
  (theme preference `system` | `light` | `dark`, ADR-022; control-navigation
  pane width `cf-control-nav-width`; authoritative data is PostgreSQL)

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
- Demo: authenticated invite-only. Local full environment via
  `npm run bootstrap:demo`. Production uses `DEPLOYMENT_MODE=normal|demo`
  (`npm start`: validate → migrate → mode bootstrap → Next.js). Deployed
  demo requires `DEMO_BOOTSTRAP_PASSWORD` and seeds the full 05A dataset.
  Never `--reset` on deploy. See `docs/deployment.md` and `docs/demo-data.md`.
- Health: `GET /api/health` probes PostgreSQL without exposing secrets

## Developer demo bootstrap

`npm run bootstrap:demo` is the canonical command for the demo environment.
It prepares a complete local environment without manual `.env.local`
editing, invitations, or hand-built demo data. It:

1. Ensures `.env.local` (create from `.env.example` or fill missing keys only)
2. Refuses production / non-local databases (local orchestrator only)
3. Runs `npm run db:migrate`
4. Creates **Canadian Goose Defence System**, **Contoso Industries**, and
   **FirstDoor** with RBAC memberships
5. Seeds the Goose flagship plus supporting projects (NIST Low / Moderate /
   High, CMMC Level 2, and DoD Cloud Impact Level 4), Contoso Cloud Platform,
   and FirstDoor Platform (Demo)
6. Populates collaboration, ControlRecord metadata, and Evidence
   (markers keep seeds idempotent; existing user edits are preserved)

Shared local demo password: `ControlFreakDemo123!` (override with
`DEMO_BOOTSTRAP_PASSWORD`). Olivia’s prompt label “Contributor” maps to the
existing `author` role. There is no FedRAMP Moderate importer; the flagship
uses the pinned NIST Moderate baseline. CMMC demo content does not export
OSCAL. Local `npm run dev` allows LAN origin `192.168.211.160` via Next.js
`allowedDevOrigins` (development only; omitted from production builds).

See `docs/demo-data.md` for organizations, projects, maturity intent, and
safety/idempotency rules.

`db:seed:demo` remains a lower-level flagship-only seed into
`SEED_DEMO_ORG_SLUG`. `--reset` is a separate destructive local command.

Production deployments use `DEPLOYMENT_MODE` (`docs/deployment.md`, ADR-028).
`SEED_DEMO_PROJECT` is no longer a production startup switch.

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
  views; control-tree coverage indicators; control Evidence panel freshness;
  linked Evidence titles open `/projects/{id}?view=evidence&evidence={id}`
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

## CMMC Level 2 (Milestone 04C)

- Framework ID: `cmmc-level-2-nist-sp-800-171-r2` (immutable Project identity)
- Population: 110 requirements in 14 families from NIST SP 800-171 Rev. 2
- Operational IDs: CMMC identification numbers (`AC.L2-3.1.1`); NIST origin
  retained as `originId` (`3.1.1`), not a separate operational row
- Presentation: user-facing "requirement/requirements"; internal `controlId`,
  ControlRecord, `view=controls` unchanged
- Evidence Coverage semantics unchanged; CMMC copy states coverage is not
  MET / NOT MET, SPRS, or certification
- OSCAL SSP export disabled (no official CMMC / 800-171 R2 OSCAL profile)
- No schema migration; no assessment, scoring, or certification fields
- DoD Model Overview short names were not pinable (HTTP 403); titles are
  derived from the NIST requirement statement

## In-app Help / user guide

- Canonical content: Markdown pages with frontmatter (`title`, `summary`,
  `section`, `order`, `related`) under `docs/user-guide/`; the same files are
  the checked-in documentation source and the in-app Help content — no
  duplicated copy
- Loader (`src/help/`): server-only frontmatter + dependency-free Markdown
  parser (headings, paragraphs, lists, code blocks, labeled blockquote
  callouts, `diagram` fences, tables, links; no `dangerouslySetInnerHTML`),
  grouped into a manifest by section (`src/help/sections.ts`)
- Routes: `/help` (Help Center landing: task cards, in-memory full-text
  search over parsed pages, and browse-all topics) and `/help/{slug}`
  (article with sticky topic nav, optional right-hand table of contents on
  wide screens, related-topic links, and previous/next), both behind
  authentication (redirect to sign-in) and using the existing `AppShell` /
  `ProductHeader` / `PageContent` design-system shell
- Navigation: sidebar topic list with a client-side "Filter topics" control
  across titles and summaries; landing-page search matches title, summary,
  headings, and body text (no search index/dependency)
- Discoverability: a persistent **Help** link in the authenticated header
  (`AuthenticatedHeaderActions`); the Help header logo and a **Back to
  projects** link return to `/projects`; targeted contextual links
  (`HelpLink`) on the control editor (the three status fields), the overlay
  metadata panel (IL4 Help), the Evidence tab (coverage/freshness), the OSCAL
  export control (including IL4-unavailable copy), and the workflow
  automation rule list — not added to every screen. Contextual links stay
  in-app (same tab) and deep-link to the relevant heading where one exists
- Tests validate manifest loading/ordering, path-traversal-safe slug
  resolution, landing-page destinations, contextual heading anchors, callout
  parsing, in-memory search, and that every internal `/help/{slug}` and
  `related` link in the content resolves to a real page
- Content is read from `docs/user-guide/*.md` at runtime (same pattern as
  the pinned OSCAL schema); the production Docker image copies that
  directory from the builder (`COPY . .`) because `.dockerignore` keeps
  `docs/user-guide` while excluding the rest of `docs/`
- Reused for other output formats (standalone HTML, PDF, Word) if desired
  later: the Markdown source has no in-app-only content and no build step

## Current standards position

- OSCAL version: 1.2.2
- Supported frameworks:
  - NIST SP 800-53 Rev. 5 Low, Moderate, and High
    (`nist-sp-800-53-rev5-low|moderate|high`)
  - CMMC Level 2 / NIST SP 800-171 Rev. 2
    (`cmmc-level-2-nist-sp-800-171-r2`): 110 requirements identical to
    NIST SP 800-171 Revision 2 (February 2020, updates as of 28 January 2021),
    as adopted by 32 CFR Part 170. Do not substitute Rev. 3.
  - DoD Cloud Impact Level 4 (`dod-cloud-il4-rev5`): 345 framework items
    (183 NIST bases, 152 enhancements, 10 General Readiness Requirements).
    Product-selectable under DoD Cloud → Impact Level 4. Known non-conflicting
    overlay assignments may appear as a derived Effective requirement, and
    unresolved organization-defined parameters use their NIST catalog
    descriptions in the authoring view; the NIST source statement remains
    available. Overlay supplements, DSPAV notices, and CDS applicability stay
    separate. Evidence, coverage, review,
    and collaboration use the generic 345-item population, including GRRs.
    OSCAL SSP export is disabled.
- Framework source of truth: `FrameworkRegistry` (ADR-026). NIST entries are
  derived from pinned OSCAL profiles + SP 800-53 catalog. CMMC is derived from
  pinned NIST SP 800-171 R2 CSV with the official PDF as the normative
  publication. DoD IL4 is derived from the FedRAMP Moderate workbook, DoD
  SSP Addendum extract, NIST catalog, and SRG Appendix D extract (ADR-029).
  Runtime identity is `projects.framework_id`;
  `project_json.project.frameworkId` is a schema v1 compatibility copy only.
- Create UI defaults to Moderate and always sends an explicit `frameworkId`.
  Omitting `frameworkId` on the create API still selects Moderate for
  backwards-compatible callers; that default is API compatibility, not the
  architectural source of framework identity. IL4 is product-selectable.
  `createProjectAction` rejects unknown IDs and descriptors with
  `productSelectable: false`. `createProjectForOrg` accepts any registered ID.
- Demo/bootstrap projects: the Goose flagship remains Moderate; supporting
  demo projects cover Low, High, CMMC Level 2, and DoD Cloud Impact Level 4
  (Snow Goose Cloud Impact Level 4). See `docs/demo-data.md`.
- Existing projects continue as Moderate; no SQL backfill was required.
- Current product does not claim FedRAMP, CMMC certification, C3PAO
  assessment, MET / NOT MET, or SPRS scoring.
- CMMC Program Phase II assessment/affirmation rollout was suspended
  13 July 2026. That acquisition context is documentation only; it is not
  persisted as Project framework semantics and does not change the 110
  Level 2 requirements.
- FedRAMP Rules are a separate future policy layer
- Do not invent or substitute a FedRAMP OSCAL profile
- Do not invent a CMMC or SP 800-171 Rev. 2 OSCAL catalog/profile

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

CMMC Level 2 / NIST SP 800-171 Rev. 2 pins live under:

`vendor/nist/sp800-171/r2/`

Use:

- `NIST.SP.800-171r2.pdf`
- `sp800-171r2-security-reqs.csv`
- `sp800-171r2-security-reqs.xlsx`

Provenance and checksums are documented in:

`vendor/nist/sp800-171/r2/SOURCES.md`

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
- Routes: `/sign-in`, `/projects`, `/projects/[id]` (including `?view=evidence`
  and `?evidence={id}`),
  `/help`, `/help/[slug]`,
  `/organizations/[orgId]/settings`, `/organizations/[orgId]/workflows`,
  `/invitations/[id]`
- ControlRecords / ControlActivity / collaboration / evidence tables remain
  operational metadata outside OSCAL and `project_json`

Legacy SQLite code under `src/persistence/sqlite/` and `drizzle/` supports
cutover only.

## Known gaps

- No production email provider wired (dev uses `TEST_EMAIL_SINK`; hosted
  demo users are bootstrap-verified so they can sign in without email)
- Hosted Render demo stays at one web instance; see `docs/deploy-render.md`
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
- Intentionally NIST-specific behavior remains for 800-53 projects: control
  families, enhancement IDs (`ac-2.1`), family grouping, and client SSP export
  via the NIST identity table rather than `FrameworkRegistry`. CMMC projects
  use requirement terminology and have no OSCAL SSP export. DoD IL4 is
  product-selectable with overlay metadata on the framework read model;
  OSCAL SSP export is disabled
  (`frameworkHasOscalSspExport("dod-cloud-il4-rev5") === false`).
- Per-control UI action hiding is coarse; server authorization is authoritative
- Production Docker image must not statically import PGlite (devDependency;
  pruned from the image). Tests load it only inside `openTestDb()`.
- DoD IL4 Moderate / MMx (`dod-cloud-il4-rev5`) is a product-selectable
  `FrameworkProvider` (WP4) with generic Evidence/workflow/collaboration
  on all 345 item IDs including GRRs (WP5). Overlay parameter/provenance
  metadata remains framework read-model data only; it does not mutate
  ControlRecord, review, evidenceRequirement, or coverage population.
  OSCAL export remains disabled and named versions preserve live
  `frameworkId` (WP6). Help documents the implemented overlay model in
  `docs/user-guide/dod-cloud-il4.md`. Canonical demo includes Snow Goose
  Cloud Impact Level 4 without replacing the Moderate flagship (WP7).
  See ADR-029 and `vendor/dod/cloud-il4-rev5/SOURCES.md`.

## Next approved milestone

None. Milestone 06A is released as **v0.6.1**. Word/PDF
authorization-package export and future IL5/IL6 work remain unscheduled
on `docs/roadmap.md`.

## Required verification for each milestone

Run:

- `npm test`
- `npm run lint`
- `npm run build`

Do not commit until the user reviews the summary.

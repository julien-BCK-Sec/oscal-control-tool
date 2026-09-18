# Architecture

The application separates product concerns into independent layers.

Each layer has a single responsibility.

---

## Framework Layer

Provides read-only compliance framework information.

Responsibilities:

- FrameworkRegistry (in-process catalog of supported providers, ADR-026)
- FrameworkProvider
- FrameworkControl (optional overlay parameter, provenance, supplement, and applicability metadata; ADR-029)
- Framework metadata (catalog, revision, profile, optional item terms, optional OSCAL export fields, optional `productSelectable`)
- Control Browser overlay presentation (effective requirement when known assignments can be inlined; classification caption separate from artifact source; untouched source statement; supplements; DSPAV and source-conflict notices)
- Generic Evidence/workflow/collaboration against registered framework item IDs, including IL4 GRRs (WP5); overlay metadata is not operational state
- Framework derivation (pinned NIST SP 800-53 Rev. 5 Low / Moderate / High OSCAL; pinned NIST SP 800-171 Rev. 2 CSV for CMMC Level 2; DoD IL4 Moderate / MMx overlay artifact from FedRAMP Moderate + Addendum extract + Table D-1 delta, ADR-029)

Framework data is never persisted in application storage. Projects persist
only an opaque `frameworkId` in `projects.framework_id`, which is the sole
runtime authority (ADR-026). `project_json.project.frameworkId` is a
compatibility copy written from that column and is not used as an
independent identity. Runtime views resolve the column ID through the
registry rather than a global Moderate singleton. Live documents use
schema v3; v1/v2 envelopes migrate in memory on load. Schema v3 adds
project-authored parameter records (ADR-032).

---

## Domain Layer

Represents the application's business model.

Contains:

- Project
- Control implementation
- Project metadata, including canonical SSP system characteristics
  (`project_json` schema v3; ADR-030, ADR-032)
- Parameter resolution (catalog identity + framework resolution + project
  records; ADR-032)
- Domain services

The domain model is the source of truth.

The domain model is independent of OSCAL.

---

## Operational Layer

Stores application-specific operational information.

Contains:

- ControlRecord
- Review workflow
- Activity history
- Ownership
- Comments / threaded discussions
- Mentions
- Assignments
- In-app notifications
- Evidence (Milestone 03A)
- Evidence Versions / object storage (Milestone 03B)

Operational metadata is never stored inside OSCAL documents.

---

## Platform Services Layer

Milestone 1 capabilities:

- PostgreSQL persistence (ADR-014)
- Better Auth email/password sessions and organization plugin (ADR-015)
- Database-backed opaque session cookies
- Centralized Control Freak RBAC over organization roles (ADR-017)
- Organization invitations (ADR-018)
- Authenticated invite-only demo bootstrap (ADR-019)
- Canonical demo bootstrap (`npm run bootstrap:demo` under
  `src/seed/dev-bootstrap/` wrapping shared `src/seed/canonical-demo.ts`) —
  local env ensure, migrate, identity, canonical projects, collaboration,
  evidence. Local orchestrator only.
- Production startup (`npm start`, ADR-028): `DEPLOYMENT_MODE=normal|demo`,
  validate → migrate → mode bootstrap → Next.js. Demo mode uses the same
  canonical library and requires `DEMO_BOOTSTRAP_PASSWORD`. See
  `docs/deployment.md`.

Milestone 02A capabilities:

- Control-scoped collaboration (ADR-020)
- Discussion / assignment / notification services over PostgreSQL repositories
- Collaboration events on the shared ControlActivity stream

Milestone 02B capabilities:

- Domain event contracts and catalog (`src/domain/events`, ADR-021)
- `DomainEventPublisher` + in-process `DomainEventBus` + handlers
- Post-success publication from authorized wrappers (notifications and
  ControlActivity remain direct writes in this milestone)
- Process-local, org-admin diagnostics (`event.diagnostics.read`)

Milestone 02C capabilities:

- Workflow engine subscribes to `DomainEventBus` (ADR-023)
- Pluggable trigger / condition / action registries (`src/workflow`)
- Org-admin rule CRUD and execution history (`workflow.read` /
  `workflow.manage`)
- Synchronous evaluation with durable `workflow_rules` /
  `workflow_executions` and no-cascade loop protection
- See `docs/workflows.md`

Milestone 03A capabilities:

- Project-scoped Evidence aggregate with stable UUID (ADR-024)
- Evidence ↔ control many-to-many associations
- Evidence requirement on ControlRecord (default `required`)
- Evidence domain events + ControlActivity link/unlink fan-out
- Evidence browse / CRUD / archive UI

Milestone 03B capabilities:

- Immutable Evidence Versions with current-version pointer (ADR-024 amendment)
- Object storage port: filesystem (dev/test) + S3-compatible (production,
  fail closed) — ADR-025
- App-proxied upload/download Route Handlers; SHA-256 + MIME validation
- Version history UI on the Evidence tab

Milestone 03C capabilities:

- Presentational reusable Evidence Picker (`<dialog>`)
- Project-scoped server-side search with keyset pagination
- Control panel owns associate/create; picker emits selection callbacks
- Associate rejects archived Evidence for new links

Milestone 03D capabilities:

- Derived Evidence Coverage and freshness read models (ADR-024 amendment)
- Dedicated coverage/inventory query boundary (not a new aggregate)
- Project Overview coverage counts; Evidence Browser search/filter/attention
  views; control-tree coverage indicators
- Authorized CSV inventory download (no PDF, no binaries, no storage keys)
- Due-soon window is the application constant `EVIDENCE_DUE_SOON_DAYS = 30`
- No scheduled jobs, workflow engine changes, or assessment semantics

Milestone 04A capabilities:

- In-process `FrameworkRegistry` of `FrameworkProvider` entries (ADR-026)
- Durable project `frameworkId` (Low / Moderate / High NIST Rev. 5 profiles)
- Framework identity immutable after create; restore preserves live identity
- Control browsing, Evidence links, coverage, and OSCAL SSP export resolve
  the project's selected framework
- Control-scoped writes validate `controlId` against that framework
- No plugin system, framework switching, or runtime standards downloads

Milestone 04B capabilities:

- `projects.framework_id` is the only runtime framework identity; JSON copy
  is compatibility-only
- Project save/autosave do not round-trip `frameworkId` from the client
- Review transitions and workflow assign/status/due-date actions validate
  `controlId` before creating operational rows
- Project save rejects out-of-framework implementation keys
- Registry-driven Low / Moderate / High presentation in project create, list,
  overview, and workspace chrome
- Moderate remains the create-form default and the omitted-API-field default

Milestone 04C capabilities:

- CMMC Level 2 (`cmmc-level-2-nist-sp-800-171-r2`) as a registered FrameworkProvider
- 110 NIST SP 800-171 Rev. 2 requirements, CMMC IDs `DD.L2-REQ`, origin IDs retained
- User-facing requirement/requirements terms; internal `controlId` unchanged
- OSCAL SSP export remains NIST SP 800-53 only (disabled for CMMC and IL4)
- No assessment objectives, MET/NOT MET, scoring, or certification fields

Milestone 06A capabilities:

- DoD Cloud Impact Level 4 (`dod-cloud-il4-rev5`) as a product-selectable FrameworkProvider
- 345-item overlay population (FedRAMP Moderate + DoD Addendum IL4 Moderate + 10 GRRs)
- Overlay presentation separate from NIST statements (DSPAV, source-conflict, CDS applicability)
- Generic Evidence/workflow/collaboration against all 345 IDs, including GRRs
- OSCAL SSP export disabled (no approved/pinned IL4 OSCAL profile)
- Canonical demo project Snow Goose Cloud Impact Level 4 (does not replace the Moderate flagship)
- User-guide topic `docs/user-guide/dod-cloud-il4.md` as the canonical Help source

Milestone 06B capabilities:

- Table D-1 membership and adjustment kind as a machine-checkable IL4 delta
- Explicit FedRAMP base inheritance vs DoD explicit vs DoD-permitted FedRAMP value
- AU-5(1) provenance from the DoD Addendum, not the pinned FedRAMP Moderate baseline
- Fail-closed derivation when Table D-1 and Addendum relationships are inconsistent
- Overlay classification remains control-level (not per-ODP) in 06B
  metadata. 07C adds per-ODP resolution rows with an empty IL4 pin set.

Milestone 07A capabilities:

- Canonical SSP system characteristics on `ProjectMetadata` inside
  `project_json` schema v2 (no relational tables)
- Distinct authorization-boundary and environment-of-operation narratives;
  `systemDescription` remains System Overview and includes purpose
- Optional user-authored FIPS 199 CIA values and a separate optional DoD
  cloud impact-level assertion; neither is inferred from `frameworkId`
- Typed SSP documentation roles, distinct from Better Auth users and
  collaboration assignments
- Optional operational status, distinct from authorization or review status
- Conservative NIST OSCAL adapter consumption of authored fields; IL4/CMMC
  OSCAL export remains disabled
- Diagrams were not modeled in 07A and remain deferred

Milestone 07B capabilities:

- Control Freak System Security Plan document/view model (`src/ssp/`) independent
  of DOCX and OSCAL
- Programmatic layout `cf-ssp-docx` version 1.0
- On-demand in-memory Word export via `GET /api/projects/[projectId]/exports/ssp.docx`
  (Node runtime, `project.read`, tenant isolation)
- Available for all currently supported frameworks; OSCAL SSP export remains
  NIST-only
- Missing data uses render-only placeholders; empty collections mean
  not documented
- Organization-defined parameters remain unresolved in the source statement;
  overlay assignments stay separate from authoritative source statements
- 07C synthesizes a resolved requirement from the SSP document model using
  the domain resolution engine (ADR-032). The unresolved-parameter list is
  the remaining inserts from that same walk, not a second inference from
  the source statement.
- No new SQL migration
- Diagrams remain deferred

Milestone 07C (implemented, manually accepted, not released): per-ODP
catalog identity, immutable framework parameter resolution, `project_json`
schema v3 parameter records, ODP authoring UI, and partial SSP
substitution. IL4 per-ODP mappings start empty. OSCAL `set-parameters` and
responsibility/origination are deferred. See ADR-032 and
`docs/research/07C-parameter-resolution-architecture.md`.

Actor identity for activity rows comes from the authenticated session for user
actions and from the System actor for automated operations.

Later capabilities remain independent of UI and persistence:

- Email / external notifications
- AI services
- Evidence processing (virus scan, OCR, preview)
- Durable event store / outbox / external broker
- Async / queued workflow execution, approvals, SLA timers
- Scheduled Evidence reminders (due soon / overdue / missing required)

---

## Persistence Layer

Provides repositories for application storage.

Examples:

- ProjectRepository (organization-scoped)
- OrganizationRepository (memberships / invitations)
- ControlRecordRepository
- ActivityRepository
- CommentRepository
- AssignmentRepository
- NotificationRepository
- WorkflowRepository
- EvidenceRepository / EvidenceService (including search)
- EvidenceVersionRepository / EvidenceVersionService
- EvidenceCoverageQuery (derived coverage + inventory; Milestone 03D)
- ObjectStorageProvider (filesystem | S3-compatible)

Repositories isolate the database from business logic.

Local development uses `compose.yaml` (PostgreSQL 16). See the README Quick
Start for `docker compose up -d` and cleanup commands.

Authorization checks occur in server wrappers / actions **before** repository
reads and mutations. A resource identifier alone is never sufficient.

---

## Export Layer

Transforms the domain model into standards-based exports.

Examples:

- OSCAL SSP (NIST SP 800-53 Low / Moderate / High only; unavailable for CMMC and IL4).
  The adapter consumes authored system characteristics when the mapping is
  unambiguous. It does not copy system overview into authorization-boundary
  and does not map SSP organization name to system-owner. Missing values
  remain explicit gaps. OSCAL is a sibling exporter, not the domain model.

- Control Freak System Security Plan (Word). Canonical domain data is mapped
  into an SSP document/view model (`src/ssp/`), then rendered with the
  `cf-ssp-docx` 1.0 layout (`src/export/ssp-docx/`). Generation is server-side
  and in memory. The Word file is not OSCAL, not an official FedRAMP/DoD/CMMC
  package, and not stored.

- PDF (future)

Exporters adapt the domain model.

They do not define it.

Collaboration metadata is never included in OSCAL exports. The human-readable
SSP may include optional ControlRecord owner labels and linked Evidence
titles; it does not include collaboration assignments or review workflow
status as implementation status.

---

## Presentation Layer

Contains:

- Next.js
- React
- Design System (semantic light/dark tokens, Brand, Account menu Theme
  preference — ADR-022)
- Workspace UI
- Sign-in and organization team settings
- Collaboration UI (discussion panel, assignments, notification center,
  mention autocomplete)

Presentation never performs persistence directly.

Presentation never contains OSCAL serialization.

UI may hide unauthorized actions but is never the authorization boundary.

Theme preference is a client UI concern (`src/theme/`, localStorage). The
control-navigation pane width is the same class of preference
(`cf-control-nav-width`). Neither is part of auth, tenancy, or domain
persistence.

---

## Runtime flow (authenticated request)

```text
Browser cookie session
        │
        ▼
Better Auth getSession (server)
        │
        ▼
Resolve org membership + role (member table)
        │
        ▼
requirePermission (src/authz)
        │
        ▼
Repository / service (PostgreSQL)
        │
        ▼
Domain / OSCAL export or Control Freak SSP DOCX as needed
```

Collaboration mutations follow the same path through authorized wrappers in
`src/server/` (discussions, assignments, notifications) before persistence.

After a successful mutation, authorized wrappers also publish domain events via
`DomainEventPublisher` → in-process `DomainEventBus` (ADR-021). Handlers run
independently; failures are logged and do not roll back the business write.
The Workflow Engine may subscribe and evaluate org-scoped rules without being
invoked by business services (ADR-023).

---

## Architectural Principles

- Keep standards separate from operational metadata.
- Keep framework data read-only and resolve it from the project's
  `projects.framework_id` column (ADR-026). Do not treat
  `project_json.project.frameworkId` as an independent authority.
- Keep the domain model independent of export formats.
- Keep repositories database-specific.
- Keep UI independent of persistence.
- Keep theme preference (ADR-022) independent of authentication and domain
  persistence; resolve via semantic tokens on the document root.
- Keep exports deterministic.
- Keep application metadata separate from compliance content.
- Fail closed on missing authentication, membership, or permission.
- Never trust client-supplied organization, role, or membership claims.
- Publish domain events after successful business operations; never invoke
  subscribers from business services.
- Do not claim durable retry, cross-instance ordering, or broker delivery for
  the in-process DomainEventBus.
- Workflow automation must subscribe to domain events; business services must
  never call the workflow engine directly (ADR-023).

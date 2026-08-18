# Architecture

The application separates product concerns into independent layers.

Each layer has a single responsibility.

---

## Framework Layer

Provides read-only compliance framework information.

Responsibilities:

- FrameworkRegistry (in-process catalog of supported providers, ADR-026)
- FrameworkProvider
- FrameworkControl
- Framework metadata (catalog, revision, profile, optional item terms, optional OSCAL export fields)
- Framework derivation (pinned NIST SP 800-53 Rev. 5 Low / Moderate / High OSCAL; pinned NIST SP 800-171 Rev. 2 CSV for CMMC Level 2)

Framework data is never persisted in application storage. Projects persist
only an opaque `frameworkId` in `projects.framework_id`, which is the sole
runtime authority (ADR-026). `project_json.project.frameworkId` is a
schema v1 compatibility copy written from that column and is not used as an
independent identity. Runtime views resolve the column ID through the
registry rather than a global Moderate singleton.

---

## Domain Layer

Represents the application's business model.

Contains:

- Project
- Control implementation
- Project metadata
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
- Development-only full demo bootstrap (`npm run bootstrap:demo` under
  `src/seed/dev-bootstrap/`) — env ensure, migrate, identity, projects,
  collaboration; not a production seed path

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
- OSCAL SSP export remains NIST SP 800-53 only (disabled for CMMC)
- No assessment objectives, MET/NOT MET, scoring, or certification fields

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

- OSCAL SSP (NIST SP 800-53 Low / Moderate / High only; unavailable for CMMC)

- Word (future)
- PDF (future)

Exporters adapt the domain model.

They do not define it.

Collaboration metadata is never included in OSCAL exports.

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

Theme preference is a client UI concern (`src/theme/`, localStorage). It is not
part of auth, tenancy, or domain persistence.

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
Domain / OSCAL export as needed
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

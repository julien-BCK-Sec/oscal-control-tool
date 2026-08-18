# Roadmap

## Completed

**Milestone 1 – Platform Foundation** (implemented on `feat/platform-foundation`)

PostgreSQL, organizations, Better Auth, RBAC, invitations, tenant-isolation
tests, and authenticated invite-only demo. See
`docs/milestones/01-platform-foundation.md` and ADR-014 through ADR-019.

**Milestone 1.1 – Local development bootstrap**

Docker Compose PostgreSQL for local development, standalone scripts load
`.env.local` / `.env`, and documented `docker compose up -d` → migrate →
bootstrap → `npm run dev` onboarding.

**Milestone 02A – Collaboration** (implemented on `feat/collaboration-02a`)

Threaded control discussions, mentions, in-app notifications, assignments,
collaboration activity history, and tenant-aware authorization. See
`docs/milestones/02A-collaboration.md` and ADR-020.

**Milestone 02B – Domain Event Infrastructure** (implemented on
`feat/domain-events-02b`)

Strongly typed domain events, `DomainEventPublisher`, in-process
`DomainEventBus`, handler isolation, process-local diagnostics, and
post-success publication from authorized mutations. See
`docs/milestones/02B-domain-event-infra.md` and ADR-021.

**Milestone 02C – Workflow Automation** (implemented on
`feat/workflow-automation-02c`)

Event-driven workflow engine with pluggable triggers/conditions/actions,
org-admin rule administration, execution history, and no-cascade safety.
See `docs/milestones/02C-workflow-automation.md`, `docs/workflows.md`, and
ADR-023.

**Milestone 03A – Evidence Management Foundation** (implemented on
`feat/evidence-management-03a`)

Project-scoped Evidence aggregate, control associations, evidence
requirement on ControlRecord, RBAC, audit/events, and browse/CRUD UI without
binary uploads. See `docs/milestones/03A-evidence-management.md` and ADR-024.

**Milestone 03B – Evidence Storage & Versioning** (implemented on
`feat/evidence-storage-03b`)

Immutable Evidence Versions, object storage abstraction (filesystem
dev/test; S3-compatible production), app-proxied upload/download, version
history UI. See `docs/milestones/03B-evidence-storage-and-versioning.md` and
ADR-025.

**Milestone 03C – Searchable Evidence Picker** (implemented on
`feat/evidence-picker-03c`)

Reusable presentational Evidence Picker, project-scoped server search with
keyset pagination, control linking integration. See
`docs/milestones/03C-evidence-picker.md`.

**Milestone 03D – Evidence Coverage, Freshness & Reporting** (implemented)

Derived control/project Evidence Coverage, freshness from review due date,
scalable Evidence Browser filters, authorized CSV inventory. See
`docs/milestones/03D-evidence-coverage-and-reporting.md` and ADR-024
amendment. Evidence Coverage is not a compliance score.

**Milestone 04A – Multi-Framework Foundation** (implemented)

In-process `FrameworkRegistry`, durable project `frameworkId`, and pinned
NIST SP 800-53 Rev. 5 Low / Moderate / High profiles. Existing projects
remain Moderate. Coverage, control browsing, Evidence links, and OSCAL SSP
export resolve the project's selected framework. See
`docs/milestones/04A-multi-framework-foundation.md`, ADR-002 amendment, and
ADR-026.

**Milestone 04B – Framework UX and Runtime Hardening** (implemented)

Canonical `projects.framework_id` runtime identity, control-write validation
(including review and workflow), registry-driven Low / Moderate / High
presentation, and compatibility for existing documents and named versions.
See `docs/milestones/04B-framework-ux-and-hardening.md` and ADR-026
amendment.

**Milestone 04C – CMMC Level 2 Framework Support** (implemented)

CMMC Level 2 as a registered framework (`cmmc-level-2-nist-sp-800-171-r2`)
backed by pinned NIST SP 800-171 Rev. 2 artifacts (32 CFR Part 170). 110
requirements, CMMC operational IDs, Evidence and workflow against those IDs,
OSCAL SSP export disabled for CMMC. Not CMMC assessment or certification.
See `docs/milestones/04C-cmmc-level-2-framework-support.md`, ADR-026
amendment, and ADR-027.

**Milestone 05A – Consolidate and Modernize the Demo Dataset** (implemented)

One canonical demo environment: Canadian Goose Defence System flagship
(Strategic Goose Operations Platform) plus supporting Low / High / CMMC /
evidence-gap projects, Contoso tenant isolation, idempotent bootstrap, and
separated destructive reset. See `docs/milestones/05A-consolidate-modernize-demo-dataset.md`
and `docs/demo-data.md`.

**Milestone 05B – Normal and Demo Deployment Lifecycle** (implemented)

One production startup command (`npm start`) with `DEPLOYMENT_MODE=normal`
or `DEPLOYMENT_MODE=demo`. Shared canonical demo library, retired
`SEED_DEMO_PROJECT` production switch, explicit demo password, Evidence S3
startup validation. See `docs/milestones/05B-normal-demo-deployment-lifecycle.md`,
`docs/deployment.md`, and ADR-028.

## Next

**Word/PDF export** — portable authoring outputs beyond OSCAL JSON.

**Milestone 05C – Render Deployment** — provision Render PostgreSQL, web
service, environment, and object storage using the 05B lifecycle. Not
implemented in 05B.

## Later

- Organization-wide Evidence library (reuse picker + new search scope)
- Evidence review / approval workflow
- Assessment management (Milestone 04)
- Scheduled Evidence reminders (missing required, due soon, overdue)
- Email / Slack / Teams notifications
- Durable domain event store / outbox / external broker
- Additional compliance frameworks beyond the current NIST Rev. 5 Low /
  Moderate / High and CMMC Level 2 registry (ISO, CIS, PCI DSS, CMMC Level 1/3,
  CSF, mappings, official CMMC OSCAL if one is published)
- AI-assisted authoring
- Async / queued workflow execution, approvals, SLA timers
- Horizontal scaling review beyond single-instance defaults
- Presigned/direct object-store transfers (scaling optimization)
- Postgres FTS/trigram if project libraries outgrow ILIKE

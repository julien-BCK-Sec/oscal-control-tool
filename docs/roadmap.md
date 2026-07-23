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

## Next

**Word/PDF export** — portable authoring outputs beyond OSCAL JSON.

## Later

- Evidence management
- Email / Slack / Teams notifications
- Durable domain event store / outbox / external broker
- Additional compliance frameworks
- AI-assisted authoring
- Async / queued workflow execution, approvals, SLA timers
- Horizontal scaling review beyond single-instance defaults

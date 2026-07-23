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

## Next

**Milestone 02B – Workflow Automation**

Automated operational workflows built on collaboration and review foundations.
See future milestone specs under `docs/milestones/` when published.

**Word/PDF export** — portable authoring outputs beyond OSCAL JSON.

## Later

- Evidence management
- Email / Slack / Teams notifications
- Additional compliance frameworks
- AI-assisted authoring
- Horizontal scaling review beyond single-instance defaults

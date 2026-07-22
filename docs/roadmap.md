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

## Next

**Word/PDF export** — portable authoring outputs beyond OSCAL JSON.

## Later

- Comments, mentions, notifications
- Evidence management
- Additional compliance frameworks
- AI-assisted authoring
- Horizontal scaling review beyond single-instance defaults

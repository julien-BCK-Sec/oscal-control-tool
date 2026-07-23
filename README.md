# Control Freak

Control Freak is a collaborative compliance authoring and control governance platform built around OSCAL.

Its goal is to help organizations create, review, maintain, and export high-quality security control implementations while remaining aligned with official compliance frameworks.

Control Freak treats OSCAL as an interchange and export format rather than the application's internal editing model.

---

## Current Status

Control Freak is under active development. Milestone 1 (Platform Foundation) adds
PostgreSQL, organizations, Better Auth, RBAC, and invite-only access.

The current implementation includes:

- Organization-owned collaborative compliance authoring
- Better Auth email/password sessions with email verification
- Role-based authorization and invitations
- NIST SP 800-53 Rev. 5 Moderate support
- OSCAL System Security Plan (SSP) export
- Review workflow
- Operational metadata
- Version history
- PostgreSQL persistence

See `docs/current-state.md` for the complete implementation status.

---

## Quick Start

### Requirements

- Node.js 20+ (or current LTS)
- npm
- Docker Engine with the Compose v2 plugin (`docker compose`)

On Ubuntu / WSL with the `docker.io` package, Compose is separate:

```bash
sudo apt update
sudo apt install docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
# Apply the docker group (or log out and back in):
newgrp docker
docker compose version
```

### Installation

```bash
git clone <repository-url>
cd oscal-control-tool
npm install --legacy-peer-deps
docker compose up -d
npm run bootstrap:demo
npm run dev
```

`npm run bootstrap:demo` is the standard local setup path. It:

- Ensures `.env.local` exists (copies from `.env.example`, fills localhost
  defaults, generates missing secrets only — never overwrites existing keys)
- Verifies PostgreSQL connectivity and runs `npm run db:migrate`
- Creates demo organizations, users, memberships, projects, and collaboration
  data (idempotent; safe to re-run)
- Prints login emails and the shared demo password

Compose PostgreSQL defaults (no `compose.yaml` edits required):

```
postgres://postgres:postgres@localhost:5432/oscal_control_tool
```

Open:

```
http://localhost:3000/sign-in
```

Demo accounts (shared password `ControlFreakDemo123!`):

| Email | Role | Organization |
|-------|------|--------------|
| alice@example.com | Organization Admin | Acme Corporation |
| bob@example.com | Project Manager | Acme Corporation |
| carol@example.com | Author | Acme Corporation |
| dave@example.com | Reviewer | Acme Corporation |
| victor@example.com | Viewer | Acme Corporation |
| olivia@example.com | Author (Contributor) | Acme Corporation |
| oscar@example.com | Organization Admin | Contoso Industries |
| rachel@example.com | Reviewer | Contoso Industries |

Projects: Goose Command Control Center (flagship), Customer A SSP, Internal Lab
Environment (Acme), Contoso Cloud Platform (Contoso). Framework content uses the
pinned NIST SP 800-53 Rev. 5 Moderate baseline (no FedRAMP profile is shipped).

Migrations vs demo data: `npm run db:migrate` applies schema only.
`bootstrap:demo` runs migrations, then seeds identity and demo content.
You can still run migrations alone when you only need schema updates.

Development verification and invitation links are written to `data/email-sink.json`
(see `.env.example`). Email delivery is not required for demo users (verified at
seed time).

#### Troubleshooting PostgreSQL connectivity

If `bootstrap:demo` cannot connect:

1. Confirm Compose is up: `docker compose ps` (service `postgres` healthy).
2. Confirm `DATABASE_URL` in `.env.local` matches Compose
   (`postgres://postgres:postgres@localhost:5432/oscal_control_tool`).
3. If port 5432 is already taken, stop the other Postgres instance or change
   the Compose port mapping and `DATABASE_URL` together.
4. `bootstrap:demo` refuses production `NODE_ENV`, Render, and non-local
   database hosts — it never truncates or resets data.

### Local database cleanup

```bash
docker compose down      # stop containers; keep data volume
docker compose down -v   # stop containers and delete the volume
```

If port 5432 is already taken by a one-off `docker run` Postgres container,
remove it before starting Compose:

```bash
docker rm -f controlfreak-postgres
docker compose up -d
```

---

## Useful Commands

```bash
npm run dev
npm test
npm run lint
npm run build

docker compose up -d
docker compose down
docker compose down -v

npm run db:migrate
npm run db:generate
npm run db:studio
npm run db:migrate:sqlite-to-pg
npm run bootstrap:demo
npm run bootstrap:admin
npm run db:seed:demo

npm run derive:framework
```

`bootstrap:admin` remains available for a minimal single-admin org when you do
not want the full multi-tenant demo. Prefer `bootstrap:demo` for day-to-day
local development.

---

## Documentation

| Document | Purpose |
|----------|---------|
| `docs/vision.md` | Product vision |
| `docs/roadmap.md` | Planned milestones |
| `docs/current-state.md` | Current implementation |
| `docs/architecture.md` | System architecture |
| `docs/decisions.md` | Architectural decisions (ADRs) |
| `docs/design-system.md` | UI design system |
| `docs/oscal-standards-alignment.md` | OSCAL and standards guidance |
| `docs/deploy-render.md` | Deployment guide |
| `docs/playbooks/sqlite-to-postgres-cutover.md` | Legacy SQLite cutover |
| `docs/milestones/` | Milestone specifications |
| `docs/playbooks/` | Engineering playbooks |
| `AGENTS.md` | Instructions for AI and human contributors |

---

## Design Principles

- OSCAL is an export format, not the domain model.
- Framework content is read-only reference data.
- Operational metadata is separate from compliance content.
- The application domain model is independent of OSCAL.
- Standards alignment is preferred over proprietary formats.
- Server-side authorization is authoritative; UI hiding is not.

---

## Contributing

Before making significant changes, read:

1. `AGENTS.md`
2. `docs/vision.md`
3. `docs/current-state.md`
4. `docs/architecture.md`
5. `docs/decisions.md`

Follow the appropriate milestone specification and playbooks when implementing new features.

---

## License

TBD

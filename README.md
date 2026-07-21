# OSCAL Control Tool

Local-first web app for documenting NIST SP 800-53 Rev. 5 Moderate controls and
exporting a validated OSCAL System Security Plan (JSON).

This is **not** a GRC platform and does **not** claim FedRAMP support.

## Requirements

- Node.js 20+ (or current LTS)
- npm

## Setup

```bash
npm install
cp .env.example .env.local   # optional
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to `/projects`.

`npm run dev` also runs `db:migrate` via `predev`.

### Database

| Item | Detail |
| --- | --- |
| Engine | SQLite via Drizzle ORM and `better-sqlite3` |
| Default path (dev) | `./data/oscal-control-tool.sqlite` |
| Override | Set `DATABASE_PATH` in `.env.local` (server-only; never `NEXT_PUBLIC_`) |
| Production | `DATABASE_PATH` is **required** (Render: `/var/data/oscal-author.db`) |
| Migrations | `npm run db:migrate` (SQL under `drizzle/`); also on `npm start` |
| Studio | `npm run db:studio` |

Framework control text is **not** stored in the database. It comes from
`FrameworkProvider` (build-time derivation from pinned NIST artifacts).

### Deployment assumptions

- Durable local filesystem (or a mounted volume)
- **Single** Node.js application instance (`npm start` / production startup)
- Trusted local / single-user deployment — **no authentication yet**
- **Not supported** on ephemeral serverless hosts (for example typical Vercel
  serverless) because the SQLite file is not durable across instances

### Render (Docker)

See **`docs/deploy-render.md`** for the full guide.

- Persistent disk at `/var/data`
- `DATABASE_PATH=/var/data/oscal-author.db` (required in production)
- Health check: `/api/health`
- Optional `SEED_DEMO_PROJECT=true` for idempotent CGDS demo seed on startup
- Blueprint: `render.yaml`

Do not expose this app on a public network without adding authentication.

## Useful scripts

```bash
npm test                 # unit tests
npm run lint
npm run build
npm start                # production: migrate → optional seed → next start
npm run derive:framework # regenerate NIST Moderate app framework JSON
npm run db:generate      # generate Drizzle migrations after schema edits
npx tsx --require ./scripts/mock-server-only.cjs scripts/smoke-persistence.ts
```

## Docs

- `docs/current-state.md` — what works now
- `docs/architecture.md` — layering
- `docs/roadmap.md` — milestones
- `docs/decisions.md` — ADRs
- `docs/deploy-render.md` — Render / Docker deployment
- `docs/oscal-standards-alignment.md` — OSCAL / FedRAMP boundaries
- `AGENTS.md` — contributor / agent instructions

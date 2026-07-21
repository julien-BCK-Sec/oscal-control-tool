# Deploying to Render (Docker + SQLite)

This app is a **single-instance** Next.js service. Project data lives in a local
SQLite file on a durable filesystem. It is **not** safe to run multiple
instances against separate disks, and it is **not** suitable for ephemeral
serverless hosts.

Cloudflare / custom-domain setup is handled separately from this guide.

## Required environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_PATH` | **Yes in production** | Absolute path to the SQLite file. On Render: `/var/data/oscal-author.db` |
| `PORT` | Set by Render | HTTP listen port |
| `SEED_DEMO_PROJECT` | Optional | When `true`, run the idempotent CGDS demo seed on startup |
| `NODE_ENV` | Production | Set to `production` |

Production startup **refuses** a repository-local database default. If
`DATABASE_PATH` is missing at runtime, the process exits.

Never commit `.env` files or secrets. Never use `NEXT_PUBLIC_` for database paths.

## Production startup

`npm start` runs `scripts/start-production.ts`, which:

1. Ensures the parent directory of `DATABASE_PATH` exists
2. Applies Drizzle migrations (fails fast on error)
3. If `SEED_DEMO_PROJECT=true`, runs the **idempotent** demo seed (**never** `--reset`)
4. Starts Next.js bound to `0.0.0.0` on `PORT`

### Why `--reset` must never run during normal deployment

`npm run db:seed:demo -- --reset` deletes the demo project and recreates it.
That would wipe demo edits on every deploy. Startup only calls the idempotent
path: if the demo already exists, seeding is a no-op.

## Health check

- URL: `/api/health`
- Success: HTTP 200 with `{"status":"ok"}`
- Does not expose database paths, secrets, or stack traces
- Performs a lightweight `SELECT 1` against SQLite

## Local Docker build and run

Docker must be available on the host.

```bash
docker build -t oscal-control-tool .

mkdir -p deploy-data
docker run --rm -p 3000:3000 \
  -e DATABASE_PATH=/var/data/oscal-author.db \
  -e SEED_DEMO_PROJECT=true \
  -e PORT=3000 \
  -v "$(pwd)/deploy-data:/var/data" \
  oscal-control-tool
```

Then:

- Open http://localhost:3000
- Health: http://localhost:3000/api/health
- Confirm `deploy-data/oscal-author.db` was created
- Stop and re-run the same `docker run` with the same volume — data should persist
- A second start with `SEED_DEMO_PROJECT=true` should not recreate/wipe the demo

To skip seeding:

```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_PATH=/var/data/oscal-author.db \
  -e SEED_DEMO_PROJECT=false \
  -v "$(pwd)/deploy-data:/var/data" \
  oscal-control-tool
```

## Render setup

Blueprint: `render.yaml` (Docker web service).

1. Use a **paid** instance type that supports persistent disks (Blueprint uses `starter`)
2. Attach a disk mounted at `/var/data` (already in `render.yaml`)
3. Set `DATABASE_PATH=/var/data/oscal-author.db`
4. For the initial demo deployment, set `SEED_DEMO_PROJECT=true`
5. Health check path: `/api/health`
6. Branch: `main` (unless you configure otherwise in the Render dashboard)
7. Keep **one** instance — SQLite is local to the attached disk

Deploy via Blueprint sync or by connecting the repo and selecting the Dockerfile.
Render builds the image; `CMD` is `npm start`.

### Persistent disk notes

- Only files under `/var/data` survive deploys and restarts
- Attaching a disk disables zero-downtime deploys on Render
- You cannot horizontally scale a service that has a persistent disk

## Data backup

SQLite is a file on the disk (`oscal-author.db`, plus `-wal` / `-shm` when WAL is active).

Practical options:

- Use Render disk snapshots if available on your plan
- Periodically copy the database file while the app is stopped (or use SQLite backup APIs)
- Keep exports of OSCAL SSP JSON as an application-level backup of authored content

There is no automatic off-site backup in this MVP.

## Limitations

- Single Node.js instance only
- No application authentication yet — treat the deployment as trusted / access-controlled at the network edge
- Not for multi-tenant public hosting without additional controls
- Custom domains / Cloudflare are out of scope for this document

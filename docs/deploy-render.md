# Deploying to Render (Docker + PostgreSQL)

Control Freak runs as a Next.js Docker web service on Render with **Render
PostgreSQL** in the same region (ADR-014, ADR-015, ADR-019, ADR-028).

**Milestone 05B does not provision Render.** Use this file for host-specific
notes. The application startup lifecycle is documented in `docs/deployment.md`.
Actual service/database/object-storage provisioning is Milestone 05C.

Authentication is required. Membership is invite-only after bootstrap.
Do not seed the local default demo password onto an Internet-facing service.

## Required environment variables

See `.env.example` and `docs/deployment.md`. At minimum for a Render web
service:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string. Prefer the Render **internal** URL. |
| `BETTER_AUTH_SECRET` | **Yes** | Opaque session signing secret (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | **Yes** | Public HTTPS origin (e.g. `https://your-service.onrender.com`) |
| `NEXT_PUBLIC_APP_URL` | Optional at image build | Same origin for the client if baked at build time; runtime server uses `BETTER_AUTH_URL` |
| `DEPLOYMENT_MODE` | Recommended | `normal` or `demo` (omitted defaults to `normal`) |
| `DEMO_BOOTSTRAP_PASSWORD` | **Yes if demo** | Canonical demo login password (never the local default) |
| `BOOTSTRAP_ADMIN_*` | Optional if normal | Initial administrator when not using demo mode |
| `EVIDENCE_S3_*` | **Yes in production** | S3-compatible Evidence storage (not provisioned in 05B) |
| `PORT` | Set by Render | HTTP listen port |
| `NODE_ENV` | Production | Set to `production` |
| `DATABASE_SSL` | Optional | Set `true` to force TLS when the URL does not include `sslmode=require` |

`SEED_DEMO_PROJECT` is deprecated and must not be `true` in `normal` mode.

Never commit `.env` files or secrets. Never put `DATABASE_URL` or
`BETTER_AUTH_SECRET` in `NEXT_PUBLIC_*` variables.

## Render topology

1. Create a **PostgreSQL** instance in the same region as the web service.
2. Attach `DATABASE_URL` from the database’s **internal** connection string to
   the web service.
3. For one-off admin tools from outside Render, use the external URL with TLS
   (`sslmode=require`).
4. Persistent disks are **not** required for application data (PostgreSQL holds
   state). Evidence binaries need S3-compatible storage (05C).
5. Start with `numInstances: 1`.

Blueprint: `render.yaml` (Docker web service + managed Postgres). Do not treat
it as a complete 05C deployment.

## Production startup

`npm start` runs `scripts/start-production.ts`:

1. Validate `DEPLOYMENT_MODE` and required variables
2. Apply Drizzle PostgreSQL migrations from `drizzle-pg/`
3. Normal: optional `BOOTSTRAP_ADMIN_*`; demo: full canonical 05A dataset
4. Start Next.js bound to `0.0.0.0` on `PORT`

Never `--reset` during deployment.

## Health check

- URL: `/api/health`
- Success: HTTP 200 with `{"status":"ok"}`
- Does not expose connection strings, secrets, or stack traces
- Performs a lightweight `SELECT 1` against PostgreSQL

## Local Docker (application only)

```bash
docker build -t oscal-control-tool .

docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e DEPLOYMENT_MODE=normal \
  -e DATABASE_URL='postgres://postgres:postgres@host.docker.internal:5432/oscal_control_tool' \
  -e BETTER_AUTH_SECRET='replace-me-at-least-32-chars' \
  -e BETTER_AUTH_URL='http://localhost:3000' \
  -e EVIDENCE_STORAGE_DRIVER=s3 \
  -e EVIDENCE_S3_BUCKET=dev-not-for-prod \
  -e EVIDENCE_S3_ACCESS_KEY_ID=minio \
  -e EVIDENCE_S3_SECRET_ACCESS_KEY=minio12345 \
  -e PORT=3000 \
  oscal-control-tool
```

Local production-mode runs still require S3 configuration because
`NODE_ENV=production` fails closed on filesystem Evidence storage. For
day-to-day development use `npm run dev` with Compose PostgreSQL.

## Manual production smoke test

After deploy and bootstrap, follow the checklist in `docs/deployment.md` plus:

1. Sign in and sign out at `/sign-in`
2. Confirm unauthenticated requests to `/projects` redirect to sign-in
3. Confirm `/api/health` returns `{"status":"ok"}`
4. Restart the service and confirm persistence

## SQLite → PostgreSQL cutover

Existing SQLite deployments must follow:

`docs/playbooks/sqlite-to-postgres-cutover.md`

## Limitations

- Horizontal scaling requires a shared PostgreSQL and sticky-aware session
  design review; start with a single web instance unless load requires more
- No production email provider is wired by default
- Social login, SSO, passkeys, MFA, and SCIM remain out of scope
- Evidence object storage is required in production but is not provisioned here

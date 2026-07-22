# Deploying to Render (Docker + PostgreSQL)

Control Freak runs as a Next.js Docker web service on Render with **Render
PostgreSQL** in the same region (ADR-014, ADR-015, ADR-019).

Authentication is required. The demo deployment is invite-only after bootstrap.
Do not seed shared public credentials.

## Required environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string. Prefer the Render **internal** URL for the web service. |
| `BETTER_AUTH_SECRET` | **Yes** | Opaque session signing secret (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | **Yes** | Public app base URL (e.g. `https://your-service.onrender.com`) |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Same public base URL for client auth helpers (non-secret) |
| `PORT` | Set by Render | HTTP listen port |
| `NODE_ENV` | Production | Set to `production` |
| `SEED_DEMO_PROJECT` | Optional | When `true`, idempotent demo project seed (**never** `--reset`) |
| `SEED_DEMO_ORG_SLUG` | Required if seeding | Organization slug that owns the demo project |
| `DATABASE_SSL` | Optional | Set `true` to force TLS when the URL does not include `sslmode=require` |

Never commit `.env` files or secrets. Never put `DATABASE_URL` or
`BETTER_AUTH_SECRET` in `NEXT_PUBLIC_*` variables.

## Render topology

1. Create a **PostgreSQL** instance in the same region as the web service.
2. Attach `DATABASE_URL` from the database’s **internal** connection string to
   the web service.
3. For one-off admin tools from outside Render, use the external URL with TLS
   (`sslmode=require`).
4. Persistent disks are **not** required for application data (PostgreSQL holds
   state). Remove legacy SQLite disk mounts when cutting over.

Blueprint: `render.yaml` (Docker web service + managed Postgres).

## Production startup

`npm start` runs `scripts/start-production.ts`, which:

1. Requires `DATABASE_URL` (fails closed if unset)
2. Applies Drizzle PostgreSQL migrations from `drizzle-pg/`
3. If `SEED_DEMO_PROJECT=true`, runs the **idempotent** demo seed into
   `SEED_DEMO_ORG_SLUG` (**never** `--reset`)
4. Starts Next.js bound to `0.0.0.0` on `PORT`

### Bootstrap (one-time, outside normal deploy)

Create the first organization administrator **once** before relying on the
demo or invitations:

```bash
BOOTSTRAP_ADMIN_EMAIL=you@example.com \
BOOTSTRAP_ADMIN_PASSWORD='a-long-unique-password' \
BOOTSTRAP_ADMIN_NAME='Platform Admin' \
BOOTSTRAP_ORG_NAME='Demo Organization' \
BOOTSTRAP_ORG_SLUG=demo-organization \
npm run bootstrap:admin
```

Then invite additional users from **Organization settings**. Public
self-registration remains disabled.

### Why `--reset` must never run during normal deployment

`npm run db:seed:demo -- --reset` deletes the demo project and recreates it.
That would wipe demo edits on every deploy. Startup only calls the idempotent
path.

## Health check

- URL: `/api/health`
- Success: HTTP 200 with `{"status":"ok"}`
- Does not expose connection strings, secrets, or stack traces
- Performs a lightweight `SELECT 1` against PostgreSQL

## SQLite → PostgreSQL cutover

Existing SQLite deployments must follow the offline cutover playbook:

`docs/playbooks/sqlite-to-postgres-cutover.md`

Rollback is restoration of the previous SQLite deployment and its backup. No
PostgreSQL-to-SQLite reverse sync is provided.

## Local Docker (application only)

Requires a reachable PostgreSQL URL (Render, local Postgres, or similar):

```bash
docker build -t oscal-control-tool .

docker run --rm -p 3000:3000 \
  -e DATABASE_URL='postgres://user:pass@host:5432/oscal' \
  -e BETTER_AUTH_SECRET='replace-me' \
  -e BETTER_AUTH_URL='http://localhost:3000' \
  -e NEXT_PUBLIC_APP_URL='http://localhost:3000' \
  -e SEED_DEMO_PROJECT=false \
  -e PORT=3000 \
  oscal-control-tool
```

## Manual production smoke test

After deploy and bootstrap:

1. Sign in and sign out at `/sign-in`
2. Confirm unauthenticated requests to `/projects` redirect to sign-in
3. Create or open a project in the demo organization
4. Edit an implementation as an author
5. Submit for review; complete a review as a reviewer
6. Confirm a viewer cannot mutate
7. Invite a member; accept the invitation with a verified matching email
8. Remove a member and confirm access is revoked
9. Export and validate OSCAL for a representative project
10. Restart the service and confirm persistence
11. Confirm `/api/health` returns `{"status":"ok"}`

## Data backup

- Use Render PostgreSQL backups / point-in-time recovery per your plan
- Keep OSCAL SSP JSON exports as an application-level content backup
- Retain the pre-cutover SQLite file backup until the release is accepted

## Limitations

- Horizontal scaling requires a shared PostgreSQL and sticky-aware session
  design review; start with a single web instance unless load requires more
- No production email provider is wired by default — configure a real sender
  before relying on verification/invitation email outside development
- Social login, SSO, passkeys, MFA, and SCIM remain out of scope

# Deploying to Render (Docker + PostgreSQL)

Control Freak runs as a Next.js Docker web service on Render with **Render
PostgreSQL** in the same region and **S3-compatible Evidence storage**
(ADR-014, ADR-015, ADR-019, ADR-025, ADR-028).

Milestone 05C verified this topology for a seeded demo. The application
startup lifecycle is documented in `docs/deployment.md`. This file records
the hosted configuration that was actually used.

Authentication is required. Membership is invite-only after bootstrap.
Do not seed the local default demo password onto an Internet-facing service.

## Verified hosted demo (Milestone 05C)

The live demo is a **single** Docker web service in **Ohio**, not Oregon.

| Resource | Name | Notes |
| --- | --- | --- |
| Web service | `oscal-control-tool` | Docker, starter, `numInstances: 1`, health `/api/health` |
| PostgreSQL | `oscal-control-tool-db` | PostgreSQL 16, `basic-256mb`, Ohio, empty until `npm start` migrated it |
| Object storage | Existing private Evidence bucket | AWS S3, `us-east-2`, public access blocked, key prefix `demo` |

Public origin used by browsers and Better Auth:

```text
https://controlfreak.threatthreatthreat.ca
```

The default `https://oscal-control-tool.onrender.com` hostname returns 404
with `x-render-routing: blocked-render-subdomain`. Set `BETTER_AUTH_URL` to
the custom domain users actually open. Do not use the blocked `onrender.com`
URL for cookies, redirects, or invitation links.

First demo boot created the canonical 05A dataset (`orgs +2, users +8,
projects +6`). Adding FirstDoor later creates the missing org, seven
admins, and one Moderate project (`orgs +1, users +7, projects +1`) on the
next demo start. The Milestone 06A cutover created Snow Goose Cloud Impact
Level 4 (`orgs +0, users +0, projects +1`) without resetting PostgreSQL.
A later redeploy of the same service, without resetting PostgreSQL, logs
`orgs +0, users +0, projects +0` and preserves user edits plus uploaded
Evidence objects.

## Verified production release (Milestone 06A)

Live revision: **v0.6.1** (`eb12b69`). Source branch is **`main`**.
Auto-deploy is **off**. `DEPLOYMENT_MODE=demo`. Health `GET /api/health`
returns HTTP 200 on the custom domain.

**v0.6.0** (`48ae30f`) is the 06A merge commit. It is **not** the live
release: Render’s Docker build failed because `.dockerignore` excluded
`docs/user-guide` from the builder. The fix is `7d2034f` (merged as
`eb12b69`): `.dockerignore` exceptions so Help Markdown enters builder
`COPY . .`. An experimental extra Dockerfile `COPY` of that directory was
discarded and not committed.

06A production smoke confirmed IL4 is selectable, Snow Goose Cloud Impact
Level 4 (Demo) exists, NIST Moderate and CMMC Level 2 remain available
(including Strategic Goose Operations Platform), IL4 Help resolves, IL4
OSCAL SSP export remains unavailable, and representative overlay items
AC-2, AC-7, IA-5(1), SC-17, SC-46, and GRR-1 resolve with the IA-5(1)
source-conflict notice and DSPAV-required overlay behavior still present.

## Seeded demo vs normal install

Same image, same `npm start`, different dashboard configuration.

### Seeded demo (verified)

```text
DEPLOYMENT_MODE=demo
```

Requires `DEMO_BOOTSTRAP_PASSWORD` (minimum 12 characters; never the local
development default). Canonical demo users such as `alice@example.com` and
`oscar@example.com` share that password. Demo users are created with
`emailVerified: true` so login works without a production email provider.

### Normal install (same Blueprint, not provisioned separately in 05C)

```text
DEPLOYMENT_MODE=normal
```

Omitting `DEPLOYMENT_MODE` also defaults to `normal`. Do not set
`DEMO_BOOTSTRAP_PASSWORD` unless you intend a demo. Optional
`BOOTSTRAP_ADMIN_*` / `BOOTSTRAP_ORG_*` create the first administrator.
See `docs/deployment.md`.

`render.yaml` keeps `DEPLOYMENT_MODE=normal` so a Blueprint apply does not
accidentally seed the canonical demo. The hosted demo overrides that value
in the Render dashboard.

## Required environment variables

See `.env.example` and `docs/deployment.md`. Dashboard keys used by the
verified demo (values stay in Render; never commit them):

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | **Yes** | Render **internal** PostgreSQL URL from `fromDatabase.connectionString` |
| `BETTER_AUTH_SECRET` | **Yes** | Opaque session signing secret (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | **Yes** | Public HTTPS origin users open (custom domain in this deployment) |
| `DEPLOYMENT_MODE` | **Yes for demo** | `demo` for the hosted demo; Blueprint default is `normal` |
| `DEMO_BOOTSTRAP_PASSWORD` | **Yes if demo** | Canonical demo login password |
| `EVIDENCE_S3_BUCKET` | **Yes in production** | Evidence bucket name |
| `EVIDENCE_S3_REGION` | Recommended | Region for AWS S3 (`us-east-2` for the verified bucket) |
| `EVIDENCE_S3_ACCESS_KEY_ID` | **Yes in production** | Bucket-scoped IAM user |
| `EVIDENCE_S3_SECRET_ACCESS_KEY` | **Yes in production** | IAM secret |
| `EVIDENCE_S3_KEY_PREFIX` | Recommended | Object key prefix (`demo` on the verified bucket) |
| `NODE_ENV` | Production | `production` |
| `PORT` | Set by Render | HTTP listen port (`10000` observed at startup) |

Do **not** set:

- `SEED_DEMO_PROJECT` — retired production switch; absent from the verified service
- `DATABASE_PATH` — SQLite path; unused
- `DATABASE_SSL=true` — **not** for Render internal URLs (host looks like
  `dpg-…-a`, no `sslmode`). External URLs include `sslmode=require` and enable
  TLS automatically
- `NEXT_PUBLIC_*` secrets

`PUT` of Render env vars replaces the **entire** set. Read the current keys,
change one, and write them all back.

Never commit `.env` files or secrets.

## Render topology

1. Create **PostgreSQL** in the same region as the web service (Ohio).
2. Attach `DATABASE_URL` from the database’s **internal** connection string.
   External `psql` from an unlisted IP is denied by Render’s allow list; use
   the dashboard shell or an allowed address for operator access.
3. Persistent disks are **not** required for application data. PostgreSQL
   holds state; Evidence binaries go to S3.
4. Keep `numInstances: 1`. Milestone 05B documented a first-boot project-name
   race if two unsynchronized processes seed an empty database.
5. Configure S3 (`EVIDENCE_S3_*`) before expecting uploads to succeed.
   Metadata-only seeded Evidence does not prove object storage.

The verified service still has a leftover disk from an older SQLite-era
deploy (`/var/data`). Do not use it for application data. Do not treat it as
the database or Evidence store.

Blueprint: `render.yaml` (Docker web service + managed Postgres). The
Blueprint `branch` is `main`. The live service tracks **`main`** with
auto-deploy **off**. Earlier feature-branch verification used
`feat/05C-render-deployment` and `feat/firstdoor-demo-tenant` on the same
service, also with auto-deploy off.

## Production startup

`npm start` runs `scripts/start-production.ts`:

1. Validate `DEPLOYMENT_MODE` and required variables
2. Apply Drizzle PostgreSQL migrations from `drizzle-pg/`
3. Normal: optional `BOOTSTRAP_ADMIN_*`; demo: full canonical 05A dataset
4. Start Next.js bound to `0.0.0.0` on `PORT`

Never `--reset` during deployment. Redeploy the same service without creating
a new database.

The production image runs `npm prune --omit=dev`. PGlite is a **dev**
dependency and must not be statically imported from production modules. Tests
open PGlite only through a dynamic import inside `openTestDb()`.

The `nextjs` container user has `HOME=/home/nextjs` so npm/runtime logs that
write under the home directory succeed.

## Health check

- Path: `/api/health` (Render health check and operators)
- Success: HTTP 200 with `{"status":"ok"}`
- Does not expose connection strings, secrets, deployment mode, or stack traces
- Performs a lightweight `SELECT 1` against PostgreSQL
- HTTP to the custom domain redirects to HTTPS (301)

## First deploy vs redeploy

| Event | Expected startup |
| --- | --- |
| First boot against empty Postgres in `demo` | `environment valid` → `migrations complete` → canonical bootstrap creates missing orgs/users/projects → Next.js starts |
| Redeploy without resetting Postgres | Same validation and migrations; bootstrap counters stay `+0`; user edits and Evidence objects remain |

Do not rename canonical demo **project names**. Names are idempotency keys;
renaming a seeded project can cause bootstrap to create a second project with
the original name.

## Evidence / S3

Production uploads are app-proxied (`POST` multipart field `file` on the
Evidence version route). Confirm a real upload, not only seeded metadata:

1. Object appears in the configured bucket/prefix
2. Authenticated download returns the file
3. Unauthenticated callers get 401
4. Cross-tenant callers get 404
5. Unsigned public GET of the object fails
6. Redeploy does not delete the object or its database row

Keep the bucket private (all four S3 public-access block settings on).

## Authentication

Better Auth email/password. Production cookies are `__Secure-` prefixed,
`Secure`, `HttpOnly`, and `SameSite=Lax`. `BETTER_AUTH_URL` must match the
custom domain. Wrong passwords return 401. Organization isolation is
server-enforced (Canadian Goose Defence System, Contoso Industries, and
FirstDoor).

## Operational commands

Use the Render CLI against the existing service id; do not print secret
values.

```bash
render workspace current
render deploys create srv-… --wait --confirm
render logs --resources srv-… --type app --limit 80
render services get srv-…
```

- **Deploy logs / app logs:** `render logs` and the Render dashboard.
- **Health:** `GET https://<public-origin>/api/health`
- **PostgreSQL:** dashboard status; internal URL on the web service; do not
  expose the database port on the web service.
- **Environment variables:** dashboard or Render API. Values are secrets.
- **Manual redeploy:** `render deploys create <serviceId> --wait --confirm`
  (no `--clear-cache` unless the image is stale).
- **Rollback:** redeploy a previous successful deploy/commit from the
  dashboard. Do not reset PostgreSQL to roll back application code.

Invalid-configuration fail-closed behavior is covered by Milestone 05B tests.
Do not break the primary demo to re-test missing `DEMO_BOOTSTRAP_PASSWORD` or
an invalid `DEPLOYMENT_MODE`.

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

1. Sign in and sign out at `/sign-in` with a canonical demo user
2. Confirm unauthenticated requests to `/projects` show sign-in
3. Confirm `/api/health` returns `{"status":"ok"}`
4. Upload a small Evidence file and download it
5. Export OSCAL SSP from a NIST SP 800-53 project (not CMMC)
6. Redeploy without resetting PostgreSQL and confirm edits persist

## SQLite → PostgreSQL cutover

Existing SQLite deployments must follow:

`docs/playbooks/sqlite-to-postgres-cutover.md`

The hosted demo started from a **fresh** Render PostgreSQL instance. Do not
migrate leftover SQLite from `/var/data`.

## Known limitations

- Keep **one** web instance
- No production email provider (invites, password reset, and verification
  email do not send). Demo bootstrap marks demo users verified
- Social login, SSO, passkeys, MFA, and SCIM remain out of scope
- Default `onrender.com` service URL is blocked; use the custom domain
- Leftover `/var/data` disk is unused
- Horizontal scaling is not in scope

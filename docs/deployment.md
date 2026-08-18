# Deployment lifecycle

Control Freak uses one production build and one production startup command.
The deployment mode is configuration, not a separate branch or image.

```bash
npm start
```

That command (`scripts/start-production.ts`) always:

1. Validates `DEPLOYMENT_MODE` and required environment variables.
2. Applies pending PostgreSQL migrations (`drizzle-pg/`).
3. Runs mode-specific bootstrap.
4. Starts Next.js on `0.0.0.0` using `PORT` (default 3000).

It never resets the database, never truncates data, and never runs
`db:seed:demo -- --reset`.

Cloud hosts (including a later Render deployment) should run only `npm start`.
Do not put mode-specific logic in infrastructure files.

## Deployment modes

| `DEPLOYMENT_MODE` | Meaning |
| --- | --- |
| `normal` | Clean installation. No canonical demo data. |
| `demo` | Ensure the full Milestone 05A canonical demo environment. |
| omitted | Defaults to **`normal`** (safest: no demo seed). |
| any other value | Startup fails before migrations. |

`DEPLOYMENT_MODE=demo` is the only production demo switch. It creates the
**entire** canonical dataset (Canadian Goose Defence System, supporting
projects including CMMC Level 2, Contoso Industries, identities, collaboration,
and Evidence) — not only the Goose flagship.

## Normal lifecycle

```text
validate env
  → apply migrations
  → optional BOOTSTRAP_ADMIN_* (if fully configured)
  → start Next.js
```

Normal mode never creates demo organizations, projects, users, Evidence,
comments, assignments, or ControlRecords from the canonical demo library.

### Initial administrator

Public self-registration is disabled. A fresh normal deployment obtains its
first administrator in one of two ways:

1. **Automatic (recommended for hosted installs):** set all of
   `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ORG_NAME`,
   and `BOOTSTRAP_ORG_SLUG`. Startup creates the user, organization, and
   `organization_admin` membership idempotently. Existing users are reused;
   passwords of existing users are never overwritten.
2. **Omitted:** the application starts with no users. Create the first
   administrator later with `npm run bootstrap:admin` (same logic), then invite
   members from Organization settings.

Partial `BOOTSTRAP_*` sets fail closed.

Normal mode does not require `DEMO_BOOTSTRAP_PASSWORD`.

A normal redeploy applies new migrations and re-runs the idempotent admin
ensure step. It does not duplicate identities or wipe data.

## Demo lifecycle

```text
validate env (including DEMO_BOOTSTRAP_PASSWORD)
  → apply migrations
  → ensure canonical demo identities
  → ensure canonical demo organizations and dataset
  → start Next.js
```

`DEMO_BOOTSTRAP_PASSWORD` is required (minimum 12 characters). The local
development default (`ControlFreakDemo123!`) is **not** used for
`DEPLOYMENT_MODE=demo` or `NODE_ENV=production`. Missing credentials fail
before startup. Passwords are never logged and must not be baked into the
Docker image.

A demo redeploy is seeded, not ephemeral: it creates missing canonical rows and
leaves ordinary user edits alone. Destructive reset remains a separate local
command (`npm run db:seed:demo -- --reset`), which is refused in production and
when `DEPLOYMENT_MODE=demo`.

See `docs/demo-data.md` for organizations, projects, and idempotency keys.

## Local development vs deployed demo

| Path | Role |
| --- | --- |
| `npm run bootstrap:demo` | Local convenience orchestrator. May write `.env.local`, assumes localhost, refuses remote databases, may use the documented local password. |
| `DEPLOYMENT_MODE=demo` via `npm start` | Production-safe startup. Does not write `.env.local`, does not assume localhost, requires `DEMO_BOOTSTRAP_PASSWORD`. |

Both call the same canonical library (`src/seed/canonical-demo.ts`). There is
one dataset definition.

## Legacy `SEED_DEMO_PROJECT`

This flag used to seed only the Goose flagship into `SEED_DEMO_ORG_SLUG`
during production startup. That path is **removed** from `npm start`.

- `DEPLOYMENT_MODE=normal` (or omitted) **and** `SEED_DEMO_PROJECT=true` →
  configuration error (would otherwise create partial demo data).
- `DEPLOYMENT_MODE=demo` **and** `SEED_DEMO_PROJECT=true` → deprecation
  warning; ignored. The full canonical path runs.

`npm run db:seed:demo` remains a lower-level local/flagship-only command and
still uses `SEED_DEMO_ORG_SLUG`.

## Environment variables

`.env.example` is the authoritative list (required / optional / normal-only /
demo-only / local-only / deprecated).

Production runtime always needs:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` or `NEXT_PUBLIC_APP_URL`
- S3-compatible Evidence storage (`EVIDENCE_S3_*`; see below)
- `DEPLOYMENT_MODE` (`normal` or `demo`; omitted → `normal`)

Demo-only: `DEMO_BOOTSTRAP_PASSWORD`.

Normal-only: optional `BOOTSTRAP_ADMIN_*` / `BOOTSTRAP_ORG_*`.

Platform-injected environment variables take precedence over `.env` files.
Production containers must not depend on `.env.local`.

## Authentication and public URL

Set `BETTER_AUTH_URL` to the HTTPS origin users actually open (no hard-coded
hosting hostname). Secure cookies (`Secure`, `SameSite=Lax`) are enabled when
`NODE_ENV=production`.

Optional:

- `BETTER_AUTH_TRUSTED_ORIGINS` — comma-separated extra origins (Better Auth
  already trusts `baseURL`).
- `BETTER_AUTH_TRUSTED_PROXY_HEADERS=true` — trust `X-Forwarded-Host` /
  `X-Forwarded-Proto`. Default **off**. Prefer an explicit `BETTER_AUTH_URL`.

`NEXT_PUBLIC_APP_URL` is inlined at **build** time if set during `next build`.
The production image is built without it so the browser client uses the current
origin. Set `BETTER_AUTH_URL` at **runtime** for invitation links and cookies.

Local `npm run dev` continues to use `http://localhost:3000`.

## Evidence storage

Production Evidence upload/download requires S3-compatible object storage
(ADR-025). Filesystem storage is development/test only and is rejected at
production startup.

Required in production:

- `EVIDENCE_S3_BUCKET`
- `EVIDENCE_S3_ACCESS_KEY_ID`
- `EVIDENCE_S3_SECRET_ACCESS_KEY`

Optional: `EVIDENCE_S3_REGION` (default `us-east-1`), `EVIDENCE_S3_ENDPOINT`,
`EVIDENCE_S3_FORCE_PATH_STYLE`, `EVIDENCE_S3_KEY_PREFIX`,
`EVIDENCE_UPLOAD_MAX_BYTES` (default 25 MiB).

Metadata-only Evidence (including seeded demo records) does not need object
storage bytes. Uploads fail closed until S3 is configured.

This milestone does not provision object storage.

## Health

`GET /api/health`

- Success: HTTP 200 `{ "status": "ok" }` after a `SELECT 1` against PostgreSQL
- Failure: HTTP 503 `{ "status": "unavailable" }`
- No secrets, paths, deployment mode, or stack traces

Next.js only serves this after validate → migrate → bootstrap, so a 200 is a
reasonable readiness signal for a single instance.

## Docker

One image, two modes:

```bash
docker build -t oscal-control-tool .
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e DEPLOYMENT_MODE=normal \
  -e DATABASE_URL='...' \
  -e BETTER_AUTH_SECRET='...' \
  -e BETTER_AUTH_URL='https://example.com' \
  -e EVIDENCE_S3_BUCKET='...' \
  -e EVIDENCE_S3_ACCESS_KEY_ID='...' \
  -e EVIDENCE_S3_SECRET_ACCESS_KEY='...' \
  -e PORT=3000 \
  oscal-control-tool
```

For demo mode, use the same image with `DEPLOYMENT_MODE=demo` and
`DEMO_BOOTSTRAP_PASSWORD`.

The image includes migrate/bootstrap sources (`src/`, `scripts/`,
`drizzle-pg/`). Secrets stay outside the image. `PORT` is honored; the process
binds `0.0.0.0`.

## Concurrent startup

Assume a single web instance during deploy (the existing blueprint uses
`numInstances: 1`). Drizzle applies migrations on process start. Canonical
demo rows are idempotent (org slug, user email, project name, seed markers).
Project names are not uniquely constrained in the database; two overlapping
first-time demo starts could theoretically create duplicate projects. Do not
run multiple unsynchronized first-boot instances against an empty database.

## Related documents

- Canonical demo content: `docs/demo-data.md`
- Host-specific Render notes (historical): `docs/deploy-render.md`
- Actual Render provisioning: Milestone 05C

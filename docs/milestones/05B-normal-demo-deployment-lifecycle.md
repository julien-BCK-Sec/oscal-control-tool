# Milestone 05B — Normal and Demo Deployment Lifecycle

## Objective

Make Control Freak deployable from the same codebase and production build in two explicit modes:

1. **Normal deployment**
2. **Seeded demo deployment**

The deployment lifecycle must be safe, deterministic, repeatable, and suitable for a later Render deployment.

This milestone is about the **application startup/deployment lifecycle**.

Do **not** perform the actual Render deployment yet.

---

## Context

Milestone 05A established one canonical demo dataset and one canonical demo bootstrap model.

The current state after 05A includes:

- Canonical organization: **Canadian Goose Defence System**
- Canonical flagship project: **Strategic Goose Operations Platform (Demo)**
- Supporting demo projects at different maturity levels
- CMMC Level 2 demo coverage
- Contoso Industries as a second tenant
- Canonical local demo command:

```bash
npm run bootstrap:demo
```

- Safe, idempotent demo seeding
- Destructive reset kept separate
- `db:seed:demo` retained as a lower-level flagship-only command
- `DEPLOYMENT_MODE=demo` already recognized as the intended future production-safe demo seed signal
- `bootstrap:demo` remains local-oriented because it may create/write `.env.local`
- Existing production startup still contains older `SEED_DEMO_PROJECT` behavior that seeds only the flagship rather than the full canonical demo environment

Milestone 05B should turn this into a clean production startup model.

---

# 1. Deployment modes

Support one authoritative deployment-mode configuration.

Use:

```text
DEPLOYMENT_MODE=normal
```

or:

```text
DEPLOYMENT_MODE=demo
```

These should be the only supported deployment modes unless the current architecture provides a compelling reason for a third explicitly documented mode.

Do not rely on combinations of loosely related seed flags to determine whether demo content should be created.

## Normal mode

Conceptually:

```text
start
  |
  +-- validate environment
  +-- apply pending migrations
  +-- perform explicitly configured initial bootstrap if needed
  +-- start production application
```

Normal mode must **not** create demo organizations, demo projects, demo users, demo Evidence, demo comments, demo assignments, demo ControlRecords, or any other canonical demo data.

## Demo mode

Conceptually:

```text
start
  |
  +-- validate environment
  +-- apply pending migrations
  +-- create/ensure demo identities
  +-- create/ensure canonical demo organizations
  +-- create/ensure canonical demo dataset
  +-- start production application
```

Demo mode must create/ensure the **full canonical demo environment from Milestone 05A**, not only the flagship project.

---

# 2. Inspect before changing

Before implementing, inspect the current deployment/startup architecture.

Review at minimum:

- `package.json`
- `scripts/start-production.ts`
- `scripts/seed-demo.ts`
- `src/seed/demo/`
- `src/seed/dev-bootstrap/`
- `src/seed/safety.ts`
- `.env.example`
- Dockerfile(s)
- Docker Compose files
- Better Auth configuration
- database configuration
- migration scripts
- current production start command
- current bootstrap/admin logic
- existing Render-related files/configuration
- deployment documentation
- relevant tests

Confirm the current behavior before modifying it.

Do not assume older deployment design notes are still correct.

---

# 3. One production startup entry point

Establish one obvious production startup command.

Prefer keeping or evolving the existing production startup mechanism rather than inventing a parallel system.

For example:

```bash
npm run start:production
```

or the existing equivalent.

The entry point should be responsible for orchestrating:

1. deployment-mode validation;
2. environment validation;
3. database migration;
4. mode-specific bootstrap;
5. starting Next.js.

Avoid putting complicated lifecycle logic into infrastructure-specific configuration.

Render, Docker, or any other host should eventually only need to execute one production command.

---

# 4. Separate local bootstrap from deployment bootstrap

The existing:

```bash
npm run bootstrap:demo
```

is useful for local development and should remain useful.

However, production demo startup must **not** depend on behavior that writes `.env.local`, assumes localhost, assumes local development credentials, performs local-only setup, or refuses to run merely because the database is remote.

Refactor shared logic where appropriate so both local and deployed demo flows use the same canonical seed implementation.

Conceptually:

```text
Canonical demo library
       |
       +-- local bootstrap:demo wrapper
       |
       +-- deployed DEPLOYMENT_MODE=demo startup
```

Do not duplicate the demo dataset definition.

---

# 5. Normal deployment bootstrap

Determine how a fresh normal deployment obtains its initial administrator and organization.

Use the existing authentication/organization architecture.

If the application already has an appropriate production bootstrap mechanism, retain and harden it.

If initial bootstrap is environment-driven, use clearly named variables such as the existing equivalents of:

```text
BOOTSTRAP_ADMIN_EMAIL
BOOTSTRAP_ADMIN_PASSWORD
BOOTSTRAP_ADMIN_NAME
BOOTSTRAP_ORG_NAME
BOOTSTRAP_ORG_SLUG
```

Do not rename existing variables without good reason.

Requirements:

- bootstrap must be explicit;
- bootstrap must be idempotent;
- passwords/secrets must not be logged;
- normal mode must not require demo credentials;
- existing administrators must not be overwritten;
- existing organization data must not be reset;
- a redeploy must not duplicate the bootstrap identity or organization.

Document what happens when bootstrap variables are omitted.

If the application can legitimately start with no users and expects registration/invitation through another workflow, document that instead of inventing bootstrap behavior.

---

# 6. Demo deployment identities

Demo mode must be capable of creating/ensuring the canonical Milestone 05A demo identities without relying on a local hard-coded password.

The local development default:

```text
ControlFreakDemo123!
```

must not silently become the password for an Internet-facing deployment.

For deployed demo mode:

- require an explicitly supplied demo bootstrap password or equivalent secure configuration;
- fail clearly if a required deployed-demo credential is absent;
- never print the password;
- never commit it;
- never embed it in the Docker image.

Reuse:

```text
DEMO_BOOTSTRAP_PASSWORD
```

if that remains the established 05A variable.

Local development may retain its documented local default if current safety checks ensure it is local-only.

---

# 7. Retire the old production demo switch

Review the existing production startup behavior involving:

```text
SEED_DEMO_PROJECT
```

The audit after 05A found that this path seeds only the flagship project.

That is no longer sufficient as the authoritative demo deployment mechanism.

Move production/demo startup to:

```text
DEPLOYMENT_MODE=demo
```

which must create the **entire canonical demo environment**.

Prefer deprecating or removing `SEED_DEMO_PROJECT` from production startup if it no longer has a legitimate separate purpose.

If backward compatibility is retained:

- document it as deprecated;
- do not allow it to conflict ambiguously with `DEPLOYMENT_MODE`;
- never let it accidentally create partial demo state in `normal` mode.

Example safe behavior:

```text
DEPLOYMENT_MODE=normal + SEED_DEMO_PROJECT=true
→ refuse with a clear configuration error
```

rather than silently seeding data.

Use judgment based on the existing architecture.

---

# 8. Deployment mode validation

Validate `DEPLOYMENT_MODE` explicitly.

Expected values:

```text
normal
demo
```

Unknown values must fail startup clearly.

If `DEPLOYMENT_MODE` is omitted, choose the safest behavior.

Prefer `normal` as the default if backward compatibility requires a default.

If explicit configuration is safer and feasible, require the variable in production.

Document the choice.

---

# 9. Database migrations

Use the repository's existing migration system.

Production startup must:

- apply pending migrations before bootstrap/seeding;
- fail if migration fails;
- not use destructive schema reset;
- not use development-only schema push if that bypasses migration history;
- not continue startup with a partially migrated database.

Migration behavior must be identical in normal and demo modes.

---

# 10. Transaction and partial-failure behavior

Review what happens if startup fails partway through bootstrap or demo seed.

The next run must recover safely.

The lifecycle should tolerate:

```text
migrations succeed
demo seed partially runs
process crashes
container restarts
```

The subsequent startup should converge on the canonical expected state without duplication or destructive cleanup.

Use existing idempotency from 05A.

Where practical, use transactions around logically atomic groups.

Do not introduce large or risky transaction scopes merely for theoretical purity.

---

# 11. Concurrent startup safety

Consider that cloud platforms may briefly start more than one instance during deployment/restart.

Assess whether two startup processes could both attempt migrations, admin bootstrap, or demo bootstrap.

Use the capabilities of the current migration/ORM/database architecture.

At minimum:

- unique constraints/idempotency should prevent duplicate canonical records;
- startup should fail predictably rather than corrupt data;
- document any remaining single-instance assumption.

Do not build a distributed locking system unless genuinely necessary.

---

# 12. Authentication and production URL configuration

Review Better Auth and production URL handling.

Ensure deployed startup supports configuration for:

- application public URL;
- Better Auth base URL;
- trusted origins;
- secure cookies;
- reverse proxy / HTTPS;
- production hostname.

Do not hard-code Render hostnames.

Local development must continue working.

Use actual existing environment-variable names from the codebase.

---

# 13. Environment validation

Create or improve central validation for deployment-critical environment variables.

At minimum consider:

### All production deployments

- database URL;
- auth secret;
- public/base application URL;
- deployment mode.

### Normal deployment only

- initial bootstrap variables, if initial bootstrap is enabled.

### Demo deployment only

- demo bootstrap password;
- any other required identity settings.

### Storage

The earlier audit identified an S3/evidence-storage deployment concern.

Inspect the current evidence/storage architecture and identify exactly what is required for an Internet-hosted deployment.

Do not silently configure fake storage.

If S3-compatible storage is required for Evidence upload/download, make the required variables explicit and validate them appropriately.

If Evidence can function in another supported mode, document that.

Do not implement infrastructure-specific storage provisioning in this milestone unless a small application-side configuration fix is required.

---

# 14. Health endpoint

Ensure there is a production-appropriate health check suitable for a cloud host.

If one already exists, review it instead of duplicating it.

The health endpoint should:

- return a simple success/failure state;
- expose no secrets;
- avoid expensive work;
- ideally distinguish whether the application is actually ready after migrations/bootstrap.

Keep this lightweight.

---

# 15. Docker production behavior

Review the Dockerfile and production container behavior.

Ensure:

- the production build succeeds;
- required migration code is included;
- required bootstrap/seed code is included;
- production dependencies required by startup exist;
- the container does not depend on local `.env.local`;
- secrets are supplied at runtime;
- the process listens on the host-provided `PORT`;
- the app binds to an appropriate interface;
- the same image can run in `normal` or `demo` mode.

Target:

```text
one image
+ environment configuration
= normal or demo deployment
```

Do not build separate demo and production images.

---

# 16. Startup logging

Provide useful, non-sensitive startup logging.

A deployer should be able to see steps such as:

```text
deployment mode: demo
running migrations
migrations complete
ensuring demo bootstrap
demo bootstrap complete
starting application
```

Do not log passwords, auth secrets, database passwords, session secrets, or sensitive tokens.

Keep logs concise.

---

# 17. Demo redeployment behavior

A demo deployment will be redeployed repeatedly.

Confirm that a redeploy:

- applies new migrations;
- ensures missing canonical seed data;
- does not reset the demo database;
- does not overwrite ordinary user edits;
- does not recreate duplicates;
- does not delete newly created user content.

Demo mode is **seeded**, not **ephemeral-reset-on-start**.

A destructive reset must remain an explicit separate administrative/development action.

---

# 18. Normal redeployment behavior

A normal deployment redeploy must:

- apply migrations;
- preserve all existing data;
- preserve users;
- preserve organizations;
- preserve projects;
- avoid demo seed code entirely;
- avoid re-running destructive bootstrap.

---

# 19. Documentation

Create or update deployment documentation, preferably:

```text
docs/deployment.md
```

Document normal mode, demo mode, local demo workflow, destructive reset behavior, and the future cloud-hosting requirements.

Keep the distinction clear:

```bash
npm run bootstrap:demo
```

is the local convenience workflow.

Do not make the documentation Render-specific yet except where existing code already contains Render assumptions that must be documented.

---

# 20. `.env.example`

Update `.env.example` as the authoritative environment-variable reference.

Clearly identify:

- required;
- optional;
- normal-only;
- demo-only;
- local-development-only;
- deprecated.

Never include real credentials.

---

# 21. Tests

Add focused tests for deployment lifecycle decisions.

At minimum verify:

### Mode selection

- `normal` selects normal startup path;
- `demo` selects canonical demo startup path;
- invalid mode fails;
- omitted mode follows the documented safe default or fails if required.

### Normal mode

- demo bootstrap is not invoked;
- demo data is not created.

### Demo mode

- canonical demo bootstrap is invoked;
- full 05A dataset path is used, not flagship-only seed;
- missing required deployed-demo password fails clearly.

### Deprecated legacy flag

If `SEED_DEMO_PROJECT` remains:

- conflicts are handled safely;
- it cannot accidentally create partial demo data in normal deployment.

### Idempotency

- second startup does not duplicate canonical demo data.

### User modification preservation

- routine demo startup does not wipe a representative user edit.

Use existing test patterns.

---

# 22. Integration verification

Use clean PostgreSQL databases and verify both modes.

## Test A — clean normal deployment

Run the production startup lifecycle with:

```text
DEPLOYMENT_MODE=normal
```

Confirm migrations succeed, normal bootstrap behaves as documented, no demo data is created, and the application starts.

## Test B — normal redeploy

Run again and confirm no duplication or data loss.

## Test C — clean demo deployment

Run production lifecycle with:

```text
DEPLOYMENT_MODE=demo
```

and required demo credentials.

Confirm:

- migrations succeed;
- canonical demo users are created;
- Canadian Goose Defence System exists;
- Strategic Goose Operations Platform (Demo) exists;
- all supporting 05A projects exist;
- CMMC project exists;
- Contoso tenant exists;
- application starts.

## Test D — demo redeploy

Run again and confirm canonical entity counts do not unexpectedly grow.

## Test E — preserve demo edits

Modify representative demo content, rerun demo startup, and confirm the edit is preserved according to 05A semantics.

## Test F — invalid deployment mode

Use an invalid mode and confirm startup fails before application launch and does not seed data.

---

# 23. Existing TypeScript issues

The 05A report identified pre-existing `npx tsc --noEmit` errors in unrelated tests involving:

- `ProcessEnv.NODE_ENV`;
- a NIST derive fixture.

Do not broaden this milestone merely to fix unrelated historical issues.

However:

- do not introduce new TypeScript errors;
- if deployment files you modify are affected, fix only what is necessary and document it;
- continue to report pre-existing failures accurately if they remain.

---

# 24. Verification suite

Run the repository's actual available validation commands.

At minimum:

```bash
npm run lint
npm test
npm run build
npx tsc --noEmit
```

Clearly distinguish pre-existing type errors from any new errors caused by 05B.

Do not claim a fully clean typecheck if historical failures remain.

---

# 25. Scope boundaries

Do not:

- deploy to Render yet;
- create a Render service;
- provision a Render database;
- add findings/risks/tasks;
- redesign demo content from 05A;
- rewrite the Goose scenario;
- implement CMMC OSCAL export;
- build Kubernetes support;
- create separate demo and production branches;
- create separate demo and production Docker images;
- reset databases automatically;
- perform unrelated UI redesign.

---

# 26. Deliverables

When complete, return:

1. Executive summary.
2. Previous production startup behavior.
3. New deployment lifecycle architecture.
4. Exact normal-mode lifecycle.
5. Exact demo-mode lifecycle.
6. Initial admin/bootstrap behavior.
7. Demo identity behavior.
8. Handling/deprecation of `SEED_DEMO_PROJECT`.
9. Environment variables by category.
10. Authentication/public URL configuration.
11. Evidence/storage deployment requirements found.
12. Health/readiness behavior.
13. Docker/startup changes.
14. Files changed.
15. Tests added/updated.
16. Integration verification results for Tests A–F.
17. Lint/test/build/typecheck results.
18. Any remaining deployment risks.
19. Exact remaining work before Milestone 05C Render deployment.

Do not commit or push unless explicitly instructed.

---

# Target end state

The same Control Freak codebase and production image can be deployed safely as either:

```text
DEPLOYMENT_MODE=normal
```

or:

```text
DEPLOYMENT_MODE=demo
```

with no source-code changes between them.

A normal deployment starts cleanly without demo content.

A demo deployment creates the complete canonical Milestone 05A demo environment safely and idempotently.

Both modes preserve existing data across redeployments.

Actual Render provisioning and deployment are intentionally deferred to **Milestone 05C**.

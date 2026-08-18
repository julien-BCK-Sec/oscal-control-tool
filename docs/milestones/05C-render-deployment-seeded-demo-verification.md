# Milestone 05C — Render Deployment and Seeded Demo Verification

## Objective

Deploy Control Freak to Render using the production lifecycle completed in Milestone 05B and verify that the seeded demo works end to end in a real hosted environment.

This milestone should result in a working Internet-accessible Control Freak demo deployment using:

- the current production Docker image;
- Render Web Service;
- Render PostgreSQL;
- `DEPLOYMENT_MODE=demo`;
- the canonical Milestone 05A demo dataset;
- production-safe authentication configuration;
- S3-compatible Evidence storage;
- the existing `/api/health` readiness endpoint.

This is the first milestone that should perform the actual hosted deployment.

The goal is not merely to make Render configuration files look correct. The goal is to prove that the deployed application actually works.

---

# Context

Milestone 05A established the canonical demo environment:

- Organization: **Canadian Goose Defence System**
- Flagship: **Strategic Goose Operations Platform (Demo)**
- Supporting projects at different maturity levels
- CMMC Level 2 demo project
- Contoso Industries as a second tenant
- Canonical demo users
- Idempotent, non-destructive demo seeding

Milestone 05B established one production startup lifecycle:

```text
npm start
  → validate
  → migrate
  → mode-specific bootstrap
  → Next.js
```

Supported modes:

```text
DEPLOYMENT_MODE=normal
DEPLOYMENT_MODE=demo
```

For demo mode, production startup now ensures the full canonical Milestone 05A dataset.

The current repository also contains:

- Docker production support;
- `render.yaml` as a starting Blueprint;
- production environment validation;
- Better Auth production URL handling;
- S3-compatible Evidence storage requirements;
- `/api/health`;
- integration verification for normal/demo lifecycle.

Milestone 05C should now use that architecture rather than redesigning it.

---

# 1. Inspect the current deployment configuration first

Before provisioning or changing anything, inspect the current repository state.

Review at minimum:

- `render.yaml`
- `Dockerfile`
- `package.json`
- `scripts/start-production.ts`
- `src/deployment/`
- `docs/deployment.md`
- `docs/deploy-render.md`
- `.env.example`
- Better Auth configuration
- Evidence/S3 storage configuration
- `/api/health`
- current database SSL handling
- current migration behavior

Confirm:

1. what Render resources the Blueprint currently defines;
2. whether it is already usable as-is;
3. what must be configured manually in the Render dashboard;
4. whether Render-specific configuration needs small changes before deployment.

Do not redesign the deployment lifecycle unless a real hosted-deployment blocker is found.

---

# 2. Deployment target

Provision a **demo deployment** first.

The initial hosted instance should run with:

```text
DEPLOYMENT_MODE=demo
```

This milestone does not need to stand up a separate normal-production instance unless doing so is trivial and useful for verification.

The demo deployment must use the same production image and startup command that a normal deployment would use.

Do not create a demo-specific branch or image.

---

# 3. Render PostgreSQL

Create a fresh PostgreSQL database for the demo deployment.

Requirements:

- same Render region as the web service;
- application should use the Render internal database connection where supported;
- no existing local/demo database should be migrated into it;
- start from a clean database;
- no manual table creation;
- production startup must apply the existing migrations.

Configure:

```text
DATABASE_URL
```

using the production-safe Render-provided database connection.

Review whether:

```text
DATABASE_SSL
```

or equivalent current application settings are required for Render.

Do not weaken TLS validation unnecessarily.

---

# 4. Render Web Service

Create the Control Freak web service using the repository's production Dockerfile.

Prefer using the existing `render.yaml` Blueprint if it accurately represents the desired service.

The web service should:

- build from the current `main` branch;
- use the production Dockerfile;
- execute the repository's production startup command;
- run one instance initially;
- expose Render's assigned HTTPS hostname;
- use `/api/health` for the health check;
- not use a persistent application filesystem for database state;
- not run a separate demo image.

Record the resulting Render service name and hostname in deployment documentation.

Do not hard-code the Render hostname in source code.

---

# 5. Deployment mode

For this hosted demo, configure:

```text
DEPLOYMENT_MODE=demo
```

Do not configure:

```text
SEED_DEMO_PROJECT=true
```

The legacy flag must not be used.

On first startup, the application should:

```text
validate
→ migrate
→ ensure canonical demo identities
→ ensure canonical demo organizations/projects/data
→ start Next.js
```

On redeploy:

```text
validate
→ migrate
→ ensure missing canonical demo data
→ preserve existing edits
→ start Next.js
```

---

# 6. Better Auth production configuration

Configure production authentication correctly for the Render HTTPS origin.

At minimum set the current equivalents of:

```text
BETTER_AUTH_SECRET
BETTER_AUTH_URL
```

Use the actual deployed HTTPS origin.

Configure trusted origins only as required by the current implementation.

Do not enable trusted proxy-header behavior unless necessary and understood.

Verify:

- login works over HTTPS;
- cookies are Secure;
- session survives navigation/reload;
- logout works;
- callback URLs remain on the correct Render hostname;
- no localhost URL appears in production flows.

Generate a strong production auth secret.

Never commit it.

---

# 7. Demo bootstrap password

Set:

```text
DEMO_BOOTSTRAP_PASSWORD
```

to a strong demo password that is not the local development default.

Requirements:

- at least the minimum length enforced by 05B;
- stored only as a Render secret/environment value;
- not committed;
- not printed in logs;
- not added to docs verbatim.

Verify canonical demo accounts can authenticate using the configured deployed-demo password.

Do not expose the password publicly in repository documentation.

---

# 8. Evidence storage

Milestone 05B established that Internet-hosted production requires S3-compatible Evidence storage.

Provision a suitable S3-compatible bucket for the demo.

Use an appropriate supported provider.

The application-side target is the current `EVIDENCE_S3_*` configuration.

Configure the required variables, including the actual current equivalents of:

```text
EVIDENCE_S3_BUCKET
EVIDENCE_S3_ACCESS_KEY_ID
EVIDENCE_S3_SECRET_ACCESS_KEY
```

and, where required:

```text
EVIDENCE_S3_REGION
EVIDENCE_S3_ENDPOINT
EVIDENCE_S3_FORCE_PATH_STYLE
EVIDENCE_S3_KEY_PREFIX
EVIDENCE_UPLOAD_MAX_BYTES
```

Use the current storage implementation as the source of truth.

Requirements:

- credentials scoped to the specific bucket where possible;
- no public-write bucket;
- do not make objects world-readable unless the application explicitly requires it;
- no credentials committed to source;
- verify upload and retrieval through the application.

The seeded demo's existing Evidence metadata does not prove storage works. Perform a real upload test.

---

# 9. Render Blueprint

Review and update `render.yaml` if needed so it accurately represents the deployable service.

The Blueprint should prefer declaring stable, non-secret configuration while leaving secrets for Render secret values.

It may include:

- service definition;
- Docker runtime;
- PostgreSQL attachment/reference;
- health-check path;
- deployment mode default if appropriate;
- one-instance expectation if supported.

Do not place actual secret values in `render.yaml`.

If a configuration item is better managed manually in Render, document that.

The resulting Blueprint should remain suitable for a future normal deployment as well.

Do not permanently hard-wire the repository to demo-only behavior if it can be avoided.

---

# 10. Production environment variables

Create a final deployed-environment inventory.

Categorize variables as:

## Render/database

Examples:

```text
DATABASE_URL
DATABASE_SSL
PORT
NODE_ENV
```

## Application/auth

Examples:

```text
BETTER_AUTH_SECRET
BETTER_AUTH_URL
BETTER_AUTH_TRUSTED_ORIGINS
BETTER_AUTH_TRUSTED_PROXY_HEADERS
```

## Deployment mode

```text
DEPLOYMENT_MODE=demo
DEMO_BOOTSTRAP_PASSWORD
```

## Evidence storage

All required `EVIDENCE_S3_*` values.

## Optional

Any optional application-specific values actually used.

For every variable, indicate:

- whether Render supplies it;
- whether the user must set it;
- whether it is a secret;
- whether it is demo-only.

Do not copy secret values into docs.

---

# 11. First deployment verification

Observe the first deployment logs.

Confirm the expected lifecycle occurs in order:

```text
deployment mode: demo
environment validation
migrations
canonical demo bootstrap
application start
```

Exact log text may differ.

Verify there are no logged secrets.

Confirm:

- migrations complete;
- canonical demo bootstrap completes;
- Next.js starts;
- Render marks the service healthy;
- `/api/health` returns 200.

If startup fails, diagnose and fix the actual hosted blocker.

Avoid hiding configuration problems with temporary bypasses.

---

# 12. Canonical demo verification

After first deployment, sign in and verify the real hosted demo contains the full canonical 05A dataset.

At minimum confirm:

## Organization

- Canadian Goose Defence System
- Contoso Industries

## Flagship

- Strategic Goose Operations Platform (Demo)
- NIST Moderate assignment
- broad control implementation coverage
- named versions/snapshots
- collaboration content
- Evidence metadata
- ControlRecord/status/ownership variety

## Supporting projects

Confirm all expected Milestone 05A supporting projects exist, including:

- Border Goose Squadron CUI Enclave (Demo)
- Honkwater Visitor Network (Demo)
- Coconut Logistics Inventory System (Demo)
- National Honk Operations Centre High Baseline (Demo)
- Contoso Cloud Platform

## CMMC

Confirm:

- CMMC Level 2 framework is visible;
- the CMMC demo project uses it;
- partial implementation data appears;
- no unsupported CMMC OSCAL export is exposed as though it were valid.

---

# 13. Authentication verification

Test at least:

- sign in with a canonical demo user;
- wrong-password rejection;
- session persistence;
- logout;
- sign back in;
- organization/project access appropriate to that user.

If multiple demo roles exist, test at least one second user where useful.

Do not weaken authentication merely to make the public demo easier to access.

---

# 14. Evidence upload verification

Perform a real Evidence upload through the hosted application.

Verify:

1. file upload succeeds;
2. metadata record is created;
3. object reaches the configured S3-compatible bucket;
4. user can retrieve/download/view it through the supported application path;
5. authorization remains enforced;
6. redeploy does not lose the object or its database metadata.

Use a harmless small test file.

Clean up the test record/object afterward if appropriate, unless keeping it improves the canonical demo.

---

# 15. OSCAL export verification

For the NIST/FedRAMP flagship, perform the supported OSCAL SSP export in the hosted environment.

Confirm:

- export succeeds;
- output remains valid according to the application's current validation path;
- download works through the deployed application;
- no localhost assumptions exist.

Do not attempt to add CMMC OSCAL export.

---

# 16. Redeployment verification

Trigger a normal redeploy of the same service without resetting the database.

Before redeploy, make one harmless visible edit to a canonical demo record.

After redeploy, confirm:

- migration/startup succeeds;
- service becomes healthy;
- canonical project counts do not unexpectedly increase;
- no duplicate demo users/orgs/projects appear;
- the harmless user edit remains;
- uploaded Evidence remains available;
- authentication still works.

This is a critical acceptance test.

A demo deployment must behave as persistent seeded data, not as reset-on-start data.

---

# 17. Invalid configuration verification

Where practical without damaging the live environment, verify fail-closed behavior for at least one deployment-critical configuration issue.

Prefer doing this safely using a temporary preview/test service or equivalent rather than breaking the primary demo.

Examples:

- invalid `DEPLOYMENT_MODE`;
- missing `DEMO_BOOTSTRAP_PASSWORD`;
- missing required S3 configuration.

Confirm startup fails with a clear non-secret error.

Restore configuration afterward.

Do not intentionally destabilize the primary service if Render lacks a safe preview mechanism.

---

# 18. Single-instance constraint

Milestone 05B documented a first-boot concurrency risk around project-name uniqueness.

Keep the demo web service at **one instance** for this milestone.

Document this explicitly.

Do not attempt horizontal scaling yet.

If Render performs overlapping deploy replacement internally, observe whether the current lifecycle remains safe.

Only make application changes if a real conflict is observed.

---

# 19. Email gap

Production email remains a known gap from 05B.

Do not expand this milestone into a full email-provider integration unless lack of email blocks required demo functionality.

Document what invitation/reset/email-related features do not work in the hosted demo.

If a minimal configuration already exists and can be safely enabled without substantial scope, document it separately rather than hiding the gap.

---

# 20. Security checks

Perform a focused hosted-deployment security review.

At minimum verify:

- HTTPS enforced by Render;
- auth cookies are Secure;
- no secrets appear in HTML/client bundles;
- no `.env` files are exposed;
- no database port is exposed by the web service;
- S3 bucket is not broadly public;
- health endpoint leaks no sensitive configuration;
- demo bootstrap password is not logged;
- production stack traces do not expose secrets;
- no legacy `SEED_DEMO_PROJECT` path is active;
- admin/bootstrap endpoints or scripts are not exposed as unauthenticated HTTP functionality.

Do not turn this into a full penetration test.

---

# 21. Render logs and operational notes

Document how to inspect:

- deploy logs;
- application logs;
- health status;
- PostgreSQL status;
- environment variables;
- manual redeploy;
- rollback to previous deploy.

Do not include secret values.

---

# 22. Deployment documentation

Update:

```text
docs/deploy-render.md
```

and, where appropriate:

```text
docs/deployment.md
```

with the actual deployed architecture and verified steps.

The documentation should distinguish:

## Seeded demo deployment

```text
DEPLOYMENT_MODE=demo
```

## Normal deployment

```text
DEPLOYMENT_MODE=normal
```

Even though 05C deploys the demo, document how the same Blueprint/service configuration can later be used for a normal install.

Include:

- required Render resources;
- environment-variable categories;
- first deployment;
- health check;
- demo bootstrap;
- evidence storage;
- redeploy behavior;
- known limitations;
- single-instance requirement.

Do not include actual secrets.

---

# 23. Render-specific code changes

Keep application changes minimal.

Acceptable changes include:

- correcting `render.yaml`;
- fixing production URL handling exposed by the real deployment;
- fixing Docker/runtime dependency omissions;
- correcting SSL configuration;
- correcting S3 endpoint behavior;
- correcting health/readiness behavior;
- fixing startup assumptions that fail on Render.

Do not perform unrelated refactors.

Every application/code change made during 05C should correspond to an observed or clearly necessary hosted-deployment requirement.

---

# 24. Verification suite after any changes

If repository files change during 05C, rerun:

```bash
npm run lint
npm test
npm run build
npx tsc --noEmit
```

Continue to distinguish known pre-existing typecheck failures from new failures.

Also rerun:

```bash
npm run verify:deployment
```

if changes touch deployment lifecycle behavior.

Do not claim clean typecheck if the known historical errors remain.

---

# 25. Acceptance criteria

Milestone 05C is complete only when all of the following are true:

- Render web service exists and is healthy;
- Render PostgreSQL is connected;
- production startup runs in `DEPLOYMENT_MODE=demo`;
- first startup creates the full canonical demo;
- canonical demo user can log in;
- flagship and supporting projects are visible;
- CMMC demo is visible;
- `/api/health` returns 200;
- real Evidence upload works using S3-compatible storage;
- NIST/FedRAMP OSCAL export works;
- redeploy preserves edits and does not duplicate canonical seed data;
- uploaded Evidence survives redeploy;
- no production secrets are committed;
- deployment documentation reflects reality.

---

# 26. Scope boundaries

Do not:

- create a separate production codebase;
- create a demo-only branch;
- create separate demo/normal Docker images;
- automatically reset the demo database;
- implement horizontal scaling;
- implement distributed locking unless a real blocker appears;
- implement CMMC OSCAL export;
- add unrelated GRC features;
- redesign the demo dataset;
- redesign the UI;
- perform a broad penetration test;
- add an email provider unless required to unblock the deployment;
- commit or push changes unless explicitly instructed.

---

# 27. Deliverables

When complete, return:

1. Executive summary.
2. Final Render architecture.
3. Render service/database/storage resources created.
4. Final deployed hostname.
5. Production startup lifecycle observed.
6. Environment-variable inventory by category.
7. Better Auth configuration used.
8. Evidence/S3 configuration and verification.
9. Health-check result.
10. Canonical demo verification results.
11. Authentication verification results.
12. OSCAL export verification result.
13. Redeployment/idempotency/edit-preservation result.
14. Security checks performed and findings.
15. Render-specific code/config changes made.
16. Files changed.
17. Local verification results after changes.
18. Known limitations.
19. Any remaining work before declaring the hosted demo stable.
20. Recommendation for the next milestone.

Do not commit or push unless explicitly instructed.

---

# Target end state

A real hosted Control Freak demo is running on Render using the same production build and lifecycle intended for normal installations.

The deployment uses:

```text
DEPLOYMENT_MODE=demo
```

and automatically ensures the full canonical Milestone 05A demo without resetting it on redeploy.

The application is healthy, authentication works, PostgreSQL persists data, Evidence storage works through S3-compatible storage, OSCAL export works for the supported NIST/FedRAMP project, and a redeploy preserves user edits and uploaded Evidence.

The resulting Render configuration and documentation should also make a future:

```text
DEPLOYMENT_MODE=normal
```

deployment straightforward.

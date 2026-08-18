# Milestone 05A — Consolidate and Modernize the Control Freak Demo Dataset

## Objective

Create one coherent, canonical Control Freak demo dataset that represents the current product well and is safe to use later in a seeded deployment.

This milestone is about **demo data and demo seeding only**.

Do **not** implement Render deployment yet.

## Context

A read-only audit of the current repository established that:

- The historical flagship Goose demo was never lost.
- The canonical organization is **Canadian Goose Defence System**.
- The canonical flagship system/project is **Strategic Goose Operations Platform (Demo)**.
- “Avian” was informal shorthand and was not a historical repository name.
- There are currently two separate Goose-themed demo/bootstrap mechanisms with overlapping but different content:
  - the standalone `db:seed:demo` path;
  - the `bootstrap:demo` path.
- One contains richer baseline/control population.
- The other contains useful collaboration/persona/demo content.
- Neither currently represents the complete desired demo environment.
- CMMC Level 2 support now exists in the application, based on NIST SP 800-171 Rev. 2 with 110 requirements.
- No existing demo project currently exercises CMMC.
- Findings/risks/tasks are not current domain concepts and must not be invented for the demo.
- OSCAL export is intentionally NIST-specific; do not create fake CMMC export functionality.
- `scripts/seed-demo.ts` currently lacks the production/locality safety guard present in `bootstrap-demo.ts`.

## 1. Preserve the flagship demo

The existing canonical flagship must remain:

- Organization: **Canadian Goose Defence System**
- Project/system: **Strategic Goose Operations Platform (Demo)**

Do not replace this with a generic fictional organization or newly invented flagship scenario.

Preserve existing authored content wherever practical, including:

- names;
- personas;
- descriptions;
- project/system narrative;
- control implementation statements;
- stable identifiers;
- evidence;
- framework assignments;
- collaboration data;
- version/snapshot data if present.

The goal is to **consolidate and enrich**, not rewrite from scratch.

## 2. Reconcile the two existing demo mechanisms

Inspect the current implementation of:

- `bootstrap:demo`
- `db:seed:demo`
- their underlying scripts/modules
- related tests

Determine exactly which valuable records each currently creates.

Then establish a single authoritative demo-data implementation.

Avoid maintaining two independent definitions of the same Goose environment.

It is acceptable for:

```text
bootstrap:demo
```

to orchestrate several lower-level operations, but canonical data definitions should not be duplicated.

Prefer a structure such as:

```text
bootstrap demo
    |
    +-- ensure demo users
    +-- ensure demo organization
    +-- ensure framework/catalog prerequisites
    +-- seed canonical demo projects
```

using shared seed modules where appropriate.

Do not introduce unnecessary abstraction merely for architectural purity.

## 3. Flagship completeness

The Strategic Goose Operations Platform should become the **showcase project**.

Within capabilities that actually exist today, make it demonstrate as much of Control Freak as reasonably possible.

Preserve the existing broad NIST/FedRAMP control population.

Where supported, ensure it includes representative:

- project/system metadata;
- NIST/FedRAMP framework assignment;
- implementation statements;
- implementation statuses;
- responsible parties/owners;
- evidence records;
- control/evidence associations;
- comments/collaboration data;
- project members/personas;
- snapshots/versions;
- dashboards/metrics-driving data;
- OSCAL-compatible project metadata;
- any other currently implemented mature project capabilities.

Do not artificially populate concepts that the application does not support.

The flagship does not need literally every record populated identically.

It should contain enough variation to look credible while still being clearly the most mature project in the demo.

## 4. Supporting demo projects

Create a small set of additional projects designed to demonstrate different maturity levels.

Prefer approximately **4 supporting projects**, rather than many shallow projects.

Use the actual domain capabilities currently available.

### A. CMMC Level 2 project

Create a project specifically demonstrating the new CMMC Level 2 capability.

It should:

- be assigned to the supported CMMC Level 2 / NIST SP 800-171 Rev. 2 framework;
- contain partial implementation progress;
- demonstrate multiple statuses;
- include some evidence where supported;
- intentionally leave meaningful work incomplete.

Do not attempt OSCAL export for this project if the product intentionally supports OSCAL export only for NIST/FedRAMP.

### B. Early-stage project

Create a project that has recently begun its compliance journey.

It should have:

- valid project metadata;
- framework assignment;
- relatively little completed control work;
- many controls still unaddressed.

This gives dashboards and project lists meaningful contrast with the flagship.

### C. Evidence-gap project

Create a more mature project where:

- many controls have implementation statements/statuses;
- evidence coverage is intentionally weaker.

Use this to demonstrate the difference between documenting implementation and substantiating it.

### D. Additional representative project

Based on the application's actual current multi-framework capabilities, create one additional project that demonstrates a meaningful scenario not already covered.

This may be:

- another framework;
- a different baseline/profile;
- a multi-framework scenario;
- another maturity pattern.

Choose this based on current code, not assumptions.

## 5. Organizations

Do not create unnecessary organizations merely to increase record count.

Review the organizations currently created by the two demo mechanisms.

Preserve existing organizations where they are intentional and useful.

If older bootstrap organizations such as Acme/Contoso exist only as generic scaffolding and no longer provide meaningful demo value, assess whether they should:

- remain;
- be repurposed with coherent projects;
- or be removed from the canonical demo.

Do not remove historical demo organizations casually.

Document your decision.

## 6. Demo users and personas

Preserve useful existing Goose personas/collaboration data.

Demo users should help show:

- project membership;
- ownership;
- responsible-party assignment;
- comments/collaboration if supported;
- different roles where the application supports them.

Avoid creating dozens of meaningless accounts.

Credentials must not be hard-coded into production source.

Use environment-driven credentials/bootstrap behavior as appropriate.

## 7. Deterministic data

Demo data must be deterministic.

Do not use random values for canonical records unless they are generated from a fixed seed and randomness genuinely improves the dataset.

Stable values are preferable for:

- UUIDs/identifiers where feasible;
- organization/project slugs;
- email addresses;
- evidence names;
- control assignments;
- version names;
- timestamps where their exact value matters for assertions.

The deployed demo should look the same after a clean rebuild.

## 8. Idempotency

The entire canonical demo seed must be safe to execute repeatedly.

Running the demo bootstrap twice must not create duplicates.

Verify at minimum:

- organizations;
- users;
- memberships;
- projects;
- framework assignments;
- controls;
- implementation records;
- evidence;
- evidence associations;
- comments/collaboration data;
- versions/snapshots.

Routine execution must not delete user changes or reset the database.

Destructive reset behavior, if retained for development, must remain an explicit separate command.

## 9. Safety guard

Address the audit finding that `scripts/seed-demo.ts` lacks the environment/locality safety protection used by `bootstrap-demo.ts`.

Ensure that destructive or development-oriented seed/reset operations cannot accidentally run against a production database.

A future deployed demo must be intentionally seedable, so distinguish between:

- safe idempotent demo initialization;
- destructive local demo reset/rebuild.

Do not simply prohibit demo seeding in production, because the next milestone will intentionally deploy a seeded demo environment.

Instead make the distinction explicit and safe.

## 10. Seed API

At the end of this milestone there should be one obvious canonical command for creating/ensuring the demo environment.

Prefer something like:

```bash
npm run bootstrap:demo
```

if that fits the current architecture.

A developer should not need to know that several separate seed scripts must be run in a particular undocumented order.

If lower-level commands remain useful, retain them, but document the canonical entry point.

## 11. Normal application isolation

Demo code/data must remain opt-in.

Normal application bootstrap must not create demo projects.

This milestone should prepare for a later deployment model such as:

```text
DEPLOYMENT_MODE=normal
```

versus:

```text
DEPLOYMENT_MODE=demo
```

but do not implement the Render deployment lifecycle in this milestone unless a tiny supporting change is necessary for the demo architecture.

## 12. Tests

Add or update tests that validate the canonical demo.

At minimum verify:

- canonical Goose organization exists;
- Strategic Goose Operations Platform exists;
- flagship has expected broad framework/control coverage;
- expected supporting projects exist;
- CMMC demo project has CMMC Level 2 assigned;
- supporting projects intentionally have different maturity/completeness;
- seed is idempotent;
- a second run does not increase canonical entity counts unexpectedly;
- demo bootstrap does not destroy existing data.

Prefer assertions against stable invariants rather than brittle exact counts where exact counts are not semantically important.

Where exact counts are important — such as CMMC Level 2's 110 requirements — use them.

## 13. Documentation

Document the demo dataset.

Create/update an appropriate document such as:

```text
docs/demo-data.md
```

Include:

- canonical organization(s);
- flagship project;
- supporting projects;
- purpose of each;
- framework assignment;
- intended maturity;
- personas/users;
- canonical seed command;
- reset command if one exists;
- safety behavior;
- idempotency expectations.

This document should make it easy for someone demonstrating Control Freak to understand why each sample project exists.

## 14. Verification

Run the repository's normal verification suite.

At minimum, where available:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Then verify demo behavior from a clean database.

### Test A — clean demo bootstrap

From an empty PostgreSQL database:

```bash
npm run bootstrap:demo
```

Confirm the expected organizations/projects/users/data are created.

### Test B — second bootstrap

Run:

```bash
npm run bootstrap:demo
```

again.

Confirm:

- no duplicate canonical records;
- no unexpected count growth;
- no errors.

### Test C — preserve modification

Make a harmless modification to an existing demo record that represents something a user could edit.

Run the safe demo bootstrap again.

Confirm routine bootstrap does not indiscriminately reset user-edited data.

If canonical fields intentionally need reconciliation, document exactly which fields are authoritative.

## 15. Scope boundaries

Do not:

- implement Render deployment yet;
- redesign the UI;
- add findings/risks/tasks;
- implement CMMC OSCAL export;
- invent unsupported product features;
- rewrite the Goose scenario;
- create excessive fake data;
- introduce separate demo/production branches.

## 16. Deliverables

Return:

1. Executive summary.
2. Description of the two previous demo mechanisms.
3. Consolidation approach chosen.
4. Canonical organizations.
5. Canonical flagship project and preserved content.
6. Supporting projects created.
7. CMMC demo content.
8. Demo users/personas.
9. Seed/idempotency design.
10. Safety changes.
11. Files changed.
12. Tests added/updated.
13. Verification results.
14. Any data intentionally removed or deprecated and why.
15. Remaining issues before normal/demo deployment work.

Do not commit or push unless explicitly instructed.

The target end state is:

> **One coherent Control Freak demo environment, generated by one canonical safe/idempotent bootstrap path, containing one highly complete flagship Goose project plus several intentionally less-complete projects that demonstrate the range of the current product.**

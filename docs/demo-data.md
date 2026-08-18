# Demo dataset

Canonical Control Freak sample environment used for local development and
seeded demo deployments (`DEPLOYMENT_MODE=demo`).

This document describes **what is seeded and why**. Application behavior
belongs in `docs/current-state.md` and `docs/architecture.md`.

## Canonical command

```bash
npm run bootstrap:demo
```

That is the only command a developer needs for a complete **local** demo
environment. It is idempotent: safe to run repeatedly. It never truncates
the database and does not reset user-edited records.

A hosted demo uses `DEPLOYMENT_MODE=demo` with `npm start` instead. See
`docs/deployment.md`. Both paths share `src/seed/canonical-demo.ts`.

Normal application startup (`DEPLOYMENT_MODE=normal`, the default) does
**not** create demo projects.

## Lower-level commands

| Command | Purpose |
| --- | --- |
| `npm run bootstrap:demo` | Canonical full environment: env, migrate, users, orgs, projects, collaboration, evidence |
| `npm run db:seed:demo` | Flagship project only, into `SEED_DEMO_ORG_SLUG` |
| `npm run db:seed:demo -- --reset` | **Destructive** rebuild of the flagship project only (local development) |
| `npm run bootstrap:admin` | Minimal single-admin org, no demo projects |
| `docker compose down -v` | Wipe the local Compose volume (full database rebuild) |

`--reset` is not part of routine bootstrap and must never run in production
or when `DEPLOYMENT_MODE=demo`.

## Organizations

| Organization | Slug | Purpose |
| --- | --- | --- |
| **Canadian Goose Defence System** | `canadian-goose-defence-system` | Canonical demo tenant. Hosts the Goose flagship and supporting CGDS projects. |
| **Contoso Industries** | `contoso-industries` | Second tenant for isolation. Not a CGDS system. |

Acme Corporation (`acme-corporation`) was generic bootstrap scaffolding that
hosted a misnamed Goose project. It is **no longer created**. Routine
bootstrap does not delete an existing Acme org if one is already in a local
database.

## Flagship project

**Strategic Goose Operations Platform (Demo)**

- Organization: Canadian Goose Defence System
- Framework: NIST SP 800-53 Rev. 5 Moderate
- Maturity: highly complete showcase
- Includes: full Moderate baseline implementation narratives, named versions,
  ControlRecord metadata, threaded discussions, assignments, notifications,
  and strong (not total) Evidence Coverage

Preserved world-building (personas, locations, coconut custody, Honk
Protocol, Gary's Annual Performance Review, and so on) lives in
`src/seed/demo/world.ts` and `src/seed/demo/controls/`.

## Supporting projects

| Project | Framework | Intended maturity | Why it exists |
| --- | --- | --- | --- |
| **Border Goose Squadron CUI Enclave (Demo)** | CMMC Level 2 / NIST SP 800-171 Rev. 2 (110 requirements) | Partial: mixed statuses, many requirements unaddressed, some Evidence | Exercises the CMMC catalog without implying assessment, MET / NOT MET, SPRS, or OSCAL export |
| **Honkwater Visitor Network (Demo)** | NIST SP 800-53 Rev. 5 Low | Early-stage: metadata plus a handful of controls | Contrast with the flagship on dashboards and project lists |
| **Coconut Logistics Inventory System (Demo)** | NIST SP 800-53 Rev. 5 Moderate | Many implementation statements, weak Evidence | Shows documenting a control vs substantiating it |
| **National Honk Operations Centre High Baseline (Demo)** | NIST SP 800-53 Rev. 5 High | Mid-maturity High overlay | Different baseline/profile from the Moderate flagship |
| **Contoso Cloud Platform** | NIST SP 800-53 Rev. 5 Moderate | Thin, other tenant | Organization isolation |

There is no multi-framework project: a Project has exactly one `frameworkId`
(ADR-026). CMMC projects do not export OSCAL.

## Personas and users

Login accounts demonstrate RBAC. Goose operational personas (Gary Mercer,
Priya Sharma, and others) appear in narratives, Evidence owners, and
ControlRecord owner labels; they are not separate login accounts.

| Email | Role | Organization |
| --- | --- | --- |
| alice@example.com | Organization admin | Canadian Goose Defence System |
| bob@example.com | Project manager | Canadian Goose Defence System |
| carol@example.com | Author | Canadian Goose Defence System |
| dave@example.com | Reviewer | Canadian Goose Defence System |
| victor@example.com | Viewer | Canadian Goose Defence System |
| olivia@example.com | Author | Canadian Goose Defence System |
| oscar@example.com | Organization admin | Contoso Industries |
| rachel@example.com | Reviewer | Contoso Industries |

Local default password: `ControlFreakDemo123!`.

Override with `DEMO_BOOTSTRAP_PASSWORD`. A demo deployment must set that
variable; the default is for local development only and is not a production
credential.

## Idempotency and preservation

Routine bootstrap **creates missing** canonical records and **leaves
existing ones alone**.

Identity keys:

- organizations: slug
- users: email
- projects: name within the organization
- comments: `<!-- demo-seed:… -->` marker in the body
- evidence: `<!-- demo-seed:… -->` marker in the description
- assignments: existing owner/reviewer row on that control
- ControlRecords: existing `(projectId, controlId)` row

Authoritative on first create only (not reconciled on later runs):

- project metadata and implementations
- Evidence title, status, dates, and links
- ControlRecord owner/status fields
- assignment assignees
- comment bodies
- membership roles

A harmless user edit (for example changing an implementation narrative) is
kept after `npm run bootstrap:demo`.

## Safety

| Path | Allowed when |
| --- | --- |
| `bootstrap:demo` | Local development only (writes `.env.local`; refuses production / remote databases) |
| Production `DEPLOYMENT_MODE=demo` | Hosted startup via `npm start`; requires `DEMO_BOOTSTRAP_PASSWORD`; does not write `.env.local` or assume localhost |
| Idempotent `db:seed:demo` | Local databases, **or** `DEPLOYMENT_MODE=demo` |
| `db:seed:demo -- --reset` | Local development only; refused in production and when `DEPLOYMENT_MODE=demo` |

`SEED_DEMO_PROJECT` is not a production startup switch. Combined with
`DEPLOYMENT_MODE=normal` it fails closed. See `docs/deployment.md`.

## What is not in the demo

- Findings, risks, tasks (not in the domain model)
- CMMC OSCAL export
- Fake assessment results, SPRS scores, or certification status
- Shared production credentials
- Automatic seeding on normal application bootstrap

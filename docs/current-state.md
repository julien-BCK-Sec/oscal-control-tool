# Current Project State

Date: 2026-07-22

## Product direction

This is a local-first OSCAL authoring application, not a GRC platform.

Current stack:

- Next.js (App Router)
- TypeScript
- React
- Tailwind
- npm
- SQLite + Drizzle (`better-sqlite3`) for project persistence
- Browser localStorage only as a legacy import source

OSCAL is an export/interchange format, not the internal editing model.

## Architecture

1. Pinned NIST OSCAL profile + catalog (vendor)
2. `FrameworkProvider` → application-facing `Framework`
3. User implementation data (persisted per project)
4. Project metadata (persisted per project)
5. OSCAL-independent domain model (`assembleProject`)
6. `ProjectRepository` → SQLite (hybrid columns + validated JSON)
7. OSCAL exporter + AJV validation
8. Future FedRAMP rules evaluation

Keep these concerns separate. Framework content is never stored in the database.

## Current standards position

- OSCAL version: 1.2.2
- Current framework: NIST SP 800-53 Rev. 5 Moderate (full baseline via profile)
- Framework source of truth: pinned Moderate profile + SP 800-53 catalog
- Current product does not claim FedRAMP support
- FedRAMP Rules are a separate future policy layer
- Do not invent or substitute a FedRAMP OSCAL profile

## Pinned official artifacts

Under:

`vendor/oscal/v1.2.2/`

Use:

- `schema/oscal_ssp_schema.json`
- `schema/oscal_profile_schema.json`
- `schema/oscal_catalog_schema.json`
- `profiles/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json`
- `catalogs/NIST_SP-800-53_rev5_catalog.json`

Provenance and checksums are documented in:

`vendor/oscal/v1.2.2/SOURCES.md`

Do not fetch standards files at runtime and do not use moving branches.

## Completed work

- Static control browser
- Implementation editor
- Project metadata
- OSCAL-independent `Project` domain model
- OSCAL SSP exporter
- NIST Moderate labeling alignment
- Real `import-profile` reference
- AJV validation against the pinned OSCAL 1.2.2 SSP schema
- Download blocked when schema validation fails
- Positive and negative validation tests
- `FrameworkProvider` boundary
- Build-time derivation of the full NIST Moderate control set from the pinned profile + catalog
- Control Browser UX (Milestone 3.5)
- **Milestone 4:** SQLite-backed projects, Server Actions, debounced autosave, optimistic concurrency, in-session undo/redo, automatic snapshots, immutable named versions, localStorage one-time import
- **Demo seed:** Canonical CGDS / SGOP development project via `npm run db:seed:demo` (idempotent; `--reset` recreates)
- **UI polish + Overview (Milestones A/B):** shared visual tokens, redesigned project cards, Overview workspace dashboard, Controls authoring layout improvements, centralized completion calculation, on-demand OSCAL validation summary
- **ControlRecord metadata:** application-level ownership / **implementation status**
  / **review status** table separate from OSCAL and `project_json`; Control
  Metadata editor section; Review section with action buttons (no raw
  reviewStatus dropdown); list badges for both implementation and review status
- **ControlActivity stream:** append-only operational history for ControlRecord
  field changes (including `implementation_status_changed`) and review workflow
  transitions; read-only History panel in the control editor; actor resolution
  helper for future Cloudflare Access / User identity
- **Review workflow:** centralized transitions in `src/data/control-review`;
  `transitionReviewStatus` Server Action with `expectedCurrentStatus` concurrency;
  approval is a state + activity, not an Approval entity

## Demo seed project

- Module: `src/seed/demo/` with family-organized narratives under `src/seed/demo/controls/`
- CLI: `scripts/seed-demo.ts` → `npm run db:seed:demo` / `npm run db:seed:demo -- --reset`
- Seeds only through `ProjectRepository` into `DATABASE_PATH` (no committed SQLite data)
- Project name: `Strategic Goose Operations Platform (Demo)`
- Org / system: Canadian Goose Defence System (CGDS) / Strategic Goose Operations Platform (SGOP)
- **Complete Moderate baseline coverage:** every control from `FrameworkProvider` / `FRAMEWORK_CONTROLS` receives exactly one implementation; the count is derived from the pinned framework data and is not hardcoded
- Featured (~20) high-quality narratives are preserved in `controls/featured.ts`; remaining controls are curated by family modules
- Domain model remains lean: org fiction stays in `ProjectMetadata.systemDescription` and implementation narratives
- Recurring cast includes Gary Mercer (system owner; veterinary clearance appears only in the final named version), Priya Sharma (ISSO), Sam Okonkwo (coconut custody), Nadia Fortin (deployment authority), and Steve Kowalski (“See Steve” runbooks)
- Named versions: Initial Authorization Package → Management Review → Goose Readiness Exercise 2026 → Emergency Coconut Reconciliation → Gary's Annual Performance Review
- Idempotent without `--reset`; `--reset` deletes the demo project and snapshots then recreates the canonical document
- Final seed exports SSP and validates against pinned OSCAL 1.2.2 schema
- Demo remains intentionally satirical while remaining technically representative of Moderate SSP authoring

## Persistence (Milestone 4)

- Interface: `ProjectRepository` in `src/persistence/`
- Implementation: Drizzle + `better-sqlite3` under `src/persistence/sqlite/`
- Server entry: `src/persistence/server.ts` (`server-only`) + `src/app/actions/projects.ts`
- Database path: `DATABASE_PATH` (default `./data/oscal-control-tool.sqlite` in
  development/test; **required** in production — no repository-local fallback)
- Setup: `npm run db:migrate` (also `predev`); production `npm start` migrates
  before serving
- Routes: `/projects` (list/create), `/projects/[id]` (workspace with Overview / Controls / Project details / Version history)
- Health: `GET /api/health` → `{"status":"ok"}` (lightweight DB probe; no secrets)
- Optional view query: `?view=controls|details|history` (Overview is default when omitted)
- Theme: light-only (`color-scheme: light`; shared CSS tokens; page background is not flipped by prefers-color-scheme)
- Stored document: schema version 1 JSON envelope (metadata + implementations + framework id). No framework statements.
- Autosave: ~1.5s debounce; statuses Unsaved / Saving / Saved / Save failed / Conflict
- Snapshots: `project_snapshots` table (`automatic` | `named` | `pre-restore`)
- ControlRecords: `control_records` table (`project_id` + `control_id` unique);
  lazy create on first metadata edit or first review transition; not stored in
  OSCAL or `project_json`; column `implementation_status` holds implementation
  maturity; column `review_status` holds review workflow (default
  `not_reviewed`); metadata autosave never writes `review_status`
- ControlActivity: append-only `control_activities` stream keyed by
  `control_record_id`; written in the same transaction as metadata upserts and
  review transitions; independent lifecycle from named `project_json` versions
- Auth: not implemented — assumes trusted local / single-user deployment with a durable filesystem and one Node instance

## Render / Docker deployment

- Guide: `docs/deploy-render.md`
- Blueprint: `render.yaml` (Docker web service, disk at `/var/data`, paid plan)
- Production DB: `/var/data/oscal-author.db` via `DATABASE_PATH`
- Startup: migrate → optional idempotent `SEED_DEMO_PROJECT` seed → `next start -H 0.0.0.0 -p $PORT`
- Demo seed on deploy never uses `--reset`
- Single instance only (SQLite on attached disk)
- Dockerfile is multi-stage; Next.js standalone output is **not** used (preserves migrate/seed + on-disk schema)
## Workspace UI (Milestones A/B)

- Shared visual foundation in `src/app/globals.css` (surfaces, text, accent, status, focus, buttons, fields)
- Workspace tabs: **Overview** (default) → Controls → Project details → Version history
- Overview dashboard: identity, overall completion, family progress, domain validation summary, continue-authoring links, recent versions, compact details summary
- Completion: centralized in `src/domain/completion.ts` — a control is complete when its implementation narrative is non-empty after trim; totals come from `FrameworkProvider` (never hardcoded)
- Family progress: `computeFamilyCompletion` in framework order; Overview family rows navigate into Controls with that family expanded
- Validation summary: live domain checks (baseline coverage, missing/duplicate/unknown IDs, domain validity); **OSCAL SSP schema validation runs only on demand** (“Run OSCAL validation” / “Refresh validation”) and is not claimed until actually run; result is session-only (not persisted)
- Controls view: denser navigation with overall + per-family progress, expand/collapse all, accessible complete/incomplete indicators, quieter requirement pane with distinct parameter tokens, primary implementation editor
- Projects list: professional cards with derived completion, revision, updated time; compact New project action; empty state; restyled browser-import callout
- Project cards load completion by reading each project document on the list page (local-first; fine for small project counts)

## Framework derivation (Milestone 3)

- Interface: `FrameworkProvider.getFramework(): Framework`
- Implementation: `nistModerateFrameworkProvider` in `src/data/framework/`
- Derivation logic: `src/framework/nist-moderate/derive.ts`
- Generated app data: `src/data/framework/generated/nist-sp-800-53-rev5-moderate.json`
- Regenerate with `npm run derive:framework` (also runs on `pretest` / `prebuild`)
- UI and domain consume `Framework` / `FrameworkControl` only — not raw OSCAL

## Current exporter behavior

- `metadata.oscal-version` is 1.2.2
- SSP imports the pinned NIST Moderate profile through a back-matter resource
- `system-owner` role is defined
- Export is currently a single SSP JSON file
- Future target is a portable package with SSP, profile, catalog, and provenance

## Known placeholders and gaps

These are domain gaps, not trustworthy system facts:

- Information type: `Unspecified`
- System status: `under-development`
- Authorization-boundary fallback text
- System name/description fallback
- Random UUIDs regenerated on export

Other gaps:

- No semantic cross-reference validation yet
- No stable OSCAL UUID persistence
- No FedRAMP policy evaluation
- No portable OSCAL package
- No OSCAL import (SSP → project)
- No authentication / multi-user access control
- Snapshot merge UX deferred (reload-latest on conflict)
- Ephemeral serverless deployment is not supported by local SQLite
- Render Docker + persistent disk is the supported remote deployment path (single instance)
- No dark theme (light theme forced for contrast)
- Overview OSCAL validation result is not persisted across reloads
- Projects list completion requires loading each project document (acceptable locally; not optimized for large fleets)
- No rich-text / Markdown / AI assist / collaboration features
- ControlRecord comments / evidence / notifications / RBAC not implemented yet
  (review workflow is a state machine + activity stream; no Approval entity)
- Named version restore does not roll back ControlRecord metadata (including
  reviewStatus) or ControlActivity (by design — operational metadata has an
  independent lifecycle)

## Operational metadata vs named versions

`project_json` snapshots (automatic / named / pre-restore) capture document
content only (metadata + implementations). Restoring a named version rewrites
`project_json` and bumps project revision; it does **not** delete or roll back:

- ControlRecord ownership / implementationStatus / reviewStatus
- ControlActivity history (including review workflow events)
- future comments, evidence, or Approval rows keyed to ControlRecord

Review workflow is operational state and is not rolled back with named document
versions.

## Next approved milestone

Milestone 5 — Word/PDF export (see `docs/roadmap.md`).

## Required verification for each milestone

Run:

- `npm test`
- `npm run lint`
- `npm run build`

Do not commit until the user reviews the summary.

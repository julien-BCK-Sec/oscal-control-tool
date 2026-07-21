# Current Project State

Date: 2026-07-21

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
- Database path: `DATABASE_PATH` (default `./data/oscal-control-tool.sqlite`)
- Setup: `npm run db:migrate` (also `predev`)
- Routes: `/projects` (list/create), `/projects/[id]` (editor)
- Stored document: schema version 1 JSON envelope (metadata + implementations + framework id). No framework statements.
- Autosave: ~1.5s debounce; statuses Unsaved / Saving / Saved / Save failed / Conflict
- Snapshots: `project_snapshots` table (`automatic` | `named` | `pre-restore`)
- Auth: not implemented — assumes trusted local / single-user deployment with a durable filesystem and one Node instance

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

## Next approved milestone

Milestone 5 — Word/PDF export (see `docs/roadmap.md`).

## Required verification for each milestone

Run:

- `npm test`
- `npm run lint`
- `npm run build`

Do not commit until the user reviews the summary.

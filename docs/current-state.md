# Current Project State

Date: 2026-07-21

## Product direction

This is a local-first OSCAL authoring application, not a GRC platform.

Current stack:

- Next.js
- TypeScript
- React
- Tailwind
- npm
- localStorage

OSCAL is an export/interchange format, not the internal editing model.

## Architecture

1. Pinned NIST OSCAL profile + catalog (vendor)
2. `FrameworkProvider` → application-facing `Framework`
3. User implementation data
4. Project metadata
5. OSCAL-independent domain model
6. OSCAL exporter
7. OSCAL validation
8. Future FedRAMP rules evaluation

Keep these concerns separate.

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
- localStorage persistence
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

## Framework derivation (Milestone 3)

- Interface: `FrameworkProvider.getFramework(): Framework`
- Implementation: `nistModerateFrameworkProvider` in `src/data/framework/`
- Derivation logic: `src/framework/nist-moderate/derive.ts`
- Generated app data: `src/data/framework/generated/nist-sp-800-53-rev5-moderate.json`
- Regenerate with `npm run derive:framework` (also runs on `pretest` / `prebuild`)
- UI and domain consume `Framework` / `FrameworkControl` only — not raw OSCAL
- Statement text is a normalized plain-string flattening of catalog `statement` parts (parameter insert tokens preserved; guidance/discussion excluded)
- Implementations remain keyed by control ID; existing localStorage entries for prior MVP IDs (e.g. `ac-1`) continue to apply — no migration required

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
- No stable UUID persistence
- No FedRAMP policy evaluation
- No portable OSCAL package
- No OSCAL import (SSP → project)
- Profile resolver supports only features used by the pinned Moderate profile

## Next approved milestone

Milestone 4 — Word/PDF export (see `docs/roadmap.md`).

## Required verification for each milestone

Run:

- `npm test`
- `npm run lint`
- `npm run build`

Do not commit until the user reviews the summary.

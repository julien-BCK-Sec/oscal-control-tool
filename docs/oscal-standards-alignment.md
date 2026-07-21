# OSCAL and FedRAMP Standards Alignment

Date: 2026-07-21  
Status: Active design guidance (labeling and exporter profile reference aligned).

## Official sources used

| Concern | Source |
| --- | --- |
| OSCAL model / schemas | [usnistgov/OSCAL](https://github.com/usnistgov/OSCAL) release [`v1.2.2`](https://github.com/usnistgov/OSCAL/releases/tag/v1.2.2) |
| OSCAL model reference | [OSCAL Reference v1.2.2](https://pages.nist.gov/OSCAL-Reference/models/v1.2.2/) |
| SP 800-53 Rev. 5 catalog and baselines | [usnistgov/oscal-content](https://github.com/usnistgov/oscal-content) `nist.gov/SP800-53/rev5/` |
| FedRAMP Consolidated Rules (policy, not OSCAL) | [FedRAMP/rules](https://github.com/FedRAMP/rules) — future evaluation only |
| Archived FedRAMP OSCAL automation | [GSA/fedramp-automation](https://github.com/GSA/fedramp-automation) — not located/approved as a project input |

## What each artifact is

| Artifact | Role |
| --- | --- |
| **OSCAL JSON Schema** (SSP / profile / catalog) | Validates **document structure** for a given OSCAL model version |
| **OSCAL catalog** | Authoritative control definitions (e.g. NIST SP 800-53 Rev. 5) |
| **OSCAL profile** | Selection/tailoring of controls from a catalog (e.g. NIST Moderate baseline) |
| **OSCAL SSP** | System-specific implementation of a selected profile |
| **FedRAMP Consolidated Rules** | Machine-readable FedRAMP **policy/rules** (FRD/FRR/KSI/CTL); not a catalog or profile |

An SSP’s `import-profile` must point at an **OSCAL profile**, not at FedRAMP Rules JSON.

### Validation layers (keep distinct)

| Layer | What it proves |
| --- | --- |
| NIST OSCAL JSON Schema (e.g. AJV later) | Structural shape of JSON against the schema |
| Semantic OSCAL checks (future) | UUID/role/control/profile link integrity beyond JSON Schema |
| FedRAMP policy evaluation (future) | Alignment with Consolidated Rules — not OSCAL structure |

AJV (when added) will validate JSON Schema structure only. It will **not** by itself prove:

- all UUID references resolve;
- all role IDs are defined;
- all control IDs belong to the imported profile;
- profile and catalog links resolve;
- the SSP is operationally complete;
- the document is FedRAMP-ready.

## Pinned files

Pinned under `vendor/oscal/v1.2.2/` (see `SOURCES.md` there):

```
vendor/oscal/v1.2.2/
  SOURCES.md
  schema/
    oscal_ssp_schema.json
    oscal_profile_schema.json
    oscal_catalog_schema.json
  catalogs/
    NIST_SP-800-53_rev5_catalog.json
  profiles/
    NIST_SP-800-53_rev5_MODERATE-baseline_profile.json
```

**Not pinned:** resolved profile catalogs, `-min` variants, any FedRAMP-labeled OSCAL baseline. Resolved profiles are derived convenience artifacts; the profile and catalog are the primary source artifacts used by this application.

## SSP `import-profile` (current export)

The exporter emits:

```json
"import-profile": {
  "href": "#<profile-resource-uuid>"
}
```

with a matching `back-matter.resources[]` entry titled as the NIST SP 800-53 Rev. 5 Moderate profile and an `rlink` to the commit-pinned upstream URI in `SOURCES.md`.

Do **not** import the catalog directly, FedRAMP Rules, a fabricated FedRAMP profile, a local `vendor/...` path, or a made-up public URI.

## Export packaging

### Current export

Single SSP JSON file. The SSP references a commit-pinned external NIST Moderate profile via back-matter `rlink`.

### Future target

```
Portable OSCAL package
├── SSP JSON
├── Moderate profile JSON
├── SP 800-53 catalog JSON
└── provenance or manifest information
```

ZIP packaging is not implemented yet.

## Repository structure

```
vendor/oscal/v1.2.2/          # pinned NIST OSCAL schemas + NIST content
src/data/framework/           # app-facing NIST Moderate MVP control subset
src/data/implementation/      # user implementation state
src/data/project/             # project metadata
src/domain/                   # assembled Project model (OSCAL-independent)
src/oscal/                    # SSP export adapters only
src/fedramp/                  # future: read-only rules evaluation (not present yet)
docs/                         # vision, architecture, this alignment note
```

## Application architecture

1. **Domain model** — `Project` (metadata + MVP framework subset + implementations); no OSCAL types.
2. **NIST profile/catalog** — pinned vendor content; authoritative baseline for `import-profile`.
3. **User implementation** — status/narrative keyed by control ID.
4. **OSCAL exporter** — pure `Project` → SSP JSON in `src/oscal/`.
5. **Validation (later)** — AJV against pinned SSP schema (structural only).
6. **FedRAMP policy evaluation (later)** — Consolidated Rules; never replaces catalog/profile.

```text
UI ──► domain Project ──► OSCAL exporter ──► SSP JSON ──► (later) AJV / NIST schema
                │
                └──────── MVP subset (labeled NIST Moderate)
                │
                └──────── import-profile ──► pinned NIST Moderate profile
                │
                └──────── (later) FedRAMP rules engine — parallel
```

## Current `FrameworkControl[]` meaning

Neither a full catalog nor a profile. It is a **small static NIST Moderate MVP subset** with placeholder statements. Authoritative baseline content remains the pinned NIST catalog + Moderate profile.

Do **not** treat FedRAMP Rules `CTL` or KSI `controls` arrays as the framework catalog.

## Validation plan

**Current:** AJV validates exported SSP JSON against the pinned
`vendor/oscal/v1.2.2/schema/oscal_ssp_schema.json` before download. Structural
only.

**Still deferred:** semantic/cross-document checks; FedRAMP Consolidated Rules
evaluation; UUID persistence.

### MVP placeholders retained for schema-required fields

| Field | Why retained |
| --- | --- |
| `system-information.information-types[]` | Schema requires ≥1; domain has no information types — emits explicit “Unspecified” placeholder |
| `system-characteristics.status` | Schema requires status; domain has no ops state — `under-development` + remarks |
| `authorization-boundary.description` | Schema requires description; uses system description or “has not been documented” |
| Empty / fallback system name & description strings | Required string fields when metadata is blank |

These placeholders are labeled as gaps, not invented operational facts.

## Gaps before FedRAMP support can be claimed

1. No official FedRAMP OSCAL profile has been located and approved as an input to this project.
2. FedRAMP Consolidated Rules not integrated as a separate evaluation layer.
3. MVP control set is a tiny subset with placeholder statements — not the full Moderate baseline.
4. Stable document/party/component UUIDs not persisted.
5. Many SSP-required operational facts still missing from the domain model.
6. Semantic OSCAL checks (UUID integrity beyond pattern, control-in-profile membership, profile/catalog package resolution) not implemented.

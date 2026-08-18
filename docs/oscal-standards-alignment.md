# OSCAL and FedRAMP Standards Alignment

Date: 2026-08-17  
Status: Active design guidance (NIST Rev. 5 Low / Moderate / High derivation complete; FedRAMP still not claimed).

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
| **OSCAL profile** | Selection/tailoring of controls from a catalog (e.g. NIST Low / Moderate / High baselines) |
| **OSCAL SSP** | System-specific implementation of a selected profile |
| **FedRAMP Consolidated Rules** | Machine-readable FedRAMP **policy/rules** (FRD/FRR/KSI/CTL); not a catalog or profile |

An SSP’s `import-profile` must point at an **OSCAL profile**, not at FedRAMP Rules JSON.

### Validation layers (keep distinct)

| Layer | What it proves |
| --- | --- |
| NIST OSCAL JSON Schema (AJV) | Structural shape of JSON against the schema |
| Semantic OSCAL checks (future) | UUID/role/control/profile link integrity beyond JSON Schema |
| FedRAMP policy evaluation (future) | Alignment with Consolidated Rules — not OSCAL structure |

AJV validates JSON Schema structure only. It will **not** by itself prove:

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
    NIST_SP-800-53_rev5_LOW-baseline_profile.json
    NIST_SP-800-53_rev5_MODERATE-baseline_profile.json
    NIST_SP-800-53_rev5_HIGH-baseline_profile.json
```

**Not pinned:** resolved profile catalogs, `-min` variants, any FedRAMP-labeled OSCAL baseline. Resolved profiles are derived convenience artifacts; the profile and catalog are the primary source artifacts used by this application.

## FrameworkProvider (application framework source of truth)

The UI no longer uses a handwritten MVP control list.

| Piece | Location |
| --- | --- |
| `FrameworkRegistry` | `src/data/framework/registry.ts` |
| `FrameworkProvider` | `src/data/framework/types.ts` / `provider.ts` |
| NIST Rev. 5 identities | `src/framework/nist-sp-800-53-rev5/identities.ts` |
| NIST Rev. 5 derivation | `src/framework/nist-sp-800-53-rev5/derive.ts` |
| Generated app framework JSON | `src/data/framework/generated/nist-sp-800-53-rev5-{low,moderate,high}.json` |
| Derive script | `scripts/derive-nist-sp-800-53-rev5-frameworks.ts` (`npm run derive:framework`) |

**Source of truth for which controls appear:** the pinned Low / Moderate / High profile `imports[].include-controls[].with-ids` for the project's `frameworkId`.

**Source of truth for titles, families, and statements:** the pinned SP 800-53 Rev. 5 catalog.

**Where derivation occurs:** build-time (and pretest) Node script. The browser loads only the generated application JSON for the project's selected framework (passed from the server). Client components must not import `FrameworkRegistry`, which would bundle all generated catalogs.

### Statement normalization

Catalog `statement` parts (including nested `item` parts and label props) are flattened to a plain string. Parameter insert tokens such as `{{ insert: param, … }}` are preserved. Guidance and discussion parts are never used as the statement.

### Profile features supported (pinned Low / Moderate / High profiles)

Inspected on each pinned Rev. 5 baseline profile; only these selection-related features are used and supported:

- `imports[].href` (not followed; local catalog is paired explicitly)
- `imports[].include-controls[].with-ids`
- `merge.as-is: true`
- `back-matter.resources` (ignored for local pin pairing)

### Unsupported profile features (fail if present and would alter the framework)

This is **not** a universal OSCAL profile engine. Derivation fails clearly if the profile introduces:

- `exclude-controls`
- `include-all`, `with-child-controls`, `matching`
- `modify` (parameters/alters)
- merge strategies other than `as-is: true`
- other unrecognized profile keys that are not in the allow-list

### NIST Rev. 5 baselines vs future FedRAMP

| | NIST Rev. 5 Low / Moderate / High (current) | FedRAMP (not claimed) |
| --- | --- | --- |
| Control selection | Pinned NIST OSCAL baseline profile for the project's `frameworkId` | Would require an official FedRAMP OSCAL profile (not located/approved) |
| Control definitions | NIST SP 800-53 catalog | Same catalog family; FedRAMP may tailor further |
| Policy checks | None | FedRAMP Consolidated Rules (separate layer) |

Do **not** treat FedRAMP Rules `CTL` or KSI `controls` arrays as the framework catalog.

## SSP `import-profile` (current export)

The exporter emits:

```json
"import-profile": {
  "href": "#<profile-resource-uuid>"
}
```

with a matching `back-matter.resources[]` entry titled as the project's selected NIST SP 800-53 Rev. 5 profile (Low, Moderate, or High) and an `rlink` to the commit-pinned upstream URI in `SOURCES.md`.

Do **not** import the catalog directly, FedRAMP Rules, a fabricated FedRAMP profile, a local `vendor/...` path, or a made-up public URI.

## Export packaging

### Current export

Single SSP JSON file. The SSP references a commit-pinned external NIST profile via back-matter `rlink` for the project's selected Low, Moderate, or High baseline. Implemented requirements cover the full derived control set for that profile.

### Future target

```
Portable OSCAL package
├── SSP JSON
├── Low / Moderate / High profile JSON
├── SP 800-53 catalog JSON
└── provenance or manifest information
```

ZIP packaging is not implemented yet.

## Repository structure

```
vendor/oscal/v1.2.2/          # pinned NIST OSCAL schemas + NIST content
src/data/framework/           # FrameworkRegistry + FrameworkProvider + generated app-facing frameworks
src/framework/nist-sp-800-53-rev5/  # identities + build-time profile/catalog derivation (not UI)
src/framework/nist-moderate/  # compatibility re-exports for existing Moderate tests
src/data/implementation/      # user implementation state
src/data/project/             # project metadata
src/domain/                   # assembled Project model (OSCAL-independent)
src/oscal/                    # SSP export + validation adapters
src/fedramp/                  # future: read-only rules evaluation (not present yet)
docs/                         # vision, architecture, this alignment note
```

## Application architecture

1. **Domain model** — `Project` (metadata + `frameworkId` + framework controls + implementations); no OSCAL types.
2. **FrameworkRegistry / FrameworkProvider** — application `Framework` derived from the pinned NIST profile/catalog selected by `frameworkId`.
3. **User implementation** — status/narrative keyed by control ID.
4. **OSCAL exporter** — pure `Project` → SSP JSON in `src/oscal/`.
5. **Validation** — AJV against pinned SSP schema (structural only).
6. **FedRAMP policy evaluation (later)** — Consolidated Rules; never replaces catalog/profile.

```text
pinned Low / Moderate / High profiles + catalog
        │
        ▼ (build-time derive)
generated Framework JSON ──► FrameworkRegistry ──► FrameworkProvider ──► UI / domain Project
                                                      │
                                                      ▼
                                               OSCAL SSP exporter
                                                      │
                                                      ▼
                                               AJV / pinned SSP schema
```

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

## Intentionally retained NIST-specific behavior (04B)

04B does not make Control Freak framework-agnostic. The following remain
NIST SP 800-53 / OSCAL-specific by design:

- Control identifier presentation (`ac-2`, `ac-2.1` → `AC-2 (1)`)
- Control family grouping and enhancement nesting
- Narrow OSCAL profile derivation from pinned Rev. 5 Low / Moderate / High
- Client SSP export metadata via the NIST identity table (not `FrameworkRegistry`)
- Demo/bootstrap content written against the Moderate baseline

`FRAMEWORK` / `FRAMEWORK_CONTROLS` remain Moderate convenience exports for
demo and historical tests. Project-scoped runtime paths must resolve through
the Project's `frameworkId`.

## Gaps before FedRAMP support can be claimed

1. No official FedRAMP OSCAL profile has been located and approved as an input to this project.
2. FedRAMP Consolidated Rules not integrated as a separate evaluation layer.
3. Stable document/party/component UUIDs not persisted.
4. Many SSP-required operational facts still missing from the domain model.
5. Semantic OSCAL checks (UUID integrity beyond pattern, control-in-profile membership, profile/catalog package resolution) not implemented.
6. Narrow profile resolver — not a full OSCAL profile engine.

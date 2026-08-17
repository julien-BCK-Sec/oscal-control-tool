# Milestone 04A — Multi-Framework Foundation

## Status

Implemented.

## Purpose

Generalize Control Freak from a product whose current framework source is effectively a single pinned NIST SP 800-53 Rev. 5 Moderate profile into a product that can safely support multiple frameworks, baselines, and profiles.

This milestone establishes the framework-selection and framework-registry architecture.

It is **not** intended to add ISO 27001, CIS Controls, PCI DSS, CMMC, or other substantially different frameworks yet.

The first proof of the architecture should use additional NIST SP 800-53 Rev. 5 baselines/profiles because they exercise multi-framework behavior without simultaneously introducing a fundamentally different control model.

The existing NIST SP 800-53 Rev. 5 Moderate experience must continue to work.

---

# Product intent

Control Freak should eventually support projects based on different compliance/security frameworks and profiles.

Examples may include:

- NIST SP 800-53 Rev. 5 Low
- NIST SP 800-53 Rev. 5 Moderate
- NIST SP 800-53 Rev. 5 High
- NIST Privacy profiles
- NIST SP 800-171
- CMMC
- NIST CSF
- CIS Controls
- ISO/IEC 27001 / 27002
- PCI DSS
- Canadian or organization-specific frameworks
- custom OSCAL profiles
- organization-defined frameworks

However, 04A must **not assume that all future frameworks behave like NIST 800-53 or OSCAL catalogs**.

The architecture should make future framework adapters possible without prematurely designing every future framework.

---

# Important existing architecture

Before making changes, review at minimum:

- `docs/architecture.md`
- `docs/current-state.md`
- `docs/decisions.md`
- `docs/roadmap.md`
- existing framework/domain code
- `FrameworkProvider`
- project creation and persistence
- control browser/tree
- ControlRecord persistence
- Evidence associations
- Evidence coverage queries
- Evidence search
- workflow actions involving controls
- OSCAL SSP export
- demo/bootstrap/seed data
- tests that assume Moderate or a fixed control count

Also review all relevant ADRs before proposing changes.

Do not assume this milestone document is more authoritative than an existing ADR without identifying the conflict.

---

# Mandatory architectural review — STOP before implementation

Before writing implementation code, perform an architectural review.

The review must determine how deeply Control Freak currently assumes:

- NIST SP 800-53
- Revision 5
- the Moderate baseline
- OSCAL catalog/profile structure
- NIST control families
- control enhancements
- NIST-style control identifiers
- a single framework per deployment
- a single framework per project
- the current pinned catalog/profile files
- the current Moderate control count
- framework control IDs as globally meaningful identifiers

Search the repository for both explicit and implicit assumptions.

Examples include:

- hard-coded framework/profile paths
- hard-coded Moderate labels
- hard-coded baseline counts
- tests expecting 287 controls
- control-family assumptions
- parsing of NIST identifiers such as `ac-2`
- Evidence links using framework `control_id`
- coverage queries obtaining the framework control set
- project creation defaulting to Moderate
- OSCAL export assuming the Moderate profile
- UI copy saying Moderate
- seed/demo data
- workflow/event payloads
- repository keys
- URLs or cache keys
- validation logic
- framework-specific types leaking into generic domain code

Produce an architectural review explaining the findings.

If a material decision requires product-owner approval, **STOP before implementation** and present the decision and recommendation.

Do not silently choose a compatibility-breaking model.

---

# Questions the architectural review must answer

## 1. What identifies a framework?

Recommend a stable framework identity model.

A framework/profile needs a stable application-level identifier that is not dependent on a filename or display label.

Conceptually this may resemble:

- provider
- framework/catalog
- revision/version
- profile/baseline

But do not implement that exact hierarchy unless it matches the existing architecture.

Determine whether Control Freak needs:

- a single `frameworkId`
- separate framework + profile identifiers
- or another representation

The identity must be stable enough to persist on projects.

Examples of conceptual identities might be:

- NIST SP 800-53 Rev. 5 / Low
- NIST SP 800-53 Rev. 5 / Moderate
- NIST SP 800-53 Rev. 5 / High

Do not use display names as durable identifiers.

---

## 2. Does a Project belong to exactly one framework/profile?

For 04A, the expected model is:

**one Project → one selected framework/profile**

Do not implement a project simultaneously governed by multiple frameworks in this milestone.

Cross-framework projects, overlays, mappings, and unified compliance programs are future work.

Confirm whether this model fits the existing Project aggregate and persistence architecture.

---

## 3. Where is framework selection persisted?

Today framework content is intentionally separate from project operational data.

Determine where the selected framework/profile identity belongs.

The selection must survive:

- application restart
- deployment
- project reload
- named project versions where appropriate
- future framework registry expansion

Do not infer a project's framework from its existing ControlRecords.

Do not determine the framework based on which controls happen to have operational records.

---

## 4. What happens to existing projects?

Existing projects created before 04A must continue to behave as NIST SP 800-53 Rev. 5 Moderate projects.

There must be a deterministic migration/default strategy.

Do not require users to manually repair existing projects.

The architectural review must explicitly describe the migration behavior.

---

## 5. What is a FrameworkProvider after 04A?

Determine whether the current `FrameworkProvider` interface is already sufficient or whether it needs to evolve into a registry/provider architecture.

Desired conceptual behavior:

    Framework Registry
            |
            +-- NIST 800-53 Rev5 Low
            |
            +-- NIST 800-53 Rev5 Moderate
            |
            +-- NIST 800-53 Rev5 High
            |
            +-- future provider/profile
                    |
                    +-- framework/control data

Avoid:

    if (framework === "moderate") ...
    else if (framework === "high") ...
    else if ...

Framework-specific behavior should live behind appropriate boundaries.

Do not build a plugin system unless genuinely necessary.

---

# Scope

## In scope

### Framework registry

Introduce a way for the application to discover supported framework/profile definitions.

Each registry entry should expose enough metadata for project creation and display.

At minimum consider:

- stable ID
- display name
- framework/catalog name
- revision/version
- profile/baseline name
- provider/source
- description if useful
- availability/support status if useful

Do not over-model speculative metadata.

---

### Project framework identity

Persist the selected framework/profile identity on a project.

Existing projects migrate/default to the current NIST SP 800-53 Rev. 5 Moderate definition.

New projects explicitly select from supported framework/profile options.

If product UX strongly supports keeping Moderate as the default selection, that is acceptable, but the framework choice must no longer be implicit in the architecture.

---

### Additional NIST baseline proof

Add support for at least:

- NIST SP 800-53 Rev. 5 Low
- NIST SP 800-53 Rev. 5 Moderate
- NIST SP 800-53 Rev. 5 High

Use authoritative pinned OSCAL profile/catalog artifacts consistent with the project's existing framework-content strategy.

Do not fetch framework content from the network at application runtime.

Framework content must remain deterministic and pinned.

If repository/licensing/source constraints prevent bundling one of these profiles, STOP and report the issue.

---

### Framework-aware project loading

All framework-dependent project views must resolve the project's selected framework rather than globally assuming Moderate.

At minimum inspect:

- project overview
- control browser/tree
- control editor
- ControlRecord loading
- Evidence linking
- Evidence picker
- Evidence coverage
- Evidence reporting
- CSV inventory
- assignments/discussions where control identity matters
- workflow actions
- project versioning
- OSCAL export

Only modify areas that actually need framework awareness.

---

### Project creation UX

When creating a project, users should be able to select the framework/profile.

The initial UX may be simple.

For example:

    Framework
    NIST SP 800-53 Rev. 5

    Baseline
    Low
    Moderate
    High

or a single framework/profile selector.

Choose the UI based on the framework identity model approved during architectural review.

Do not build a marketplace or framework-management administration UI in 04A.

---

### Project display

The selected framework/profile should be visible somewhere appropriate in the project UI.

Users should be able to determine whether a project is Low, Moderate, High, etc.

Do not clutter every control screen with redundant framework labels.

---

### Evidence compatibility

Existing Evidence architecture must continue to work.

Evidence remains project-scoped.

Evidence-control associations must resolve against controls belonging to the project's selected framework.

Do not implement cross-framework Evidence associations in 04A.

Do not redesign Evidence UUIDs, Evidence Versions, storage, approval, or coverage semantics.

---

### Coverage compatibility

03D coverage must evaluate the complete control set for the project's selected framework/profile.

It must no longer implicitly evaluate the Moderate control set.

Controls without ControlRecords must continue to use the existing default Evidence requirement semantics.

Do not persist coverage state.

Do not convert coverage into a compliance score.

---

### OSCAL export

OSCAL SSP export must use the framework/profile associated with the project where applicable.

Determine whether existing SSP export metadata currently embeds Moderate-specific profile/catalog references.

If it does, generalize those references.

The exported SSP for a Low project must not claim to use the Moderate profile.

The exported SSP for a High project must not claim to use the Moderate profile.

Schema validation must continue to pass.

Do not attempt to support non-OSCAL framework export in 04A.

---

### Seed/demo behavior

Demo/bootstrap tooling must remain deterministic.

Determine whether the existing demo project should:

- remain Moderate, or
- explicitly specify Moderate through the new framework identity

Prefer preserving the current demo behavior while making the framework selection explicit in seed data.

---

# Framework content

Use the same source-of-truth philosophy already established for framework data:

- pinned
- deterministic
- version controlled where appropriate
- no runtime dependency on external services

Do not copy framework content from unofficial websites.

For NIST/OSCAL content, use the project's existing authoritative-source approach.

Document:

- source
- version/revision
- profile
- date or upstream version identifier where appropriate

---

# Important future compatibility requirement

04A must not make it harder to support non-NIST frameworks later.

However, do not prematurely normalize every possible framework into a lowest-common-denominator model.

Future frameworks may differ in:

- hierarchy
- grouping
- identifiers
- enhancements/subrequirements
- parameters
- implementation semantics
- assessment procedures
- mappings
- licensing
- versioning
- source format

The goal is a clean provider/registry boundary, not a universal compliance ontology.

---

# Control identity

This requires particular scrutiny.

Existing operational records and Evidence associations rely on framework control identifiers.

Determine whether the current key:

    projectId + controlId

remains sufficient when the Project itself has a persisted framework identity.

It may be sufficient because framework identity can be derived from Project.

Do not add framework IDs redundantly to every operational table unless required for correctness or referential integrity.

Conversely, do not assume control IDs such as `ac-2` are globally unique across all future frameworks.

The architectural review must explicitly state the chosen invariant.

---

# Framework switching

Changing the framework/profile of an established project is **not required** in 04A.

In fact, once a project has operational data, switching from Moderate to High could create ambiguous behavior involving:

- implementation narratives
- ControlRecords
- Evidence associations
- assignments
- discussions
- workflow history
- named versions
- exported SSPs

Recommended initial behavior:

- framework/profile selected at project creation
- existing projects assigned Moderate through migration
- no general framework-switch operation in 04A

If the implementation exposes framework changes, STOP and justify the migration semantics before proceeding.

---

# Cross-framework mapping

Explicitly out of scope.

Do not implement mappings such as:

    NIST AC-2
       ↔ CIS ...
       ↔ ISO ...
       ↔ CMMC ...

Do not introduce canonical "universal controls" in 04A.

Mapping is a future capability and deserves its own architectural milestone.

The 04A architecture should merely avoid making mapping unnecessarily difficult later.

---

# Licensing

04A uses NIST content as the proof of multi-framework architecture.

Before future work bundles third-party frameworks such as ISO or CIS, licensing and redistribution rights must be reviewed.

Do not add copyrighted/licensed third-party framework text merely to demonstrate extensibility.

The registry should eventually be capable of representing framework content that is:

- bundled
- organization-provided
- licensed
- imported

but those mechanisms are not required in 04A.

---

# Explicitly out of scope

Do NOT implement in 04A:

- ISO 27001 / ISO 27002
- CIS Controls
- PCI DSS
- CMMC
- NIST CSF
- NIST 800-171 unless specifically approved during review
- cross-framework mappings
- universal control ontology
- organization framework marketplace
- custom framework authoring
- custom framework import
- organization-wide Evidence
- Evidence approval
- assessment management
- findings
- POA&M
- control inheritance/common controls
- automated Evidence collection
- Word/PDF export
- production notification integrations
- framework switching for established projects
- framework auto-upgrades
- runtime downloading of framework content

---

# Authorization

Framework selection during project creation should follow the existing authorization required to create a project.

Reading the framework registry does not require a new permission unless existing architecture requires one.

Do not introduce `framework.*` permissions merely for displaying built-in framework choices.

If future organization-managed/custom frameworks require administration permissions, defer those permissions to that milestone.

---

# Persistence

Follow existing persistence boundaries.

Framework content itself should not be copied wholesale into PostgreSQL merely because multiple frameworks now exist.

Persist only the framework/profile identity and other application state that genuinely belongs to the Project.

Operational entities remain operational.

Framework/catalog source data remains behind the framework provider boundary.

---

# Named versions / restore

Review how project named versions interact with framework identity.

A named version must not accidentally restore project content under the wrong framework.

Determine whether framework identity is:

- immutable project identity and therefore outside document restore, or
- part of versioned project document state.

Given that framework switching is out of scope, immutable project identity may be preferable.

Do not choose silently if existing ADRs make this ambiguous.

---

# Migration requirements

Database migrations must be forward-only and safe for existing installations.

Requirements:

- existing projects resolve to NIST SP 800-53 Rev. 5 Moderate
- no existing Evidence links are lost
- no ControlRecords are recreated merely to establish framework identity
- no named versions are destroyed
- no audit history is rewritten
- demo/bootstrap remains functional
- PostgreSQL remains the production persistence target
- preserve any required SQLite parity/cutover behavior if still part of the repository architecture

If adding a non-null project framework column requires a staged migration/default, implement it safely.

---

# Tests

Add or update tests for at least the following.

## Registry

- registry returns supported profiles
- stable IDs are unique
- Low, Moderate, and High resolve successfully
- unknown framework/profile fails safely

## Existing project compatibility

- migrated/default existing project resolves to Moderate
- existing Moderate behavior remains unchanged
- existing Evidence links still resolve

## Project creation

- project can be created with Low
- project can be created with Moderate
- project can be created with High
- invalid framework ID is rejected

## Framework isolation

For equivalent project operations:

- Low project sees Low controls
- Moderate project sees Moderate controls
- High project sees High controls

No project should accidentally use another project's framework definition.

## Coverage

- coverage denominator comes from selected profile
- required-missing controls include framework controls without ControlRecords
- Low/Moderate/High totals are derived from actual pinned profiles, not hard-coded test constants

Avoid brittle tests that unnecessarily hard-code upstream control counts.

If exact profile counts are intentionally asserted as integrity checks, clearly identify them as pinned-content assertions.

## Evidence

- Evidence can link only to controls valid for the project's framework
- cross-project protections remain intact
- archived association rule remains intact
- picker/search continue working

## OSCAL export

- Low project references Low profile where appropriate
- Moderate references Moderate
- High references High
- exported SSPs continue schema validation

## Authorization

Existing project/framework operations continue to fail closed.

Do not weaken tenant isolation while introducing registry lookups.

## Regression

Existing suites for:

- control authoring
- collaboration
- review
- workflow automation
- Evidence CRUD
- Evidence association
- Evidence versions
- Evidence picker/search
- Evidence coverage
- inventory CSV
- OSCAL export

must continue to pass.

---

# Performance

Do not load or parse every registered framework on every request if the current provider architecture can avoid it.

Framework resolution should be deterministic and reasonably cacheable.

Do not introduce distributed caching in 04A.

Coverage must continue to use batched queries rather than N+1 ControlRecord loading.

---

# Documentation

Update as appropriate:

- `docs/architecture.md`
- `docs/current-state.md`
- `docs/decisions.md`
- `docs/roadmap.md`
- this milestone document
- demo/bootstrap documentation
- framework source/version documentation

Add a new ADR only if the architectural review determines that framework identity/registry represents a durable architectural decision not adequately covered by existing ADRs.

Likely ADR candidate:

**Framework Registry and Project Framework Identity**

But do not create an ADR merely because the milestone number changed.

---

# Work packages

The following work-package structure is suggested but may be adjusted after architectural review.

## WP1 — Architecture audit and decision

- inventory NIST/Moderate assumptions
- inspect framework provider boundaries
- inspect project persistence
- inspect Evidence/control identity assumptions
- inspect coverage
- inspect OSCAL export
- propose framework identity
- propose migration behavior
- determine ADR requirement

**STOP here if approval is required.**

---

## WP2 — Framework registry/domain

- stable framework/profile identity
- registry
- provider resolution
- Low/Moderate/High definitions
- pinned source data
- unit tests

---

## WP3 — Project persistence and creation

- persist selected framework/profile
- safe existing-project migration
- project creation selection
- demo/bootstrap update
- authorization preservation
- tests

---

## WP4 — Framework-aware control surfaces

- project loading
- control browser
- control editor
- operational ControlRecord resolution
- Evidence associations/picker where required
- remove inappropriate Moderate assumptions
- tests

---

## WP5 — Coverage and reporting

- resolve complete control set from project framework
- preserve 03D coverage semantics
- CSV inventory correctness
- project overview counts
- tests

---

## WP6 — OSCAL export

- framework/profile-aware SSP references
- Low/Moderate/High correctness
- schema validation
- tests

---

## WP7 — Documentation and verification

- architecture/current-state/roadmap
- ADR if approved/required
- framework source documentation
- full regression suite
- lint
- production build

---

# Verification

Before declaring the milestone complete, run:

    npm test
    npm run lint
    npm run build

All must pass.

Do not create commits unless explicitly requested.

---

# Completion report

At completion, report:

1. Executive summary
2. Architectural audit findings
3. Architectural decisions made
4. ADRs added or amended
5. Framework identity model
6. Registry/provider design
7. Supported framework/profile definitions
8. Existing-project migration behavior
9. Project creation behavior
10. Control identity invariant
11. Evidence compatibility
12. Coverage/reporting behavior
13. OSCAL export behavior
14. Database/schema changes
15. Files added
16. Files modified
17. Tests added/modified
18. Remaining NIST/Moderate assumptions, if any
19. Known limitations
20. Recommendations for 04B
21. Verification results

---

# Expected 04A outcome

At the end of 04A:

- Control Freak no longer assumes every project is Moderate.
- Every project has a durable framework/profile identity.
- Existing projects remain Moderate without user intervention.
- New projects can select Low, Moderate, or High.
- Framework content remains pinned and deterministic.
- Control browsing reflects the selected profile.
- Evidence remains project-scoped and works against the selected control set.
- Coverage uses the selected profile's complete control population.
- OSCAL SSP export references the correct profile.
- No cross-framework mapping has been invented.
- No third-party licensed framework has been bundled.
- Future non-NIST frameworks can be introduced through a deliberate extension of the registry/provider architecture rather than another Moderate-specific rewrite.
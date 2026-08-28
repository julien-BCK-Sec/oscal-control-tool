# Milestone 06A — DoD Impact Level 4 Framework Support

## Status

Implemented, merged, released, and production verified 2026-08-27.
WP1 through WP7 complete.

Production release: **v0.6.1** (`eb12b69`).

**v0.6.0** (`48ae30f`) is the 06A merge commit. It failed the Render
Docker build because `.dockerignore` excluded `docs/user-guide`.
**v0.6.1** includes that packaging fix (`7d2034f` merged as `eb12b69`)
and is the live production revision. Do not treat v0.6.0 as the live
release.

Durable framework ID: **`dod-cloud-il4-rev5`**. Population: **345** items
(323 FedRAMP Moderate NIST items + 12 DoD-selected NIST items + 10 GRRs).
Product-selectable under DoD Cloud → Impact Level 4. OSCAL SSP export
disabled. No schema changes. Canonical demo: Snow Goose Cloud Impact
Level 4 (Demo). Help: `docs/user-guide/dod-cloud-il4.md`.

WP1 through WP6 remain the historical implementation record below. Do not
treat the research questions later in this document as still-open product
scope.

## WP1 approved conclusions (2026-08-27)

These replace the stale research assumptions below for implementation work.
Do not treat them as still-open WP1 questions.

- Current Cloud Computing SRG package is **Y26M06**. CSP SRG is **V1R7,
  30 June 2026**.
- Current Addendum is **DoD Rev 5 SSP Addendum Controls v1.2** (workbook
  modified / DCCS listing **2025-12-03**).
- Product scope for 06A is **IL4 Moderate / MMx only** (not IL4 High, IL5,
  IL6, NSS, or privacy overlays).
- Correct base is **FedRAMP Rev. 5 Moderate + DoD IL4 overlay**, not Control
  Freak’s NIST Moderate provider. NIST Moderate remains unchanged.
- Default PA-facing population is the Addendum **IL4 Moderate** sheet:
  **345** items (183 NIST base + 152 NIST enhancements + 10 GRRs).
  NIST 800-53-only count is **335** if GRRs are excluded from that particular
  count; GRR-1…GRR-10 **are** included in the default framework population.
- Historical “FedRAMP Moderate + 35 controls” does not match this Rev. 5 set.
- Overlay architecture is **Option B** (base + overlay) with structured
  parameter / provenance / supplement metadata (ADR-029).
- Unresolved DSPAV values are explicit (`authoritative-value-required`); they
  do not block IL4 derivation or project creation. RMF KS values are not guessed.
- Durable framework ID: **`dod-cloud-il4-rev5`**. Source versions and hashes
  are metadata, not part of the ID.
- OSCAL SSP export is **disabled** for IL4. Do not point IL4 at the NIST
  Moderate profile or fabricate FedRAMP/DoD OSCAL profiles.
- No database schema change for 06A. Create-only; no in-place Moderate → IL4
  mutation.

## WP3 runtime integration (2026-08-27)

WP3 registered `dod-cloud-il4-rev5` as a `FrameworkProvider` mapped from the
WP2 generated overlay artifact. Overlay metadata is generic
`FrameworkControl` read-model data. The framework is **not**
product-selectable (`productSelectable: false`); project create still lists
NIST Low/Moderate/High and CMMC Level 2 only. Do not treat this as WP4
project/UI integration.

## WP4 authoring presentation (2026-08-27)

WP4 added generic overlay metadata presentation in the Control Browser and
set `productSelectable: true` for `dod-cloud-il4-rev5`. IL4 is available
in the project-create selector under **DoD Cloud → Impact Level 4**.
Moderate remains the default. Overlay assignments, supplements, DSPAV
notices, IA-5(1) source conflict, SC-46 CDS applicability, and GRR
terminology are read-model presentation only. Evidence/workflow special
behavior is WP5.

## WP5 Evidence/workflow integration (2026-08-27)

WP5 verified that existing project-scoped Evidence, Evidence Coverage,
review, assignments, discussions, activity, domain events, and workflow
control-ID validation work against all 345 IL4 item IDs, including
GRR-1…GRR-10. Overlay DSPAV, source-conflict, supplements, assignments,
and SC-46 CDS applicability do not mutate ControlRecord, implementation
status, review, evidenceRequirement, or coverage population. Coverage
denominator is 345. No IL4-specific Evidence types, workflow actions, or
schema changes. OSCAL SSP export remains disabled (WP6). Help/demo remain
WP7.

## WP6 export and compatibility (2026-08-27)

WP6 verified IL4 OSCAL SSP export stays disabled (`frameworkHasOscalSspExport`
false; `projectToOscalSsp` fails closed with no NIST Moderate fallback).
NIST Low/Moderate/High SSP export and schema validation remain unchanged.
CMMC remains unsupported. IL4 projects load/save and named-version restore
preserve `dod-cloud-il4-rev5`. Restore cannot switch framework identity
from snapshot JSON. No Word/PDF package. Help/demo remain WP7.

## Purpose

Add DoD Impact Level 4 (IL4) as a first-class supported framework/profile in Control Freak, using current authoritative DoD cloud security requirements and preserving the existing framework architecture established in Milestones 04A–04C.

Control Freak already supports:

- NIST SP 800-53 Rev. 5 Low;
- NIST SP 800-53 Rev. 5 Moderate;
- NIST SP 800-53 Rev. 5 High;
- CMMC Level 2 / NIST SP 800-171 Rev. 2.

06A extends that model to DoD IL4.

The goal is not merely to add a label called “IL4.”

The goal is to establish the exact authoritative IL4 requirement set, determine the correct relationship between:

- FedRAMP Moderate;
- NIST SP 800-53 Rev. 5 Moderate;
- DoD Cloud Computing SRG requirements;
- DoD Rev. 5 SSP Addendum controls;
- DoD-specific parameters and supplemental requirements;

and then represent IL4 accurately and deterministically inside the existing framework model.

This milestone must not encode historical “FedRAMP+” assumptions without verifying them against the current authoritative DoD Rev. 5 artifacts.

---

# Product intent

A user should eventually be able to create a Project and choose:

    DoD Impact Level 4

The resulting Project should contain the correct IL4 control population and DoD-specific requirement semantics.

Existing Control Freak capabilities should continue to operate where applicable:

- control browsing;
- implementation narratives;
- ownership and metadata;
- review workflow;
- assignments;
- discussions;
- activity history;
- Evidence;
- Evidence Picker;
- Evidence Coverage;
- workflow automation;
- named versions;
- reporting/export where accurate.

Control Freak must not imply that choosing IL4 means:

- DoD authorization;
- provisional authorization;
- FedRAMP authorization;
- successful assessment;
- approval by an Authorizing Official;
- an ATO has been granted.

Framework selection remains documentation scope, not authorization state.

---

# Critical architectural question

The primary architectural question for 06A is whether DoD IL4 can be represented correctly as:

    existing framework control population

or whether Control Freak must support a true overlay/profile model capable of:

- adding base controls;
- adding enhancements;
- overriding parameter values;
- attaching DoD-specific supplemental requirements;
- preserving source provenance.

Do not assume the answer before WP1 research.

WP1 is complete. The approved answer is Option B (base + overlay); see
“WP1 approved conclusions” and ADR-029. Do not re-open that choice in later
work packages without a new decision.

---

# Mandatory WP1 authoritative source and architecture review

WP1 is mandatory.

Do not implement IL4 support until WP1 has been reviewed and explicitly approved.

The authoritative current DoD source material must be established first.

At minimum investigate:

- current DoD Cloud Computing Security Requirements Guide;
- current DoD Rev. 5 SSP Addendum Controls;
- current IL4 requirements;
- applicable FedRAMP/NIST baseline;
- DoD-specific parameter requirements;
- DoD-specific enhancement requirements;
- DoD-specific supplemental implementation requirements;
- privacy requirements and conditionality;
- machine-readable source availability;
- source redistribution/pinning implications.

Historical descriptions such as:

    “FedRAMP Moderate + 35 controls”

must be treated as background only until verified against the current Rev. 5 material.

---

# Mandatory STOP after WP1

After WP1 research and architecture analysis:

STOP.

Do not proceed to implementation until the findings have been reviewed and approved.

Return a report containing:

1. Executive summary
2. Repository/start-state confirmation
3. Authoritative DoD sources
4. Current Cloud Computing SRG version/date
5. Current DoD Rev. 5 SSP Addendum version/date
6. Current authoritative definition of IL4
7. Correct FedRAMP/NIST base for IL4
8. Existing Control Freak Moderate population
9. Exact IL4 delta table
10. Added base controls
11. Added enhancements
12. Parameter modifications
13. Supplemental DoD requirements/guidance
14. Privacy requirements
15. Historical FedRAMP+/35-control comparison
16. Resulting IL4 population/count
17. FrameworkProvider compatibility
18. Overlay/parameter architecture findings
19. Recommended framework representation
20. Proposed durable framework ID
21. Source/provenance/pinning strategy
22. Licensing/redistribution conclusion
23. OSCAL/machine-readable source findings
24. Project creation/presentation implications
25. Existing feature compatibility
26. Existing Moderate → IL4 migration/clone recommendation
27. Database/schema implications
28. ADR implications
29. Security/authorization implications
30. Test strategy
31. Proposed WP2–WP7 implementation plan
32. Exact material decisions requiring approval

For each material recommendation include:

- recommended option;
- alternatives considered;
- rationale;
- implementation impact;
- future impact.

If authoritative public artifacts are inaccessible, do not substitute unofficial control spreadsheets or community mappings.

Report the blocked source explicitly and stop.

---

# 1. Authoritative source model

06A must use current primary DoD sources.

Preferred source order:

1. DoD CIO / DoD Cyber Exchange / DISA
2. Federal Register / CFR where relevant
3. FedRAMP authoritative materials
4. NIST publications and official OSCAL repositories

Secondary sources may be used only to locate primary material.

Do not derive IL4 from:

- blogs;
- consultant spreadsheets;
- training content;
- unofficial GitHub repositories;
- historical control crosswalks;
- stale FedRAMP+ cheat sheets.

Record for each authoritative artifact:

- document title;
- version;
- publication/update date;
- URL;
- format;
- relevant sections;
- checksum/hash if pinned locally.

---

# 2. Correct IL4 baseline

WP1 must determine whether IL4 should conceptually derive from:

    NIST SP 800-53 Rev. 5 Moderate

or:

    FedRAMP Rev. 5 Moderate

or another authoritative profile.

Do not assume plain NIST Moderate and FedRAMP Moderate are equivalent for IL4.

If FedRAMP Moderate introduces:

- additional controls;
- parameter values;
- implementation requirements;
- documentation requirements;

that are relevant to IL4, they must be identified explicitly.

The eventual representation must use the correct base.

---

# 3. Exact IL4 delta

WP1 must produce a deterministic comparison between the authoritative IL4 requirement set and the current Control Freak Moderate provider.

Each difference must be classified as:

- Added base control
- Added control enhancement
- Existing control with changed parameter
- Existing enhancement with changed parameter
- Existing control with DoD-specific supplemental requirement
- Existing enhancement with DoD-specific supplemental requirement
- Documentation/package requirement
- Privacy-dependent requirement
- Other

Controls already present in Moderate must not be counted as “additional” merely because DoD references them.

The goal is the semantic delta, not a historical marketing count.

---

# 4. Framework identity

IL4 must receive a durable immutable framework ID.

The exact ID is a WP1 decision.

Possible forms may include:

    dod-impact-level-4-rev5
    dod-cloud-il4-rev5
    dod-il4-<source-version>

Do not persist an ID until the authoritative source/version strategy is settled.

Framework identity must be stable.

If DoD later publishes a materially different IL4 requirement revision, existing Projects must not silently change meaning.

A future IL4 revision should receive a new durable framework identity where required.

---

# 5. Project model

The existing invariant remains:

    Project
       ↓
    frameworkId
       ↓
    FrameworkRegistry
       ↓
    FrameworkProvider

Project framework identity remains immutable.

Operational control identity remains:

    (projectId, controlId)

unless WP1 proves that IL4 cannot safely fit that invariant.

Do not add frameworkId redundantly to:

- ControlRecord;
- Evidence associations;
- assignments;
- discussions;
- activity;
- workflows;
- other Project-owned operational rows.

If the identity model cannot support IL4 accurately, STOP rather than silently changing it.

---

# 6. Overlay architecture

WP1 must evaluate at least these approaches.

## Option A — Fully derived IL4 provider

A dedicated FrameworkProvider emits the final complete IL4 control set and metadata.

## Option B — Base + overlay

Conceptually:

    FedRAMP/NIST Moderate
           +
      DoD IL4 overlay
           =
        IL4 framework

The overlay may:

- add controls;
- add enhancements;
- override parameters;
- attach supplemental requirements;
- preserve DoD provenance.

## Option C — Another model

If authoritative source semantics require another approach, document it.

Compare options on:

- correctness;
- provenance;
- maintainability;
- framework immutability;
- future IL5 support;
- privacy overlays;
- FedRAMP-specific profiles;
- OSCAL compatibility;
- upgrade/migration behavior.

Do not implement overlay abstractions speculatively before WP1 approval.

---

# 7. Parameters

DoD may require specific parameter values for controls already present in the base framework.

WP1 must determine whether the current FrameworkProvider and statement/parameter rendering pipeline can represent:

- selected parameter values;
- DoD override values;
- source provenance;
- display of DoD-specific parameterization.

Do not hard-code replacement statement text merely to avoid modeling parameters properly.

If the current abstraction cannot support required parameterization, treat that as a material architecture decision.

---

# 8. Supplemental DoD requirements

DoD may impose requirements that modify how an existing selected control must be implemented without changing the NIST control text itself.

Examples may include:

- DoD-specific implementation requirements;
- documentation requirements;
- architecture requirements;
- external service requirements;
- cryptographic requirements;
- operational constraints.

Do not rewrite normative NIST text to make it look like DoD authored the control.

Preserve:

    NIST control
        +
    DoD supplemental requirement

as distinct provenance where possible.

---

# 9. Privacy requirements

WP1 must determine whether IL4 privacy requirements are:

- always applicable;
- conditional on PII processing;
- implemented through an overlay;
- separate documentation requirements.

Do not automatically add every privacy control to every IL4 Project without authoritative justification.

Do not introduce generic conditional-framework logic in WP1.

Report the requirement and architectural implication first.

---

# 10. Framework metadata and terminology

Proposed registry metadata should include where appropriate:

- framework ID;
- display name;
- short name;
- framework family;
- impact level;
- baseline relationship;
- source version;
- source provenance;
- terminology metadata.

Likely user-facing family:

    DoD Cloud

Likely option:

    Impact Level 4

Supporting copy may say:

    Based on FedRAMP Moderate plus DoD IL4 requirements

only if that is technically accurate according to WP1.

Do not use language implying authorization.

---

# 11. Project creation

After implementation approval, IL4 should appear in the framework selector.

Moderate remains the default unless separately changed by product decision.

Possible conceptual selector:

    NIST SP 800-53 Rev. 5
      Low
      Moderate
      High

    CMMC
      Level 2

    DoD Cloud
      Impact Level 4

Exact UI should follow registry-driven metadata and existing design-system patterns.

---

# 12. Existing Project compatibility

Existing Projects must remain unchanged.

Preserve:

- NIST Low;
- NIST Moderate;
- NIST High;
- CMMC Level 2;
- framework identity;
- ControlRecords;
- implementation narratives;
- Evidence;
- assignments;
- discussions;
- activity;
- workflows;
- named versions;
- OSCAL behavior.

No existing Moderate Project should silently become IL4.

---

# 13. Moderate → IL4 transition

06A must not implement framework switching.

However, WP1 must analyze a future transition workflow for organizations that already have a Moderate Project and later need IL4.

Potential approaches:

- clone Project into IL4;
- explicit framework-upgrade/migration operation;
- another mapped transition.

The analysis should identify what could safely be preserved:

- narratives;
- ControlRecord metadata;
- review state;
- Evidence associations;
- Evidence Versions;
- assignments;
- discussions;
- activity;
- named versions.

Do not implement the migration in 06A unless separately approved.

---

# 14. Control Browser

IL4 should use the existing Control Browser if the normalized framework model supports it.

Preserve:

- family grouping;
- enhancement nesting where applicable;
- IDs;
- titles;
- search;
- implementation editing;
- status/review UI;
- Evidence;
- collaboration.

Do not create a separate IL4-specific control browser.

Do not flatten enhancements incorrectly.

---

# 15. Evidence

Existing Evidence semantics remain unchanged.

IL4 controls may:

- link Evidence;
- create Evidence;
- upload immutable Evidence Versions;
- use Evidence Picker;
- participate in Evidence Coverage;
- display freshness.

Evidence Coverage remains:

    Evidence presence relative to Evidence requirement

It is not:

- DoD assessment status;
- authorization status;
- assessment success;
- audit readiness.

---

# 16. Workflows and collaboration

Existing generic collaboration/workflow behavior should operate against IL4 control IDs.

Validate IL4 control IDs through the existing Project-framework control boundary.

Preserve:

- review workflow;
- assignments;
- discussions;
- activity;
- notifications;
- workflow triggers/conditions/actions.

Do not introduce DoD-specific workflow semantics unless explicitly approved later.

---

# 17. OSCAL

WP1 must determine whether authoritative OSCAL artifacts exist for:

- the applicable FedRAMP base;
- DoD IL4;
- DoD parameter overlays;
- DoD SSP Addendum content.

Do not fabricate OSCAL.

Possible implementation outcomes:

1. existing SSP export can accurately support IL4;
2. export requires an authoritative FedRAMP/DoD profile;
3. export should remain disabled until accurate authoritative artifacts exist.

Accuracy is more important than feature parity.

Existing NIST SSP export must remain unchanged.

---

# 18. Authorization package generation relationship

06A is framework support, not full DoD SSP package generation.

However, the IL4 source/provenance model should not prevent the future roadmap capability:

    DoD / Impact Level SSP generation

Document any IL4-specific metadata or source structure that future template-driven package generation will need.

Do not build Word/PDF IL4 SSP generation in 06A.

---

# 19. Source provenance and pinning

All built-in IL4 content must be deterministic.

No runtime downloads.

Prefer pinned authoritative artifacts.

Record:

- source URL;
- source version;
- retrieval date;
- hash/checksum;
- transformation process;
- generated output integrity tests.

If machine-readable artifacts do not exist, use a deterministic transformation from official documents.

Do not use OCR unless absolutely unavoidable.

Do not manually transcribe a large control set if a deterministic source pipeline is feasible.

---

# 20. Licensing and redistribution

WP1 must assess whether the DoD source material required for IL4 can appropriately be:

- stored in the repository;
- transformed;
- redistributed with the application;
- displayed to users.

Do not assume every government-hosted artifact has identical redistribution conditions.

If licensing or redistribution is uncertain enough to affect implementation, STOP.

---

# 21. Database/schema

Prefer no schema change.

Existing Project/framework/control architecture should support IL4 if the framework abstraction is sufficient.

Do not add:

- `impact_level` to Project if frameworkId already expresses the selection;
- DoD-specific columns to ControlRecord;
- parameter columns unless genuinely required by a generic framework capability;
- frameworkId to operational tables.

If a generic schema extension is required, WP1 must justify it before implementation.

---

# 22. Security and authorization

Preserve the existing authorization order:

    authenticate
       ↓
    resolve Project/resource
       ↓
    organization permission
       ↓
    framework/control validation
       ↓
    mutation

Framework validation must not leak:

- Project existence;
- tenant membership;
- another organization's framework/control state.

Preserve all current tenant-isolation and Evidence authorization behavior.

---

# 23. Help / documentation

If IL4 is implemented, update the in-app Help/User Guide to explain:

- what IL4 means in Control Freak;
- framework immutability;
- relationship to FedRAMP/NIST baseline;
- DoD-specific requirements;
- limitations;
- OSCAL/export behavior;
- that framework selection does not imply authorization.

Do not turn Help into DoD compliance guidance beyond what authoritative sources support.

---

# 24. Demo data

Do not replace the canonical Moderate demo Project.

An IL4 demo Project is optional and should only be added if it materially helps verification/demo use.

Do not substantially increase bootstrap complexity solely for 06A.

---

# 25. Tests

Future implementation must include representative tests for:

## Source integrity

- pinned source hash/version;
- deterministic derivation;
- exact authoritative control delta.

## Framework population

- exact base-control count;
- exact enhancement count;
- exact final IL4 population;
- representative added items;
- representative parameter overrides;
- supplemental DoD metadata.

## Framework isolation

- Moderate Project rejects IL4-only control IDs;
- IL4 Project accepts valid IL4 IDs;
- CMMC remains isolated;
- Low/High remain unchanged.

## Project behavior

- IL4 Project creation;
- framework immutability;
- save/restore;
- named versions.

## Evidence

- linking;
- picker;
- coverage denominator;
- freshness.

## Workflow/collaboration

- valid IL4 actions work;
- invalid IDs fail before operational state creation.

## OSCAL

Test only the export behavior approved after WP1.

## Security

Preserve:

- tenant isolation;
- Evidence authorization;
- notification authorization;
- cross-framework non-enumeration.

---

# 26. Verification

Before declaring 06A implemented:

    npm test
    npm run lint
    npm run build

All must pass.

Do not create commits unless explicitly requested.

---

# 27. Work packages

## WP1 — Authoritative IL4 delta and architecture review

Research and document:

- current DoD Cloud Computing SRG;
- current DoD Rev. 5 SSP Addendum;
- IL4 definition;
- correct FedRAMP/NIST baseline;
- exact Moderate → IL4 delta;
- parameters;
- supplemental DoD requirements;
- privacy requirements;
- OSCAL availability;
- source provenance;
- licensing;
- FrameworkProvider compatibility;
- overlay architecture;
- schema implications;
- migration/clone implications;
- test plan.

STOP for approval.

## WP2 — Source/pinning model

After approval:

- add authoritative pinned source artifacts and hash-locked extracts as
  required by redistribution constraints;
- add deterministic derivation pipeline (FedRAMP Moderate workbook +
  Addendum IL4 Moderate extract + NIST catalog + SRG Appendix D extract);
- add source provenance documentation (`vendor/dod/cloud-il4-rev5/SOURCES.md`);
- add source integrity tests for the approved 345-item population and
  representative parameter/provenance cases;
- do **not** register `dod-cloud-il4-rev5` or expose IL4 in the application.

## WP3 — Framework provider/model changes

- implement approved IL4 representation;
- implement minimal generic overlay/parameter changes if approved;
- register framework metadata;
- preserve existing framework behavior.

## WP4 — Project/UI integration

Implemented 2026-08-27. Overlay authoring presentation is generic
Control Browser metadata; IL4 is product-selectable. Evidence/workflow
special behavior is WP5.

- project creation option;
- framework presentation;
- Control Browser;
- search;
- IL4-specific supplemental display where approved.

## WP5 — Evidence/workflow/collaboration integration

Implemented 2026-08-27. Generic operational machinery accepts the 345 IL4
IDs, including GRRs. Overlay metadata stays non-operational.

- Evidence association;
- Evidence Coverage;
- workflow validation;
- review;
- assignments/discussions/activity;
- regression tests.

## WP6 — Export and compatibility

Implemented 2026-08-27. IL4 OSCAL SSP export remains disabled. NIST and
CMMC export behavior is unchanged. Named versions preserve live
`frameworkId`.

- implement only approved accurate OSCAL/export behavior;
- preserve existing NIST/CMMC behavior;
- verify existing Projects/named versions.

## WP7 — Documentation and verification

Implemented 2026-08-27.

### Help / user guide

Canonical content is `docs/user-guide/dod-cloud-il4.md` (in-app `/help/dod-cloud-il4`).
Existing framework, OSCAL, Evidence Coverage, glossary, and limitations
pages point to that topic instead of duplicating overlay explanations.

Implemented facts taught in Help:

- IL4 composition is NIST SP 800-53 Rev. 5 → FedRAMP Rev. 5 Moderate →
  DoD IL4 overlay → Control Freak IL4 framework, not “NIST Moderate plus
  extra controls.”
- Population is 345 = 323 FedRAMP Moderate NIST items + 12 DoD-selected
  NIST items (2 bases + 10 enhancements) + 10 GRRs.
- GRRs are first-class framework items, not NIST controls.
- Control statement / FedRAMP Moderate / DoD IL4 layers stay separate.
  Known non-conflicting assignments may appear as a derived Effective
  requirement; the NIST source statement is preserved.
- DSPAV shows **DoD assignment required**; values are not guessed.
- IA-5(1) shows **Source interpretation requires review**; no winner.
- SC-46 remains in the population with CDS conditionality; no auto-N/A.
- Evidence Coverage denominator is 345 and is not a compliance score,
  assessment result, authorization readiness, or ATO determination.
- OSCAL export is unavailable because Control Freak has no approved/pinned
  authoritative OSCAL profile for the implemented IL4 framework — not
  because OSCAL cannot represent overlays.
- Framework identity is durable after project creation.
- Selecting IL4 is not FedRAMP authorization, DoD authorization,
  Provisional Authorization, an ATO, certification, or a successful
  assessment.

Contextual Help: overlay metadata panel →
`/help/dod-cloud-il4#how-nist-fedramp-and-dod-layers-appear`; IL4 OSCAL
unavailable copy →
`/help/oscal-export#dod-cloud-il4-projects-do-not-have-this-button`.

### Canonical demo

**Snow Goose Cloud Impact Level 4 (Demo)** under Canadian Goose Defence
System. Framework ID `dod-cloud-il4-rev5`. Complements Strategic Goose
Operations Platform (Demo), which remains NIST Moderate.

Representative seeded items: AC-2, AC-7, IA-5(1), SC-17, SC-46, GRR-1.
One active Evidence record linked to `ac-2` and `grr-1`. No invented
DSPAV values. Bootstrap remains idempotent; normal deployment does not
seed demo data.

### Final implemented facts

| Fact | Value |
| --- | --- |
| Durable framework ID | `dod-cloud-il4-rev5` |
| Source set / hashes | `vendor/dod/cloud-il4-rev5/SOURCES.md` |
| Population | 345 (183 NIST bases + 152 enhancements + 10 GRRs) |
| Overlay architecture | ADR-029 base + overlay; NIST statements not rewritten |
| GRRs | `grr-1`…`grr-10`; first-class items |
| DSPAV | `authoritative-value-required`; not guessed |
| IA-5(1) | source-conflict; both layers shown |
| SC-46 | remains in population; CDS conditionality; no auto-N/A |
| Evidence/workflow | generic machinery on all 345 IDs |
| OSCAL | unsupported (`frameworkHasOscalSspExport` false) |
| Demo project | Snow Goose Cloud Impact Level 4 (Demo) |
| Schema | no migrations / no schema changes |
| Test concurrency | `--test-concurrency=4` retained |

- implement only approved accurate Help and demo content;
- preserve existing NIST/CMMC/IL4 runtime behavior;
- verify existing Projects/named versions.

---

# 28. Explicitly out of scope

Do NOT implement in 06A unless separately approved:

- DoD IL5;
- DoD IL6;
- Secret/Top Secret frameworks;
- framework switching;
- automatic Moderate → IL4 conversion;
- POA&M;
- assessment management;
- DoD assessment findings;
- AO workflows;
- certification/authorization state;
- DoD SSP Word/PDF generation;
- automated AWS/Prowler collection;
- cloud telemetry;
- cross-framework mappings;
- universal control ontology;
- runtime source downloads;
- custom framework import;
- conditional privacy framework engine;
- Continuous ATO.

Keep 06A focused on correct IL4 framework support.

---

# 29. Completion report

At completion report:

1. Executive summary
2. Authoritative IL4 model implemented
3. Source versions
4. Correct FedRAMP/NIST base
5. Exact IL4 delta
6. Added controls/enhancements
7. Parameter overrides
8. Supplemental DoD requirements
9. Privacy behavior
10. Framework ID
11. FrameworkProvider changes
12. Overlay architecture
13. Source provenance/pinning
14. Licensing conclusion
15. Project creation/presentation
16. Control Browser behavior
17. Evidence behavior
18. Coverage behavior
19. Workflow/collaboration behavior
20. OSCAL/export behavior
21. Database/schema changes
22. ADR changes
23. Files added
24. Files modified
25. Tests added/modified
26. Existing framework regression status
27. Security regression status
28. Moderate → IL4 transition recommendation
29. Remaining limitations
30. Recommendations for IL5 / authorization package work
31. Verification results

---

# Expected 06A outcome

At the end of 06A:

- DoD Impact Level 4 is a selectable immutable Project framework;
- its requirement population is derived from current authoritative DoD sources;
- the exact relationship to FedRAMP/NIST Moderate is documented;
- DoD-specific control additions, parameters, and supplemental requirements are represented accurately;
- provenance is retained;
- no historical FedRAMP+ assumption is encoded without verification;
- existing Low/Moderate/High/CMMC Projects remain unchanged;
- Evidence, collaboration, review, workflows, and coverage operate against IL4;
- OSCAL behavior is accurate rather than fabricated;
- the architecture is positioned for future IL5 support and DoD SSP package generation without pretending IL4 framework selection equals authorization.
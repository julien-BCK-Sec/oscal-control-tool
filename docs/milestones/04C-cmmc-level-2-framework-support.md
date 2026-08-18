# Milestone 04C — CMMC Level 2 Framework Support

## Status

Implemented.

## Purpose

Extend Control Freak beyond the NIST SP 800-53 Rev. 5 Low/Moderate/High profile family by adding CMMC Level 2 as the first meaningfully different supported framework.

Milestones 04A and 04B established and hardened:

- Project-owned immutable framework identity;
- `projects.framework_id` as the authoritative runtime framework identity;
- a FrameworkRegistry / FrameworkProvider boundary;
- pinned and deterministic framework content;
- NIST SP 800-53 Rev. 5 Low, Moderate, and High;
- framework-aware control loading;
- framework-aware Evidence coverage;
- framework-aware collaboration and workflows;
- framework-aware OSCAL SSP export;
- Project-framework control-ID validation;
- framework-aware Project UX;
- explicit separation between accidental Moderate assumptions and intentionally NIST-specific behavior.

04C tests whether those abstractions can support a framework with different source material, identifiers, terminology, and compliance context without redesigning the application around CMMC.

The objective is **framework support**, not CMMC assessment or certification management.

---

# Product intent

A user should be able to create a Project and choose:

    CMMC Level 2

The Project should then expose the appropriate CMMC Level 2 requirement population and allow the existing Control Freak capabilities to operate against those requirements where the concepts are applicable:

- implementation narratives;
- ownership;
- status/review workflow;
- assignments;
- discussions;
- activity;
- Evidence association;
- Evidence versions;
- Evidence coverage;
- Evidence freshness;
- Evidence inventory/reporting;
- workflow automation.

The application must clearly identify the Project as CMMC Level 2.

Control Freak must **not** imply that Evidence coverage, implementation status, or completion of requirements means:

- CMMC certification;
- CMMC assessment success;
- a MET determination;
- audit readiness;
- authorization by a C3PAO;
- authorization by the Department of Defense.

Those are separate assessment/compliance concepts.

---

# Critical terminology rule

Existing application/domain types may use the term `control` generically.

Do not automatically rename the entire application from "controls" to "requirements" in 04C.

However, user-facing framework metadata and presentation should use terminology appropriate to the selected framework where practical.

The architectural review must determine whether the existing generic `controlId` / framework-control abstraction can safely represent CMMC Level 2 requirements without introducing a universal control ontology.

Prefer the smallest compatible extension.

---

# Mandatory source and architecture review — STOP before implementation

WP1 is mandatory.

Do not implement CMMC support until the authoritative source model has been established and approved.

CMMC and its relationship to NIST SP 800-171 have changed over time. Do not assume that historical descriptions, older 110-requirement mappings, CMMC 2.0 drafts, or previous NIST revisions represent the current framework.

Before implementation:

1. determine the current authoritative CMMC Program version/rule applicable to Level 2;
2. determine the authoritative NIST SP 800-171 revision used by current CMMC Level 2 requirements;
3. determine the exact Level 2 requirement population;
4. determine whether CMMC adds requirements beyond the referenced NIST SP 800-171 population;
5. determine the authoritative identifiers and titles;
6. determine the relationship between:
   - CMMC Level 2;
   - NIST SP 800-171;
   - NIST SP 800-171A;
   - assessment objectives;
   - CMMC assessment requirements;
7. determine which of those concepts belong in 04C and which belong in later Assessment Management;
8. identify authoritative machine-readable source material if available;
9. determine licensing/copyright implications for bundling framework content;
10. determine whether authoritative source material can be pinned and built deterministically without runtime network access.

Prefer primary sources such as:

- U.S. Department of Defense;
- official CMMC Program materials;
- Cyber AB only where it is authoritative/relevant to the specific information;
- NIST publications and official NIST machine-readable content.

Do not build the framework definition from blogs, consulting sites, Wikipedia, or secondary CMMC summaries.

Record exact source URLs, publication/revision identifiers, and pinning/version information in the milestone/architecture documentation.

---

# Mandatory STOP report

After completing WP1 source and architecture research, STOP before implementation and return:

1. Current CMMC Level 2 model
2. Governing CMMC rule/version
3. Applicable NIST SP 800-171 revision
4. Requirement count
5. Requirement identifiers
6. CMMC-specific additions or differences, if any
7. Relationship to NIST SP 800-171A
8. Relationship to CMMC assessment objectives
9. Authoritative source documents
10. Machine-readable sources available
11. Licensing/content-distribution considerations
12. Proposed framework ID
13. Proposed framework metadata
14. Proposed internal representation
15. Proposed hierarchy/grouping
16. Terminology implications
17. FrameworkProvider compatibility
18. Existing domain assumptions that conflict with CMMC
19. Evidence Coverage compatibility
20. Workflow/collaboration compatibility
21. Export implications
22. Assessment concepts explicitly deferred
23. Database/schema implications
24. ADR implications
25. Exact implementation plan
26. Material decisions requiring approval

Do not implement WP2+ until this review is approved.

---

# 1. Framework identity

04C should introduce one durable opaque framework identifier for CMMC Level 2.

The exact identifier must be proposed during WP1 after the authoritative model is verified.

Expected shape may resemble:

    cmmc-level-2-<version>

but do not choose or persist a version identifier until the governing source/version has been established.

Framework IDs are durable application identity, not merely display labels.

Do not encode unstable marketing terminology into the identifier unnecessarily.

The framework registry should provide structured metadata such as:

- framework ID;
- display name;
- short name;
- framework family;
- level;
- source/revision;
- authoritative source reference;
- control/requirement terminology;
- hierarchy/group metadata where appropriate.

---

# 2. Project framework model

The 04A/04B invariant remains:

    Project
       ↓
    frameworkId
       ↓
    FrameworkRegistry
       ↓
    FrameworkProvider

A Project still has exactly one framework/profile.

Framework identity remains immutable after Project creation.

Operational identity remains:

    (projectId, controlId)

unless WP1 proves that CMMC cannot safely fit that invariant.

Do not add `frameworkId` redundantly to:

- ControlRecord;
- Evidence associations;
- assignments;
- discussions;
- activity;
- workflow state;
- other Project-owned operational rows.

If CMMC cannot safely fit `(projectId, controlId)`, STOP rather than silently introducing a second identity system.

---

# 3. CMMC vs. NIST SP 800-171

Do not model CMMC Level 2 as an arbitrary copy of NIST SP 800-171 without documenting their relationship.

WP1 must establish whether the appropriate representation is conceptually:

    CMMC Level 2
         ↓
    references/adopts
         ↓
    NIST SP 800-171 requirements

or whether the current governing CMMC model requires additional/different requirement semantics.

Preserve source provenance.

If the underlying requirement originates in NIST SP 800-171, the framework representation should retain that fact rather than pretending Control Freak invented a CMMC-specific requirement.

Do not create duplicate universal-control identities merely to support future mappings.

---

# 4. Assessment concepts are separate

CMMC introduces assessment concepts that are materially different from the existing Evidence Coverage model.

04C must not collapse those concepts together.

Existing Control Freak Evidence Coverage answers approximately:

    Is required active Evidence associated with this framework item?

It does NOT answer:

    Has this CMMC requirement been assessed as MET?

These must remain separate.

Do not add in 04C:

- MET / NOT MET determinations;
- assessment objective scoring;
- assessor judgments;
- assessment instances;
- C3PAO workflows;
- certification state;
- conditional certification;
- final certification;
- assessment findings;
- assessment evidence sufficiency judgments;
- POA&M eligibility;
- POA&M scoring;
- SPRS scoring;
- CMMC score calculations;
- affirmation;
- assessment closeout.

Those belong in Assessment Management.

---

# 5. NIST SP 800-171A

NIST SP 800-171A assessment procedures/objectives are not equivalent to framework requirements.

If current CMMC Level 2 assessment methodology relies on 800-171A-derived assessment objectives, document that relationship during WP1.

Do not automatically import all assessment objectives into the existing framework-control model.

Preferred conceptual separation:

    Framework Requirement
           │
           ├── implementation
           ├── Evidence
           └── coverage

    Assessment
           │
           ├── assessment objectives
           ├── Evidence evaluation
           ├── assessor judgment
           └── determination

04C implements the first side.

A later Assessment milestone implements the second.

---

# 6. FrameworkProvider

Extend the existing FrameworkProvider/FrameworkRegistry architecture rather than adding a parallel CMMC subsystem.

The provider must expose enough normalized information for existing Project functionality to operate.

Review whether the current normalized framework item requires:

- ID;
- title;
- description;
- family/group;
- parent/child relationship;
- sort order;
- metadata.

Make only the smallest generalization required.

Do not build:

- a universal framework DSL;
- a standards ontology;
- a cross-framework mapping engine;
- arbitrary framework import;
- a plugin marketplace.

If the existing provider interface contains assumptions that fundamentally only make sense for OSCAL/NIST 800-53, identify those explicitly during WP1.

---

# 7. Hierarchy and grouping

CMMC/NIST SP 800-171 grouping may differ from the existing 800-53 control-family/enhancement hierarchy.

Do not fake 800-53 enhancements.

Determine the authoritative grouping model during WP1.

If requirements are grouped into families/domains, represent those groups accurately.

The Control Browser should continue to provide useful navigation without requiring every framework to share identical hierarchy semantics.

Prefer normalized concepts such as:

    group
       ↓
    framework item

where possible.

Do not remove enhancement support required by existing NIST SP 800-53 frameworks.

---

# 8. Framework item identifiers

Preserve authoritative requirement identifiers.

Do not invent sequential Control Freak IDs as the primary visible identity if authoritative identifiers exist.

Identifiers must be stable enough to support:

- ControlRecords;
- Evidence associations;
- assignments;
- discussions;
- activity;
- workflows;
- named versions;
- exports.

Validate supplied IDs against the Project framework using the 04B control-validation boundary.

CMMC Projects must reject 800-53-only IDs that do not exist in the selected framework.

800-53 Projects must likewise remain isolated from CMMC/800-171 requirement IDs.

---

# 9. Project creation

Add CMMC Level 2 to the existing framework selector.

Do not make it the default.

NIST SP 800-53 Rev. 5 Moderate remains the default unless separately changed by product decision.

The UI should distinguish framework families clearly.

For example:

    NIST SP 800-53 Rev. 5
      ○ Low
      ● Moderate
      ○ High

    CMMC
      ○ Level 2

Exact presentation should follow the existing design system.

Do not imply that choosing CMMC Level 2 means the organization is certified or pursuing a particular assessment type.

---

# 10. Project presentation

CMMC Projects should clearly display their selected framework.

Use registry metadata rather than framework-ID conditionals.

Expected human-readable presentation:

    CMMC Level 2

Where useful, supporting metadata may indicate the underlying NIST publication/revision.

Avoid excessive standards/legal text in normal Project surfaces.

---

# 11. Control Browser

The Control Browser must operate against the selected CMMC framework without pretending CMMC items are 800-53 controls/enhancements.

Review:

- grouping;
- search;
- selection;
- item titles;
- IDs;
- implementation editing;
- status;
- review status;
- assignments;
- discussions;
- Evidence;
- coverage badges.

Avoid hard-coded 800-53 family/enhancement presentation.

Do not regress existing Low/Moderate/High presentation.

---

# 12. ControlRecord compatibility

Preserve lazy ControlRecord behavior.

A framework item should not require a persisted ControlRecord merely to appear in the browser.

When operational state is created:

    (projectId, controlId)

remains the identity.

Existing ControlRecord concepts such as:

- implementation narrative;
- implementation status;
- review status;
- ownership/due-date behavior where currently supported

should work for CMMC requirements unless WP1 identifies a semantic incompatibility.

Do not reinterpret implementation/review status as a CMMC assessment determination.

---

# 13. Evidence

Existing Evidence architecture remains unchanged.

CMMC requirements may:

- associate existing Project Evidence;
- create Evidence;
- upload immutable Evidence Versions;
- use Evidence Picker;
- display Evidence freshness;
- participate in Evidence Coverage.

Evidence remains Project-scoped.

Do not add CMMC-specific Evidence storage.

Do not duplicate Evidence records merely because the Project uses CMMC.

---

# 14. Evidence Coverage

03D semantics remain unchanged.

Coverage means Evidence presence according to the existing requirement configuration.

It is not:

- CMMC scoring;
- CMMC assessment status;
- MET/NOT MET;
- certification readiness;
- assessor sufficiency.

The UI must avoid language that could reasonably imply otherwise.

Coverage queries must derive their framework population from the CMMC Project's selected framework.

No persisted coverage state.

---

# 15. Collaboration

Existing collaboration features should work against CMMC requirement IDs:

- assignments;
- discussions;
- mentions;
- activity;
- notifications.

The 04B Project-framework control validation must remain enforced.

Do not introduce CMMC-specific collaboration tables.

---

# 16. Workflow automation

Existing workflow triggers/actions should work where their semantics are framework-independent.

Examples:

- assign user;
- assign role;
- set due date;
- change implementation/review status where appropriate.

Workflow control IDs must be validated against the selected CMMC framework.

Do not introduce:

- CMMC scoring actions;
- assessment determinations;
- certification workflows.

Those belong later.

---

# 17. Search

Framework/control search should work for CMMC IDs, titles, and descriptions using the existing framework search behavior.

Do not assume identifiers begin with:

    ac-
    ia-
    cm-

Do not implement a new search product.

---

# 18. Reporting

Existing lightweight reporting should remain available where applicable:

- Evidence Coverage;
- Evidence inventory CSV.

Use framework-appropriate labels.

The report must not claim:

- CMMC certification;
- CMMC assessment completion;
- CMMC score;
- MET/NOT MET.

Do not implement a CMMC assessment report in 04C.

---

# 19. OSCAL

Do not assume CMMC requires the same OSCAL SSP export behavior as NIST SP 800-53 profile Projects.

WP1 must determine whether existing OSCAL export can accurately represent the selected framework using authoritative OSCAL artifacts.

Possible outcomes:

1. existing export can support CMMC accurately;
2. export can support the underlying NIST SP 800-171 representation with clear metadata;
3. CMMC OSCAL export should be unavailable until a later milestone.

Accuracy is more important than forcing feature parity.

Do not fabricate an OSCAL profile reference.

Do not generate misleading SSP output merely to keep the Export button enabled.

If no authoritative/accurate representation is available, disable or omit OSCAL export for CMMC Projects with clear user-facing explanation.

Existing 800-53 OSCAL export must remain unchanged.

---

# 20. Framework source provenance

Every built-in framework definition must have documented provenance.

For CMMC Level 2 record:

- governing source;
- publication/rule version;
- effective/current version as appropriate;
- underlying NIST publication;
- machine-readable source, if any;
- retrieval/pinning information;
- integrity information where practical;
- transformation/derivation process.

Framework content must be deterministic at build/runtime.

No runtime download from NIST, DoD, Cyber AB, or another standards site.

---

# 21. Licensing and redistribution

WP1 must explicitly review whether the authoritative source content may be bundled/redistributed in the repository/application.

NIST publications are generally public U.S. government works, but do not extrapolate that assumption to every CMMC-related source.

Do not bundle proprietary training, guidance, assessment materials, or third-party mappings.

If authoritative CMMC content has redistribution constraints, propose a compliant representation before implementation.

STOP if licensing prevents the intended implementation.

---

# 22. Database/schema

Prefer no schema change.

The existing Project/framework/control operational model should support CMMC if the abstraction is sound.

Do not add CMMC-specific columns to general operational tables.

Do not add:

- `cmmc_level` to Project if frameworkId already represents the selection;
- assessment columns to ControlRecord;
- MET/NOT MET columns;
- scoring columns;
- certification columns.

If a schema change is genuinely required for generic framework support, explain it during WP1 before implementation.

---

# 23. Existing Project compatibility

Existing Projects must remain unchanged.

Preserve:

- Low;
- Moderate;
- High;
- framework identity;
- ControlRecords;
- Evidence;
- Evidence Versions;
- assignments;
- discussions;
- activity;
- workflows;
- named versions;
- exports.

No existing Project should silently become CMMC.

No migration should reinterpret existing control IDs.

---

# 24. Demo/bootstrap

Do not change the existing default demo Project from Moderate.

If useful, add a separate optional CMMC demo fixture only if it is small and clearly useful for testing/product demonstration.

Do not make seed/bootstrap substantially more complex solely for 04C.

---

# 25. Security

Preserve all existing authorization and tenant-isolation behavior.

Framework identity is not an authorization boundary.

Authorization order remains:

    authenticate
       ↓
    resolve resource/Project
       ↓
    organization membership/permission
       ↓
    framework/control validation
       ↓
    mutation

Do not expose another tenant's Project/framework state through control-validation errors.

Preserve:

- CSV formula neutralization;
- notification resource-organization authorization;
- recipient ownership;
- Evidence route authorization;
- Project/org isolation.

---

# 26. Performance

Framework content remains in-process/pinned reference data.

Do not copy all CMMC requirements into PostgreSQL simply to display them.

Preserve lazy operational records.

Do not add runtime standards downloads.

Framework loading/search should remain inexpensive and deterministic.

---

# 27. Accessibility

New framework selection/presentation must use existing accessible design-system patterns.

The CMMC option must be:

- keyboard accessible;
- properly labelled;
- understandable without color;
- distinguishable from the NIST 800-53 profiles.

Do not introduce a new UI library.

---

# 28. ADR

Expect an ADR amendment or new ADR only if WP1 identifies a durable architectural decision not already covered by ADR-026.

Potential ADR-worthy topics include:

- framework terminology abstraction;
- source/provenance model;
- separation of framework requirements from assessment objectives.

Do not create an ADR merely to say "CMMC was added."

If ADR-026 already covers the necessary provider/identity behavior, amend it only where clarification is needed.

---

# 29. Explicitly out of scope

Do NOT implement in 04C:

- CMMC Level 1 unless required by an approved architecture decision;
- CMMC Level 3;
- CMMC certification tracking;
- assessment instances;
- C3PAO workflows;
- assessor accounts/roles;
- MET/NOT MET;
- assessment objective evaluation;
- SPRS scoring;
- CMMC scoring;
- POA&M;
- conditional certification;
- final certification;
- affirmation;
- assessment findings;
- assessment reports;
- CUI discovery/classification;
- CUI enclave/scoping tools;
- asset inventory for CMMC scope;
- ESP/MSP/MSSP assessment semantics;
- NIST CSF;
- CIS;
- ISO;
- PCI DSS;
- cross-framework mappings;
- universal control ontology;
- framework switching;
- custom framework import;
- runtime standards downloads.

Do not silently pull Assessment Management into 04C.

---

# Work packages

## WP1 — Authoritative source + architecture review

Research and document:

- current governing CMMC Level 2 model;
- applicable CMMC rule/version;
- applicable NIST SP 800-171 revision;
- requirement population;
- authoritative identifiers;
- NIST SP 800-171A relationship;
- CMMC assessment-objective relationship;
- authoritative machine-readable sources;
- licensing/redistribution;
- source pinning;
- current FrameworkProvider compatibility;
- hierarchy/grouping;
- terminology;
- OSCAL implications;
- schema implications;
- ADR implications.

Audit the application for assumptions that block a non-800-53 framework.

**STOP and obtain approval before WP2.**

---

## WP2 — Framework source and provider

After approval:

- add pinned authoritative source material or deterministic derivation;
- add CMMC Level 2 provider;
- add registry metadata;
- implement minimal generic provider changes approved in WP1;
- provenance documentation;
- provider/derivation tests.

---

## WP3 — Project creation and framework presentation

- add CMMC Level 2 to framework selection;
- preserve Moderate default;
- registry-driven presentation;
- Project list/overview/workspace presentation;
- accessibility;
- tests.

---

## WP4 — Control Browser and operational state

- CMMC grouping/navigation;
- requirement identifiers/titles;
- implementation editing;
- review status;
- control-ID validation;
- assignments/discussions/activity;
- preserve lazy ControlRecords;
- tests.

---

## WP5 — Evidence, coverage, and workflows

- Evidence association;
- Evidence Picker;
- coverage;
- freshness;
- reporting;
- workflows;
- framework-appropriate copy;
- tests.

Do not add assessment semantics.

---

## WP6 — Export and regression

- determine approved CMMC OSCAL behavior from WP1;
- implement only accurate export behavior;
- preserve 800-53 exports;
- cross-framework isolation tests;
- security regression tests.

---

## WP7 — Documentation and verification

Update:

- architecture;
- current state;
- roadmap;
- decisions/ADR if necessary;
- framework provenance;
- milestone status;
- intentionally deferred CMMC assessment concepts.

Run full verification.

---

# Required tests

At minimum verify:

## Framework

- CMMC Level 2 resolves from registry;
- authoritative requirement count is correct;
- representative requirement IDs/titles are correct;
- grouping is correct;
- unknown IDs fail;
- deterministic source derivation.

## Project

- CMMC Level 2 Project creation succeeds;
- Moderate remains default;
- framework identity is immutable;
- save/restore preserves CMMC identity;
- named versions cannot switch framework.

## Isolation

- CMMC Project cannot accept an 800-53-only control ID;
- 800-53 Project cannot accept a CMMC/800-171-only requirement ID;
- valid CMMC requirement IDs work;
- lazy ControlRecord behavior works.

## UI/domain

Representative tests for:

- browser population;
- implementation state;
- review state;
- assignments;
- discussions/activity where meaningful.

## Evidence

- association;
- picker/search;
- coverage;
- freshness;
- inventory CSV.

## Workflow

- valid CMMC requirement action works;
- invalid requirement ID is rejected before operational state is created.

## Export

Test the exact export behavior approved after WP1.

Existing Low/Moderate/High OSCAL tests must remain green.

## Security

Preserve regression coverage for:

- tenant isolation;
- notification authorization;
- CSV formula neutralization;
- Evidence authorization.

---

# Verification

Before declaring 04C complete:

    npm test
    npm run lint
    npm run build

All must pass.

Do not create commits unless explicitly requested.

---

# Completion report

At completion report:

1. Executive summary
2. Authoritative CMMC model implemented
3. Governing CMMC source/version
4. NIST SP 800-171 relationship
5. Requirement population/count
6. Source provenance and pinning
7. Licensing/redistribution conclusion
8. Framework ID and metadata
9. FrameworkProvider changes
10. Hierarchy/grouping representation
11. Terminology changes
12. Project creation/presentation changes
13. Control Browser changes
14. Operational control-ID behavior
15. Evidence behavior
16. Coverage behavior
17. Workflow/collaboration behavior
18. OSCAL/export behavior
19. Database/schema changes
20. ADR changes
21. Files added
22. Files modified
23. Tests added/modified
24. Security regression status
25. Existing framework regression status
26. CMMC assessment concepts explicitly deferred
27. Remaining limitations
28. Recommendations for Assessment Management
29. Verification results

---

# Expected 04C outcome

At the end of 04C:

- CMMC Level 2 is a selectable Project framework;
- its definition comes from verified authoritative and pinned source material;
- requirement identifiers and grouping are accurate;
- the existing FrameworkRegistry/FrameworkProvider architecture supports it without a CMMC-specific parallel subsystem;
- framework identity remains Project-owned and immutable;
- `(projectId, controlId)` remains valid operational identity unless WP1 explicitly establishes otherwise;
- Control Browser works with CMMC requirements;
- implementation/review workflow works without pretending to be a CMMC assessment;
- assignments/discussions/activity work;
- Evidence can be associated with CMMC requirements;
- Evidence Coverage works but remains explicitly distinct from CMMC assessment status;
- workflow automation works for applicable generic operations;
- invalid cross-framework IDs are rejected;
- existing Low/Moderate/High behavior remains intact;
- OSCAL behavior is accurate rather than artificially forced;
- no CMMC certification or assessment claims are introduced;
- the architecture is ready for a later Assessment Management milestone to add assessment objectives, assessor judgments, findings, MET/NOT MET determinations, and related CMMC assessment semantics.
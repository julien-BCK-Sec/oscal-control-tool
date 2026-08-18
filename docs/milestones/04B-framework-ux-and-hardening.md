# Milestone 04B — Framework UX and Runtime Hardening

## Status

Implemented.

## Purpose

Complete the runtime and user-experience hardening of the multi-framework architecture introduced in Milestone 04A.

Milestone 04A established:

- durable Project framework identity;
- a framework registry/provider boundary;
- NIST SP 800-53 Rev. 5 Low, Moderate, and High support;
- framework-aware control loading;
- framework-aware Evidence coverage;
- framework-aware OSCAL SSP export;
- immutable framework identity after Project creation;
- compatibility for existing Moderate projects.

04B is not primarily about adding another framework.

Its purpose is to make sure framework identity is consistently respected throughout the application, eliminate remaining accidental Moderate/single-framework assumptions, improve the framework-selection and framework-display UX, strengthen control-identity validation, and resolve framework-related correctness debt discovered during 04A and subsequent review.

At the end of 04B, Low, Moderate, and High projects should behave as first-class project types throughout the application rather than as variations supported only by the framework-loading layer.

---

# Product intent

Users should not need to understand Control Freak's internal framework architecture.

A user should simply be able to:

1. create a Project;
2. choose an available framework/profile;
3. see clearly which framework/profile the Project uses;
4. work with the appropriate control population;
5. use collaboration, workflows, Evidence, coverage, reporting, and OSCAL export normally;
6. trust that operations cannot accidentally reference controls outside the Project's selected framework.

The product should not expose framework implementation details such as provider class names, profile file paths, registry keys, or OSCAL source internals unless those details are explicitly useful.

---

# Existing architecture

Before implementation, review at minimum:

- `docs/architecture.md`
- `docs/current-state.md`
- `docs/decisions.md`
- `docs/roadmap.md`
- `docs/milestones/04A-multi-framework-foundation.md`
- ADR-002
- ADR-026
- Project domain/document model
- Project persistence
- FrameworkRegistry / FrameworkProvider
- project creation
- project list/workspace/overview
- ControlBrowser
- ControlRecord actions/services
- assignments
- discussions
- notifications
- workflow actions/executors
- Evidence association
- Evidence Picker/search
- Evidence coverage
- Evidence inventory CSV
- named versions / restore
- OSCAL SSP export
- demo/bootstrap tooling

Review the actual implementation rather than assuming 04A documentation perfectly reflects the final code.

---

# Mandatory architectural review — STOP before implementation

Before implementing 04B, perform a focused architectural/runtime audit.

The audit should answer:

1. Where do implicit Moderate or single-framework assumptions remain?
2. Are all Project runtime paths resolving framework identity from the Project?
3. Are all control-scoped writes validating control identity where appropriate?
4. Are there paths where arbitrary `controlId` values can still enter operational state?
5. Is framework identity displayed consistently enough for users to understand the Project they are editing?
6. Is Project creation framework selection understandable and safe?
7. Is `projects.framework_id` now the correct canonical runtime source of framework identity?
8. Can `project_json.frameworkId` be safely removed as an independent runtime source of truth?
9. What compatibility implications would changing the document representation have for:
   - named versions;
   - restore;
   - existing Project documents;
   - tests;
   - SQLite cutover tooling, if still retained?
10. Are there any framework-specific assumptions that should intentionally remain NIST-specific rather than being generalized?
11. Does any proposed change conflict with ADR-002 or ADR-026?

Search for both explicit and implicit assumptions.

Examples include:

    moderate
    Moderate
    nist-sp-800-53-rev5-moderate
    FRAMEWORK
    FRAMEWORK_CONTROLS
    frameworkId
    framework_id
    ac-
    control family assumptions
    fixed control counts
    profile paths
    catalog paths

Do not mechanically remove every occurrence.

Tests, migration compatibility code, pinned NIST provider implementations, and explicitly Moderate-specific fixtures may legitimately contain Moderate references.

Classify findings as:

- runtime bug;
- correctness debt;
- UX issue;
- intentional framework-specific behavior;
- test fixture;
- documentation;
- no action required.

If resolving the dual framework identity representation or another finding requires a material document/persistence compatibility decision, **STOP before implementation** and present the options and recommendation.

---

# 1. Canonical Project framework identity

ADR-026 established that framework identity belongs to the Project and is immutable after creation.

04B should ensure there is one authoritative runtime source.

The expected direction is:

    projects.framework_id

as the authoritative persisted Project framework identity.

The application should not depend on two independently meaningful framework identity values.

Currently, framework identity may also appear inside serialized Project document state as:

    project_json.frameworkId

This duplication was previously assessed as a correctness/robustness concern rather than a security vulnerability because application write paths keep the values synchronized.

04B should determine whether the JSON copy can now be:

- removed from new document state;
- retained only for backward compatibility;
- ignored during runtime loading;
- normalized during load/save;
- or otherwise reduced to a non-authoritative compatibility field.

Do not silently introduce a Project document schema break.

Existing Project documents and named versions must remain loadable unless a deliberate migration is approved.

---

# 2. Framework identity immutability

Framework/profile switching for an established Project remains out of scope.

The following must remain true:

- framework is selected during Project creation;
- existing Projects retain their framework;
- save/autosave cannot change framework identity;
- named-version restore cannot change framework identity;
- direct client input cannot bypass the immutability rule;
- Project document content cannot override the authoritative framework identity.

If framework identity appears in update DTOs where it is no longer necessary, simplify those contracts where safe.

Do not implement a framework-switch operation.

---

# 3. Project creation UX

Review the 04A framework selection UI.

The creation experience should make the choice understandable without requiring knowledge of registry IDs.

For the current built-in choices, users should clearly see:

- NIST SP 800-53 Rev. 5
- Low
- Moderate
- High

Moderate should remain the default selection unless there is a strong product reason to change it.

The selected option must still be explicitly represented in the create request and validated server-side.

Do not infer Moderate merely because the client omitted a framework value unless backward-compatible API behavior specifically requires it.

The UI should make clear that the framework/profile cannot currently be changed after Project creation.

Avoid unnecessary warning dialogs.

A concise note such as:

    Framework cannot be changed after project creation.

is sufficient if needed.

---

# 4. Project framework visibility

Users should be able to determine the selected framework/profile after entering a Project.

Review:

- project list/cards;
- Project Overview;
- Project Workspace;
- Project settings/metadata surfaces;
- control workspace headers where appropriate.

Do not repeat the full framework name everywhere.

Prefer a consistent human-readable presentation such as:

    NIST SP 800-53 Rev. 5 — Moderate

or an equivalent existing design-system treatment.

A compact badge may be appropriate in some contexts:

    Moderate

provided the surrounding UI makes the framework clear.

Use existing design-system primitives.

Do not create a new visual system solely for framework identity.

---

# 5. Framework-aware runtime resolution

Audit runtime paths for use of global/default framework data where Project-specific resolution is required.

Project-scoped operations should resolve:

    Project
       ↓
    frameworkId
       ↓
    FrameworkRegistry
       ↓
    FrameworkProvider / Framework

rather than importing a global Moderate framework.

Pay particular attention to:

- project pages;
- control browsing;
- ControlRecord operations;
- assignments;
- discussions;
- Evidence;
- coverage;
- inventory/reporting;
- workflows;
- named versions;
- OSCAL export.

Do not replace legitimate framework-independent code with unnecessary registry lookups.

---

# 6. Control identity validation

ADR-026 establishes the operational identity invariant:

    (projectId, controlId)

Framework identity is derived from Project.

`controlId` must not be treated as globally meaningful across all frameworks.

04B should harden control-scoped write boundaries so an invalid control ID cannot be introduced into Project operational state through normal application APIs.

At minimum audit:

- ControlRecord create/update;
- Evidence association;
- Evidence create-with-links;
- assignments;
- discussions;
- workflow actions that target controls;
- control activity;
- other control-scoped mutations.

Where a user/API supplies a `controlId`, validate that the ID exists in the Project's selected framework before creating new operational state.

Avoid duplicating validation at every layer if a shared authorized/domain boundary can enforce the invariant safely.

Do not require existing ControlRecords to exist before a framework control can receive operational state; lazy ControlRecord behavior must remain intact.

---

# 7. Invalid or stale control references

Determine how the application behaves if persisted operational data contains a control ID that does not exist in the Project's selected framework.

This could arise from:

- historical bugs;
- manual database modification;
- legacy migration;
- future framework-content changes;
- corrupted state.

Normal writes should prevent this condition.

Runtime reads should fail safely and predictably.

Do not silently reinterpret an unknown control ID as another framework's control.

Do not delete operational data automatically.

If stale references require a diagnostic/reporting mechanism, document that as future work unless a minimal implementation is clearly warranted.

---

# 8. Framework content integrity

Low, Moderate, and High definitions must remain:

- pinned;
- deterministic;
- authoritative;
- unavailable through runtime network dependency.

Review registry startup/resolution behavior.

The application should fail clearly if a configured built-in framework definition cannot be loaded or derived.

Do not silently substitute Moderate when another persisted framework ID fails to resolve.

Unknown persisted framework identity should fail closed as a correctness error.

---

# 9. Coverage and Evidence

03D Evidence Coverage semantics must remain unchanged.

Only the Project's framework-derived control population determines the coverage denominator.

Preserve:

- `required`
- `optional`
- `not_required`
- active Evidence eligibility
- draft Evidence attention behavior
- freshness derivation
- no persisted coverage state
- no compliance score

Evidence remains Project-scoped.

Do not introduce:

- cross-framework Evidence;
- organization-wide Evidence;
- Evidence approval;
- framework mappings.

Review Evidence UI copy for accidental Moderate assumptions.

---

# 10. Workflow compatibility

Workflow automation predates multi-framework support.

Audit workflow triggers/actions that reference:

- control IDs;
- control status;
- Evidence;
- framework-derived controls.

Existing workflow behavior should continue for Low, Moderate, and High Projects.

If a workflow action supplies a control ID, ensure the same Project-framework validity invariant is respected.

Do not redesign the workflow engine.

Do not introduce framework-specific workflow syntax unless required.

---

# 11. Collaboration compatibility

Assignments, discussions, mentions, activity, and notifications should continue to work normally for all supported Project frameworks.

Audit for:

- Moderate-specific labels;
- global framework lookups;
- assumptions about NIST family IDs;
- invalid control ID writes.

Do not redesign collaboration features.

The notification security remediation completed after 04A must remain intact.

Do not reintroduce membership-order-dependent authorization.

---

# 12. OSCAL export

Low, Moderate, and High SSP export must remain framework-aware.

Review for residual Moderate assumptions in:

- profile references;
- metadata;
- imports;
- control implementation generation;
- tests.

Do not broaden 04B into general OSCAL interoperability work.

The following remain future work:

- SSP import;
- portable OSCAL packages;
- general semantic cross-reference validation;
- FedRAMP policy evaluation;
- arbitrary OSCAL catalog/profile support beyond approved built-in definitions.

---

# 13. Named versions and restore

Framework identity is immutable Project identity.

Named versions must not become a framework-switch mechanism.

If framework identity remains represented inside historical serialized Project documents for compatibility, restore must ignore or normalize that value against the live Project's authoritative framework identity.

Add or preserve regression tests proving:

- restoring a version cannot change framework identity;
- old Moderate snapshots remain restorable;
- Low/High snapshots remain associated with the correct live Project framework;
- mismatched/tampered document framework identity cannot override the Project identity.

---

# 14. Demo and bootstrap

Demo/bootstrap behavior should remain deterministic.

The existing demo Project should remain explicitly Moderate unless there is a documented reason to change it.

Do not rely on implicit framework defaults inside seed code.

If test factories frequently construct Projects, prefer an explicit reusable Moderate test default rather than scattering hard-coded registry IDs everywhere.

---

# 15. Framework presentation helpers

If framework display-name formatting is currently duplicated, introduce a small presentation helper or registry metadata access pattern.

Avoid UI code such as:

    frameworkId === "nist-sp-800-53-rev5-moderate"
      ? "Moderate"
      : ...

The registry should provide appropriate metadata.

Do not put React/presentation concerns into the framework domain/provider layer.

---

# 16. Remaining NIST-specific assumptions

04B is not intended to make Control Freak universally framework-agnostic.

Some concepts may legitimately remain NIST/OSCAL-specific because the only currently supported framework family is NIST SP 800-53 Rev. 5.

Document these intentionally retained assumptions.

Examples may include:

- control families;
- enhancements;
- OSCAL profile derivation;
- NIST catalog structure;
- SSP export;
- control identifier presentation.

The goal is to distinguish:

    accidental Moderate assumption

from:

    intentional NIST-family implementation

This distinction is important before 04C introduces a meaningfully different framework family.

---

# 17. Security requirements

04B must preserve the application's existing authorization model.

Framework identity is not an authorization boundary.

Tenant isolation continues to derive from:

- authenticated user;
- resource;
- organization membership;
- permission.

Do not use framework identity as a substitute for Project/org authorization.

Control validation must occur only after the caller has been authorized for the relevant Project/resource.

Do not expose whether another organization's Project or control exists through validation errors.

The security remediations completed after 04A must remain intact:

- CSV spreadsheet-formula neutralization;
- resource-organization notification authorization.

---

# 18. Performance

Framework resolution should remain inexpensive and deterministic.

Do not:

- parse every framework for every request unnecessarily;
- add distributed caching;
- copy complete framework catalogs into PostgreSQL;
- add runtime network fetches.

Existing framework/provider caching may be reused where safe.

Coverage must remain batched and avoid N+1 behavior.

---

# 19. Database/schema changes

A database migration is not automatically required for 04B.

If the canonical framework identity cleanup requires a schema or document migration, explain why during the architectural review.

Do not remove `projects.framework_id`.

Do not add `framework_id` redundantly to operational tables merely to simplify queries.

Any migration must:

- preserve existing Low/Moderate/High Projects;
- preserve ControlRecords;
- preserve Evidence links;
- preserve assignments/discussions/activity;
- preserve named versions;
- preserve audit history;
- remain forward-only.

---

# 20. Explicitly out of scope

Do NOT implement in 04B:

- additional framework families;
- NIST SP 800-171;
- NIST CSF;
- CMMC;
- CIS Controls;
- ISO 27001 / 27002;
- PCI DSS;
- cross-framework mappings;
- universal/canonical controls;
- framework switching;
- framework upgrades;
- custom framework authoring;
- custom framework import;
- framework marketplace;
- organization-wide Evidence;
- Evidence approval;
- assessment management;
- findings;
- POA&M;
- common-control inheritance;
- automated Evidence collection;
- Word/PDF export;
- production email integrations;
- general OSCAL import/interoperability work.

If one of these becomes necessary to fix a correctness problem, STOP and report why rather than expanding scope silently.

---

# 21. Tests

Add or update tests where necessary.

## Framework identity

Verify:

- Project framework identity comes from the authoritative source;
- save cannot change framework;
- autosave cannot change framework;
- restore cannot change framework;
- invalid framework IDs fail safely;
- Low/Moderate/High resolve correctly.

## Project creation

Verify:

- Moderate is the default UI selection;
- Low can be selected;
- Moderate can be selected;
- High can be selected;
- invalid framework IDs are rejected server-side.

Do not make UI implementation tests brittle if equivalent server/domain coverage is more appropriate.

## Control identity

For each relevant write boundary, verify invalid control IDs cannot create operational state.

At minimum ensure coverage for the primary paths discovered during the audit.

Verify valid controls continue to work without pre-existing ControlRecords.

## Runtime framework isolation

Verify representative operations against:

- Low Project;
- Moderate Project;
- High Project.

A Project must never accidentally receive another framework's control population.

## Evidence

Preserve tests for:

- association;
- archived association rejection;
- picker/search;
- coverage;
- versions;
- inventory CSV;
- CSV formula neutralization.

## Workflow/collaboration

Add framework-specific regression coverage only where the audit finds meaningful framework assumptions.

Do not duplicate the entire collaboration suite three times without a reason.

## Named versions

Verify framework identity survives:

- save;
- snapshot;
- restore;
- legacy snapshot compatibility where applicable.

## OSCAL

Preserve Low/Moderate/High profile-reference and schema-validation tests.

## Security

Existing tenant-isolation, notification authorization, and CSV security regression tests must continue to pass.

---

# 22. Documentation

Update as appropriate:

- `docs/architecture.md`
- `docs/current-state.md`
- `docs/decisions.md`
- `docs/roadmap.md`
- `docs/design-system.md` if framework presentation patterns are added
- this milestone document

Amend ADR-026 if the canonical-source cleanup materially clarifies the framework identity invariant.

Do not create another ADR unless 04B introduces a genuinely new durable architectural decision.

Document intentionally retained NIST-specific assumptions for 04C.

---

# Work packages

## WP1 — Runtime/framework audit

- search for remaining Moderate assumptions;
- inspect framework identity reads/writes;
- inspect control-scoped mutations;
- inspect UI framework presentation;
- inspect named versions;
- inspect workflows/collaboration;
- inspect Evidence/coverage;
- inspect OSCAL export;
- classify findings;
- determine canonical framework identity cleanup;
- determine ADR impact.

**STOP if a material compatibility or architectural decision requires approval.**

---

## WP2 — Framework identity hardening

- establish one authoritative runtime framework identity;
- reduce/remove independent JSON authority;
- preserve legacy compatibility;
- preserve immutability;
- harden named-version restore;
- tests.

---

## WP3 — Control identity hardening

- centralize/reuse Project-framework control validation where appropriate;
- protect control-scoped write boundaries;
- preserve lazy ControlRecord behavior;
- fail closed without tenant leaks;
- tests.

---

## WP4 — Framework UX

- review Project creation selector;
- keep Moderate default;
- communicate immutability appropriately;
- consistent Project framework display;
- registry-driven labels;
- remove inappropriate hard-coded Moderate presentation;
- accessibility review.

---

## WP5 — Runtime feature audit/fixes

Apply only necessary fixes discovered in WP1 for:

- ControlRecord surfaces;
- collaboration;
- workflows;
- Evidence;
- coverage/reporting;
- named versions;
- other Project runtime surfaces.

Do not redesign features that are already framework-correct.

---

## WP6 — OSCAL and regression hardening

- residual Moderate export assumptions;
- Low/Moderate/High correctness;
- schema validation;
- regression tests;
- document intentionally retained NIST-specific behavior.

---

## WP7 — Documentation and verification

- update architecture/current-state/roadmap;
- amend ADR-026 if warranted;
- document remaining NIST assumptions;
- run full verification.

---

# Verification

Before declaring 04B complete, run:

    npm test
    npm run lint
    npm run build

All must pass.

Do not create commits unless explicitly requested.

---

# Completion report

At completion, report:

1. Executive summary
2. Architectural/runtime audit findings
3. Remaining Moderate assumptions discovered
4. Findings classified as fixed vs intentionally retained
5. Framework identity canonical-source decision
6. Project document/named-version compatibility behavior
7. Control identity validation changes
8. Project creation UX changes
9. Framework presentation changes
10. Collaboration/workflow changes, if any
11. Evidence/coverage changes, if any
12. OSCAL changes, if any
13. Database/schema/document migrations
14. ADRs added or amended
15. Files added
16. Files modified
17. Tests added/modified
18. Security regression status
19. Remaining limitations
20. Intentionally retained NIST-specific assumptions
21. Recommendations for Milestone 04C
22. Verification results

---

# Expected 04B outcome

At the end of 04B:

- framework identity has one authoritative runtime source;
- framework identity remains immutable after Project creation;
- named-version restore cannot change it;
- Low, Moderate, and High are consistently represented in Project UX;
- Project creation provides a clear framework/profile choice with Moderate as the default;
- Project-scoped runtime behavior resolves framework data through the Project;
- invalid control IDs cannot normally enter control-scoped operational state;
- `(projectId, controlId)` remains the operational control identity;
- framework IDs are not redundantly copied into operational tables;
- Evidence and coverage retain their existing semantics;
- workflows and collaboration operate correctly across supported profiles;
- OSCAL export remains profile-correct;
- accidental Moderate assumptions have been removed;
- intentionally NIST-specific assumptions are explicitly documented;
- the application is ready for 04C to test the architecture with a meaningfully different framework family.
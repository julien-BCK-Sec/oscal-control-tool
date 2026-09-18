# Milestone 07C — Parameter Resolution & Control Fidelity

**Status:** Implemented and manually accepted; not released
**Release baseline:** v0.7.0 (`56e71ff`) remains production
**Depends on:** Milestones 06B, 07A, 07B  
**Architecture:** [`docs/research/07C-parameter-resolution-architecture.md`](../research/07C-parameter-resolution-architecture.md) (approved as ADR-032)

Architecture was approved as ADR-032. Runtime implementation is complete
and manually accepted (2026-09-18). This is not a production release. Do
not tag or deploy 07C in this phase.

---

## 1. Purpose

Milestone 07C introduces parameter-level resolution and control fidelity into Control Freak.

Control Freak currently understands:

- authoritative control statements;
- organization-defined parameters (ODPs);
- framework-level assignments;
- FedRAMP Moderate baseline assignments;
- DoD IL4 overlay semantics;
- project-authored implementation narratives;
- human-readable SSP generation.

However, parameter resolution is not yet represented as a first-class project capability.

The current human-readable SSP intentionally leaves unresolved parameters visible, for example:

    [Unresolved ODP: ac-07_odp.01 — number]

An implementation narrative may independently contain language such as:

    FeatherAuth locks an account after five failed logon attempts within 15 minutes.

Control Freak must not infer from that prose that the organization has authoritatively selected `5` or `15 minutes` as the values for the corresponding ODPs.

Milestone 07C addresses this gap.

The goal is to allow Control Freak to distinguish and represent:

1. what the authoritative catalog asks to be defined;
2. what a framework or overlay authoritatively assigns;
3. what a project organization explicitly authors;
4. what remains unresolved;
5. what requires an unavailable authoritative value;
6. what contains conflicting authoritative sources;
7. the provenance of every resulting parameter resolution.

This must happen at the **individual parameter level**, not merely at the control level.

---

## 2. Core architectural principle

### Parameter identity and authority are strongly modeled. Authored values remain flexible.

Control Freak must not prematurely convert organization-defined parameters into application-specific datatypes.

For example, if an authoritative requirement asks for an organization-defined time period, the canonical project model must not automatically require a representation such as:

    {
      value: 15,
      unit: "minutes"
    }

Valid organization-authored documentation could instead be:

    15 minutes

or:

    Immediately upon receipt of a validated termination event

or:

    Within one business day for manually managed accounts; immediately for
    accounts integrated with the HR termination feed.

The canonical model must be capable of representing all of these without changing the data model.

ODPs may describe:

- numbers;
- frequencies;
- durations;
- personnel;
- roles;
- events;
- conditions;
- actions;
- mechanisms;
- system components;
- lists;
- selections;
- combinations of selections and assignments;
- free-form organization-defined concepts;
- more complicated prose.

Control Freak must not create a large application-specific datatype system simply because some parameters resemble numbers, durations, dates, or enumerations.

Strong typing should primarily apply to:

- parameter identity;
- resolution state;
- source;
- provenance;
- framework semantics.

The architecture investigation must determine whether a simple authored `string` is sufficient or whether minimum additional structure is required to preserve authoritative OSCAL/NIST selection semantics.

### Required architecture question

The architecture proposal must explicitly answer:

> What is the minimum parameter-value representation that preserves authoritative OSCAL/NIST selection and assignment semantics while still permitting free-form organization-authored values, without imposing artificial application-level datatypes such as integer, duration, date, or enum?

UI affordances and canonical persistence are separate concerns.

A UI may eventually provide:

- suggested values;
- dropdowns;
- checkboxes;
- multi-select controls;
- duration helpers;
- other source-informed authoring assistance.

Such controls must not unnecessarily constrain the organization's actual documented value.

---

## 3. Three distinct concepts

Milestone 07C must preserve a clear separation between three concepts.

### 3.1 Catalog parameter

The authoritative underlying control defines a parameter that must or may be resolved.

Conceptually:

    Control: AC-7
    Parameter: ac-07_odp.01
    Prompt: organization-defined number

The catalog parameter establishes the identity and semantics of the ODP.

### 3.2 Framework parameter resolution

A selected framework may provide an authoritative resolution or additional semantics for that parameter.

Conceptually:

    Parameter: ac-07_odp.01
    Resolution: framework-defined value
    Value: 3
    Source: FedRAMP Moderate

Framework-derived resolution is immutable framework/reference data.

It must not be persisted as editable project data.

### 3.3 Project-authored parameter value

Where project or organization authorship is permitted or required, a project may document its own value.

Conceptually:

    Parameter: ac-07_odp.01
    Authored value: 5
    Rationale: Corporate authentication standard

Project-authored parameter values are project data and must persist.

These three concepts must not be collapsed into a single generic `value` field.

---

## 4. Why control-level classification is insufficient

Milestone 06B introduced conservative DoD IL4 tailoring semantics.

Current IL4 classifications include concepts such as:

- `csp-organization-defined`;
- `fedramp-base-inherited`;
- `fedramp-explicitly-referenced`;
- `dod-explicit`;
- `satisfied-by-addendum-value`;
- `authoritative-value-required`;
- `source-conflict`;
- `not-indicated`.

The generic runtime model similarly distinguishes concepts such as:

- organization-defined;
- baseline-inherited;
- may-use-baseline;
- overlay-explicit;
- satisfied-by-overlay;
- authoritative-value-required;
- source-conflict.

These semantics were intentionally implemented conservatively at the control level in Milestone 06B.

That is insufficient for long-term parameter fidelity.

A single control may contain multiple parameters with different authoritative states.

For example:

    Control X

    Parameter A
      FedRAMP base inherited

    Parameter B
      DoD explicit adjustment

    Parameter C
      authoritative DSPAV value required

    Parameter D
      conflicting authoritative sources

Milestone 07C must determine how these semantics move to or are represented at the individual parameter level without regressing the existing 06B behavior.

Control-level classifications may remain useful as summaries, but they must not become the authoritative representation when individual ODPs differ.

---

## 5. Fail-closed requirements

Parameter resolution must remain fail-closed.

Control Freak must never:

- infer an ODP value from implementation narrative prose;
- invent an unavailable DSPAV value;
- silently choose a winner between conflicting authoritative sources;
- treat an empty DoD Addendum cell as sufficient authority for FedRAMP inheritance;
- infer parameter mappings from similar-looking prose without authoritative support;
- infer security categorization from framework selection;
- convert a framework-defined value into an organization-defined value;
- silently replace a framework-authoritative value with a project-authored value;
- claim an unresolved parameter is resolved because related implementation prose happens to contain a plausible value.

If authoritative source relationships are inconsistent or cannot be mapped safely, the result must remain unresolved or explicitly conflicted.

---

## 6. Architecture investigation

Before implementation, inspect the actual repository and pinned authoritative artifacts.

Do not design this milestone from documentation alone.

### 6.1 Current parameter representation

Inspect:

- catalog parameter types/interfaces;
- parameter IDs;
- OSCAL `insert` representation;
- OSCAL selection representation;
- NIST catalog parsing;
- FedRAMP Moderate profile parsing;
- FedRAMP parameter assignments;
- generated framework JSON;
- framework runtime/read model;
- framework control types;
- current assignment representation;
- authoring requirement rendering;
- SSP document/view model;
- DOCX requirement rendering;
- OSCAL SSP exporter;
- project persistence model;
- control implementation model;
- relevant tests.

Trace at least one representative control, preferably AC-7, end-to-end:

    authoritative source
        ↓
    catalog/profile parser
        ↓
    generated framework artifact
        ↓
    runtime framework model
        ↓
    authoring UI
        ↓
    project persistence
        ↓
    SSP document model
        ↓
    DOCX
        ↓
    OSCAL export

Identify precisely where parameter identity, structure, provenance, selection semantics, or assignments are currently lost.

---

## 7. Parameter-shape research

Analyze the parameter structures actually present in the pinned authoritative source artifacts.

Do not design around AC-7 alone.

Investigate representative examples of:

- simple assignment parameters;
- selection parameters;
- one-of selections;
- one-or-more selections;
- parameters containing prose;
- parameters referenced through OSCAL insert elements;
- parameters receiving framework assignments;
- parameters remaining organization-defined;
- parameters with multiple source relationships;
- nested or dependent structures, if present.

Determine whether project-authored parameter resolution requires:

- authored text only;
- structured selected choices plus optional authored text;
- multiple authored values;
- another minimal representation.

Prefer the smallest representation that faithfully preserves authoritative semantics.

---

## 8. Framework parameter inventory

Quantify the current parameter state for each supported framework where applicable:

- NIST SP 800-53 Low;
- NIST SP 800-53 Moderate;
- NIST SP 800-53 High;
- CMMC Level 2;
- DoD Cloud IL4.

Where meaningful, report:

- selected control count;
- distinct referenced ODP/parameter count;
- parameters with framework-derived authoritative values;
- parameters remaining organization-defined;
- parameters involving selection semantics;
- parameters involving multiple selections;
- parameters requiring unavailable authoritative values;
- parameters with source conflicts;
- other meaningful parameter-resolution states.

Clearly distinguish:

    catalog parameter population
            ≠
    selected-framework parameter population
            ≠
    framework parameter assignment
            ≠
    project-authored parameter value

Do not force CMMC into NIST SP 800-53 parameter semantics if the current CMMC model does not use them.

Counts derived from current pinned artifacts are regression observations, not permanent architecture invariants.

---

## 9. FedRAMP parameter semantics

Inspect how the pinned FedRAMP Moderate profile assigns parameters.

Determine:

- how assignments are represented;
- whether assignments are always simple text;
- whether selection semantics survive profile resolution;
- whether a parameter can receive multiple values;
- whether current generated framework data loses structure;
- how source/provenance is currently represented.

The architecture must preserve the conceptual distinction:

    CATALOG PARAMETER
    What must be defined

    FRAMEWORK PARAMETER RESOLUTION
    What the framework says the value or resolution is

    PROJECT PARAMETER VALUE
    What this project's organization explicitly documents where permitted

Do not collapse these concepts.

---

## 10. DoD IL4 per-parameter semantics

This is a critical part of 07C.

Inspect:

- DoD CSP SRG V1R7;
- DoD Rev5 SSP Addendum Controls V1.2;
- Table D-1 derived metadata;
- current generated IL4 framework artifact;
- Milestone 06B parser/classification code;
- known DSPAV cases;
- IA-5(1);
- AU-5(1);
- AC-7;
- SC-24;
- SC-46;
- representative multi-ODP controls.

Determine what authoritative mapping exists between DoD overlay prose/assignments and individual NIST/OSCAL parameter IDs.

### Mapping rule

Do not guess a parameter mapping because prose appears similar.

If DoD overlay material cannot be mapped confidently to a specific OSCAL parameter ID using pinned authoritative evidence, the architecture must fail closed.

If explicit pinned mapping metadata is required, propose how it should work.

The architecture must support a control where individual parameters have different states, for example:

    Parameter A
      baseline inherited

    Parameter B
      overlay explicit

    Parameter C
      authoritative value required

    Parameter D
      source conflict

---

## 11. Framework parameter resolution model

Propose the minimum framework/read-model representation for parameter-level resolution.

A conceptual starting point might resemble:

    type FrameworkParameterResolution = {
      controlId: string;
      parameterId: string;
      status: FrameworkParameterResolutionStatus;
      value?: unknown;
      source: FrameworkSource;
    };

This is illustrative only.

Do not adopt this shape without investigation.

The architecture proposal must determine:

- whether `controlId` is required or derivable;
- whether `parameterId` alone is globally safe;
- how values are represented;
- whether multiple values are required;
- how selections are represented;
- how source artifact and semantic classification differ;
- how provenance is represented;
- how conflicts preserve all relevant sources;
- how DSPAV / authoritative-value-required is represented;
- how conditional applicability interacts with parameters;
- how inherited baseline values differ from explicitly permitted baseline values;
- whether framework-derived parameter resolutions should be generated artifacts, runtime derivations, or both.

Framework-derived parameter resolution is immutable reference metadata.

It must not be stored as editable project data.

---

## 12. Project-authored parameter model

Propose how project-authored parameter values should persist.

Likely requirements include:

- stable parameter identity;
- authored value;
- optional rationale or notes;
- sufficient structure for selections where authoritative semantics require it;
- no artificial datatype restrictions;
- deterministic persistence/versioning;
- safe handling of framework changes;
- no inference from implementation narratives.

Assess whether this requires:

    project_json schema v2 → schema v3

If schema v3 is recommended, define:

- exact proposed shape;
- v2 → v3 in-memory migration;
- save behavior;
- create behavior;
- historical revision behavior;
- restore behavior;
- no destructive inference;
- behavior when a stored parameter ID no longer exists in the selected framework;
- behavior when the selected framework changes;
- treatment of orphaned project-authored parameter values.

Prefer the existing project document model unless there is a concrete reason to introduce relational tables.

If relational persistence is proposed, justify why `project_json` is no longer appropriate.

---

## 13. Resolution and precedence rules

The architecture proposal must define explicit resolution rules.

Do not leave precedence to UI behavior.

Determine how the effective parameter state is derived from:

- catalog organization-defined parameter;
- framework authoritative assignment;
- inherited baseline assignment;
- explicitly permitted baseline assignment;
- overlay assignment;
- project-authored value;
- unavailable authoritative external value;
- conflicting authoritative sources;
- unresolved organization-defined parameter.

Explicitly answer the following.

### 13.1 Framework-authoritative values

If FedRAMP supplies an authoritative assignment, may a project override it?

If a project authors a different value, what does that mean?

Should the application reject it, preserve it as a documented deviation, warn, or model another state?

### 13.2 Organization-defined values

If NIST leaves an ODP organization-defined, should a project-authored value resolve it?

### 13.3 Inherited values

If DoD IL4 inherits a FedRAMP assignment, may the project replace that assignment?

### 13.4 Explicitly permitted baseline values

How does:

    DoD explicitly permits the FedRAMP value

differ from:

    DoD inherits the FedRAMP value

at the parameter level?

### 13.5 DSPAV

If an authoritative DSPAV value is required but unavailable to Control Freak, may a project author enter the value manually?

If so, the model must distinguish:

    Organization-selected value

from:

    Organization asserts this is the authoritative DSPAV value obtained from
    the restricted authoritative source

Control Freak must not transform an unknown authoritative requirement into an organization-defined parameter.

### 13.6 Source conflicts

Can a project author resolve an authoritative source conflict?

Or must the authoritative conflict remain visible even if the project records how it chose to proceed?

### 13.7 Partial resolution

A control may have some resolved and some unresolved parameters.

The model and renderer must support this without promoting the whole control to "resolved."

Provide a proposed resolution/state machine or equivalent deterministic rules.

---

## 14. Authoring UX

Propose the minimum useful 07C authoring experience.

The user should be able to understand:

- what parameter is being defined;
- its authoritative description;
- framework-derived value, if one exists;
- authoritative source/provenance;
- whether organization authorship is expected;
- whether organization authorship is permitted;
- current project-authored value;
- unresolved state;
- conflict state;
- DSPAV / authoritative-value-required state.

Do not make every ODP a dropdown.

Do not make raw OSCAL parameter IDs the primary user-facing label.

Parameter IDs may be shown as secondary technical metadata.

Where authoritative source metadata supports it, the UI may provide convenience controls such as:

- suggestions;
- radio buttons;
- checkboxes;
- multi-select;
- dropdowns;
- duration helpers.

The canonical persisted representation must not depend on the widget used.

There must be an appropriate path for flexible authored text where the authoritative semantics permit it.

---

## 15. SSP synthesis

Milestone 07B intentionally preserves unresolved ODPs.

Example:

    Enforce a limit of
    [Unresolved ODP: ac-07_odp.01 — number]
    consecutive invalid logon attempts during a
    [Unresolved ODP: ac-07_odp.02 — time period].

After 07C, legitimately resolved parameters may be safely synthesized.

For example:

    Enforce a limit of 5 consecutive invalid logon attempts during a
    15-minute period.

This may happen only because structured parameter-resolution data supports the substitution.

### Requirements

SSP synthesis must:

- preserve the authoritative source statement;
- never infer values from implementation narratives;
- resolve parameters individually;
- support partial resolution;
- retain explicit placeholders for unresolved parameters;
- preserve DSPAV-required state;
- preserve source conflicts;
- preserve provenance;
- avoid silently selecting conflict winners.

For example, if three ODPs exist and only two are resolved:

    Requirement text with:
      resolved value A
      resolved value B
      [Unresolved ODP: parameter C]

is correct.

The architecture proposal must determine whether the SSP document model should contain concepts such as:

    sourceStatement
    resolvedStatement
    parameterResolutions

or another representation.

The DOCX renderer must consume the SSP document/view model.

The DOCX renderer must not independently implement parameter-resolution business logic.

Substantial SSP visual/template redesign remains out of scope for 07C.

---

## 16. OSCAL export

Assess how project-authored parameter values should eventually affect NIST OSCAL SSP export.

Control Freak's canonical domain must remain independent from OSCAL serialization.

Determine:

- where project-authored parameter values belong in OSCAL SSP 1.2.2;
- whether the current exporter can represent them faithfully;
- whether selection semantics can be preserved;
- whether parameter settings belong in system implementation, control implementation, or another OSCAL structure;
- whether OSCAL export should be updated in 07C or deferred to a follow-on work package.

Do not enable CMMC OSCAL SSP export as part of this milestone.

Do not enable DoD IL4 OSCAL SSP export as part of this milestone.

Their existing blockers remain unless independently resolved by future architecture work.

---

## 17. Adjacent control-fidelity question: responsibility and origination

Assess, but do not automatically include, the adjacent control-fidelity concepts:

- CSP implemented;
- customer implemented;
- shared;
- inherited;
- hybrid;
- control origination;
- implementation responsibility.

These concepts are important for future FedRAMP and DoD authorization outputs.

The architecture proposal must recommend either:

### Option A — Include in 07C

Include responsibility/origination because it naturally belongs in the same canonical control-fidelity change and can be added without materially expanding the milestone.

### Option B — Defer

Keep 07C focused on parameter resolution because responsibility/origination is orthogonal and deserves a later milestone.

Do not include responsibility/origination merely because a future FedRAMP output may require it.

Provide rationale for the recommendation.

---

## 18. Security, tenancy, and auditability

Assess the impact of project-authored parameter values on:

- project permissions;
- tenant isolation;
- revision history;
- restore behavior;
- autosave;
- concurrent edits;
- auditability;
- exports;
- demo mode;
- production bootstrap.

Parameter values must inherit the existing project security boundary.

No parameter value may be readable or writable across tenant/project boundaries.

Determine whether existing project revision history is sufficient to provide historical traceability for parameter changes.

Do not introduce a separate parameter audit subsystem unless there is a demonstrated requirement.

---

## 19. Demo data

Propose how demo projects should exercise 07C.

The demo should include representative examples of:

- organization-defined parameter resolved by project;
- unresolved organization-defined parameter;
- framework-authoritative value;
- inherited FedRAMP value;
- explicitly permitted FedRAMP value;
- DoD explicit adjustment;
- DSPAV / authoritative-value-required;
- source conflict;
- partial resolution within a multi-ODP control;
- flexible authored prose rather than only numeric examples.

Do not infer demo parameter values from existing implementation narratives at runtime.

Demo values must be explicitly authored seed data.

---

## 20. Testing strategy

The architecture proposal must define tests for at least the following areas.

### Domain / persistence

- project parameter persistence;
- schema migration if required;
- no inference from narrative;
- revision/restore behavior;
- framework-change/orphan behavior.

### Framework resolution

- catalog ODP identity;
- FedRAMP assignments;
- IL4 baseline inheritance;
- IL4 explicitly permitted FedRAMP values;
- DoD explicit adjustment;
- DSPAV required;
- source conflict;
- multiple parameters with different states in one control.

### SSP

- fully unresolved requirement;
- fully resolved requirement;
- partially resolved requirement;
- project-authored prose value;
- framework-derived value;
- DSPAV placeholder;
- source conflict;
- provenance.

### UI

- editable organization-defined parameter;
- framework-authoritative read-only state;
- flexible text authoring;
- source display;
- conflict display;
- DSPAV state;
- no accidental rigid datatype requirement.

### Security

- viewer/edit permissions as appropriate;
- tenant isolation;
- cross-tenant access;
- export permissions.

### Regression

- existing NIST Low/Moderate/High behavior;
- CMMC;
- DoD IL4 345 population / 10 GRRs;
- existing 06B representative semantics;
- existing human-readable SSP;
- existing NIST OSCAL SSP export;
- no new CMMC/IL4 OSCAL capability.

---

## 21. Explicit non-goals

Milestone 07C does not include:

- SSP visual/template redesign;
- PDF generation;
- diagrams;
- official FedRAMP authorization-package generation;
- FedRAMP 2026 CPO/SDR output;
- DoD authorization-package generation;
- CMMC assessment scoring;
- MET / NOT MET determination;
- SPRS scoring;
- certification or authorization decisions;
- POA&M implementation;
- assessment-result modeling;
- evidence assessment;
- AI extraction of ODP values from implementation narratives;
- automatic inference of project ODP values;
- CMMC OSCAL SSP export;
- DoD IL4 OSCAL SSP export;
- arbitrary application-level typing of ODPs into integers, durations, dates, or enums.

---

## 22. Architecture deliverable

Before implementation, produce a durable architecture proposal that includes:

1. current-state parameter data-flow findings;
2. representative authoritative parameter shapes;
3. framework parameter inventory/counts;
4. FedRAMP parameter semantics;
5. DoD IL4 per-ODP findings;
6. identified places where current parameter semantics are lost;
7. proposed framework parameter-resolution model;
8. proposed project-authored parameter model;
9. persistence/schema-version recommendation;
10. deterministic resolution/precedence rules;
11. DSPAV handling;
12. conflict handling;
13. framework-change/orphan handling;
14. proposed authoring UX;
15. SSP document-model changes;
16. OSCAL export impact;
17. recommendation on responsibility/origination;
18. demo-data strategy;
19. testing strategy;
20. risks and unresolved questions;
21. proposed 07C implementation work packages.

The proposal must include concrete TypeScript shapes where useful.

Clearly distinguish:

- decisions recommended for approval;
- findings from current code;
- findings from authoritative pinned artifacts;
- assumptions;
- unresolved questions.

**Delivered 2026-09-17:** [`docs/research/07C-parameter-resolution-architecture.md`](../research/07C-parameter-resolution-architecture.md).

### Important findings (summary)

- Pinned NIST catalog: 1600 unique parameter IDs; 133 selects; no catalog `values` / `constraints`; `how-many` omitted means one permitted value. OSCAL assignments are `string[]`, not application datatypes.
- Pinned NIST Low / Moderate / High profiles have no `modify`. Generated frameworks copy catalog ODPs only. Counts (regression observations): Low 445, Moderate 643, High 767 distinct catalog params; CMMC Level 2 has none.
- DoD IL4 keeps 06B **control-level** classification. 152 IL4 items have two or more catalog ODPs under one status. Table D-1 (23 rows) and FedRAMP assignment cells do not name OSCAL parameter IDs. Per-ODP overlay mapping cannot be inferred safely; 07C should pin mappings explicitly or leave ODPs `control-level-unmapped`.
- Current losses: catalog `props` (alt-identifier, aggregates) dropped; project_json v2 has no parameter records; SSP leaves inserts unresolved; NIST OSCAL export has no `set-parameters`.
- Recommended: `project_json` schema v3 with flexible authored `values: string[]` plus a selection form; reuse `FrameworkAuthoritativeValueStatus`; defer responsibility/origination and OSCAL `set-parameters`.

### Proposed implementation work packages (not started)

1. Framework parameter identity and unmapped IL4 rows
2. Schema v3 persistence
3. Resolution engine
4. Authoring UI and Help
5. SSP synthesis and explicit demo seed

OSCAL `set-parameters` is not a 07C work package.

---

## 23. Architecture STOP

**STOP after the architecture/research deliverable.**

Do not implement Milestone 07C until the architecture is reviewed and approved.

Do not:

- create project schema v3;
- change persistence;
- modify framework generation;
- modify IL4 semantics;
- modify the SSP renderer;
- modify OSCAL export;
- build the ODP authoring UI;
- seed new parameter values;
- begin responsibility/origination implementation;
- tag a release;
- deploy production.

The purpose of this STOP is to approve the canonical parameter-resolution model and authority/precedence rules before implementation begins.

Routine research, code inspection, source inspection, local analysis, and documentation updates do not require intermediate approval.

---

## 25. Implementation status

Implemented and manually accepted 2026-09-18. ADR-032 records the approved
architecture and was not changed by the acceptance corrections.

IL4 per-ODP mapping pin set is empty and fail-closed. Responsibility/origination
and NIST OSCAL SSP `set-parameters` remain deferred. CMMC/GRR have no invented
ODP editors. Production remains v0.7.0; do not tag or deploy 07C.

Acceptance corrections (not architecture changes):

- ODP text fields dropped Space because controlled values were trimmed on
  every keystroke. Editors now keep a live draft and persist normalized
  values separately.
- SSP `unresolvedParameters` had been inferred from the humanized source
  statement. It is now collected by the same per-insert walk that produces
  `resolvedStatement` (`synthesizeControlStatement` over
  `src/domain/parameter-resolution.ts`).
- Nested catalog-choice editors render under the selected choice. Nested
  project records remain when the parent is deselected.
- Assignment fields show surrounding catalog insert context. No datatype
  inference or English-language rewriting.

NIST AC-7 browser acceptance confirmed typed spaces, persisted selections
and nested values, faithful SSP substitution of authored values and
human-readable catalog choice text, and no stale unresolved list on a
fully resolved control. IL4 review confirmed control-level overlay
material stays separate, zero pinned mappings, and DSPAV/conflict remain
fail-closed.

---

## 24. Instructions for the architecture phase

1. Confirm repository state and v0.7.0 baseline.
2. Create/use this milestone document as the durable 07C specification.
3. Perform the repository and pinned-source investigation described above.
4. Do not alter runtime behavior.
5. Produce the architecture proposal in the appropriate durable research/design documentation.
6. Update this milestone with links to the resulting architecture material and architecture status.
7. Run documentation/diff checks appropriate to documentation-only changes.
8. Commit and push the architecture/research documentation if repository conventions permit documentation-only milestone research to be committed before architecture approval.
9. Report:
   - files created/changed;
   - research findings;
   - parameter counts;
   - proposed canonical models;
   - proposed persistence version;
   - proposed precedence rules;
   - IL4 mapping findings;
   - SSP impact;
   - OSCAL impact;
   - responsibility/origination recommendation;
   - implementation work-package proposal;
   - commit SHA if committed;
   - working-tree state;
   - stash state.
10. **STOP for architecture approval.**

Do not begin implementation.
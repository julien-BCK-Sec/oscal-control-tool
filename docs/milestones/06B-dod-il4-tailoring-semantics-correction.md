# Milestone 06B — DoD IL4 Tailoring Semantics Correction

**Status:** Implemented, committed on `main` (`b6914c6`), preparing v0.6.2. Not yet tagged, deployed, or production verified.
**Type:** Corrective implementation milestone
**Depends on:** Milestone 06A — DoD Cloud Impact Level 4 Framework Support  
**Primary research input:** `docs/research/06B-il4-tailoring-semantics-audit.md`

---

## 1. Purpose

Milestone 06A correctly established the current DoD Cloud Impact Level 4 control population and the overall FedRAMP+ base-and-overlay architecture, but the follow-on tailoring semantics audit identified a narrow defect in how Control Freak determines and labels effective parameter assignments.

The current generated IL4 values are materially correct for the pinned 345-item dataset, with one confirmed provenance-labeling defect on AU-5(1). However, the derivation mechanism is not sufficiently tied to the authoritative DoD rule that produced those values.

This milestone corrects that mechanism without changing the IL4 control population, without redesigning the framework architecture, and without expanding scope into SSP generation or per-ODP parameter persistence.

The objective is:

> Make IL4 parameter inheritance, DoD adjustments, and provenance explicit, source-backed, fail-closed, and distinguishable to downstream consumers.

WP2–WP7 implement the WP1 contract: Table D-1 is the machine-checkable DoD delta; ordinary FedRAMP assignments are `fedramp-base-inherited`; explicit “may use FedRAMP value” rows are `fedramp-explicitly-referenced`; AU-5(1) provenance is the DoD Addendum. The 345-item population is unchanged. Committed on `main`; not yet tagged, deployed, or production verified.

---

## 2. Background

The 06B audit confirmed that the current DoD Cloud Computing Security Requirements Guide, CSP SRG V1R7, defines FedRAMP+ as a FedRAMP baseline with DoD-specific additions and adjusted parameter values.

The authoritative methodology supports:

1. FedRAMP Moderate as the base for IL4.
2. DoD Table D-1 as the delta list for added or adjusted controls and parameter values.
3. FedRAMP values continuing to stand where DoD has not identified a Table D-1 adjustment.
4. DoD-specific values superseding or supplementing the FedRAMP base where Table D-1 requires them.

The audit also confirmed that the current Control Freak derivation does **not** implement this rule directly. Instead, it currently relies on the DoD SSP Addendum parameter column being empty or populated:

```text
DoD Addendum parameter cell populated
    -> use DoD value

DoD Addendum parameter cell empty
    -> use FedRAMP value when present
```

For the current pinned dataset, this produces the same effective values as the authoritative Table D-1 delta rule. That equivalence is not asserted by the code and is therefore vulnerable to silent drift if a future source revision changes the relationship between the Addendum and Table D-1.

The audit also found:

- the 345-item IL4 population is correct;
- GRR handling is correct;
- SC-46 conditional applicability is correct;
- IA-5(1) remains correctly conflict-preserving;
- the unresolved DSPAV controls remain correctly fail-closed;
- AU-5(1) has a confirmed provenance-labeling defect;
- the current parameter model is control-level rather than per-ODP, which is a future SSP-generation concern but is not corrected in this milestone.

---

## 3. Authoritative Semantic Model

The corrected IL4 derivation SHALL implement the following semantic model:

```text
NIST SP 800-53 Rev.5 control
        +
FedRAMP Moderate baseline membership and assignments
        +
DoD FedRAMP+ delta
        |
        +-- DoD Table D-1 addition/adjustment
        +-- explicit "may use FedRAMP value"
        +-- DSPAV requirement
        +-- supplemental requirement
        +-- conditional applicability
        +-- DoD General Readiness Requirement
```

The architecture remains **base + overlay**.

This milestone does **not** replace ADR-029's architecture with three independent, unrelated framework layers.

---

## 4. Required Semantic Distinctions

Control Freak SHALL distinguish at least the following effective-value situations:

### 4.1 CSP organization-defined

No FedRAMP or DoD program assignment resolves the relevant requirement.

Suggested semantic label:

`csp-organization-defined`

### 4.2 FedRAMP base inherited under the DoD FedRAMP+ delta model

A FedRAMP Moderate assignment exists and the authoritative DoD Table D-1 does not define an IL4 adjustment for that control.

This is **not** an unconfirmed guess. It is inherited because the DoD FedRAMP+ methodology establishes FedRAMP as the base and Table D-1 as the delta.

Suggested semantic label:

`fedramp-inherited-by-dod-delta-rule`

A shorter implementation name such as `fedramp-base-inherited` is acceptable if equally precise.

The chosen term MUST NOT imply that the value is merely assumed because DoD was silent.

### 4.3 DoD explicitly references the FedRAMP value

DoD Table D-1 explicitly states that the CSP/CSO may use the FedRAMP value.

Known examples:

- AU-5(1)
- MA-6
- PS-4

Suggested semantic label:

`fedramp-explicitly-referenced`

This category MUST remain distinct from ordinary FedRAMP base inheritance.

### 4.4 DoD explicit value

DoD provides an explicit IL4 value or requirement.

Suggested semantic label:

`dod-explicit`

### 4.5 DoD DSPAV satisfied by Addendum value

Table D-1 says DSPAV must be used, while the authoritative Addendum provides the concrete value used by Control Freak.

Suggested semantic label:

`dod-dspav-satisfied-by-addendum`

Existing naming may be retained if semantically equivalent.

### 4.6 DoD DSPAV required but unresolved

No public authoritative DSPAV is available and Control Freak must not guess.

Suggested semantic label:

`dod-dspav-required`

### 4.7 Source conflict

Authoritative sources conflict and no winner may be synthesized.

Known example: IA-5(1).

Suggested semantic label:

`source-conflict`

### 4.8 Conditional applicability

A DoD requirement applies only when a documented condition is true.

Known example: SC-46 when CDS is used.

Conditionality remains orthogonal to the effective-value classification.

---

## 5. Explicit Non-Goals

This milestone SHALL NOT:

- change the 345-item IL4 control population;
- add or remove DoD GRRs;
- change SC-46's conditional applicability behavior;
- resolve IA-5(1) to a synthesized winner;
- guess inaccessible DSPAV values;
- change the current project framework ID;
- change database schema;
- change persisted project data;
- enable IL4 OSCAL SSP export;
- implement IL5;
- implement a human-readable SSP generator;
- redesign the entire framework provider architecture;
- implement per-ODP persistence or per-ODP authoring state;
- reinterpret the SSP Addendum's `Leveraged from FedRAMP Moderate` field as an authoritative parameter-inheritance switch.

---

## 6. Source Authority and Provenance Rules

The derivation SHALL preserve the existing pinned-source discipline.

Authoritative sources remain:

- NIST SP 800-53 Rev.5 catalog;
- pinned FedRAMP Moderate baseline artifact;
- DoD Rev 5 SSP Addendum Controls v1.2 extract;
- CSP SRG V1R7 Appendix D / Table D-1 extract;
- existing source hashes and provenance documentation under `vendor/dod/cloud-il4-rev5/`.

The `Leveraged from FedRAMP Moderate` field may be retained as provenance or used as a secondary consistency signal, but SHALL NOT independently determine parameter inheritance because its exact column semantics could not be verified from accessible authoritative documentation.

The derivation SHALL prefer authoritative Table D-1 membership and content for deciding whether DoD defines an IL4 addition or adjustment.

---

## 7. Work Packages

### WP1 — Lock the Corrected Semantic Contract

Before changing runtime behavior:

1. Read the 06B audit, ADR-029, Milestone 06A, existing IL4 derivation/runtime code, and pinned source extracts.
2. Define the exact internal enum/field names for all semantic categories.
3. Confirm conditional applicability remains independent.
4. Confirm no DB migration is required.

**Mandatory STOP after WP1.**

Return the proposed type-level semantic contract before implementation.

### WP2 — Make Table D-1 Membership a Checkable Invariant

The derivation SHALL no longer infer the entire DoD delta solely from Addendum-column emptiness.

Implement a source-backed, machine-checkable representation of Table D-1 membership.

Preferred approach:

- extend the pinned Appendix D extract with explicit `listedInTableD1` or equivalent metadata;
- preserve exact source provenance;
- update parser/validation code;
- fail closed if authoritative source relationships become inconsistent.

The implementation MUST account for the known situation where Table D-1 says `DSPAV must be used` while the later/specific Addendum provides the actual concrete value.

Do not mechanically require literal text equality between Table D-1 and Addendum when the Addendum is intentionally more specific.

### WP3 — Correct Parameter Classification and Resolution

Refactor `classifyParameters` or its equivalent so effective-value resolution is explicit.

Required behavior:

1. IA-5(1) remains source conflict with no synthesized effective value.
2. unresolved DSPAV controls remain authoritative-value-required.
3. explicit DoD/Addendum values remain DoD-sourced.
4. explicit `may use FedRAMP value` cases remain distinct.
5. ordinary FedRAMP values inherited because no DoD Table D-1 adjustment exists are classified as FedRAMP base inheritance under the DoD delta model.
6. CSP-defined ODPs remain unresolved where neither FedRAMP nor DoD resolves them.
7. provenance SHALL reflect the artifact that actually supplied the text.

No effective value may be assigned merely because a source field happened to be empty.

### WP4 — Fix AU-5(1) Provenance

Correct the known AU-5(1) defect.

Current incorrect behavior:

`effectiveAssignmentSource = fedramp-moderate-baseline`

even though AU-5(1) is not selected in the pinned FedRAMP Moderate baseline and the actual text used comes from the DoD SSP Addendum's FedRAMP-reference column.

Required behavior:

- do not label the text as originating from the FedRAMP Moderate baseline;
- preserve the actual source as the DoD Addendum or another exact provenance label;
- preserve the semantic fact that DoD Table D-1 explicitly allows use of a FedRAMP value;
- do not invent the original FedRAMP source if it has not been pinned and verified.

### WP5 — Runtime and Authoring Presentation

Thread the corrected classifications through the generic framework runtime and authoring presentation.

The UI SHALL allow an author to distinguish:

- FedRAMP base value inherited under DoD FedRAMP+ methodology;
- DoD explicit value;
- DoD explicit instruction that a FedRAMP value may be used;
- CSP organization-defined/open ODP;
- DSPAV required/unresolved;
- source conflict;
- conditional applicability.

Suggested user-facing wording:

**FedRAMP base, inherited for IL4**  
FedRAMP Moderate assignment applies. No DoD IL4 adjustment is listed for this requirement.

**DoD IL4 adjustment**  
DoD IL4 defines an additional or adjusted requirement.

**DoD permits FedRAMP value**  
DoD explicitly permits the FedRAMP value for this requirement.

The UI SHALL NOT imply that an inherited FedRAMP base value was individually authored or re-approved by DoD.

### WP6 — Generated Artifact and Regression Invariants

Regenerate `src/data/framework/generated/dod-cloud-il4-rev5.json` using the normal derivation command.

Do not hand-edit generated data.

Tests must cover at minimum:

- total item count remains 345;
- NIST and GRR counts remain unchanged;
- ordinary FedRAMP inheritance has the new semantic classification;
- DoD-explicit controls remain DoD-explicit;
- explicit `may use FedRAMP value` controls remain distinct;
- AU-5(1) provenance is not `fedramp-moderate-baseline`;
- MA-6 and PS-4 retain correct real FedRAMP baseline provenance;
- IA-5(1) remains source conflict;
- MA-5(1), PE-15, SA-9(3) remain DSPAV-blocked;
- SC-46 remains conditional on CDS;
- SC-17 remains supplemental guidance;
- future mismatches between authoritative Table D-1 membership and derivation inputs fail closed.

### WP7 — Documentation Closeout

Amend existing durable documentation after implementation.

At minimum:

- amend ADR-029 rather than replacing it;
- update `docs/current-state.md`;
- update this milestone with implementation status;
- update relevant Help text if user-facing semantics changed;
- record the authoritative basis for the corrected resolution logic.

Do not rewrite Milestone 06A as incorrect.

Milestone 06B is a semantic-hardening correction to parameter resolution and provenance.

---

## 8. Required Invariants

The following MUST remain true after 06B:

```text
framework id:
dod-cloud-il4-rev5

total framework items:
345

NIST items:
335

GRRs:
10
```

No project migration is required.

Existing projects using `dod-cloud-il4-rev5` SHALL continue to load without modification.

Framework identity remains immutable.

IL4 OSCAL SSP export remains disabled.

Demo project identities remain unchanged.

---

## 9. Per-ODP Modeling Gap

The 06B audit identified an important limitation that is **not fixed by this milestone**.

Current `OverlayParameterMetadata` is effectively control-level. A control may contain multiple distinct NIST organization-defined parameters, only some of which are resolved by FedRAMP or DoD.

Example: AC-1 contains multiple ODPs, while the FedRAMP assignment resolves only a subset.

Therefore a composite control-level classification cannot precisely answer:

> Which individual ODPs are already program-defined, and which still require CSP input?

This limitation is acceptable for 06B because the milestone is correcting source semantics, not redesigning authoring persistence.

However, this gap SHALL be recorded as a prerequisite/design concern for high-fidelity human-readable SSP generation.

A later milestone should evaluate per-ODP resolution metadata before a generated SSP attempts to fully synthesize control requirement text or determine all missing system inputs.

---

## 10. Relationship to Human-Readable SSP Generation

Human-readable SSP generation SHALL NOT begin until 06B is complete.

The SSP generator will depend on trustworthy answers to:

- why an effective value exists;
- which source supplied it;
- whether it is FedRAMP base, DoD-adjusted, DSPAV-dependent, conflicting, or CSP-defined;
- whether a requirement is conditional;
- which ODPs remain open for organization-specific input.

06B establishes the provenance and classification foundation required for that work.

It does **not** define the SSP template, document structure, DOCX generation architecture, or system-information data model.

---

## 11. Acceptance Criteria

Milestone 06B is complete when:

- [x] FedRAMP base inheritance is represented as an explicit DoD FedRAMP+ semantic outcome, not as a generic empty-cell fallback.
- [x] Table D-1 membership/delta status is machine-checkable from pinned source data.
- [x] Derivation fails closed when source relationships needed for inheritance are inconsistent.
- [x] The `Leveraged from FedRAMP Moderate` field is not treated as authoritative parameter-inheritance semantics.
- [x] explicit DoD references to FedRAMP remain distinct from ordinary FedRAMP base inheritance.
- [x] AU-5(1) no longer claims `fedramp-moderate-baseline` provenance for text not present in that baseline.
- [x] MA-6 and PS-4 retain correct FedRAMP baseline provenance.
- [x] DoD explicit assignments remain unchanged.
- [x] unresolved DSPAV behavior remains unchanged.
- [x] IA-5(1) conflict behavior remains unchanged.
- [x] SC-46 conditional applicability remains unchanged.
- [x] SC-17 remains modeled as supplemental guidance.
- [x] framework remains exactly 345 items.
- [x] no database schema change is introduced.
- [x] existing IL4 projects continue to load unchanged.
- [x] IL4 OSCAL SSP export remains disabled.
- [x] authoring UI visibly distinguishes major assignment/provenance categories.
- [x] generated artifact is regenerated, not hand-edited.
- [x] tests cover corrected classifications and fail-closed invariants.
- [x] ADR-029 and current-state documentation are updated.
- [x] full test suite, lint, build, and `git diff --check` pass.

---

## 12. STOP / Approval Gates

### Mandatory STOP after WP1

WP1 completed and approved. The corrected semantic contract is implemented in WP2–WP7.

### Mandatory STOP before any scope expansion

Stop and request approval if implementation appears to require:

- database schema changes;
- changing the IL4 control population;
- redesigning all framework providers;
- adding IL5;
- enabling IL4 OSCAL export;
- implementing per-ODP persistence;
- implementing SSP generation;
- obtaining or pinning additional authoritative artifacts not already approved.

---

## 13. Expected Files

Likely implementation files include:

- `src/framework/dod-cloud-il4-rev5/types.ts`
- `src/framework/dod-cloud-il4-rev5/derive.ts`
- `src/framework/dod-cloud-il4-rev5/runtime.ts`
- `src/framework/dod-cloud-il4-rev5/derive.test.ts`
- `src/data/framework/types.ts`
- `src/data/framework/generated/dod-cloud-il4-rev5.json`
- `src/components/controlBrowser/overlayPresentation.ts`
- `src/components/controlBrowser/overlayPresentation.test.ts`
- `vendor/dod/cloud-il4-rev5/extracts/appendix-d-il4-parameter-notes.json`
- associated Appendix D parser/derivation code
- `docs/decisions.md`
- `docs/current-state.md`
- relevant Help documentation
- this milestone document

Exact files may differ after WP1 inspection.

---

## 14. Definition of Done

Milestone 06B is done when Control Freak's IL4 framework still produces the correct current 345-item requirement set, but the reason each effective assignment exists is now explicit, source-backed, testable, provenance-correct, and safe against silent source drift.

The milestone should leave the product ready for the next architectural question:

> How should Control Freak model the remaining system-level and per-ODP data required to generate a trustworthy human-readable DoD IL4 SSP?
